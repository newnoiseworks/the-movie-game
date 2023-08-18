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

  test("can find single specific movie", async() => {
    const response = await axios.get(`/movieSearch?q=Thank%20You%20For%20Smoking`)

    expect(response.data).toBeTruthy()
    expect(response.data.page).toEqual(1)
    expect(response.data.results[0].title).toBe('Thank You for Smoking')
  })

  test("finds multiple movies", async() => {
    const response = await axios.get(`/movieSearch?q=Die%20Hard`)

    expect(response.data).toBeTruthy()
    expect(response.data.page).toEqual(1)
    expect(response.data.results.length).toBeGreaterThan(1)
  })
})

