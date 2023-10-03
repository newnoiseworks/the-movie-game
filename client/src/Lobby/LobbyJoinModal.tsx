import React, { useState } from 'react'
import {
  Button,
  Input,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  Text,
  VStack,
} from '@chakra-ui/react'

import { joinGame } from '../api'

interface LobbyJoinModalProps {
  isOpen: boolean
  onClose: () => void
  gameId: string
}

const LobbyJoinModal: React.FC<LobbyJoinModalProps> = ({
  isOpen, onClose, gameId
}) => {
  const [ playerName, setPlayerName ] = useState<string>('')
  const [ playerNameInvalid, setPlayerNameInvalid ] = useState<boolean>(false)

  function onPlayerNameChange(value: string) {
    setPlayerName(value)
    setPlayerNameInvalid(!value || value.length < 3)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Join Game</ModalHeader>
        <ModalBody>
          <VStack alignItems="flex-start">
            <Input
              placeholder="Enter Your Name*"
              isInvalid={playerNameInvalid}
              value={playerName}
              onChange={(e) => onPlayerNameChange(e.target.value)}
              data-testid="join-game-modal-name-input"
            />
            {playerNameInvalid && <Text as="p" fontSize="x-small">Name of 3 characters or more required</Text>}
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button onClick={async () => {
            setPlayerNameInvalid(!playerName || playerName.length < 3)

            if (!playerNameInvalid) {
              await joinGame(playerName, gameId)
              onClose()
            }
          }}>
            Join Game
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default LobbyJoinModal

