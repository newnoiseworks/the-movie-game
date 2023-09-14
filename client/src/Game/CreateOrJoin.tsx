import React, { useState } from 'react'
import {
  Button,
  Container,
  VStack,
  Text,
  useDisclosure,
  Input,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
} from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'

import { createGame } from '../api'

const CreateOrJoin: React.FC = () => {
  const navigate = useNavigate()
  const { isOpen, onOpen, onClose } = useDisclosure()

  const [ playerName, setPlayerName ] = useState<string>('')
  const [ gameName, setGameName ] = useState<string>('')
  const [ playerNameInvalid, setPlayerNameInvalid ] = useState<boolean>(false)

  async function createGameAndChangePage() {
    let gameId

    if (playerName) {
      try {
        gameId = await createGame(playerName, gameName)
        navigate(`/game/${gameId}`)
      } catch(err) {
        alert("Could not create new game ID via API.")
        throw err
      }
    } else {
      setPlayerNameInvalid(true)
    }
  }

  function onPlayerNameChange(value: string) {
    setPlayerName(value)

    setPlayerNameInvalid(!value || value.length < 3)
  }

  return (
    <
      Container
      textAlign={'center'}
    >
      <Text
        as="h1"
        fontSize="xxx-large"
        mb={5}
        mt={5}
        h="33vh"
      >
        The Movie Game
      </Text>
      <Button onClick={() => onOpen()}>Create a Game</Button>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Creating Game</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <
              VStack
              alignItems="flex-start"
            >
              <Input
                placeholder="Enter Your Name*"
                isInvalid={playerNameInvalid}
                value={playerName}
                onChange={(e) => onPlayerNameChange(e.target.value)}
              />
              {playerNameInvalid &&
                <
                  Text
                  as="p"
                  fontSize="x-small"
                >
                  Name of 3 characters or more required
                </Text>
              }
              <Input
                placeholder="Enter Game Name (Optional)"
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
              />
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button onClick={() => createGameAndChangePage()}>
              Create Game
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  )
}

export default CreateOrJoin

