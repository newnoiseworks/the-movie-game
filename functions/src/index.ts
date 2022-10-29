import * as functions from "firebase-functions";
const axios = require('axios')

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

export const isPersonInMovie = functions.https.onRequest(async (request, response) => {
  let movieResponse

  try {
    movieResponse = await axios.get(getMovieUrlById(parseInt(request.query["mid"] as string), true))
  } catch(err) {
    throw err
  }

  const isPersonInMovieBool: boolean = (movieResponse.data.credits.cast as any[]).reduce((previous, current) => {
    return previous || current.id == parseInt(request.query["pid"] as string)
  }, false)

  response.send(isPersonInMovieBool.toString())
})
