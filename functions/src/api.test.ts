import * as path from 'path'
import axios, { AxiosError, AxiosResponse } from 'axios'
import http from 'http'
import nock from 'nock'

import admin from './fbase'
import api from './api'
import Game, { Player, MAX_SCORE, GameErrorMovieOrArtfulLiarAlreadyChosen } from './game'

// TODO: Get nock back working, the below technically bypasses it
const NOCK_BACK_MODE = "wild"
const NOCK_BACK_OPTIONS: nock.BackOptions = {
  afterRecord: (defs) => defs.filter((def) =>
    !(def.scope as string).includes('localhost') &&
    !(def.scope as string).includes('127.0.0.1')
  )
}

const db = admin.database()
const auth = admin.auth()
const uuids: string[] = ["uuidOne", "uuidTwo", "uuidThree"]
const uuidToToken: { [key: string]: string; } = {}
const uuidOne = uuids[0]
const uuidTwo = uuids[1]
const uuidThree = uuids[2]
const name = "test-name"
const nameTwo = "test-user-two"
const nameThree = "test-user-three"

let nockDone: () => void
let conn: http.Server

const createUser = async (uid: string, idx: number) => {
  const email = `${uid}@fakemail.com`
  const phoneNumber = `+1123456789${idx}`

  await auth.createUser({ uid, email, phoneNumber })

  const token = await auth.createCustomToken(uid)

  let fbaseToken: AxiosResponse

  // TODO: get this working with nock back to avoid excessive auth calls, OR,
  // TODO: consider saving the below manually for now
  try {
    fbaseToken = await axios.post(
      `http://localhost:9099/www.googleapis.com/identitytoolkit/v3/relyingparty/verifyCustomToken?key=${process.env.FBASE_CLIENT_API_KEY}`,
      {
        token: token,
        returnSecureToken: true
      },
    )

    uuidToToken[uid] = fbaseToken.data.idToken
  } catch(err) {
    throw err
  }
}

beforeAll(async () => {
  await Promise.all(uuids.map((uid, idx) => createUser(uid, idx)))

  axios.defaults.baseURL = process.env.APP_TEST_URL

  conn = api.listen(process.env.APP_TEST_PORT)

  nock.back.fixtures = path.join(__dirname, '..', 'tapes', 'api')
  nock.back.setMode(NOCK_BACK_MODE)
  nock.enableNetConnect('127.0.0.1')
})

beforeEach(() => {
  nock.back.setMode(NOCK_BACK_MODE)
})

afterEach(() => {
  nock.back.setMode("wild")
  nockDone && nockDone()
})

afterAll(async () => {
  conn.close()
  await db.ref("games").set({})
  await auth.deleteUsers(uuids)
  db.goOffline()
})

describe("/movieSearch", () => {
  beforeEach(async () => {
    nockDone = (await nock.back(`movieSearch.json`, NOCK_BACK_OPTIONS)).nockDone
  })

  test("can find single specific movie", async () => {
    const response = await axios.get(`/movieSearch?q=Thank%20You%20For%20Smoking`)

    expect(response.data).toBeTruthy()
    expect(response.data.page).toEqual(1)
    expect(response.data.results[0].title).toBe('Thank You for Smoking')
  })

  test("finds multiple movies", async () => {
    const response = await axios.get(`/movieSearch?q=Die%20Hard`)

    expect(response.data).toBeTruthy()
    expect(response.data.page).toEqual(1)
    expect(response.data.results.length).toBeGreaterThan(1)
  })
})

describe("/personSearch", () => {
  beforeEach(async () => {
    nockDone = (await nock.back(`personSearch.json`, NOCK_BACK_OPTIONS)).nockDone
  })

  test("can find a single specific artful liar", async () => {
    const response = await axios.get(`/personSearch?q=Michael+Goorjian`)

    expect(response.data).toBeTruthy()
    expect(response.data.page).toEqual(1)
    expect(response.data.results.length).toEqual(1)
    expect(response.data.results[0].name).toBe('Michael Goorjian')
  })

  test("can find multiple artful liars based on last name", async () => {
    const response = await axios.get(`/personSearch?q=Wilson`)

    expect(response.data).toBeTruthy()
    expect(response.data.page).toEqual(1)
    expect(response.data.results.length).toBeGreaterThan(2)
    expect(response.data.results.find((p: any) => p.name === 'Chandra Wilson').name).toBe('Chandra Wilson')
    expect(response.data.results.find((p: any) => p.name === 'Owen Wilson').name).toBe('Owen Wilson')
  })
})

