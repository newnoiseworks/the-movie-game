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
import Game from "./game";

const app = express()
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cors({ origin: true }))

const apiAuthed = app.use(apiAuth)

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
apiAuthed.post('/createGame', async (request, response) => {
  const game: Game = new Game(admin.database())

  const gameKey = await game.create({
    uuid: request.idToken!.uid,
    name: (request.query["name"] || "") as string,
  })

  response.send(gameKey)
})

// Join game call
app.use('/joinGame', async (request, response) => {
  const db = admin.database()
  const gameId = (request.query["gid"] || "") as string

  const game = await new Game(db).get(gameId)

  try {
    await game.join({
      uuid: (request.query["uuid"] || "") as string,
      name: (request.query["name"] || "") as string,
    })

    response.send()
  } catch(err) {
    throw err
  }
})

// make sure player is in game and current person
app.use('/playerGameChoice', async (request, response) => {
  const db = admin.database()
  const movieId = parseInt(request.query["mid"] as string)
  const personId = parseInt(request.query["pid"] as string)

  // TODO: can we get the user's UUID from the firebase
  // admin as opposed to the request to prevent spoofing?
  const uuid = request.query["uuid"] as string

  const isPersonInMovieBool = await isPersonInMovie(movieId, personId)

  const gameId = request.query["gid"] as string
  const game = await new Game(db).get(gameId)

  const didPlayerMove = await game.playerMove(uuid, isPersonInMovieBool)

  response.send(didPlayerMove)
})

async function isPersonInMovie(movieId: number, personId: number) {
  let movieResponse

  try {
    movieResponse = await axios.get(getMovieUrlById(movieId))
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

export default app

