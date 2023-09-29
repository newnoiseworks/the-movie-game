import express from 'express'
import * as bodyParser from 'body-parser'
import cors from 'cors'
import axios from 'axios'

import apiAuth from './api-auth'
import admin from './fbase'
import {
  getMovieSearchUrl,
  getPersonSearchUrl,
  getMovieUrlById,
  getPersonUrlById,
} from "./tmdb-api"
import Game, { GameMove } from "./game";

const app = express()
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cors({ origin: true }))

app.get('/movieSearch', async (request, response) => {
  let searchResponse

  try {
    searchResponse = await axios.get(getMovieSearchUrl(request.query["q"] as string))
  } catch(err) {
    throw err
  }

  response.send(searchResponse.data)
})

app.get('/personSearch', async (request, response) => {
  let searchResponse

  try {
    searchResponse = await axios.get(getPersonSearchUrl(request.query["q"] as string))
  } catch(err) {
    throw err
  }

  response.send(searchResponse.data)
})

app.get('/getMovie', async (request, response) => {
  let movieResponse

  try {
    movieResponse = await axios.get(getMovieUrlById(parseInt(request.query["mid"] as string)))
  } catch(err) {
    throw err
  }

  response.send(movieResponse.data)
})

app.get('/getPerson', async (request, response) => {
  let personResponse

  try {
    personResponse = await axios.get(getPersonUrlById(parseInt(request.query["pid"] as string)))
  } catch(err) {
    throw err
  }

  response.send(personResponse.data)
})

// Create game call
app.post('/createGame', apiAuth, async (request, response) => {
  const game: Game = new Game(admin.database())

  const gameKey = await game.create({
    uuid: request.idToken!.uid,
    name: request.body["name"],
  }, request.body.gameName)

  response.send(gameKey)
})

app.get('/gameDetails', apiAuth, async(request, response) => {
  const db = admin.database()
  const gameId = request.query.gid as string

  if (!gameId) {
    return respond404(response)
  }

  try {
    const game = await new Game(db).get(gameId)

    if (!game.gid) {
      return respond404(response)
    }

    response.send({
      gid: gameId,
      players: game.players,
      currentPlayer: game.currentPlayer,
      name: game.name
    })
  } catch(err) {
    respond404(response)
    throw err
  }
})

// Join game call
app.post('/joinGame', apiAuth, async (request, response) => {
  const db = admin.database()
  const gameId = request.body.gid

  try {
    const game = await new Game(db).get(gameId)

    const didJoin = await game.join({
      uuid: request.idToken!.uid,
      name: request.body.name
    })

    if (!didJoin) {
      response.statusCode = 422
    }

    const playerKey = Object.keys(game.players).find((key) => game.players[key].uuid === request.idToken!.uid)

    response.send(playerKey)
  } catch(err) {
    response.statusCode = 500
    response.send()
    throw err
  }
})

// ready to play
app.post('/readyToPlay', apiAuth, async (request, response) => {
  const db = admin.database()
  const gameId = request.body.gid

  const game = await new Game(db).get(gameId)

  await game.playerReady(request.idToken!.uid, request.body.ready)

  response.send()
})

// make sure player is in game and current person
app.post('/playerGameChoice', apiAuth, async (request, response) => {
  const db = admin.database()
  const game = await new Game(db).get(request.body.gid)
  const uuid = request.idToken!.uid
  const { mid, pid } = request.body
  let isCorrect

  // TODO: Consider calling game.validatePlayer() and include the below there, and call that before isPersonInMovie... would consolidate things
  if (!Object.keys(game.players).find((playerKey) => game.players[playerKey].uuid === uuid)) {
    return respond403(response, "Player not joined onto this game")
  }

  const move: any = { toType: request.body.toType }

  // TODO: This is a bit gross. cleanup when there's a chance
  if (mid && pid) {
    const [
      isPersonInMovieBool, movieInfo, personInfo
    ] = await isPersonInMovie(
      mid, pid, request.body.toType === 'pid'
    )

    isCorrect = isPersonInMovieBool

    if (request.body.toType === 'pid') {
      move.name = personInfo.name
      move.photo = personInfo.profile_path
    } else {
      move.name = movieInfo.title
      move.photo = movieInfo.poster_path
    }
  } else {
    isCorrect = true

    if (mid) {
      const movieResponse = await axios.get(getMovieUrlById(mid, true))
      move.name = movieResponse.data.title
      move.photo = movieResponse.data.poster_path
    } else {
      const personResponse = await axios.get(getPersonUrlById(pid))
      move.name = personResponse.data.name
      move.photo = personResponse.data.profile_path
    }
  }

  if (!!mid) move.mid = mid
  if (!!pid) move.pid = pid

  try {
    await game.playerMove(uuid, isCorrect, move as GameMove)
  } catch(err: any) {
    if (process.env.NODE_ENV !== 'test') {
      console.error(err.message)
    }

    return respond403(response, err.message)
  }

  response.send()
})

app.post('/gameHeartbeat', apiAuth, async (request, response) => {
  const db = admin.database()
  const game = await new Game(db).get(request.body.gid)
  const uuid = request.idToken!.uid

  try {
    await game.heartbeat(uuid)
  } catch (err: any) {
    response.statusCode = 500
    response.send("Error processing heartbeat")
  }

  response.send()
})

async function isPersonInMovie(movieId: number, personId: number, getPersonInfo?: boolean) {
  let movieResponse, personResponse

  movieResponse = await axios.get(getMovieUrlById(movieId, true))

  if (getPersonInfo) {
    personResponse = await axios.get(getPersonUrlById(personId))
  }

  const isPersonInMovieBool: boolean = (
    movieResponse.data.credits.cast as any[]
  ).reduce(
    (previous, current) =>
      previous || current.id == personId,
    false
  )

  return [
    isPersonInMovieBool, 
    movieResponse.data,
    getPersonInfo && personResponse ? personResponse.data : undefined
  ]
}

function respond403(response: express.Response, message: string) {
  response.statusCode = 403
  response.send(message)
}

function respond404(response: express.Response) {
  response.statusCode = 404
  response.send()
}

export default app

