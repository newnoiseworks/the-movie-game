import { render, screen, waitFor } from "@testing-library/react"

import GameMoveModal, { SearchType, GameMoveModalProps } from './GameMoveModal'

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

    describe("if no last move, or the last move was incorrect", () => {
      it.todo("renders appropriate text on search type of both movie and person")
      it.todo("renders appropriate text on search type of movie")
      it.todo("renders appropriate text on search type of person")
    })

    describe("if last move was correct", () => {
      it.todo("if last move was a movie")
      it.todo("if last move was a person")
    })
  })

  describe("Displays correct inputs depending on search type", () => {
    it.todo("if search type is person, shows just one person input")
    it.todo("if search type is movie, shows just one movie input")
    it.todo("if search type is both, shows both inputs")
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
    it.todo("if search type is person, make choice is called with person search type")
    it.todo("if search type is movie, make choice is called with movie search type")
  })
})
