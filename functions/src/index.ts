import * as functions from "firebase-functions";
import * as admin from "firebase-admin"

var axios = require('axios')
const cors = require('cors')({ origin: true })

var serviceAccount = require("../the-movie-game-fbase-admin-sdk.json")

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FBASE_REALTIME_DB_URL
})

import {
  getMovieSearchUrl,
  getPersonSearchUrl,
  getMovieUrlById,
  getPersonUrlById,
} from "./tmdb-api"

import Game from "./game";

export const movieSearch = functions.https.onRequest(async (request, response) => {
  let searchResponse

  try {
    searchResponse = await axios.get(getMovieSearchUrl(request.query["q"] as string))
  } catch(err) {
    throw err
  }

  response.send(searchResponse.data)
})

export const personSearch = functions.https.onRequest(async (request, response) => {
  let searchResponse

  try {
    searchResponse = await axios.get(getPersonSearchUrl(request.query["q"] as string))
  } catch(err) {
    throw err
  }

  response.send(searchResponse.data)
})

export const getMovie = functions.https.onRequest(async (request, response) => {
  let movieResponse

  try {
    movieResponse = await axios.get(getMovieUrlById(parseInt(request.query["mid"] as string)))
  } catch(err) {
    throw err
  }

  response.send(movieResponse.data)
})

export const getPerson = functions.https.onRequest(async (request, response) => {
  let personResponse

  try {
    personResponse = await axios.get(getPersonUrlById(parseInt(request.query["pid"] as string)))
  } catch(err) {
    throw err
  }

  response.send(personResponse.data)
})


// Create game call
export const createGame = functions.https.onRequest(async (request, response) => {
  cors(request, response, async () => {
    const game: Game = new Game(admin.database())

    const gameKey = await game.create({
      uuid: (request.query["uuid"] || "") as string,
      name: (request.query["name"] || "") as string,
    })

    response.send(gameKey)
  })
})

// Join game call
export const joinGame = functions.https.onRequest(async (request, response) => {
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
export const playerGameChoice = functions.https.onRequest(async (request, response) => {
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
    movieResponse = await axios.get(getMovieUrlById(movieId), true)
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


// TODO: Figure out how best to mitigate for leaving -- API call? Some Firebase signal? etc



