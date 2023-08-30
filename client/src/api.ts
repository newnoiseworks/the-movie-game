import axios from 'axios'

import { auth } from './firebase'

async function createGame() {
  return axios
    .get(`${process.env.REACT_APP_FUNCTIONS_URL}/createGame?uuid=${auth.currentUser?.uid!}&name=FirstUser`)
    .then((response) => response.data)
}

export {
  createGame
}
