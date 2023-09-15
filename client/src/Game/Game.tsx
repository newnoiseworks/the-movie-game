import React from 'react'
import { Container, Text } from '@chakra-ui/react'
import { useParams, useNavigate } from 'react-router-dom'
import { useList, useObjectVal } from 'react-firebase-hooks/database'

import { getFromDB } from '../firebase'

import LobbyPlayerList, { LobbyPlayer } from './LobbyPlayerList'

const CreateOrJoin: React.FC = () => {
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
      {playerLoading && "Loading players..."}
      {playerError && `Error loading players... ${playerError}`}
      <LobbyPlayerList
        players={players}
        gameId={gameId}
      />
    </Container>
  )
}

export default CreateOrJoin

