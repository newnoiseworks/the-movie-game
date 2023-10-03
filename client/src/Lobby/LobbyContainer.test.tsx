import { render, waitFor, screen } from '@testing-library/react'

import LobbyContainer from './LobbyContainer'

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

const mockedSetupHeartbeatInterval = jest.fn()

const mockedCopyUrlFn = jest.fn()

const mockedGetUID = jest.fn().mockImplementation(() => testUuid)

describe("Create game page slash home page", () => {

  beforeEach(() => {
    isHeartbeatOnVar = false
    mockedNavigateMethod.mockReset()
    mockedCopyUrlFn.mockReset()
    mockedIsHeartbeatOn.mockReset()
    mockedSetupHeartbeatInterval.mockReset()
    mockedGetUID.mockReset()
  })

  it('renders without crashing', () => {
    render(<LobbyContainer
      players={[]}
      copyUrlFn={mockedCopyUrlFn}
      gameName={testGameName}
      gameId={testGid}
      isHeartbeatOn={mockedIsHeartbeatOn}
      setupHeartbeatInterval={mockedSetupHeartbeatInterval}
      uuid={testUuid}
    />)
  })

  it('opens modal on render if user not in players array', () => {
    render(<LobbyContainer
      players={[{
        name: "Player",
        uuid: "not-test-uuid",
        key: "gibberish-key"
      }]}
      copyUrlFn={mockedCopyUrlFn}
      gameName={testGameName}
      gameId={testGid}
      isHeartbeatOn={mockedIsHeartbeatOn}
      setupHeartbeatInterval={mockedSetupHeartbeatInterval}
      uuid={testUuid}
    />)

    expect(screen.getByTestId("join-game-modal-name-input")).toBeInTheDocument()
  })

  it('does not open modal on render if user in players array', () => {
    render(<LobbyContainer
      players={[{
        name: "Player",
        uuid: testUuid,
        key: "gibberish-key"
      }]}
      copyUrlFn={mockedCopyUrlFn}
      gameName={testGameName}
      gameId={testGid}
      isHeartbeatOn={mockedIsHeartbeatOn}
      setupHeartbeatInterval={mockedSetupHeartbeatInterval}
      uuid={testUuid}
    />)

    expect(screen.queryByTestId("join-game-modal-name-input")).not.toBeInTheDocument()
  })

  it('does not open modal if game is launching, even if user isn\'t in game', () => {
    render(<LobbyContainer
      players={[{
        name: "Player1",
        uuid: testUuid + '1',
        key: "gibberish-key",
        ready: true
      },{
        name: "Player2",
        uuid: testUuid + '2',
        key: "gibberish-key1",
        ready: true
      }]}
      copyUrlFn={mockedCopyUrlFn}
      gameName={testGameName}
      gameId={testGid}
      isHeartbeatOn={mockedIsHeartbeatOn}
      setupHeartbeatInterval={mockedSetupHeartbeatInterval}
      uuid={testUuid}
    />)

    expect(screen.queryByTestId("join-game-modal-name-input")).not.toBeInTheDocument()
  })

  it('starts countdown if all players are ready', async () => {
    const { rerender } = render(<LobbyContainer
      players={[{
        name: "Player1",
        uuid: testUuid + '1',
        key: "gibberish-key",
        ready: true
      },{
        name: "Player2",
        uuid: testUuid + '2',
        key: "gibberish-key1",
        ready: false
      }]}
      copyUrlFn={mockedCopyUrlFn}
      gameName={testGameName}
      gameId={testGid}
      isHeartbeatOn={mockedIsHeartbeatOn}
      setupHeartbeatInterval={mockedSetupHeartbeatInterval}
      uuid={testUuid}
    />)

    expect(screen.getByTestId("join-game-modal-name-input")).toBeInTheDocument()
    expect(screen.queryByTestId("game-launching-header")).not.toBeInTheDocument()

    rerender(<LobbyContainer
      players={[{
        name: "Player1",
        uuid: testUuid + '1',
        key: "gibberish-key",
        ready: true
      },{
        name: "Player2",
        uuid: testUuid + '2',
        key: "gibberish-key1",
        ready: true
      }]}
      copyUrlFn={mockedCopyUrlFn}
      gameName={testGameName}
      gameId={testGid}
      isHeartbeatOn={mockedIsHeartbeatOn}
      setupHeartbeatInterval={mockedSetupHeartbeatInterval}
      uuid={testUuid}
    />)

    expect(screen.getByTestId("game-launching-header")).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByTestId("join-game-modal-name-input")).not.toBeInTheDocument())
  })
})

