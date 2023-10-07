import { render, screen } from '@testing-library/react'
import React from 'react'

import GameSearchInput, { GameSearchInputRef, GameSearchInputProps } from './GameSearchInput'

const mockSearchFn = jest.fn()
const mockSetIdFn = jest.fn()

function constructGameSearchInput(props: Partial<GameSearchInputProps>) {
  const ref = React.createRef<GameSearchInputRef>()

  const defaultProps: GameSearchInputProps = {
    searchFn: mockSearchFn,
    setIdFn: mockSetIdFn,
    placeholder: "Search for stuff",
  }

  return [
    <GameSearchInput
      { ...defaultProps  }
      { ...props }
      ref={ref}
    />,
    ref
  ]
}

describe("Game Search Input", () => {

  it.todo("renders without crashing")

  it.todo("sets the error message to state when passed in via props")

  it.todo("entering less than 3 letters to the input should not call passed in searchFn")

  it.todo("entering 3 letters or more to the input should call passed in searchFn")

  it.todo("entering 3 letters or more to the input should render search results")

  it.todo("clicking on a search result should call setIdFn")

  it.todo("if an error exists, entering 3 letters or more to the input should clear the error")

  it.todo("clears the input via ref and internal useImperativeHandle setup")
})
