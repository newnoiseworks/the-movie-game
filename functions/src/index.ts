import * as functions from "firebase-functions";
import * as admin from "firebase-admin"

const axios = require('axios')
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

// TODO: This probably shouldn't be publicly exposed but done privately w/n a
// game "choose" method call, which this could be converted to and would update 
// the DB accordingly. No cheating / easy buckets / poor movie game opsec.
export const isPersonInMovie = functions.https.onRequest(async (request, response) => {
  let movieResponse

  try {
    movieResponse = await axios.get(getMovieUrlById(parseInt(request.query["mid"] as string), true))
  } catch(err) {
    throw err
  }

  const isPersonInMovieBool: boolean = (
    movieResponse.data.credits.cast as any[]
  ).reduce(
    (previous, current) => 
      previous || current.id == parseInt(request.query["pid"] as string), 
    false
  )

  response.send(isPersonInMovieBool.toString())
})


// TODO: Create game call
// // see if you can limit readability to who is joined but also, fuck it, v2 -- who cares
export const createGame = functions.https.onRequest((request, response) => {
  cors(request, response, () => {
    console.log(process.env.FBASE_REALTIME_DB_URL)
    const db = admin.database()
    const gamesRef = db.ref("games")

    const gameRef = gamesRef.push({
      users: [request.query["uuid"]]
    })

    gameRef.once("value", function(snapshot) {
      response.send(gameRef.key)
    })
  })
})

// TODO: Join game call
export const joinGame = functions.https.onRequest(async (request, _response) => {
  const db = admin.database()
  const gameId = request.query["uuid"]
  const gameRef = db.ref(`games/${gameId}`)

  gameRef.on('value', (snapshot) => {
    console.log(snapshot.val())
  }, (errorObject) => {
    console.log('The read failed: ' + errorObject.name)
  })
})


// TODO: Game choice call
// make sure player is in game and current person


// TODO: Figure out how best to mitigate for leaving -- API call? Some Firebase signal? etc



