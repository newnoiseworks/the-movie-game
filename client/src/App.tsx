import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Box, ChakraProvider, Container, extendTheme, Flex } from '@chakra-ui/react'

import Footer from './Global/Footer'
import CreateOrJoin from './Game/CreateOrJoin'
import SignUpInPage from './SignUpIn'
import Game from './Game/Game'

import { anonymousSignIn, auth } from './firebase'

const theme = extendTheme({})

const router = createBrowserRouter([
  {
    path: '/',
    element: <CreateOrJoin />
  },
  {
    path: '/sign-up-in',
    element: <SignUpInPage />
  },
  {
    path: '/game/:gameId',
    element: <Game />
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
           css={{ position: 'sticky', bottom: 0 }}
          >
            <Footer />
          </Box>
        </Flex>
      </ChakraProvider>
    </div>
  );
}

export default App;
