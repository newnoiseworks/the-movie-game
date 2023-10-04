import React, { useRef, useState } from 'react'
import {
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  Text,
  VStack,
} from '@chakra-ui/react'

import GameSearchInput, { GameSearchInputRef } from './GameSearchInput'
import { GameHistoryMove } from './GamePage'

export enum SearchType {
  person,
  movie,
  both
}

export interface GameMoveModalProps {
  isOpen: boolean
  onClose: () => void
  searchType: SearchType
  makeChoice: (id: number, choiceType: SearchType) => void
  searchForPeople: (person: string) => Promise<any>
  searchForMovie: (movie: string) => Promise<any>
  errorMessage?: string
  lastMove?: GameHistoryMove
}

const GameMoveModal: React.FC<GameMoveModalProps> = ({
  errorMessage,
  isOpen,
  onClose,
  searchType,
  makeChoice,
  searchForPeople,
  searchForMovie,
  lastMove
}) => {
  const [personId, setPersonId] = useState<number>(-1)
  const [movieId, setMovieId] = useState<number>(-1)
  const [choice, setChoice] = useState<SearchType>(searchType)

  const personInput = useRef<GameSearchInputRef>(null)
  const movieInput = useRef<GameSearchInputRef>(null)

  let moveString = ''

  if (!lastMove || !lastMove.correct) {
    switch (searchType) {
      case SearchType.both:
        moveString += 'Choose a movie or person to start!'
        break
      case SearchType.movie:
        moveString += 'Choose a movie - any movie!'
        break
      case SearchType.person:
        moveString += 'Choose a person from a movie!'
        break
    }
  } else if (lastMove && lastMove.correct) {
    if (lastMove.toType === 'mid') {
      moveString += 'Choose a person from the movie ' + lastMove.name
    } else {
      moveString += 'Choose a movie containing ' + lastMove.name
    }
  }

  function setPersonFromInput(id: number) {
    setPersonId(id)
    setMovieId(-1)
    setChoice(SearchType.person)

    if (movieInput.current) {
      movieInput.current.clearInput()
    }
  }

  function setMovieFromInput(id: number) {
    setMovieId(id)
    setPersonId(-1)
    setChoice(SearchType.movie)

    if (personInput.current) {
      personInput.current.clearInput()
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      closeOnOverlayClick={false}
      closeOnEsc={false}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Make Move</ModalHeader>
        <ModalBody>
          <VStack alignItems="flex-start">
            <Text data-testid="game-move-modal-move-string">{moveString}</Text>
            {
              (
                searchType === SearchType.person ||
                searchType === SearchType.both
              ) &&
              <GameSearchInput
                ref={personInput}
                setIdFn={setPersonFromInput}
                searchFn={searchForPeople}
                placeholder="Search for person"
                errorMessage={searchType === SearchType.person ? errorMessage : undefined}
              />
            }
            {
              (
                searchType === SearchType.movie ||
                searchType === SearchType.both
              ) &&
              <GameSearchInput
                ref={movieInput}
                setIdFn={setMovieFromInput}
                searchFn={searchForMovie}
                placeholder="Search for movie"
                errorMessage={searchType === SearchType.movie ? errorMessage : undefined}
              />
            }
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button onClick={() => makeChoice(
            choice === SearchType.person ? personId : movieId, 
            choice
          )}>
            Choose
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default GameMoveModal

