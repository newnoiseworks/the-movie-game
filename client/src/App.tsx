import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Box, ChakraProvider, Container, extendTheme, Flex } from '@chakra-ui/react'

import Footer from './Global/Footer'
import Create from './Game/Create'
import SignUpInPage from './SignUpIn'
import GameLobby from './Game/Lobby'

import { anonymousSignIn, auth } from './firebase'

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
    element: <Create />
  },
  {
    path: '/sign-up-in',
    element: <SignUpInPage />
  },
  {
    path: '/game-lobby/:gameId',
    element: <GameLobby />
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
          <Container width="100%" flexGrow={1}>
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
