import axios from 'axios'

import { auth } from './firebase'

async function createGame(name: string) {
  const headers = await getAuthHeaders()

  const response = await axios
    .post(
      `${process.env.REACT_APP_FUNCTIONS_URL}/createGame`,
      { name },
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

export {
  createGame
}
