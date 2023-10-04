import { render, screen, waitFor } from "@testing-library/react"

import GameMoveJumbotron, { GameMoveJumbotronProps } from "./GameMoveJumbotron"
import { GamePlayer } from "./GamePage"

// const testGameName = "Test Game"
// const testGid = "test-gid"
const testUuid = "test-uuid"
const testUserPlayerName = "test-user-player"

const testPlayer: GamePlayer = {
  uuid: testUuid,
  name: testUserPlayerName,
  key: "akey"
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

      await waitFor(() => {
        expect(screen.getByTestId("game-jumbotron-last-move-score-string")).toHaveTextContent("M****")
      })
    })

    it.todo("if max score is hit, bg of move modal renders as red, messaging writes player as knocked out")

    it.todo("if final winner passed in, displays green final winner modal after 2500ms (try using jest fake timers thing)")
  })

  describe("Current Move Display", () => {
    it.todo("if this is the first move, display appropriate text")

    it.todo("if the last move was correct and a movie, show text that next choice is a person from that movie")

    it.todo("if the last move was correct and a person, display appropriate text showing that the next choice is another movie with that person")

    it.todo("if the last move was incorrect and a movie, show text that next choice is any movie")

    it.todo("if the last move was incorrect and a person, show text that the next choice is any person")
  })
})
