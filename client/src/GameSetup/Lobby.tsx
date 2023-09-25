import React, { useEffect, useState } from 'react'
import {
  Button,
  Container,
  Flex,
  Spacer,
  Text,
  useDisclosure
} from '@chakra-ui/react'
import { useParams, useNavigate } from 'react-router-dom'
import { useList, useObjectVal } from 'react-firebase-hooks/database'
import { useCopyToClipboard, useCountdown } from 'usehooks-ts'

import { getFromDB } from '../firebase'
import { getUID } from '../api'

import LobbyPlayerList, { LobbyPlayer } from './LobbyPlayerList'
import LobbyJoinModal from './LobbyJoinModal'

const GameLobby: React.FC = () => {
  const [ , copy ] = useCopyToClipboard()
  const [count, { startCountdown, resetCountdown  }] = useCountdown({ countStart: 10 })
  const navigate = useNavigate()
  const { gameId } = useParams()
  const { isOpen, onOpen, onClose } = useDisclosure()

  const [ playerSnaps, playerLoading, playerError ] = useList(getFromDB(`games/${gameId}/players`))
  const [ gameName, gameNameLoading, gameNameError ] = useObjectVal<string>(getFromDB(`games/${gameId}/name`))
  const [ players, setPlayers ] = useState<LobbyPlayer[]>([])
  const [ gameLaunching, setGameLaunching ] = useState<boolean>(false)

  function copyUrlFn() {
    copy(global.window.location.href)
  }

  useEffect(function setupPlayerArrayOnFirebaseSnapshotChanges() {
    if (!playerLoading && playerSnaps) {
      const _players: LobbyPlayer[] = []

      playerSnaps.forEach((snap) => {
        var player = snap.val()

        if (!_players.find((p) => p.uuid === player.uuid)) {
          _players.push({ key: snap.key, ...player })
        }
      })

      setPlayers(_players)

      if (
        !isOpen && !_players.find((p) => p.uuid === getUID()) &&
        !gameLaunching
      ) {
        onOpen()
      }
    }
  }, [playerLoading, playerSnaps, isOpen, onOpen, gameLaunching])

  useEffect(function startCountdownIfAllPlayersAreReady() {
    if (players.length > 1 && !players.find((p) => !p.ready)) {
      setGameLaunching(true)
      startCountdown()
    } else {
      setGameLaunching(false)
      resetCountdown()
    }
  }, [players, resetCountdown, startCountdown])

  useEffect(function navigateToActiveGamePageIfCountdownHasHitZero() {
    if (count === 0) {
      navigate(`/game/${gameId}`)
    }
  }, [count, navigate, gameId])

  if (!gameId) {
    navigate('/')
    return <></>
  }

  return (
    <Container>
      <Container sx={{ mb: 6 }}>
        {gameNameLoading && "Loading game..."}
        {gameNameError && `Error loading game... ${gameNameError}`}
        <Text variant="h1" fontSize="3xl" fontWeight="bold">
          {gameName}
        </Text>
        <Text variant="h3" fontSize="sm">
          Lobby - The Movie Game
        </Text>
      </Container>
      {
        gameLaunching ?
        (
          <Container>
            <Text variant="h3" fontSize="sm">
              {
                players.find((p) => p.uuid === getUID()) ?
                  `Game Launching in ${count} seconds...`
                :
                  'Game launching! Unless someone clicks ready to off, no new joiners.'
              }
            </Text>
          </Container>
        )
        :
        (
          <Container sx={{ mb: 4 }}>
            <Flex alignItems="center">
              <Text variant="h3" fontSize="sm">
                Share this URL to ask others to join
              </Text>
              <Spacer />
              <Button colorScheme="purple" onClick={copyUrlFn}>
                Copy Share Link
              </Button>
            </Flex>
          </Container>
        )
      }
      {playerLoading && "Loading players..."}
      {playerError && `Error loading players... ${playerError}`}
      <LobbyPlayerList
        players={players}
        gameId={gameId}
        copyUrlFn={copyUrlFn}
      />
      <LobbyJoinModal
        isOpen={isOpen}
        onClose={onClose}
        gameId={gameId}
      />
    </Container>
  )
}

export default GameLobby

