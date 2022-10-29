import * as functions from "firebase-functions";

import {
  getMovieSearchUrl,
  getPersonSearchUrl,
  getMovieUrl,
} from "./tmdb-api"

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
//
//

export const movieSearch = functions.https.onRequest((request, response) => {
  response.send(getMovieSearchUrl(request.query["q"] as string))
})

export const personSearch = functions.https.onRequest((request, response) => {
  response.send(getPersonSearchUrl(request.query["q"] as string))
})

export const getMovie = functions.https.onRequest((request, response) => {
  response.send(getMovieUrl(request.query["mid"] as string))
})
