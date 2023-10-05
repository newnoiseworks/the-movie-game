import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import GameMoveModal, { SearchType, GameMoveModalProps } from './GameMoveModal'
import { GamePlayer } from "./GamePage"

const testUuid = "test-uuid"
const testUserPlayerName = "test-user-player"
const testUserPlayerName2 = "test-user-player2"

const testPlayer: GamePlayer = {
  uuid: testUuid,
  name: testUserPlayerName,
  key: "akey"
}

const mockedMakeChoice = jest.fn()

function constructGameMoveModal(props: Partial<GameMoveModalProps> = {}) {
  const defaultProps: GameMoveModalProps = {
    isOpen: true,
    onClose: jest.fn(),
    searchType: SearchType.both,
    makeChoice: mockedMakeChoice,
    searchForPeople: jest.fn(),
    searchForMovie: jest.fn()
  }

  return <GameMoveModal
    { ...defaultProps }
    { ...props }
  />
}

describe("Game Move Modal", () => {

  it("renders without crashing", () => {
    render(constructGameMoveModal())
  })

  describe("Constructs apprpriate move string based on last move", () => {

    describe("if no last move", () => {
      it("renders appropriate text on search type of both movie and person", () => {
        render(constructGameMoveModal())

        const text = screen.getByTestId("game-move-modal-move-string")

        expect(text.textContent).toBe("Choose a movie or person to start!")
      })
    })

    describe("if the last move was incorrect", () => {
      it("renders appropriate text on search type of movie", () => {
        render(constructGameMoveModal({
          lastMove: {
            name: "A movie",
            photo: "url",
            player: testPlayer,
            key: "akey",
            toType: "mid",
            correct: false
          },
          searchType: SearchType.movie
        }))

        const text = screen.getByTestId("game-move-modal-move-string")

        expect(text.textContent).toBe("Choose a movie - any movie!")
      })

      it("renders appropriate text on search type of person", () => {
        render(constructGameMoveModal({
          searchType: SearchType.person,
          lastMove: {
            name: "A person",
            photo: "url",
            player: testPlayer,
            key: "akey",
            toType: "pid",
            correct: false
          },
        }))

        const text = screen.getByTestId("game-move-modal-move-string")

        expect(text.textContent).toBe("Choose a person from a movie!")
      })
    })

    describe("if last move was correct", () => {
      it("if last move was a movie", () => {
        render(constructGameMoveModal({
          lastMove: {
            name: "A movie",
            photo: "url",
            player: testPlayer,
            key: "akey",
            toType: "mid",
            correct: true
          },
          searchType: SearchType.person
        }))

        const text = screen.getByTestId("game-move-modal-move-string")

        expect(text.textContent).toBe("Choose a person from the movie A movie")

      })

      it("if last move was a person", () => {
        render(constructGameMoveModal({
          lastMove: {
            name: "A person",
            photo: "url",
            player: testPlayer,
            key: "akey",
            toType: "pid",
            correct: true
          },
          searchType: SearchType.movie
        }))

        const text = screen.getByTestId("game-move-modal-move-string")

        expect(text.textContent).toBe("Choose a movie containing A person")

      })
    })
  })

  describe("Displays correct inputs depending on search type", () => {
    it("if search type is person, shows just one person input", () => {
      render(constructGameMoveModal({
        lastMove: {
          name: "A movie",
          photo: "url",
          player: testPlayer,
          key: "akey",
          toType: "mid",
          correct: true
        },
        searchType: SearchType.person
      }))

      const personInput = screen.queryByTestId("game-move-modal-search-input-person")
      const movieInput = screen.queryByTestId("game-move-modal-search-input-movie")

      expect(movieInput).not.toBeInTheDocument()
      expect(personInput).toBeInTheDocument()
    })

    it("if search type is movie, shows just one movie input", () => {
      render(constructGameMoveModal({
        lastMove: {
          name: "A person",
          photo: "url",
          player: testPlayer,
          key: "akey",
          toType: "pid",
          correct: true
        },
        searchType: SearchType.movie
      }))

      const personInput = screen.queryByTestId("game-move-modal-search-input-person")
      const movieInput = screen.queryByTestId("game-move-modal-search-input-movie")

      expect(movieInput).toBeInTheDocument()
      expect(personInput).not.toBeInTheDocument()
    })

    it("if search type is both, shows both inputs", () => {
      render(constructGameMoveModal({
        searchType: SearchType.both
      }))

      const personInput = screen.queryByTestId("game-move-modal-search-input-person")
      const movieInput = screen.queryByTestId("game-move-modal-search-input-movie")

      expect(movieInput).toBeInTheDocument()
      expect(personInput).toBeInTheDocument()
    })
  })
})

describe("Game move implementation with child search input component", () => {

  describe("Displays error message correctly based on search type", () => {
    it.todo("if search type is person, shows error on person input")
    it.todo("if search type is movie, shows error on movie input")
    it.todo("if search type is both, but last search was a movie, shows error on movie input")
    it.todo("if search type is both, but last search was a person, shows error on person input")
  })

  describe("Fires make choice with correct search type based on input changes", () => {

    it("if search type is person, make choice is called with person search type", () => {
      render(constructGameMoveModal({
        lastMove: {
          name: "A movie",
          photo: "url",
          player: testPlayer,
          key: "akey",
          toType: "mid",
          correct: true
        },
        searchType: SearchType.person
      }))

      const button = screen.getByTestId("game-move-modal-move-submit-button")
      userEvent.click(button)

      expect(mockedMakeChoice).toHaveBeenNthCalledWith(1, -1, SearchType.person)
    })

    it("if search type is movie, make choice is called with movie search type", () => {
      render(constructGameMoveModal({
        lastMove: {
          name: "A person",
          photo: "url",
          player: testPlayer,
          key: "akey",
          toType: "pid",
          correct: true
        },
        searchType: SearchType.movie
      }))

      const button = screen.getByTestId("game-move-modal-move-submit-button")
      userEvent.click(button)

      expect(mockedMakeChoice).toHaveBeenNthCalledWith(1, -2, SearchType.movie)
    })
  })
})
