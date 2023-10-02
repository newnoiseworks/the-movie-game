import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Box, ChakraProvider, Container, extendTheme, Flex } from '@chakra-ui/react'

import Footer from './Global/Footer'
import Create from './Create/CreatePage'
import GameLobby from './Lobby/LobbyPage'
import Game from './Game/GamePage'

import { anonymousSignIn, auth } from './firebase'
import { clearHeartbeatInterval } from './api'

const theme = extendTheme({
  components: {
    Button: {
      defaultProps: {
        colorScheme: "purple"
      }
    }
  }
})

const router = createBrowserRouter([
  {
    path: '/',
    element: <Create />,
    loader: () => {
      clearHeartbeatInterval()
    }
  },
  {
    path: '/game-lobby/:gameId',
    element: <GameLobby />,
    loader: () => {
      clearHeartbeatInterval()
    }
  },
  {
    path: '/game/:gameId',
    element: <Game />,
    loader: () => {
      clearHeartbeatInterval()
    }
  }
])

anonymousSignIn()

function App() {
  const [isSignedIn, setIsSignedIn] = useState(!!auth.currentUser)

  useEffect(() => {
    function authStateChange() {
      setIsSignedIn(true)
    }

    const cleanup = auth.onAuthStateChanged(authStateChange)

    return cleanup()
  })

  if (isSignedIn === false) {
    return <></>
  }

  return (
    <div>
      <ChakraProvider theme={theme}>
        <Flex
          css={{ minHeight: '100vh' }}
          direction="column"
        >
          <Container width="100%" maxWidth="900px" flexGrow={1}>
            <RouterProvider router={router} />
          </Container>
          <Box
           css={{
             position: 'sticky',
             bottom: 0
           }}
          >
            <Footer />
          </Box>
        </Flex>
      </ChakraProvider>
    </div>
  );
}

export default App;
