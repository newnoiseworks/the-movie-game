import React, { useEffect, useMemo } from 'react'
import {
  Button,
  Container,
  Flex,
  Spacer,
  Text,
  useDisclosure
} from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'

import LobbyPlayerList from './LobbyPlayerList'
import { LobbyPlayer } from './LobbyPage'
import LobbyJoinModal from './LobbyJoinModal'

export interface LobbyContainerProps {
  players: LobbyPlayer[]
  copyUrlFn: () => void
  gameId: string
  isHeartbeatOn: () => boolean
  setupHeartbeatInterval: (gid: string) => Promise<void>
  uuid: string
  count: number
  startCountdown: () => void
  resetCountdown: () => void
  setToDB: (path: string, data: any) => Promise<void>
  gameName: string
}

const LobbyContainer: React.FC<LobbyContainerProps> = ({
  players,
  copyUrlFn,
  gameName,
  gameId,
  isHeartbeatOn,
  setupHeartbeatInterval,
  uuid,
  count,
  startCountdown,
  resetCountdown,
  setToDB
}) => {
  const navigate = useNavigate()
  const { isOpen, onOpen, onClose } = useDisclosure()

  const gameLaunching = useMemo(
    () => players && players.length > 1 && !players.find((p) => !p.ready),
    [players]
  )

  const isUserInGame = useMemo(
    () => players && !!players.find((p) => p.uuid === uuid),
    [uuid, players]
  )

  useEffect(function startCountdownIfAllPlayersAreReady() {
    if (gameLaunching) {
      startCountdown()
    } else {
      resetCountdown()
    }
  }, [gameLaunching, resetCountdown, startCountdown])

  useEffect(function openJoinModalWhenNeeded() {
    if (!gameLaunching && !isUserInGame) {
      onOpen()
    } else {
      onClose()
    }
  }, [onOpen, gameLaunching, onClose, isUserInGame])

  useEffect(function setupHeartbeatIfPlayerHasnt() {
    if (gameId && !isHeartbeatOn() && isUserInGame) {
      setupHeartbeatInterval(gameId)
    }
  }, [isUserInGame, gameId, isHeartbeatOn, setupHeartbeatInterval])

  useEffect(function checkIfGameHasStartedAndBootIfSo() {
    if (players.find((p) => p.score && p.score > 0)) {
      navigate(`/game/${gameId}`)
    }
  }, [players, navigate, gameId])

  useEffect(function navigateToActiveGamePageIfCountdownHasHitZero() {
    if (count === 0) {
      navigate(`/game/${gameId}`)
    }
  }, [count, navigate, gameId])

  return (
    <Container>
      <Container sx={{ mb: 6 }}>
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
            <Text variant="h3" fontSize="sm" data-testid="game-launching-header">
              {
                players.find((p) => p.uuid === uuid) ?
                  `Game launching in ${count} seconds...`
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
              <Button
                colorScheme="purple"
                onClick={copyUrlFn}
                data-testid="game-container-copy-share-link-button"
              >
                Copy Share Link
              </Button>
            </Flex>
          </Container>
        )
      }
      <LobbyPlayerList
        players={players}
        gameId={gameId}
        copyUrlFn={copyUrlFn}
        uuid={uuid}
        setToDB={setToDB}
      />
      <LobbyJoinModal
        isOpen={isOpen}
        onClose={onClose}
        gameId={gameId}
      />
    </Container>
  )
}

export default LobbyContainer

