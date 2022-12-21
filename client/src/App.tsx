import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import CreateOrJoin from './Game/CreateOrJoin'
import SignUpInPage from './SignUpIn'
import Game from './Game/Game'

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

function App() {
  return (
    <div>
      <RouterProvider router={router} />
    </div>
  );
}

export default App;
