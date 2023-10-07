import { render, screen } from "@testing-library/react"

import GamePlayerList, { GamePlayerListProps } from "./GamePlayerList"
import { GamePlayer } from "./GamePage"

const testUuid = "test-uuid"
const testUuid2 = "test-uuid2"
const testKey = "akey"
const testKey2 = "akey2"
const testUserPlayerName = "test-user-player"
const testUserPlayerName2 = "test-user-player2"

const testPlayer: GamePlayer = {
  uuid: testUuid,
  name: testUserPlayerName,
  key: testKey
}

const testPlayer2: GamePlayer = {
  uuid: testUuid2,
  name: testUserPlayerName2,
  key: testKey2
}

function constructGamePlayerList(props: Partial<GamePlayerListProps> = {}) {
  const defaultProps = {
    players: [testPlayer, testPlayer2],
    currentPlayer: testUuid
  }

  return <GamePlayerList
    {...defaultProps}
    {...props}
  />
}

describe("Game Player List", () => {

  it("renders without crashing", () => {
    render(constructGamePlayerList())
  })

  it("lists players in order of array", () => {
    render(constructGamePlayerList())

    const playerOneRow = screen.getByTestId(`game-player-list-row-${testPlayer.key}`)
    const playerTwoRow = screen.getByTestId(`game-player-list-row-${testPlayer2.key}`)

    // 4 === player two node follows player one node, see https://developer.mozilla.org/en-US/docs/Web/API/Node/compareDocumentPosition
    expect(playerOneRow.compareDocumentPosition(playerTwoRow)).toBe(4)
  })

  it("indicates if player has lost", () => {
    render(constructGamePlayerList({
      players: [
        { ...testPlayer, score: 5 },
        testPlayer2
      ]
    }))

    const playerOneRow = screen.getByTestId(`game-player-list-row-${testPlayer.key}`)
    expect(playerOneRow.textContent).toContain(`${testPlayer.name} is out!`)
  })

  it("checks heartbeat and lists as idle if heartbeat came over 11000 ms ago (11 seconds)", () => {
    render(constructGamePlayerList({
      players: [
        {
          ...testPlayer,
          heartbeat: new Date().getTime() - 11000
        },
        testPlayer2
      ],
      currentPlayer: testPlayer2.uuid
    }))

    const playerOneRow = screen.getByTestId(`game-player-list-row-${testPlayer.key}`)

    expect(playerOneRow.textContent).toContain(`${testPlayer.name} gone idle...`)
  })

  it("correctly renders score at 0 points", () => {
    render(constructGamePlayerList({
      players: [
        {
          ...testPlayer,
        },
        testPlayer2
      ],
      currentPlayer: testPlayer2.uuid
    }))

    const playerOneScore = screen.getByTestId(`game-player-list-score-${testPlayer.key}`)

    expect(playerOneScore.textContent).toBe(`*****`)
  })

  it("correctly renders score at 1 points", () => {
    render(constructGamePlayerList({
      players: [
        {
          ...testPlayer,
          score: 1
        },
        testPlayer2
      ],
      currentPlayer: testPlayer2.uuid
    }))

    const playerOneScore = screen.getByTestId(`game-player-list-score-${testPlayer.key}`)

    expect(playerOneScore.textContent).toBe(`M****`)
  })

  it("correctly renders score at 2 points", () => {
    render(constructGamePlayerList({
      players: [
        {
          ...testPlayer,
          score: 2
        },
        testPlayer2
      ],
      currentPlayer: testPlayer2.uuid
    }))

    const playerOneScore = screen.getByTestId(`game-player-list-score-${testPlayer.key}`)

    expect(playerOneScore.textContent).toBe(`MO***`)
  })

  it("correctly renders score at 3 points", () => {
    render(constructGamePlayerList({
      players: [
        {
          ...testPlayer,
          score: 3
        },
        testPlayer2
      ],
      currentPlayer: testPlayer2.uuid
    }))

    const playerOneScore = screen.getByTestId(`game-player-list-score-${testPlayer.key}`)

    expect(playerOneScore.textContent).toBe(`MOV**`)
  })

  it("correctly renders score at 4 points", () => {
    render(constructGamePlayerList({
      players: [
        {
          ...testPlayer,
          score: 4
        },
        testPlayer2
      ],
      currentPlayer: testPlayer2.uuid
    }))

    const playerOneScore = screen.getByTestId(`game-player-list-score-${testPlayer.key}`)

    expect(playerOneScore.textContent).toBe(`MOVI*`)
  })

  it("correctly renders score at 5 points", () => {
    render(constructGamePlayerList({
      players: [
        {
          ...testPlayer,
          score: 5
        },
        testPlayer2
      ],
      currentPlayer: testPlayer2.uuid
    }))

    const playerOneScore = screen.getByTestId(`game-player-list-score-${testPlayer.key}`)

    expect(playerOneScore.textContent).toBe(`MOVIE`)
  })
})
