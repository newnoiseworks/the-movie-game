import admin from './fbase'
import * as path from 'path'
import axios, {AxiosResponse} from 'axios'
import http from 'http'
import nock from 'nock'

import api from './api'

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
const uuids: string[] = ["uuidOne", "uuidTwo"]
const uuidToToken: { [key: string]: string; } = {}

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
    const response = await axios.post(`/createGame`)

    expect(response.status).toBe(401)
  })

  test("creates a game and stores in firebase DB", async () => {
    const response = await axios.post(`/createGame`, {
      token: uuidToToken[uuids[0]],
      name: "test-game"
    })

    const gameKey = response.data

    const gameRef = (await db.ref(`games/${gameKey}`).once("value")).val()

    expect(gameRef.players.length).toBe(1)
    expect(gameRef.currentPlayer).toBe(uuids[0])
  })
})

// describe("/joinGame", () => {
//   beforeEach(async () => {
//     nockDone = (await nock.back(`joinGame.json`, NOCK_BACK_OPTIONS)).nockDone
//   })

//   test("can't join a game without authentication")

//   test("join game and registers user in firebase DB")

//   test("can't double join a game")
// })

// describe("/playerGameChoice", () => {
//   beforeEach(async () => {
//     nockDone = (await nock.back(`playerGameChoice.json`, NOCK_BACK_OPTIONS)).nockDone
//   })

//   test("can't make a player chocie on a game without authentication")

//   test("can't make a player choice on a game without having joined it (authorization as it were)")

//   test("correct choice rotates current player in DB and doesn't adjust score")

//   test("incorrect choice rotates current player in DB and adjusts score")

//   test("incorrect choice rotates current player in DB and adjusts score, causing loss to player")

//   test("can't make a player choice on a game if player is at max score")
// })

