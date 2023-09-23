import React, { useState } from 'react'
import {
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  VStack,
} from '@chakra-ui/react'

import { searchForPeople, searchForMovie } from '../api'
import GameSearchInput from './GameSearchInput'

export enum SearchType {
  person,
  movie,
  both
}

interface GameMoveModalProps {
  isOpen: boolean
  onClose: () => void
  searchType: SearchType
  makeChoice: (id: number, choiceType: SearchType) => void
}

const GameMoveModal: React.FC<GameMoveModalProps> = ({
  isOpen, onClose, searchType, makeChoice
}) => {
  const [personId, setPersonId] = useState<number>(-1)
  const [movieId, setMovieId] = useState<number>(-1)
  const [choice, setChoice] = useState<SearchType>(searchType)

  function setPersonFromInput(id: number) {
    setPersonId(id)
    setMovieId(-1)
    setChoice(SearchType.person)
  }

  function setMovieFromInput(id: number) {
    setMovieId(id)
    setPersonId(-1)
    setChoice(SearchType.movie)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Make Move</ModalHeader>
        <ModalBody>
          <VStack alignItems="flex-start">
            {
              (
                searchType === SearchType.person || 
                searchType === SearchType.both
              ) &&
              <GameSearchInput
                setIdFn={setPersonFromInput}
                searchFn={searchForPeople}
                placeholder="Search for person"
              />
            }
            {
              (
                searchType === SearchType.movie || 
                searchType === SearchType.both
              ) &&
              <GameSearchInput
                setIdFn={setMovieFromInput}
                searchFn={searchForMovie}
                placeholder="Search for movie"
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

