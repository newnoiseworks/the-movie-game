import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import LobbyPlayerList, { LobbyPlayerListProps } from './LobbyPlayerList'

const testGid = "test-gid"
const testUuid = "test-uuid"

const mockedCopyUrlFn = jest.fn()
const mockedSetToDB = jest.fn()

function constructLobbyPlayerList(props: Partial<LobbyPlayerListProps> = {}) {
  const defaultProps = {
    players: [],
    gameId: testGid,
    copyUrlFn: mockedCopyUrlFn,
    uuid: testUuid,
    setToDB: mockedSetToDB
  }

  return <LobbyPlayerList { ...defaultProps } { ...props } />
}

describe("Lobby Player list component", () => {

  beforeEach(() => {
    mockedCopyUrlFn.mockReset()
    mockedSetToDB.mockReset()
  })

  it("renders without crashing", () => {
    render(constructLobbyPlayerList())
  })

  it("renders copy link which fires copyUrlFn on click", () => {
    render(constructLobbyPlayerList())

    const button = screen.getByTestId("lobby-player-list-copy-share-link")

    expect(button).toBeInTheDocument()
    expect(mockedCopyUrlFn).not.toHaveBeenCalled()

    userEvent.click(button)

    expect(mockedCopyUrlFn).toHaveBeenCalledTimes(1)
  })

  it("renders user row and player rows in correct order, user row first even if at bottom of array, afterwards array order respected", () => {
    render(constructLobbyPlayerList({
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
      },{
        name: "Player",
        uuid: testUuid,
        key: "gibberish-key2",
        ready: false
      }]
    }))

    expect(screen.getByTestId('lobby-player-list-user-nametag').textContent).toBe(`Player - (you)`)
    
    const userPlayerRow = screen.getByTestId('user-row-gibberish-key2')
    const firstPlayerRow = screen.getByTestId('player-row-gibberish-key')
    const secondPlayerRow = screen.getByTestId('player-row-gibberish-key1')

    expect(userPlayerRow).toBeInTheDocument()
    expect(firstPlayerRow).toBeInTheDocument()
    expect(secondPlayerRow).toBeInTheDocument()
    // 4 === first player node follows user player node, see https://developer.mozilla.org/en-US/docs/Web/API/Node/compareDocumentPosition
    expect(userPlayerRow.compareDocumentPosition(firstPlayerRow)).toBe(4)
    expect(firstPlayerRow.compareDocumentPosition(secondPlayerRow)).toBe(4)

    expect(screen.getByTestId('lobby-player-list-user-nametag').textContent).toBe(`Player - (you)`)
  })

  it("renders player row with correct ready state", () => {
    render(constructLobbyPlayerList({
      players: [{
        name: "Player1",
        uuid: testUuid + '1',
        key: "gibberish-key",
        ready: true
      },{
        name: "Player",
        uuid: testUuid + '2',
        key: "gibberish-key2",
        ready: false
      }]
    }))

    const playerRow = screen.getByTestId('player-row-gibberish-key')
    const secondPlayerRow = screen.getByTestId('player-row-gibberish-key2')

    // NOTE: text is broken up by columns in code
    expect(playerRow.textContent).toBe("Player1ready")
    expect(secondPlayerRow.textContent).toBe("Playernot ready")
  })

  it("renders user row with ready toggle which calls setToDB method", () => {
    render(constructLobbyPlayerList({
      players: [{
        name: "Player1",
        uuid: testUuid,
        key: "gibberish-key",
        ready: false
      },{
        name: "Player2",
        uuid: testUuid + '2',
        key: "gibberish-key1",
        ready: false
      }]
    }))

    const userReadyToggle = screen.getByTestId('lobby-player-list-user-ready-switch')

    expect(userReadyToggle).toBeInTheDocument()

    userEvent.click(userReadyToggle)

    expect(mockedSetToDB).toHaveBeenNthCalledWith(1, `games/${testGid}/players/gibberish-key/ready`, true)
  })
})

