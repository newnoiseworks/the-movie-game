import nock from 'nock'
import * as path from 'path'
import axios from 'axios'
import http from 'http'

import api from './api'

const NOCK_BACK_MODE = "update"

let nockDone: () => void
let conn: http.Server

beforeAll(async () => {
  axios.defaults.baseURL = process.env.APP_TEST_URL
  conn = api.listen(process.env.APP_TEST_PORT)
  nock.back.fixtures = path.join(__dirname, '..', 'tapes', 'api')
  nock.back.setMode(NOCK_BACK_MODE)
  nock.enableNetConnect('127.0.0.1')
})

afterEach(() => nockDone())

afterAll(() => conn.close())

describe("/movieSearch", () => {
  beforeEach(async () => {
    nockDone = (await nock.back(`movieSearch.json`)).nockDone
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
    nockDone = (await nock.back(`personSearch.json`)).nockDone
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
    nockDone = (await nock.back(`getMovie.json`)).nockDone
  })

  test("can get a single movie based on it's TMDB id", async () => {
    const response = await axios.get(`/getMovie?mid=335796`)

    expect(response.data).toBeTruthy()
    expect(response.data.original_title).toBe('Ouija: Origin of Evil')
  })
})

describe("/getPerson", () => {
  beforeEach(async () => {
    nockDone = (await nock.back(`getPerson.json`)).nockDone
  })

  test("can get a single artful liar on their TMDB id", async () => {
    const response = await axios.get(`/getPerson?pid=36422`)

    expect(response.data).toBeTruthy()
    expect(response.data.name).toBe('Luke Wilson')
  })
})

// describe("/createGame", () => {
//   beforeEach(async () => {
//     nockDone = (await nock.back(`createGame.json`)).nockDone
//   })

//   test("can't create a game without authentication")

//   test("creates a game and stores in firebase DB")
// })

// describe("/joinGame", () => {
//   beforeEach(async () => {
//     nockDone = (await nock.back(`joinGame.json`)).nockDone
//   })

//   test("can't join a game without authentication")

//   test("join game and registers user in firebase DB")

//   test("can't double join a game")
// })

// describe("/playerGameChoice", () => {
//   beforeEach(async () => {
//     nockDone = (await nock.back(`playerGameChoice.json`)).nockDone
//   })

//   test("can't make a player chocie on a game without authentication")

//   test("can't make a player choice on a game without having joined it (authorization as it were)")

//   test("correct choice rotates current player in DB and doesn't adjust score")

//   test("incorrect choice rotates current player in DB and adjusts score")

//   test("incorrect choice rotates current player in DB and adjusts score, causing loss to player")

//   test("can't make a player choice on a game if player is at max score")
// })

