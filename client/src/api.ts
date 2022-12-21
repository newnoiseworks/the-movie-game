import axios from 'axios'

import { auth } from './firebase'

async function createGame() {
  return axios
    .get(`${process.env.REACT_APP_FUNCTIONS_URL}/createGame?uuid=${auth.currentUser?.uid!}`)
    .then((response) => response.data)
}

export {
  createGame
}
