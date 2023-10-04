import { render, screen, waitFor } from "@testing-library/react"
import {act} from "react-dom/test-utils"

import GameMoveJumbotron, { GameMoveJumbotronProps } from "./GameMoveJumbotron"
import { GamePlayer } from "./GamePage"

// const testGameName = "Test Game"
// const testGid = "test-gid"
const testUuid = "test-uuid"
const testUserPlayerName = "test-user-player"
const testUserPlayerName2 = "test-user-player2"

const testPlayer: GamePlayer = {
  uuid: testUuid,
  name: testUserPlayerName,
  key: "akey"
}

const testPlayer2: GamePlayer = {
  uuid: testUuid + "2",
  name: testUserPlayerName2,
  key: "akey2"
}

function constructGameMoveJumbotron(props: Partial<GameMoveJumbotronProps> = {}) {
  const defaultProps: GameMoveJumbotronProps = {
    playerName: testUserPlayerName,
  }

  return <GameMoveJumbotron
    {...defaultProps}
    {...props}
  />
}

describe("Game Move Jumbotron component", () => {

  describe("Last move popup window", () => {
    it("renders without crashing", () => {
      render(constructGameMoveJumbotron())
    })

    it("if there is no last move, the move alert modal should not render", () => {
      render(constructGameMoveJumbotron())

      expect(screen.getByTestId("game-jumbotron-last-move-string")).not.toBeVisible()
    })

    it("if there is a last move, the move alert modal should not render", async () => {
      render(constructGameMoveJumbotron({
        lastMove: {
          name: "A movie",
          photo: "url",
          toType: "mid",
          key: "akey",
          player: testPlayer,
          correct: false
        }
      }))

      await waitFor(() => {
        expect(screen.getByTestId("game-jumbotron-last-move-string")).toBeVisible()
      })
    })

    it("if the second to last move was incorrect, the move alert modal should not render for the next (last) move", async () => {
      const { rerender } = render(constructGameMoveJumbotron({
        lastMove: {
          name: "A movie",
          photo: "url",
          toType: "mid",
          key: "akey",
          player: testPlayer,
          correct: false
        }
      }))

      await waitFor(() => {
        expect(screen.getByTestId("game-jumbotron-last-move-string")).toBeVisible()
      })

      rerender(constructGameMoveJumbotron({
        lastMove: {
          name: "A person",
          photo: "url",
          toType: "pid",
          key: "akey",
          player: testPlayer,
          correct: true
        }
      }))

      await waitFor(() => {
        expect(screen.getByTestId("game-jumbotron-last-move-string")).not.toBeVisible()
      })
    })

    it("reports last move as correct in modal if the last move passed in was correct", async () => {
      render(constructGameMoveJumbotron({
        lastMove: {
          name: "A movie",
          photo: "url",
          toType: "mid",
          key: "akey",
          player: testPlayer,
          correct: true
        }
      }))

      await waitFor(() => {
        expect(screen.getByTestId("game-jumbotron-last-move-string")).toHaveTextContent(" correct!")
      })
    })

    it("reports last move as incorrect in modal if the last move passed in was incorrect", async () => {
      render(constructGameMoveJumbotron({
        lastMove: {
          name: "A movie",
          photo: "url",
          toType: "mid",
          key: "akey",
          player: testPlayer,
          correct: false
        }
      }))

      await waitFor(() => {
        expect(screen.getByTestId("game-jumbotron-last-move-string")).toHaveTextContent(" incorrect!")
      })
    })

    it("renders user score in last move modal", async () => {
      render(constructGameMoveJumbotron({
        lastMove: {
          name: "A movie",
          photo: "url",
          toType: "mid",
          key: "akey",
          player: { ...testPlayer, score: 1 },
          correct: false,
        }
      }))

      expect(screen.queryByTestId("game-jumbotron-last-move-knocked-out-message")).not.toBeInTheDocument()
      expect(screen.getByTestId("game-jumbotron-last-move-score-string")).toHaveTextContent("M****")
    })

    it("if max score is hit messaging writes player as knocked out", async () => {
      render(constructGameMoveJumbotron({
        lastMove: {
          name: "A movie",
          photo: "url",
          toType: "mid",
          key: "akey",
          player: { ...testPlayer, score: 5 },
          correct: false,
        }
      }))

      expect(screen.getByTestId("game-jumbotron-last-move-knocked-out-message")).toBeInTheDocument()
    })

    it("if no final winner passed in, does not renders final winner modal", () => {
      render(constructGameMoveJumbotron({
        lastMove: {
          name: "A movie",
          photo: "url",
          toType: "mid",
          key: "akey",
          player: { ...testPlayer, score: 5 },
          correct: false,
        }
      }))

      expect(screen.queryByTestId("game-jumbotron-final-winner-box")).not.toBeInTheDocument()
    })

    it("if final winner passed in, renders final winner modal, displays after 5 seconds", async () => {
      jest.useFakeTimers()

      render(constructGameMoveJumbotron({
        lastMove: {
          name: "A movie",
          photo: "url",
          toType: "mid",
          key: "akey",
          player: { ...testPlayer2, score: 5 },
          correct: false,
        },
        finalWinner: testPlayer
      }))

      expect(screen.getByTestId("game-jumbotron-final-winner-box")).toBeInTheDocument()
      expect(screen.getByTestId("game-jumbotron-final-winner-box")).not.toBeVisible()

      act(() => {
        jest.advanceTimersByTime(5010)
      })

      await waitFor(() => {
        expect(screen.getByTestId("game-jumbotron-final-winner-box")).toBeVisible()
      })

      jest.useRealTimers()
    })
  })

  describe("Current Move Display", () => {
    it("if this is the first move, display appropriate text", () => {
      render(constructGameMoveJumbotron())

      const text = screen.getByTestId("game-jumbotron-current-move-string")
      const currentPlayerNameText = screen.getByTestId("game-jumbotron-current-player-name")

      expect(text.textContent).toBe(testUserPlayerName + " has to choose a movie or person to start!")
      expect(currentPlayerNameText.textContent).toBe(testUserPlayerName + "'s move")
    })

    it("if the last move was correct and a movie, show text that next choice is a person from that movie", () => {
      render(constructGameMoveJumbotron({
        lastMove: {
          name: "A movie",
          photo: "url",
          toType: "mid",
          key: "akey",
          player: testPlayer,
          correct: true
        },
        playerName: testUserPlayerName2
      }))

      const text = screen.getByTestId("game-jumbotron-current-move-string")

      expect(text.textContent).toBe(testUserPlayerName2 + " has to choose a person from the movie A movie")
    })

    it("if the last move was correct and a person, display appropriate text showing that the next choice is another movie with that person", () => {
      render(constructGameMoveJumbotron({
        lastMove: {
          name: "A person",
          photo: "url",
          toType: "pid",
          key: "akey",
          player: testPlayer,
          correct: true
        },
        playerName: testUserPlayerName2
      }))

      const text = screen.getByTestId("game-jumbotron-current-move-string")

      expect(text.textContent).toBe(testUserPlayerName2 + " has to choose a movie containing A person")
    })

    it("if the last move was incorrect and a movie, show text that next choice is any movie", () => {
      render(constructGameMoveJumbotron({
        lastMove: {
          name: "A movie",
          photo: "url",
          toType: "mid",
          key: "akey",
          player: testPlayer,
          correct: false
        },
        playerName: testUserPlayerName2
      }))

      const text = screen.getByTestId("game-jumbotron-current-move-string")

      expect(text.textContent).toBe(testUserPlayerName2 + " has to choose a movie - any movie!")
    })

    it("if the last move was incorrect and a person, show text that the next choice is any person", () => {
      render(constructGameMoveJumbotron({
        lastMove: {
          name: "A person",
          photo: "url",
          toType: "pid",
          key: "akey",
          player: testPlayer,
          correct: false
        },
        playerName: testUserPlayerName2
      }))

      const text = screen.getByTestId("game-jumbotron-current-move-string")

      expect(text.textContent).toBe(testUserPlayerName2 + " has to choose a person from a movie!")
    })
  })
})
