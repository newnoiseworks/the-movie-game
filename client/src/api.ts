import axios from 'axios'

import { auth } from './firebase'

let hbeatInterval: NodeJS.Timer | undefined

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

async function sendHeartbeat(gid: string) {
  const headers = await getAuthHeaders()

  // console.log("sending heartbeat for user " + getUID() + " at " + new Date().getTime())

  await axios
    .post(
      `${process.env.REACT_APP_FUNCTIONS_URL}/gameHeartbeat`,
      { gid },
      { headers }
    )

  return
}

function isHeartbeatOn() {
  return !!hbeatInterval
}

async function setupHeartbeatInterval(gid: string) {
  // console.log("setupHeartbeatInterval called")

  if (!isHeartbeatOn()) {
    // console.log("actually setting heartbeat up")

    sendHeartbeat(gid)

    hbeatInterval = setInterval(() => {
      if (!!auth.currentUser) {
        sendHeartbeat(gid)
      }
    }, 10000)
  }
}

function clearHeartbeatInterval() {
  if (isHeartbeatOn()) {
    // console.log("clearing heartbeat interval")
    clearInterval(hbeatInterval)
    hbeatInterval = undefined
  }
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
  setupHeartbeatInterval,
  clearHeartbeatInterval,
  isHeartbeatOn,
  getUID
}

