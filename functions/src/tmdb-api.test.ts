import {
  getMovieSearchUrl,
  getPersonSearchUrl,
  getMovieUrlById,
  getPersonUrlById,
} from "./tmdb-api"

const tmdbApi = process.env.TMDB_API_URL
const apiKey = process.env.TMDB_API_KEY

describe("getMovieSearchUrl", () => {
  test("Returns correct URL w/ proper params", () => {
    expect(getMovieSearchUrl("hey hey hey")).toEqual(`${tmdbApi}/3/search/movie?api_key=${apiKey}&query=hey%20hey%20hey`)
  })
})

describe("getPersonSearchUrl", () => {
  test("Returns correct URL w/ proper params", () => {
    expect(getPersonSearchUrl("hey hey hey")).toEqual(`${tmdbApi}/3/search/person?api_key=${apiKey}&query=hey%20hey%20hey`)
  })
})

describe("getMovieUrlById", () => {
  test("Returns correct URL w/ proper params", () => {
    expect(getMovieUrlById(3)).toEqual(`${tmdbApi}/3/movie/3?api_key=${apiKey}&append_to_response=videos,images`)
  })

  test("Returns correct URL w/ credits w/ proper params", () => {
    expect(getMovieUrlById(3, true)).toEqual(`${tmdbApi}/3/movie/3?api_key=${apiKey}&append_to_response=videos,credits,images`)
  })
})

describe("getPersonUrlById", () => {
  test("Returns correct URL w/ proper params", () => {
    expect(getPersonUrlById(3)).toEqual(`${tmdbApi}/3/person/3?api_key=${apiKey}&append_to_response=videos,images`)
  })
})
