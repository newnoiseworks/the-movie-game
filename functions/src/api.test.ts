import * as path from 'path'
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import http from 'http'
import nock from 'nock'

import admin from './fbase'
import api from './api'
import Game, {
  Player,
  GameMove,
  MAX_SCORE,
  GameErrorMovieOrArtfulLiarAlreadyChosen,
  GameErrorPreviousMovieDoesntMatchCurrent,
  GameErrorPreviousArtfulLiarDoesntMatchCurrent
} from './game'

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
const allow400sConfig: AxiosRequestConfig = {
  validateStatus: (status) => status < 500
}

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

function getAuthHeaders(token: string) {
  return {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
}

const getAuthHeaderFor = (uuid: string | number) => {
  if (typeof uuid === 'number') {
    uuid = uuids[uuid]
  }

  return getAuthHeaders(uuidToToken[uuid])
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
    const response = await axios.post(`/createGame`, {}, allow400sConfig)

    expect(response.status).toBe(401)
  })

  test("creates a game and stores in firebase DB", async () => {
    const gameName = "The moviest game"
    const response = await axios.post(`/createGame`, {
      name: "test-name",
      gameName
    }, getAuthHeaderFor(0))

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
      name: "test-name",
    }, getAuthHeaderFor(0))

    const gameKey = response.data

    const gameRef = (await db.ref(`games/${gameKey}`).once("value")).val()

    expect(gameRef.name).toBe(gameName)
  })
})

describe("/gameDetails", () => {
  let gid: string | null

  beforeEach(async () => {
    nockDone = (await nock.back(`joinGame.json`, NOCK_BACK_OPTIONS)).nockDone

    gid = await new Game(db).create({ uuid: uuidOne, name })
  })

  test("can't get a game without authentication", async () => {
    const response = await axios.post(`/joinGame`, {
      name: "test-user-two",
      gid
    }, allow400sConfig)

    expect(response.status).toBe(401)
  })

  test("404s on blank gid", async () => {
    const response = await axios.get(
      `/gameDetails`,
      { ...allow400sConfig, ...getAuthHeaderFor(1) }
    )

    expect(response.status).toBe(404)
  })

  test("404s on non existent gid", async () => {
    const response = await axios.get(
      `/gameDetails?gid=gibberish`,
      { ...allow400sConfig, ...getAuthHeaderFor(1) }
    )

    expect(response.status).toBe(404)
  })

  test("gets game details given a gid", async () => {
    const response = await axios.get(
      `/gameDetails?gid=${gid}`,
      getAuthHeaderFor(1)
    )

    const gameRefFromServer = (await db.ref(`games/${gid}`).once('value')).val() as Game

    expect(response.status).toBe(200)
    expect(response.data.players).toStrictEqual(gameRefFromServer.players)
    expect(response.data.name).toBe(gameRefFromServer.name)
    expect(response.data.currentPlayer).toBe(gameRefFromServer.currentPlayer)
    expect(response.data.gid).toBe(gid)
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
    }, allow400sConfig)

    expect(response.status).toBe(401)
  })

  test("join game and registers user in firebase DB", async () => {
    const response = await axios.post(`/joinGame`, {
      name: nameTwo,
      gid,
    }, getAuthHeaderFor(1))

    const gameRefFromServer = (await db.ref(`games/${gid}`).once('value')).val() as Game

    const playerTwoKey = Object.keys(gameRefFromServer.players).find((key) => gameRefFromServer.players[key].uuid === uuidTwo)

    expect(response.status).toBe(200)
    expect(playerTwoKey).toBeTruthy()
    expect(gameRefFromServer.players[playerTwoKey!]).toBeTruthy()
    expect(gameRefFromServer.players[playerTwoKey!].uuid).toBe(uuidTwo)
    expect(response.data).toBe(playerTwoKey)
    expect(Object.keys(gameRefFromServer.players).length).toBe(2)
  })

  test("can't double join a game", async () => {
    const response = await axios.post(`/joinGame`, {
      uuid: uuidOne,
      name,
      gid,
    }, { ...allow400sConfig, ...getAuthHeaderFor(0) })

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
    }, { ...allow400sConfig, ...getAuthHeaderFor(2) })

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
      ready: true,
      gid
    }, getAuthHeaderFor(0))

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
      ready: false,
      gid
    }, getAuthHeaderFor(0))

    gameRefFromServer = (await db.ref(`games/${gid}`).once('value')).val() as Game

    firstPlayer = gameRefFromServer.players[Object.keys(gameRefFromServer.players)[0]]

    expect(firstPlayer.ready).toBeFalsy()
  })
})

