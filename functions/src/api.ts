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
import Game, {Player} from "./game";

const app = express()
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cors({ origin: true }))

app.use('/movieSearch', async (request, response) => {
  let searchResponse

  try {
    searchResponse = await axios.get(getMovieSearchUrl(request.query["q"] as string))
  } catch(err) {
    throw err
  }

  response.send(searchResponse.data)
})

app.use('/personSearch', async (request, response) => {
  let searchResponse

  try {
    searchResponse = await axios.get(getPersonSearchUrl(request.query["q"] as string))
  } catch(err) {
    throw err
  }

  response.send(searchResponse.data)
})

app.use('/getMovie', async (request, response) => {
  let movieResponse

  try {
    movieResponse = await axios.get(getMovieUrlById(parseInt(request.query["mid"] as string)))
  } catch(err) {
    throw err
  }

  response.send(movieResponse.data)
})

app.use('/getPerson', async (request, response) => {
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

    response.send()
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

  if (!Object.keys(game.players).find(
    (playerKey) => game.players[playerKey].uuid === uuid
  )) {
    return respond403(response)
  }

  const isPersonInMovieBool = await isPersonInMovie(request.body.mid, request.body.pid)

  const didPlayerMove = await game.playerMove(uuid, isPersonInMovieBool)

  if (!didPlayerMove) {
    return respond403(response)
  }

  response.send(didPlayerMove)
})

async function isPersonInMovie(movieId: number, personId: number) {
  let movieResponse

  try {
    movieResponse = await axios.get(getMovieUrlById(movieId, true))
  } catch(err) {
    throw err
  }

  const isPersonInMovieBool: boolean = (
    movieResponse.data.credits.cast as any[]
  ).reduce(
    (previous, current) =>
      previous || current.id == personId,
    false
  )

  return isPersonInMovieBool
}

function respond403(response: express.Response) {
  response.statusCode = 403
  response.send()
}

export default app

