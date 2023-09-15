import React, { useState, useEffect } from 'react'
import { Container, Text } from '@chakra-ui/react'
import { useParams, useNavigate } from 'react-router-dom'

import { getFromDB, onValue } from '../firebase'

import LobbyPlayerList, { LobbyPlayer } from './LobbyPlayerList'

const CreateOrJoin: React.FC = () => {
  // const [isSignedIn, setIsSignedIn] = React.useState(!!auth.currentUser)
  const navigate = useNavigate()
  const { gameId } = useParams()

  const [ players, setPlayers ] = useState<LobbyPlayer[]>([])

  useEffect(() => {
    const gameRef = getFromDB(`games/${gameId}/players`)

    onValue(gameRef, (snapshot) => {
      const playersObj = snapshot.val()
      const players = Object.keys(playersObj).map((key) => playersObj[key])
      setPlayers(players)
    })
  }, [gameId])

  if (!gameId) {
    navigate('/')
    return <></>
  }

  return (
    <Container sx={{
      mt: 4
    }}>
      <Text
        variant="h1"
        sx={{
          mb: 2
        }}
      >
        Now Playing: <em>The Movie Game</em> - #{gameId}
      </Text>
      <LobbyPlayerList players={players} gameId={gameId} />
    </Container>
  )
}

export default CreateOrJoin

