import { waitFor, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef, RefObject } from 'react'

import GameSearchInput, { GameSearchInputRef, GameSearchInputProps, SearchResult } from './GameSearchInput'

const mockSearchFn = jest.fn()

const mockSetIdFn = jest.fn()

let ref: RefObject<GameSearchInputRef>

function constructGameSearchInput(props: Partial<GameSearchInputProps> = {}) {
  const defaultProps: GameSearchInputProps = {
    searchFn: mockSearchFn,
    setIdFn: mockSetIdFn,
    placeholder: "Search for stuff",
  }

  return <GameSearchInput
    { ...defaultProps  }
    { ...props }
    ref={ref}
  />
}

function getMockSearchWithResults() {
  return jest.fn().mockReturnValue(Promise.resolve({
    results: [
      { id: 1, name: "An Actor", profile_path: "url" } as SearchResult
    ]
  }))
}

describe("Game Search Input", () => {

  beforeEach(() => {
    mockSetIdFn.mockClear()
    mockSearchFn.mockClear()

    ref = createRef<GameSearchInputRef>()
  })

  it("renders without crashing", () => {
    render(constructGameSearchInput())
  })

  it("sets the error message to state when passed in via props", () => {
    render(constructGameSearchInput({
      errorMessage: "This is an error"
    }))

    expect(screen.getByTestId("game-search-input-error")).toBeInTheDocument()
  })

  it("entering less than 3 letters to the input should not call passed in searchFn", () => {
    render(constructGameSearchInput())

    const input = screen.getByTestId("game-search-input-input")

    userEvent.type(input, "aa")

    expect(mockSearchFn).not.toHaveBeenCalled()
  })

  it("entering 3 letters or more to the input should call passed in searchFn", async () => {
    const mockSearchFn = getMockSearchWithResults()

    render(constructGameSearchInput({
      searchFn: mockSearchFn
    }))

    const input = screen.getByTestId("game-search-input-input")

    userEvent.type(input, "aaa")

    await waitFor(() => {
      expect(mockSearchFn).toHaveBeenNthCalledWith(1, "aaa")
    })
  })

  it("entering 3 letters or more to the input should render search results", async () => {
    const mockSearchFn = getMockSearchWithResults()

    render(constructGameSearchInput({
      searchFn: mockSearchFn
    }))

    const input = screen.getByTestId("game-search-input-input")

    userEvent.type(input, "aaa")

    await waitFor(() => {
      expect(screen.getByTestId("game-search-input-result-1")).toBeInTheDocument()
    })
  })

  it("clicking on a search result should call setIdFn", async () => {
    const mockSearchFn = getMockSearchWithResults()

    render(constructGameSearchInput({
      searchFn: mockSearchFn
    }))

    const input = screen.getByTestId("game-search-input-input")

    userEvent.type(input, "aaa")

    let result: HTMLElement

    await waitFor(() => {
      result = screen.getByTestId("game-search-input-result-1")
      expect(result).toBeInTheDocument()
    })

    userEvent.click(result!)

    expect(mockSetIdFn).toHaveBeenNthCalledWith(1, 1)
  })

  it("if an error exists, entering 3 letters or more to the input should clear the error", async () => {
    const mockSearchFn = getMockSearchWithResults()

    render(constructGameSearchInput({
      searchFn: mockSearchFn,
      errorMessage: "This is an error"
    }))

    expect(screen.getByTestId("game-search-input-error")).toBeInTheDocument()

    const input = screen.getByTestId("game-search-input-input")

    userEvent.type(input, "aaa")

    await waitFor(() => {
      expect(screen.queryByTestId("game-search-input-error")).not.toBeInTheDocument()
    })
  })

  it("clears the input via ref and internal useImperativeHandle setup", async () => {
    const mockSearchFn = getMockSearchWithResults()

    render(constructGameSearchInput({
      searchFn: mockSearchFn
    }))

    const input = screen.getByTestId("game-search-input-input")

    userEvent.type(input, "aaa")

    await waitFor(() => {
      expect((screen.getByPlaceholderText("Search for stuff") as HTMLInputElement).value).toBe("aaa")
    })

    ref.current?.clearInput()

    await waitFor(() => {
      expect((screen.getByPlaceholderText("Search for stuff") as HTMLInputElement).value).toBe("")
    })
  })
})
