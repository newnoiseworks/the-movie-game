import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Box, ChakraProvider, Container, extendTheme, Flex } from '@chakra-ui/react'

import Footer from './Global/Footer'
import Create from './GameSetup/Create'
import SignUpInPage from './SignUpIn'
import GameLobby from './GameSetup/Lobby'
import Game from './Game/Game'

import { anonymousSignIn, auth } from './firebase'
import { sendHeartbeat } from './api'

const theme = extendTheme({
  components: {
    Button: {
      defaultProps: {
        colorScheme: "purple"
      }
    }
  }
})

function heartbeatInterval(gameId: string) {
  if (!!auth.currentUser) {
    sendHeartbeat(gameId)
  }
}

let hbeatInterval: NodeJS.Timer

const router = createBrowserRouter([
  {
    path: '/',
    element: <Create />,
    loader: () => {
      if (!!hbeatInterval) {
        clearInterval(hbeatInterval)
      }
    }
  },
  {
    path: '/sign-up-in',
    element: <SignUpInPage />
  },
  {
    path: '/game-lobby/:gameId',
    element: <GameLobby />,
    loader: ({ params }) => {
      if (!hbeatInterval)
        hbeatInterval = setInterval(() => heartbeatInterval(params.gameId!), 10000)
    }
  },
  {
    path: '/game/:gameId',
    element: <Game />,
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