describe("/playerGameChoice", () => {
  let gid: string | null
  let game: Game
  const filmSideways = 9675
  const filmLoserId = 10642
  const menaSuvariId = 8211
  const taraReidId = 1234

  const filmGaslightId = 13528 // Correct Reference!
  const filmCasablancaId = 289
  const filmMurderExpressId = 4176
  const humphreyBogartId = 4110
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
    }, allow400sConfig)

    expect(response.status).toBe(401)
  })

  test("can't make a player choice on a game without having joined it (authorization as it were)", async () => {
    const response = await axios.post(`/playerGameChoice`, {
      mid: filmLoserId,
      pid: menaSuvariId,
      gid
    }, { ...allow400sConfig, ...getAuthHeaderFor(2) })

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
      toType: 'pid',
      gid
    }, getAuthHeaderFor(0))

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
      toType: 'pid',
      gid
    }, getAuthHeaderFor(0))

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
      gid
    }, { ...allow400sConfig, ...getAuthHeaderFor(0) })

    expect(response.status).toBe(403)
  })

  test("player can choose artful liar Mena Suvari from the movie Loser if that was the last movie picked", async () => {
    await axios.post(`/playerGameChoice`, {
      mid: filmLoserId,
      toType: 'mid',
      gid
    }, getAuthHeaderFor(0))

    const response = await axios.post(`/playerGameChoice`, {
      mid: filmLoserId,
      pid: menaSuvariId,
      toType: 'pid',
      gid
    }, getAuthHeaderFor(1))

    expect(response.status).toBe(200)
  })

  test("player cannot choose an artful liar that has already been picked", async () => {
    await axios.post(`/playerGameChoice`, {
      pid: menaSuvariId,
      toType: 'pid',
      gid
    }, getAuthHeaderFor(0))

    await axios.post(`/playerGameChoice`, {
      pid: menaSuvariId,
      mid: filmLoserId,
      toType: 'mid',
      gid
    }, getAuthHeaderFor(1))

    const response = await axios.post('/playerGameChoice', {
      mid: filmLoserId,
      pid: menaSuvariId,
      toType: 'pid',
      gid
    }, { ...allow400sConfig, ...getAuthHeaderFor(0) })

    expect(response.status).toBe(403)
    expect(response.data).toBe(new GameErrorMovieOrArtfulLiarAlreadyChosen().message)
  })

  test("player cannot choose a movie that has already been picked", async () => {
    await axios.post(`/playerGameChoice`, {
      mid: filmGaslightId,
      toType: 'mid',
      gid
    }, getAuthHeaderFor(0))

    await axios.post(`/playerGameChoice`, {
      pid: ingridBergmanId,
      mid: filmGaslightId,
      toType: 'pid',
      gid
    }, getAuthHeaderFor(1))

    const response = await axios.post('/playerGameChoice', {
      pid: ingridBergmanId,
      mid: filmGaslightId,
      toType: 'mid',
      gid
    }, { ...allow400sConfig, ...getAuthHeaderFor(0) })

    expect(response.status).toBe(403)
    expect(response.data).toBe(new GameErrorMovieOrArtfulLiarAlreadyChosen().message)
  })

  test("player can choose a movie Ingrid Bergman starred in if Ms. Bergman was the last artful liar picked, and the movie hasn't already been picked", async () => {
    await axios.post(`/playerGameChoice`, {
      mid: filmCasablancaId,
      toType: 'mid',
      gid
    }, getAuthHeaderFor(0))

    await axios.post(`/playerGameChoice`, {
      pid: ingridBergmanId,
      mid: filmCasablancaId,
      toType: 'pid',
      gid
    }, getAuthHeaderFor(1))

    const response = await axios.post('/playerGameChoice', {
      pid: ingridBergmanId,
      mid: filmGaslightId,
      toType: 'mid',
      gid
    }, getAuthHeaderFor(0))

    expect(response.status).toBe(200)
  })

  test("player can't choose an artful liar from a movie that wasn't the last movie chosen", async () => {
    await axios.post(`/playerGameChoice`, {
      mid: filmMurderExpressId,
      toType: 'mid',
      gid
    }, getAuthHeaderFor(0))

    await axios.post(`/playerGameChoice`, {
      pid: ingridBergmanId,
      mid: filmMurderExpressId,
      toType: 'pid',
      gid
    }, getAuthHeaderFor(1))

    // technically Bogart was in Casablanca, which is a match... but,
    // the last move was the film Gaslight, so this should result in a 403
    // with a relevant error message in the reponse
    const response = await axios.post('/playerGameChoice', {
      pid: humphreyBogartId,
      mid: filmCasablancaId,
      toType: 'mid',
      gid
    }, { ...allow400sConfig, ...getAuthHeaderFor(0) })

    expect(response.status).toBe(403)
    expect(response.data).toContain(new GameErrorPreviousMovieDoesntMatchCurrent().message)
  })

  test("player can't choose a movie from an artful liar that wasn't from the last artful liar chosen", async () => {
    await axios.post(`/playerGameChoice`, {
      pid: ingridBergmanId,
      toType: 'pid',
      gid
    }, getAuthHeaderFor(0))

    await axios.post('/playerGameChoice', {
      pid: ingridBergmanId,
      mid: filmGaslightId,
      toType: 'mid',
      gid
    }, getAuthHeaderFor(1))

    // technically Bogart was in Casablanca, which is a match... but,
    // the last move was the artful liar Ingrid Bergman, so this should result in a 403
    // with a relevant error message in the reponse
    const response = await axios.post('/playerGameChoice', {
      pid: humphreyBogartId,
      mid: filmCasablancaId,
      toType: 'pid',
      gid
    }, { ...allow400sConfig, ...getAuthHeaderFor(0) })

    expect(response.status).toBe(403)
    expect(response.data).toContain(new GameErrorPreviousArtfulLiarDoesntMatchCurrent().message)
  })

  test("movie choices track movie name and supply image when available", async () => {
    await axios.post(`/playerGameChoice`, {
      pid: ingridBergmanId,
      toType: 'pid',
      gid
    }, getAuthHeaderFor(0))

    await axios.post('/playerGameChoice', {
      pid: ingridBergmanId,
      mid: filmGaslightId,
      toType: 'mid',
      gid
    }, getAuthHeaderFor(1))

    const history: { [key: string]: GameMove } = (await db.ref(`games/${gid}/history`).once("value")).val()
    const firstMove: GameMove = history[Object.keys(history)[0]]
    const secondMove: GameMove = history[Object.keys(history)[1]]

    expect(firstMove.name).toEqual("Ingrid Bergman")
    expect(secondMove.name).toEqual("Gaslight")
    expect(typeof firstMove.photo).toBe("string")
    expect(typeof secondMove.photo).toBe("string")
  })

  test("player can choose whatever movie after an incorrect movie has been chosen", async () => {
    await axios.post(`/playerGameChoice`, {
      pid: ingridBergmanId,
      toType: 'pid',
      gid
    }, getAuthHeaderFor(0))

    await axios.post('/playerGameChoice', {
      pid: ingridBergmanId,
      mid: filmSideways,
      toType: 'mid',
      gid
    }, getAuthHeaderFor(1))

    // technically Bogart was in Casablanca, which is a match... but,
    // the last move was the artful liar Ingrid Bergman, so this should result in a 403
    // with a relevant error message in the reponse
    const response = await axios.post('/playerGameChoice', {
      mid: filmLoserId,
      toType: 'mid',
      gid
    }, getAuthHeaderFor(0))

    expect(response.status).toBe(200)
  })

  test("player can choose whatever person after an incorrect person has been chosen", async () => {
    await axios.post(`/playerGameChoice`, {
      pid: filmSideways,
      toType: 'mid',
      gid
    }, getAuthHeaderFor(0))

    await axios.post('/playerGameChoice', {
      pid: ingridBergmanId,
      mid: filmSideways,
      toType: 'pid',
      gid
    }, getAuthHeaderFor(1))

    // technically Bogart was in Casablanca, which is a match... but,
    // the last move was the artful liar Ingrid Bergman, so this should result in a 403
    // with a relevant error message in the reponse
    const response = await axios.post('/playerGameChoice', {
      pid: humphreyBogartId,
      toType: 'pid',
      gid
    }, getAuthHeaderFor(0))

    expect(response.status).toBe(200)
  })
})
  
