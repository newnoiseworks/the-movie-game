import {
  getMovieSearchUrl,
} from "./tmdb-api"

const tmdbApi = "https://test-themoviedb"
const apiKey = "TMDB_API_KEY"

describe("getMovieSearchUrl", () => {
  test("Returns URL w/ API Key and query string attached correctly", () => {
    expect(getMovieSearchUrl("hey hey hey")).toEqual(`${tmdbApi}/3/search/movie?api_key=${apiKey}&query=hey%20hey%20hey`)
  })
})
