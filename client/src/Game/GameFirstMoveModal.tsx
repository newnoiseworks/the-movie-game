import React from 'react'
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

import GamePeopleSearchInput from './GamePersonSearchInput'

interface GameFirstMoveModalProps {
  isOpen: boolean
  onClose: () => void
}

const GameFirstMoveModal: React.FC<GameFirstMoveModalProps> = ({
  isOpen, onClose
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Make Move</ModalHeader>
        <ModalBody>
          <VStack alignItems="flex-start">
            <GamePeopleSearchInput />
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button onClick={async () => {}}>
            Choose
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default GameFirstMoveModal

