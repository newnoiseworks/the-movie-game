import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { useState, useEffect } from 'react'

import CreateOrJoin from './Game/CreateOrJoin'
import SignUpInPage from './SignUpIn'
import Game from './Game/Game'

import { anonymousSignIn, auth } from './firebase'

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
      <RouterProvider router={router} />
    </div>
  );
}

export default App;
