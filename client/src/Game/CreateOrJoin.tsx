import React from 'react'
import { Container, Text } from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'

import { Button } from '../Button'
import { createGame } from '../api'

const CreateOrJoin: React.FC = () => {
  const navigate = useNavigate()

  async function createGameAndChangePage() {
    let gameId

    try {
      gameId = await createGame()
    } catch(err) {
      console.error("Could not create new game ID via API.")
      throw err
    }

    navigate(`/game/${gameId}`)
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
      >
        The Movie Game
      </Text>
      <Button onClick={() => createGameAndChangePage()}>Create a Game</Button>
    </Container>
  )
}

export default CreateOrJoin
