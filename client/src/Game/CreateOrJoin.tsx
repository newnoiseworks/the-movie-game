import React from 'react'
import { Button, Container, Link, TextField, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'

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
    <Container sx={{ 
      textAlign: "center",
      mt: 4
    }}>
      <Typography
        variant="h1"
        sx={{
          mb: 2
        }}
      >The Movie Game</Typography>
      <Typography component="div">
        <Link onClick={() => createGameAndChangePage()}>Create a game</Link> 
        {` `}
        <label htmlFor="game-code">
          or enter it's code 
        </label>
        {` `}
        <TextField
          id="game-code"
          variant="standard"
          placeholder="G@M3C0D3"
        />
        {` `}
        <Button type="button" size="large">Join</Button>
      </Typography>
    </Container>
  )
}

export default CreateOrJoin
