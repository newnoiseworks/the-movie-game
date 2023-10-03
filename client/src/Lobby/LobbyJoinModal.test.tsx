import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import LobbyJoinModal, { LobbyJoinModalProps } from './LobbyJoinModal'

const testGid = "test-game-id"

const mockedJoinGame = jest.fn()
const mockedOnClose = jest.fn()

function constructLobbyJoinModal(props: Partial<LobbyJoinModalProps> = {}) {
  const defaultProps: LobbyJoinModalProps = {
    isOpen: true,
    onClose: mockedOnClose,
    joinGame: mockedJoinGame,
    gameId: testGid
  }

  return <LobbyJoinModal
    { ...defaultProps } { ...props }
  />
}

describe("Game Lobby page Join Modal", () => {

  beforeEach(() => {
    mockedJoinGame.mockReset()
    mockedOnClose.mockReset()
  })

  it("renders without crashing", () => {
    render(constructLobbyJoinModal())
  })

  it("blank input is read as invalid, prevents joinGame from firing", () => {
    render(constructLobbyJoinModal())

    const button = screen.getByTestId("join-game-modal-submit-button")

    expect(button).toBeInTheDocument()

    userEvent.click(button)

    expect(mockedJoinGame).not.toHaveBeenCalled()
    expect(mockedOnClose).not.toHaveBeenCalled()
    expect(screen.getByText("Name of 3 characters or more required")).toBeInTheDocument()
  })

  it("name of two letters is read as invalid, prevents joinGame from firing", () => {
    render(constructLobbyJoinModal())

    const input = screen.getByTestId("join-game-modal-name-input")

    expect(input).toBeInTheDocument()

    userEvent.type(input, "aa")

    expect(screen.getByText("Name of 3 characters or more required")).toBeInTheDocument()

    const button = screen.getByTestId("join-game-modal-submit-button")

    expect(button).toBeInTheDocument()

    userEvent.click(button)

    expect(mockedJoinGame).not.toHaveBeenCalled()
    expect(mockedOnClose).not.toHaveBeenCalled()
  })

  it("name of three letters or more is read as valid, joinGame fires, modal closes", async () => {
    render(constructLobbyJoinModal())

    const input = screen.getByTestId("join-game-modal-name-input")

    expect(input).toBeInTheDocument()

    userEvent.type(input, "aaa")

    expect(screen.queryByText("Name of 3 characters or more required")).not.toBeInTheDocument()

    const button = screen.getByTestId("join-game-modal-submit-button")

    expect(button).toBeInTheDocument()

    userEvent.click(button)

    expect(mockedJoinGame).toHaveBeenNthCalledWith(1, "aaa", testGid)
    await waitFor(() => {
      expect(mockedOnClose).toHaveBeenCalledTimes(1)
    })
  })
})

