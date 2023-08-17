import * as nock from 'nock'
import * as path from 'path'
import axios from 'axios'
import http from 'http'

import api from './api'

let nockDone: () => void
let conn: http.Server

beforeAll(async () => {
  axios.defaults.baseURL = process.env.APP_TEST_URL
  conn = api.listen(process.env.APP_TEST_PORT)
  nock.back.setMode("record")
  nock.back.fixtures = path.join(__dirname, '..', 'tapes', 'api')
  nock.enableNetConnect('127.0.0.1')
})

afterEach(() => nockDone())

afterAll(() => conn.close())

describe("/movieSearch", () => {
  beforeEach(async () => {
    nockDone = (await nock.back(`movieSearch.json`)).nockDone
  })

  test("can find movie", async() => {
    const response = await axios.get(`/movieSearch?q=Thank%20You%20For%20Smoking`)

    expect(response.data).toBeTruthy()
    expect(response.data.page).toEqual(1)
  })
})

