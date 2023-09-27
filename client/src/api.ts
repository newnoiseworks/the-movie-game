import axios from 'axios'

import { auth, removeOnDisconnect } from './firebase'

async function createGame(name: string, gameName?: string) {
  const headers = await getAuthHeaders()

  const response = await axios
    .post(
      `${process.env.REACT_APP_FUNCTIONS_URL}/createGame`,
      { name, gameName },
      { headers }
    )

  return response.data
}

async function joinGame(name: string, gid: string) {
  const headers = await getAuthHeaders()

  const response = await axios
    .post(
      `${process.env.REACT_APP_FUNCTIONS_URL}/joinGame`,
      { name, gid },
      { headers }
    )

  removeOnDisconnect(`games/${gid}/players/${response.data}`)

  return response.data
}

async function playerGameChoice(
  choice: {
    mid?: number,
    pid?: number,
    toType: 'mid' | 'pid'
  },
  gid: string
) {
  const headers = await getAuthHeaders()

  const data: any = {
    gid,
    ...choice
  }

  const response = await axios
    .post(
      `${process.env.REACT_APP_FUNCTIONS_URL}/playerGameChoice`,
      data,
      { headers }
    )

  return response.data
}

async function searchForPeople(name: string) {
  const headers = await getAuthHeaders()

  const response = await axios
    .get(
      `${process.env.REACT_APP_FUNCTIONS_URL}/personSearch?q=${name}`,
      { headers }
    )

  return response.data
}

async function searchForMovie(name: string) {
  const headers = await getAuthHeaders()

  const response = await axios
    .get(
      `${process.env.REACT_APP_FUNCTIONS_URL}/movieSearch?q=${name}`,
      { headers }
    )

  response.data.results = response.data.results.map((result: any) => ({
    ...result,
    name: `${result.title} - ${result.release_date.split('-')[0]}`
  }))

  return response.data
}

async function getAuthHeaders() {
  const token = await auth.currentUser!.getIdToken()

  return {
    'Authorization': `Bearer ${token}`
  }
}

function getUID() {
  return auth.currentUser!.uid
}

export {
  createGame,
  joinGame,
  playerGameChoice,
  searchForPeople,
  searchForMovie,
  getUID
}

