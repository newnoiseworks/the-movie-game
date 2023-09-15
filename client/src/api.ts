import axios from 'axios'

import { auth } from './firebase'

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
  getUID
}

