import React from 'react'
import { Button, Container, Flex, Spacer, Text } from '@chakra-ui/react'
import { useParams, useNavigate } from 'react-router-dom'
import { useList, useObjectVal } from 'react-firebase-hooks/database'
import { useCopyToClipboard } from 'usehooks-ts'

import { getFromDB } from '../firebase'

import LobbyPlayerList, { LobbyPlayer } from './LobbyPlayerList'

const CreateOrJoin: React.FC = () => {
  // eslint-disable-next-line
  const [ _copyValue, copy ] = useCopyToClipboard()
  const navigate = useNavigate()
  const { gameId } = useParams()

  const [ playerSnaps, playerLoading, playerError ] = useList(getFromDB(`games/${gameId}/players`))
  const [ gameName, gameNameLoading, gameNameError ] = useObjectVal<string>(getFromDB(`games/${gameId}/name`))

  const players: LobbyPlayer[] = []

  if (!playerLoading && playerSnaps) {
    playerSnaps.forEach((snap) => {
      players.push({ key: snap.key, ...snap.val() })
    })
  }

  if (!gameId) {
    navigate('/')
    return <></>
  }

  const copyUrlFn = () => copy(global.window.location.href)

  return (
    <Container>
      <Container sx={{
        mb: 6
      }}>
        {gameNameLoading && "Loading game..."}
        {gameNameError && `Error loading game... ${gameNameError}`}
        <Text
          variant="h1"
          fontSize="3xl"
          fontWeight="bold"
        >
          {gameName}
        </Text>
        <Text
          variant="h3"
          fontSize="sm"
        >
          Lobby - The Movie Game
        </Text>
      </Container>
      <Container sx={{
        mb: 4
      }}>
        <Flex alignItems="center">
          <Text
            variant="h3"
            fontSize="sm"
          >
            Share this URL to ask others to join
          </Text>
          <Spacer />
          <Button
            colorScheme="purple"
            onClick={copyUrlFn}
          >
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
    </Container>
  )
}

export default CreateOrJoin

