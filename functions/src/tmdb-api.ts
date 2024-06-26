const apiKey = process.env.TMDB_API_KEY
const tmdbApi = process.env.TMDB_API_URL

function getMovieSearchUrl (query: string) {
  return `${tmdbApi}/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}`
}

function getPersonSearchUrl (query: string) {
  return `${tmdbApi}/3/search/person?api_key=${apiKey}&query=${encodeURIComponent(query)}`
}

function getMovieUrlById (mid: number, withCredits?: boolean) {
  return `${tmdbApi}/3/movie/${mid}?api_key=${apiKey}&append_to_response=videos${withCredits ? ',credits' : ''},images`
}

function getPersonUrlById (pid: number) {
  return `${tmdbApi}/3/person/${pid}?api_key=${apiKey}&append_to_response=videos,images`
}

export {
  getMovieSearchUrl,
  getPersonSearchUrl,
  getMovieUrlById,
  getPersonUrlById
}