describe("/getMovie", () => {
  beforeEach(async () => {
    nockDone = (await nock.back(`getMovie.json`, NOCK_BACK_OPTIONS)).nockDone
  })

  test("can get a single movie based on it's TMDB id", async () => {
    const response = await axios.get(`/getMovie?mid=335796`)

    expect(response.data).toBeTruthy()
    expect(response.data.original_title).toBe('Ouija: Origin of Evil')
  })
})

describe("/getPerson", () => {
  beforeEach(async () => {
    nockDone = (await nock.back(`getPerson.json`, NOCK_BACK_OPTIONS)).nockDone
  })

  test("can get a single artful liar on their TMDB id", async () => {
    const response = await axios.get(`/getPerson?pid=36422`)

    expect(response.data).toBeTruthy()
    expect(response.data.name).toBe('Luke Wilson')
  })
})

describe("/createGame", () => {
  beforeEach(async () => {
    nockDone = (await nock.back(`createGame.json`, NOCK_BACK_OPTIONS)).nockDone
  })

  test("can't create a game without authentication", async () => {
    const response = await axios.post(`/createGame`, {}, {
      validateStatus: (status) => status < 500
    })

    expect(response.status).toBe(401)
  })

  test("creates a game and stores in firebase DB", async () => {
    const gameName = "The moviest game"
    const response = await axios.post(`/createGame`, {
      token: uuidToToken[uuids[0]],
      name: "test-name",
      gameName
    })

    const gameKey = response.data

    const gameRef = (await db.ref(`games/${gameKey}`).once("value")).val()

    expect(response.status).toBe(200)
    expect(Object.keys(gameRef.players).length).toBe(1)
    expect(gameRef.currentPlayer).toBe(uuids[0])
    expect(gameRef.name).toBe(gameName)
  })

  test("generates game name if non provided", async () => {
    const gameName = "test-name's game"

    const response = await axios.post(`/createGame`, {
      token: uuidToToken[uuids[0]],
      name: "test-name",
    })

    const gameKey = response.data

    const gameRef = (await db.ref(`games/${gameKey}`).once("value")).val()

    expect(gameRef.name).toBe(gameName)
  })
})

describe("/joinGame", () => {
  let gid: string | null

  beforeEach(async () => {
    nockDone = (await nock.back(`joinGame.json`, NOCK_BACK_OPTIONS)).nockDone

    gid = await new Game(db).create({ uuid: uuidOne, name })
  })

  test("can't join a game without authentication", async () => {
    const response = await axios.post(`/joinGame`, {
      name: "test-user-two",
      gid
    }, {
      validateStatus: (status) => status < 500
    })

    expect(response.status).toBe(401)
  })

  test("join game and registers user in firebase DB", async () => {
    const response = await axios.post(`/joinGame`, {
      name: nameTwo,
      gid,
      token: uuidToToken[uuidTwo]
    })

    const gameRefFromServer = (await db.ref(`games/${gid}`).once('value')).val() as Game

    const playerTwoKey = Object.keys(gameRefFromServer.players).find((key) => gameRefFromServer.players[key].uuid === uuidTwo)

    expect(response.status).toBe(200)
    expect(playerTwoKey).toBeTruthy()
    expect(gameRefFromServer.players[playerTwoKey!]).toBeTruthy()
    expect(gameRefFromServer.players[playerTwoKey!].uuid).toBe(uuidTwo)
    expect(Object.keys(gameRefFromServer.players).length).toBe(2)
  })

  test("can't double join a game", async () => {
    const response = await axios.post(`/joinGame`, {
      uuid: uuidOne,
      name,
      gid,
      token: uuidToToken[uuidOne]
    }, {
      validateStatus: (status) => status < 500
    })

    const gameRefFromServer = (await db.ref(`games/${gid}`).once('value')).val() as Game

    expect(Object.keys(gameRefFromServer.players).length).toBe(1)
    expect(response.status).toBe(422)
  })

  test("can't join a game when all users are ready", async () => {
    const game = await new Game(db).get(gid!)
    await game.join({
      uuid: uuidTwo,
      name: nameTwo
    })

    await game.playerReady(uuidOne, true)
    await game.playerReady(uuidTwo, true)

    const response = await axios.post(`/joinGame`, {
      uuid: uuidThree,
      name: nameThree,
      gid,
      token: uuidToToken[uuidThree]
    }, {
      validateStatus: (status) => status < 500
    })

    const gameRefFromServer = (await db.ref(`games/${gid}`).once('value')).val() as Game

    expect(Object.keys(gameRefFromServer.players).length).toBe(2)
    expect(response.status).toBe(422)
  })
})

