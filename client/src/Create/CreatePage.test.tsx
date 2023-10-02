import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import CreatePage from './CreatePage'

const mockedNavigateMethod = jest.fn()

jest.mock("react-router-dom", () => ({
  ...(jest.requireActual("react-router-dom")),
  useNavigate: () => mockedNavigateMethod,
}))

jest.mock('../api', () => ({
  ...(jest.requireActual("../api") as any),
  createGame: jest.fn(),
}))

describe("Create game page slash home page", () => {

  beforeEach(() => {
    mockedNavigateMethod.mockReset()
  })

  it('renders without crashing', () => {
    render(<CreatePage />)
    expect(screen.getByText("The Movie Game")).toBeInTheDocument()
  })

  it("ensure button opens modal", () => {
    render(<CreatePage />)
    const button = screen.getByTestId("modal-button")

    expect(screen.queryByText("Creating Game")).not.toBeInTheDocument()

    userEvent.click(button)

    expect(screen.getByText("Creating Game")).toBeInTheDocument()
  })

  it("rejects invalid input, no letters for a name", async () => {
    render(<CreatePage />)
    const button = screen.getByTestId("modal-button")

    userEvent.click(button)

    expect(screen.queryByText("Name of 3 characters or more required")).not.toBeInTheDocument()

    const submitButton = screen.getByTestId("submit-create-game-button")

    userEvent.click(submitButton)

    expect(screen.getByText("Name of 3 characters or more required")).toBeInTheDocument()

    await waitFor(() => expect(mockedNavigateMethod).not.toHaveBeenCalled())
  })

  it("rejects invalid input, just two letters for a name", async () => {
    render(<CreatePage />)
    const button = screen.getByTestId("modal-button")

    userEvent.click(button)

    expect(screen.queryByText("Name of 3 characters or more required")).not.toBeInTheDocument()

    const nameInput = screen.getByTestId("name-input")

    userEvent.type(nameInput, 'aa')

    expect(screen.getByText("Name of 3 characters or more required")).toBeInTheDocument()

    const submitButton = screen.getByTestId("submit-create-game-button")

    userEvent.click(submitButton)

    await waitFor(() => expect(mockedNavigateMethod).not.toHaveBeenCalled())
  })

  it("accepts valid input, 4 letters on a name", async () => {
    render(<CreatePage />)
    const button = screen.getByTestId("modal-button")

    userEvent.click(button)

    expect(screen.queryByText("Name of 3 characters or more required")).not.toBeInTheDocument()

    const nameInput = screen.getByTestId("name-input")

    userEvent.type(nameInput, 'aaaa')

    expect(screen.queryByText("Name of 3 characters or more required")).not.toBeInTheDocument()

    const submitButton = screen.getByTestId("submit-create-game-button")

    userEvent.click(submitButton)

    await waitFor(() => expect(mockedNavigateMethod).toHaveBeenCalled())
  })

  it("accepts valid input, 4 letters on a name with a custom game name", async () => {
    render(<CreatePage />)
    const button = screen.getByTestId("modal-button")

    userEvent.click(button)

    const nameInput = screen.getByTestId("name-input")
    const gameNameInput = screen.getByTestId("game-name-input")

    userEvent.type(nameInput, 'aaaa')
    userEvent.type(gameNameInput, 'aaaa')

    const submitButton = screen.getByTestId("submit-create-game-button")

    userEvent.click(submitButton)

    await waitFor(() => expect(mockedNavigateMethod).toHaveBeenCalled())
  })
})
