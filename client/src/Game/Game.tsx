import React, { useState } from 'react'
import {
  Button,
  Container,
  Flex,
  Input,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  Spacer,
  Text,
  VStack,
  useDisclosure
} from '@chakra-ui/react'
import { useParams, useNavigate } from 'react-router-dom'
import { useList, useObjectVal } from 'react-firebase-hooks/database'
import { useCopyToClipboard } from 'usehooks-ts'

import { getFromDB } from '../firebase'
import { joinGame, getUID } from '../api'

import LobbyPlayerList, { LobbyPlayer } from './LobbyPlayerList'

const CreateOrJoin: React.FC = () => {
  // eslint-disable-next-line
  const [ _copyValue, copy ] = useCopyToClipboard()
  const navigate = useNavigate()
  const { gameId } = useParams()
  const { isOpen, onOpen, onClose } = useDisclosure()

  const [ playerSnaps, playerLoading, playerError ] = useList(getFromDB(`games/${gameId}/players`))
  const [ gameName, gameNameLoading, gameNameError ] = useObjectVal<string>(getFromDB(`games/${gameId}/name`))
  const [ playerName, setPlayerName ] = useState<string>('')
  const [ playerNameInvalid, setPlayerNameInvalid ] = useState<boolean>(false)

  function onPlayerNameChange(value: string) {
    setPlayerName(value)
    setPlayerNameInvalid(!value || value.length < 3)
  }

  function copyUrlFn() {
    copy(global.window.location.href)
  }

  if (!gameId) {
    navigate('/')
    return <></>
  }

  const players: LobbyPlayer[] = []

  if (!playerLoading && playerSnaps) {
    playerSnaps.forEach((snap) => {
      var player = snap.val()

      if (!players.find((p) => p.uuid === player.uuid)) {
        players.push({ key: snap.key, ...player })
      }
    })

    if (!isOpen && !players.find((p) => p.uuid === getUID())) {
      onOpen()
    }
  }

  return (
    <Container>
      <Container sx={{ mb: 6 }}>
        {gameNameLoading && "Loading game..."}
        {gameNameError && `Error loading game... ${gameNameError}`}
        <Text variant="h1" fontSize="3xl" fontWeight="bold">
          {gameName}
        </Text>
        <Text variant="h3" fontSize="sm">
          Lobby - The Movie Game
        </Text>
      </Container>
      <Container sx={{ mb: 4 }}>
        <Flex alignItems="center">
          <Text variant="h3" fontSize="sm">
            Share this URL to ask others to join
          </Text>
          <Spacer />
          <Button colorScheme="purple" onClick={copyUrlFn}>
            Copy Share Link
          </Button>
        </Flex>
      </Container>
      {playerLoading && "Loading players..."}
      {playerError && `Error loading players... ${playerError}`}
      <LobbyPlayerList
        players={players}
        gameId={gameId}
        copyUrlFn={copyUrlFn}
      />
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Creating Game</ModalHeader>
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
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button onClick={async () => {
              console.log("click")
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
    </Container>
  )
}

export default CreateOrJoin

