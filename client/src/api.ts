import axios from 'axios'

async function createGame(uuid: string) {
  return axios
    .get(`${process.env.REACT_APP_FUNCTIONS_URL}/createGame?uuid=${uuid}`)
    .then((response) => response.data)
}

export {
  createGame
}
