import React, { useState, useEffect } from 'react'
import { Container, Text } from '@chakra-ui/react'
import { useParams } from 'react-router-dom'

import { getFromDB, onValue } from '../firebase'

const CreateOrJoin: React.FC = () => {
  // const [isSignedIn, setIsSignedIn] = React.useState(!!auth.currentUser)
  const { gameId } = useParams()
  const [ players, setPlayers ] = useState<Object[]>([])

  useEffect(() => {
    const gameRef = getFromDB(`games/${gameId}/players`)

    onValue(gameRef, (snapshot) => {
      const playersObj = snapshot.val()

      const players = Object.keys(playersObj).map((key) =>
        playersObj[key]
      )

      setPlayers(players)
    })
  }, [gameId])

  return (
    <Container sx={{ 
      textAlign: "center",
      mt: 4
    }}>
      <Text
        variant="h5"
        sx={{
          mb: 2
        }}
      >
        Now Playing: <em>The Movie Game</em> - #{gameId}
      </Text>
      {players.map((player: any) => <p key={player.name}>{player.name}</p>)}
    </Container>
  )
}

export default CreateOrJoin