describe("/readyToPlay", () => {
  let gid: string | null
  let game: Game

  beforeEach(async () => {
    nockDone = (await nock.back(`readyToPlay.json`, NOCK_BACK_OPTIONS)).nockDone
    gid = await new Game(db).create({
      uuid: uuidOne,
      name
    })

    game = await new Game(db).get(gid!)

    await game.join({
      uuid: uuidTwo,
      name: nameTwo
    })
  })

  test("sets ready to play as true when flag is passed as true", async () => {
    let gameRefFromServer = (await db.ref(`games/${gid}`).once('value')).val() as Game

    let firstPlayer: Player = gameRefFromServer.players[Object.keys(gameRefFromServer.players)[0]]

    expect(firstPlayer.ready).toBeFalsy()

    await axios.post(`/readyToPlay`, {
      token: uuidToToken[uuids[0]],
      ready: true,
      gid
    })

    gameRefFromServer = (await db.ref(`games/${gid}`).once('value')).val() as Game

    firstPlayer = gameRefFromServer.players[Object.keys(gameRefFromServer.players)[0]]

    expect(firstPlayer.ready).toBeTruthy()
  })

  test("sets ready to play as false when flag is passed as false", async () => {
    await game.playerReady(uuidOne, true)

    let gameRefFromServer = (await db.ref(`games/${gid}`).once('value')).val() as Game

    let firstPlayer: Player = gameRefFromServer.players[Object.keys(gameRefFromServer.players)[0]]

    expect(firstPlayer.ready).toBeTruthy()

    await axios.post(`/readyToPlay`, {
      token: uuidToToken[uuids[0]],
      ready: false,
      gid
    })

    gameRefFromServer = (await db.ref(`games/${gid}`).once('value')).val() as Game

    firstPlayer = gameRefFromServer.players[Object.keys(gameRefFromServer.players)[0]]

    expect(firstPlayer.ready).toBeFalsy()
  })
})

