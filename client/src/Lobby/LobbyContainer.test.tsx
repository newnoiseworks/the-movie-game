import {  render, waitFor, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import LobbyContainer, { LobbyContainerProps } from './LobbyContainer'

const testGameName = "Test Game"
const testGid = "test-gid"
const testUuid = "test-uuid"

const mockedNavigateMethod = jest.fn()

jest.mock("react-router-dom", () => ({
  ...(jest.requireActual("react-router-dom")),
  useNavigate: () => mockedNavigateMethod,
}))

jest.mock("../api", () => ({
  ...(jest.requireActual("../api")),
  getUID: () => jest.fn()
}))

let isHeartbeatOnVar = false
const mockedIsHeartbeatOn = jest.fn().mockImplementation(() => {
  isHeartbeatOnVar = !isHeartbeatOnVar
  return isHeartbeatOnVar
})

const mockedStartCountdown = jest.fn()
const mockedResetCountdown = jest.fn()
const mockedSetupHeartbeatInterval = jest.fn()
const mockedCopyUrlFn = jest.fn()
const mockedGetUID = jest.fn().mockImplementation(() => testUuid)

function constructLobbyContainer(props: Partial<LobbyContainerProps> = {}) {
  const defaultProps = {
    players: [],
    copyUrlFn: mockedCopyUrlFn,
    gameName: testGameName,
    gameId: testGid,
    isHeartbeatOn: mockedIsHeartbeatOn,
    setupHeartbeatInterval: mockedSetupHeartbeatInterval,
    uuid: testUuid,
    startCountdown: mockedStartCountdown,
    resetCountdown: mockedResetCountdown,
    count: 10
  }

  return <LobbyContainer {  ...defaultProps } { ...props } />
}

describe("Create game page slash home page", () => {

  beforeEach(() => {
    isHeartbeatOnVar = false
    mockedNavigateMethod.mockReset()
    mockedCopyUrlFn.mockReset()
    mockedIsHeartbeatOn.mockReset()
    mockedSetupHeartbeatInterval.mockReset()
    mockedGetUID.mockReset()
    mockedResetCountdown.mockReset()
    mockedStartCountdown.mockReset()
  })

  it('renders without crashing', () => {
    render(constructLobbyContainer())
  })

  it('opens modal on render if user not in players array', () => {
    render(constructLobbyContainer({
      players: [{
        name: "Player",
        uuid: "not-test-uuid",
        key: "gibberish-key"
      }],
    }))

    expect(screen.getByTestId("join-game-modal-name-input")).toBeInTheDocument()
  })

  it('does not open modal on render if user in players array', () => {
    render(constructLobbyContainer({
      players: [{
        name: "Player",
        uuid: testUuid,
        key: "gibberish-key"
      }]
    }))

    expect(screen.queryByTestId("join-game-modal-name-input")).not.toBeInTheDocument()
  })

  it('does not open modal if game is launching, even if user isn\'t in game', () => {
    render(constructLobbyContainer({
      players: [{
        name: "Player1",
        uuid: testUuid + '1',
        key: "gibberish-key",
        ready: true
      },{
        name: "Player2",
        uuid: testUuid + '2',
        key: "gibberish-key1",
        ready: true
      }]
    }))

    expect(screen.queryByTestId("join-game-modal-name-input")).not.toBeInTheDocument()
  })

  it('starts countdown if all players are ready', async () => {
    const { rerender } = render(constructLobbyContainer({
      players: [{
        name: "Player1",
        uuid: testUuid + '1',
        key: "gibberish-key",
        ready: true
      },{
        name: "Player2",
        uuid: testUuid + '2',
        key: "gibberish-key1",
        ready: false
      }]
    }))

    expect(screen.getByTestId("join-game-modal-name-input")).toBeInTheDocument()
    expect(screen.queryByTestId("game-launching-header")).not.toBeInTheDocument()

    rerender(constructLobbyContainer({
      players: [{
        name: "Player1",
        uuid: testUuid + '1',
        key: "gibberish-key",
        ready: true
      },{
        name: "Player2",
        uuid: testUuid + '2',
        key: "gibberish-key1",
        ready: true
      }]
    }))

    await waitFor(() => expect(screen.queryByTestId("join-game-modal-name-input")).not.toBeInTheDocument())
    expect(screen.getByTestId("game-launching-header")).toBeInTheDocument()
    expect(mockedStartCountdown).toHaveBeenCalledTimes(1)
  })

  it('resets countdown if a players backs out of ready', async () => {
    const { rerender } = render(constructLobbyContainer({
      players: [{
        name: "Player1",
        uuid: testUuid + '1',
        key: "gibberish-key",
        ready: true
      },{
        name: "Player2",
        uuid: testUuid + '2',
        key: "gibberish-key1",
        ready: true
      }],
    }))

    expect(screen.queryByTestId("join-game-modal-name-input")).not.toBeInTheDocument()
    expect(screen.getByTestId("game-launching-header")).toBeInTheDocument()
    expect(mockedStartCountdown).toHaveBeenCalledTimes(1)

    rerender(constructLobbyContainer({
      players: [{
        name: "Player1",
        uuid: testUuid + '1',
        key: "gibberish-key",
        ready: true
      },{
        name: "Player2",
        uuid: testUuid + '2',
        key: "gibberish-key1",
        ready: false
      }]
    }))

    expect(screen.queryByTestId("game-launching-header")).not.toBeInTheDocument()
    expect(mockedResetCountdown).toHaveBeenCalledTimes(1)
  })

  it('sets up heartbeat if user in game', async () => {
    render(constructLobbyContainer({
      players: [{
        name: "Player1",
        uuid: testUuid,
        key: "gibberish-key",
        ready: false
      }]
    }))

    expect(mockedIsHeartbeatOn).toHaveBeenCalledTimes(1)
    expect(mockedSetupHeartbeatInterval).toHaveBeenNthCalledWith(1, testGid)
  })

  it('if game has already started (player has score), navigate to live game page', async () => {
    render(constructLobbyContainer({
      players: [{
        name: "Player1",
        uuid: testUuid + "1",
        key: "gibberish-key",
        ready: true,
        score: 1
      },{
        name: "Player2",
        uuid: testUuid + "2",
        key: "gibberish-key2",
        ready: true
      }]
    }))

    expect(mockedNavigateMethod).toHaveBeenNthCalledWith(1, `/game/${testGid}`)
  })

  // TODO: Move useCountdown props to parent component and pass down, easier
  it('when countdown is 0 navigate to live game page', async () => {
    render(constructLobbyContainer({
      players: [{
        name: "Player1",
        uuid: testUuid + "1",
        key: "gibberish-key",
        ready: true,
      },{
        name: "Player2",
        uuid: testUuid + "2",
        key: "gibberish-key2",
        ready: true
      }],
      count: 0
    }))

    expect(mockedNavigateMethod).toHaveBeenNthCalledWith(1, `/game/${testGid}`)
  })

  })
})


  
