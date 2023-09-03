import React from 'react'
import { Container, Text } from '@chakra-ui/react'
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
      <Text
        variant="h5"
        sx={{
          mb: 2
        }}
      >
        Now Playing: <em>The Movie Game</em> - #{gameId}
      </Text>
      <Text
        variant="h2"
        sx={{
          mb: 2
        }}
      >
    {movieOrPerson.charAt(0).toUpperCase() + movieOrPerson.slice(1)}: <em>{currentMovieOrPersonName}</em>
      </Text>
    </Container>
  )
}

export default CreateOrJoin
