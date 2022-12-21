import React from 'react'
import { Button, Container, Link, TextField, Typography } from '@mui/material'
import { useParams } from 'react-router-dom'

import { anonymousSignIn, auth } from '../firebase'

const CreateOrJoin: React.FC = () => {
  const [isSignedIn, setIsSignedIn] = React.useState(!!auth.currentUser)
  const [currentMovieOrPersonName, setCurrentMovieOrPersonName] = React.useState()
  const [movieOrPerson, setMovieOrPerson] = React.useState<'movie' | 'person'>('movie')
  const { gameId } = useParams()

  if (!auth.currentUser) {
    anonymousSignIn(() => {
      setIsSignedIn(true)
    })
  }

  if (isSignedIn === false) {
    return <></>
  }

  return (
    <Container sx={{ 
      textAlign: "center",
      mt: 4
    }}>
      <Typography
        variant="h5"
        sx={{
          mb: 2
        }}
      >
        Now Playing: <em>The Movie Game</em> - #{gameId}
      </Typography>
      <Typography
        variant="h2"
        sx={{
          mb: 2
        }}
      >
    {movieOrPerson.charAt(0).toUpperCase() + movieOrPerson.slice(1)}: <em>{currentMovieOrPersonName}</em>
      </Typography>
    </Container>
  )
}

export default CreateOrJoin
