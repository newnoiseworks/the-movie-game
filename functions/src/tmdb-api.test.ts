import {
  getMovieSearchUrl,
  getPersonSearchUrl,
  getMovieUrlById,
} from "./tmdb-api"

const tmdbApi = "https://test-themoviedb"
const apiKey = "TMDB_API_KEY"

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

describe("getMovieUrl", () => {
  test("Returns correct URL w/ proper params", () => {
    expect(getMovieUrlById(3)).toEqual(`${tmdbApi}/3/movie/3?api_key=${apiKey}&append_to_response=videos,images`)
  })

  test("Returns correct URL w/ credits w/ proper params", () => {
    expect(getMovieUrlById(3, true)).toEqual(`${tmdbApi}/3/movie/3?api_key=${apiKey}&append_to_response=videos,credits,images`)
  })
})
