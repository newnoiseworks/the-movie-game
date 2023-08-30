import React from 'react'
import { Container, Typography } from '@mui/material'
import { useParams } from 'react-router-dom'

const CreateOrJoin: React.FC = () => {
  // const [isSignedIn, setIsSignedIn] = React.useState(!!auth.currentUser)
  const [currentMovieOrPersonName] = React.useState()
  const [movieOrPerson] = React.useState<'movie' | 'person'>('movie')
  const { gameId } = useParams()



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
