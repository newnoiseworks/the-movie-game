import React, { useCallback, useState } from 'react'
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

export interface LobbyJoinModalProps {
  isOpen: boolean
  onClose: () => void
  gameId: string
  joinGame: (name: string, gid: string) => Promise<void>
}

const LobbyJoinModal: React.FC<LobbyJoinModalProps> = ({
  isOpen, onClose, gameId, joinGame
}) => {
  const [ playerName, setPlayerName ] = useState<string>('')
  const [ playerNameInvalid, setPlayerNameInvalid ] = useState<boolean>(false)

  function onPlayerNameChange(value: string) {
    setPlayerName(value)
    setPlayerNameInvalid(!value || value.length < 3)
  }

  const submitJoinGame = useCallback(async () => {
    if (!playerName || playerName.length < 3) {
      setPlayerNameInvalid(true)
    } else {
      setPlayerNameInvalid(false)
      await joinGame(playerName, gameId)
      onClose()
    }
  }, [playerName, joinGame, onClose, gameId])

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Join Game</ModalHeader>
        <ModalBody>
          <VStack alignItems="flex-start">
            <Input
              data-testid="join-game-modal-name-input"
              placeholder="Enter Your Name*"
              isInvalid={playerNameInvalid}
              value={playerName}
              onChange={(e) => onPlayerNameChange(e.target.value)}
            />
            {playerNameInvalid && <Text as="p" fontSize="x-small">Name of 3 characters or more required</Text>}
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button data-testid="join-game-modal-submit-button" onClick={() => submitJoinGame()}>
            Join Game
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default LobbyJoinModal

