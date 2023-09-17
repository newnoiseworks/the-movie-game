import React from 'react'
import {
  Button,
  Container,
  Flex,
  Spacer,
  Text,
  useDisclosure
} from '@chakra-ui/react'
import { useParams, useNavigate } from 'react-router-dom'
import { useList, useObjectVal } from 'react-firebase-hooks/database'
import { useCopyToClipboard } from 'usehooks-ts'

import { getFromDB } from '../firebase'
import { getUID } from '../api'

import LobbyPlayerList, { LobbyPlayer } from './LobbyPlayerList'
import LobbyJoinModal from './LobbyJoinModal'

const GameLobby: React.FC = () => {
  // eslint-disable-next-line
  const [ _copyValue, copy ] = useCopyToClipboard()
  const navigate = useNavigate()
  const { gameId } = useParams()
  const { isOpen, onOpen, onClose } = useDisclosure()

  const [ playerSnaps, playerLoading, playerError ] = useList(getFromDB(`games/${gameId}/players`))
  const [ gameName, gameNameLoading, gameNameError ] = useObjectVal<string>(getFromDB(`games/${gameId}/name`))

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
      <LobbyJoinModal
        isOpen={isOpen}
        onClose={onClose}
        gameId={gameId}
      />
    </Container>
  )
}

export default GameLobby