describe("/playerGameChoice", () => {
  let gid: string | null
  let game: Game
  const filmLoserId = 10642
  const menaSuvariId = 8211
  const taraReidId = 1234

  const filmGaslightId = 55207 // Reference!
  const filmCasablancaId = 289
  const ingridBergmanId = 4111

  beforeEach(async () => {
    nockDone = (await nock.back(`playerGameChoice.json`, NOCK_BACK_OPTIONS)).nockDone

    gid = await new Game(db).create({ uuid: uuidOne, name })
    game = await new Game(db).get(gid!)
    await game.join({ uuid: uuidTwo, name: nameTwo })
    await game.playerReady(uuidOne, true)
    await game.playerReady(uuidTwo, true)
  })

  test("can't make a player choice on a game without authentication", async () => {
    const response = await axios.post(`/playerGameChoice`, {
      mid: filmLoserId,
      pid: menaSuvariId,
      gid
    }, {
      validateStatus: (status) => status < 500
    })

    expect(response.status).toBe(401)
  })

  test("can't make a player choice on a game without having joined it (authorization as it were)", async () => {
    const response = await axios.post(`/playerGameChoice`, {
      mid: filmLoserId,
      pid: menaSuvariId,
      token: uuidToToken[uuids[2]],
      gid
    }, {
      validateStatus: (status) => status < 500
    })

    expect(response.status).toBe(403)
  })

  test("correct choice rotates current player in DB and doesn't adjust score", async () => {
    let gameRefFromServer = (await db.ref(`games/${gid}`).once('value')).val() as Game
    let firstPlayer = gameRefFromServer.players[Object.keys(gameRefFromServer.players)[0]] as Player

    expect(gameRefFromServer.currentPlayer).toBe(uuidOne)
    expect(firstPlayer.score).toBe(0)

    await axios.post(`/playerGameChoice`, {
      mid: filmLoserId,
      pid: menaSuvariId,
      token: uuidToToken[uuids[0]],
      toType: 'pid',
      gid
    })

    gameRefFromServer = (await db.ref(`games/${gid}`).once('value')).val() as Game
    firstPlayer = gameRefFromServer.players[Object.keys(gameRefFromServer.players)[0]] as Player

    expect(gameRefFromServer.currentPlayer).toBe(uuidTwo)
    expect(firstPlayer.score).toBe(0)
  })

  test("incorrect choice (Tara Reid in Loser, which she is not in) rotates current player in DB and adjusts score", async () => {
    let gameRefFromServer = (await db.ref(`games/${gid}`).once('value')).val() as Game
    let firstPlayer = gameRefFromServer.players[Object.keys(gameRefFromServer.players)[0]] as Player

    expect(gameRefFromServer.currentPlayer).toBe(uuidOne)
    expect(firstPlayer.score).toBe(0)

    await axios.post(`/playerGameChoice`, {
      mid: filmLoserId,
      pid: taraReidId, // FYI Tara Reid is NOT in the film "Loser"
      token: uuidToToken[uuids[0]],
      toType: 'pid',
      gid
    })

    gameRefFromServer = (await db.ref(`games/${gid}`).once('value')).val() as Game
    firstPlayer = gameRefFromServer.players[Object.keys(gameRefFromServer.players)[0]] as Player

    expect(gameRefFromServer.currentPlayer).toBe(uuidTwo)
    expect(firstPlayer.score).toBe(1)
  })

  test("can't make a player choice on a game if player is at max score", async () => {
    const gameRefFromServer = (await db.ref(`games/${gid}`).once('value')).val() as Game
    const firstPlayerKey = Object.keys(gameRefFromServer.players)[0]

    await db.ref(`games/${gid}/players/${firstPlayerKey}/score`).set(MAX_SCORE)

    expect(gameRefFromServer.currentPlayer).toBe(uuidOne)

    const response = await axios.post(`/playerGameChoice`, {
      mid: filmLoserId,
      pid: menaSuvariId,
      token: uuidToToken[uuidOne],
      gid
    }, {
      validateStatus: (status) => status < 500
    })

    expect(response.status).toBe(403)
  })

  test("player can choose artful liar Mena Suvari from the movie Loser if that was the last movie picked", async () => {
    await axios.post(`/playerGameChoice`, {
      mid: filmLoserId,
      token: uuidToToken[uuidOne],
      toType: 'mid',
      gid
    })

    const response = await axios.post(`/playerGameChoice`, {
      mid: filmLoserId,
      pid: menaSuvariId,
      token: uuidToToken[uuidTwo],
      toType: 'pid',
      gid
    })

    expect(response.status).toBe(200)
  })

  test("player cannot choose an artful liar that has already been picked", async () => {
    await axios.post(`/playerGameChoice`, {
      pid: menaSuvariId,
      token: uuidToToken[uuidOne],
      toType: 'pid',
      gid
    })

    await axios.post(`/playerGameChoice`, {
      pid: menaSuvariId,
      mid: filmLoserId,
      token: uuidToToken[uuidTwo],
      toType: 'mid',
      gid
    })

    const response = await axios.post('/playerGameChoice', {
      mid: filmLoserId,
      pid: menaSuvariId,
      token: uuidToToken[uuidOne],
      toType: 'pid',
      gid
    }, {
      validateStatus: (status) => status < 500
    })

    expect(response.status).toBe(403)
    expect(response.data).toBe(new GameErrorMovieOrArtfulLiarAlreadyChosen().message)
  })

  test("player cannot choose a movie that has already been picked", async () => {
    await axios.post(`/playerGameChoice`, {
      mid: filmGaslightId,
      token: uuidToToken[uuidOne],
      toType: 'mid',
      gid
    })

    await axios.post(`/playerGameChoice`, {
      pid: ingridBergmanId,
      mid: filmGaslightId,
      token: uuidToToken[uuidTwo],
      toType: 'pid',
      gid
    })

    const response = await axios.post('/playerGameChoice', {
      pid: ingridBergmanId,
      mid: filmGaslightId,
      token: uuidToToken[uuidOne],
      toType: 'mid',
      gid
    }, {
      validateStatus: (status) => status < 500
    })

    expect(response.status).toBe(403)
    expect(response.data).toBe(new GameErrorMovieOrArtfulLiarAlreadyChosen().message)
  })

  test("player can choose a movie Ingrid Bergman starred in if Ms. Bergman was the last artful liar picked, and the movie hasn't already been picked", async () => {
    await axios.post(`/playerGameChoice`, {
      mid: filmCasablancaId,
      token: uuidToToken[uuidOne],
      toType: 'mid',
      gid
    })

    await axios.post(`/playerGameChoice`, {
      pid: ingridBergmanId,
      mid: filmCasablancaId,
      token: uuidToToken[uuidTwo],
      toType: 'pid',
      gid
    })

    const response = await axios.post('/playerGameChoice', {
      pid: ingridBergmanId,
      mid: filmGaslightId,
      token: uuidToToken[uuidOne],
      toType: 'mid',
      gid
    })

    expect(response.status).toBe(200)
  })
})

