import { render, screen } from "@testing-library/react"

import GameContainer, { GameContainerProps } from './GameContainer'

const testGameName = "Test Game"
const testGid = "test-gid"
const testUuid = "test-uuid"
const testUserPlayerName = "test-user-player"

const mockedIsHeartbeatOn = jest.fn()

const mockedSetupHeartbeatInterval = jest.fn()
const mockedPlayerGameChoice = jest.fn()

function constructGameContainer(props: Partial<GameContainerProps> = {}) {
  const defaultProps: GameContainerProps = {
    gameId: testGid,
    players: [{
      name: testUserPlayerName,
      uuid: testUuid,
      key: testUuid,
      ready: true
    },{
      name: testUserPlayerName + "1",
      uuid: testUuid + "1",
      key: testUuid + "1",
      ready: true
    }],
    history: [],
    gameName: testGameName,
    uuid: testUuid,
    currentPlayer: testUuid,
    isHeartbeatOn: mockedIsHeartbeatOn,
    setupHeartbeatInterval: mockedSetupHeartbeatInterval,
    playerGameChoice: mockedPlayerGameChoice
  }

  return <GameContainer
    { ...defaultProps }
    { ...props }
  />
}

describe("Game Container page", () => {

  beforeEach(() => {
    mockedIsHeartbeatOn.mockReset()
    mockedSetupHeartbeatInterval.mockReset()
    mockedPlayerGameChoice.mockReset()
  })

  it("should render without crashing", () => {
    render(constructGameContainer())
  })

  it('sets up heartbeat if user in game', () => {
    render(constructGameContainer())

    expect(mockedIsHeartbeatOn).toHaveBeenCalledTimes(1)
    expect(mockedSetupHeartbeatInterval).toHaveBeenNthCalledWith(1, testGid)
  })

  it('doesn\'t set up heartbeat if user isn\'t in game', () => {
    render(constructGameContainer({
      players: [{
        name: testUserPlayerName + "2",
        uuid: testUuid + "2",
        key: testUuid + "2",
        ready: true
      },{
        name: testUserPlayerName + "1",
        uuid: testUuid + "1",
        key: testUuid + "1",
        ready: true
      }
    ]}))

    expect(mockedIsHeartbeatOn).toHaveBeenCalledTimes(1)
    expect(mockedSetupHeartbeatInterval).not.toHaveBeenCalled()
  })
})

describe("Game Container page implementation w/ child components", () => {

  beforeEach(() => {
    mockedIsHeartbeatOn.mockReset()
    mockedSetupHeartbeatInterval.mockReset()
    mockedPlayerGameChoice.mockReset()
  })

  it('sets and renders current player name', () => {
    render(constructGameContainer())

    expect(screen.getByText(`${testUserPlayerName}'s move`)).toBeInTheDocument()
  })

  it('sets the search type to both at the start', () => {
    render(constructGameContainer())

    expect(screen.getByText(`${testUserPlayerName} has to choose a movie or person to start!`)).toBeInTheDocument()
  })

  it.todo('sets the search type for next move based on last move')

  it.todo('sets final winner when all others have hit max score')

  it.todo('opens move modal when it\'s the user player\'s turn')

  it.todo('anyway to test that makeChoice method works?')
})

