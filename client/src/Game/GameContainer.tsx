import React, { useCallback, useState, useEffect } from 'react'
import {
  useDisclosure,
  Text,
  Flex,
  Box,
} from '@chakra-ui/react'

import { GameMove, GameHistoryMove, GamePlayer } from './GamePage'
import GamePlayerList, { MAX_SCORE } from './GamePlayerList'
import GameMoveModal, {SearchType} from './GameMoveModal'
import GameMoveJumbotron from './GameMoveJumbotron'

interface GameContainerProps {
  gameId: string,
  players: GamePlayer[]
  history: GameHistoryMove[]
  gameName: string
  currentPlayer: string
  isHeartbeatOn: () => boolean
  setupHeartbeatInterval: (gid: string) => Promise<void>
  playerGameChoice: (
    choice: GameMove,
    gid: string
  ) => Promise<any>
  uuid: string
}

const GameContainer: React.FC<GameContainerProps> = ({
  gameId,
  players,
  history,
  gameName,
  currentPlayer,
  isHeartbeatOn,
  setupHeartbeatInterval,
  playerGameChoice,
  uuid
}) => {
  const { isOpen: isMoveModalOpen, onOpen: onMoveModalOpen, onClose: onMoveModalClose } = useDisclosure()

  const [ finalWinner, setFinalWinner ] = useState<GamePlayer>()
  const [ currentPlayerName, setCurrentPlayerName ] = useState<string>('')
  const [ searchType, setSearchType ] = useState<SearchType>(SearchType.both)
  const [ lastMove, setLastMove ] = useState<GameHistoryMove>()
  const [ errorMessage, setErrorMessage ] = useState<string>()

  useEffect(function setupHeartbeatIfPlayerHasnt() {
    if (gameId && !isHeartbeatOn() && players.find((p) => p.uuid === uuid)) {
      setupHeartbeatInterval(gameId)
    }
  }, [players, gameId, isHeartbeatOn, setupHeartbeatInterval, uuid])

  useEffect(function setupCurrentPlayerNameFromPlayers() {
    if (currentPlayer && players && players.length > 0) {
      const player = players.find((p) => p.uuid === currentPlayer)
      if (player && currentPlayerName !== player.name) {
        setCurrentPlayerName(player.name)
      }
    }
  }, [players, currentPlayer, currentPlayerName])

  useEffect(function setupGameMoveModalOnCurrentPlayerChanges() {
    if (history) {
      if (history.length === 0) {
        setSearchType(SearchType.both)
      } else {
        const historyKeys = history.map((h) => h.key).sort()
        const lastMoveKey = historyKeys[historyKeys.length - 1]
        const lastMove = history.find((h) => h.key === lastMoveKey)

        if (lastMove) {
          setLastMove(lastMove)

          if (lastMove.toType === 'mid') {
            setSearchType(lastMove.correct ? SearchType.person : SearchType.movie)
          } else {
            setSearchType(lastMove.correct ? SearchType.movie : SearchType.person)
          }
        }
      }
    }
  }, [history])

  useEffect(function setFinalWinnerOnPlayerChanges() {
    if (players) {
      const playersLeft = players.filter((p) => (p.score || 0) < MAX_SCORE)

      if (playersLeft.length === 1 && !finalWinner) {
        setFinalWinner(playersLeft[0])
      }
    }
  }, [players, finalWinner])

  useEffect(function setupMoveModal() {
    if (currentPlayer && uuid === currentPlayer && !finalWinner) {
      onMoveModalOpen()
    } else {
      onMoveModalClose()
    }
  }, [currentPlayer, onMoveModalOpen, onMoveModalClose, finalWinner, uuid])

  const makeChoice = useCallback(async (id: number, choice: SearchType) => {
    setErrorMessage(undefined)

    const data: GameMove = {
      toType: choice === SearchType.movie ? 'mid' : 'pid'
    }

    if (choice === SearchType.movie) {
      data.mid = id
    } else {
      data.pid = id
    }

    if (history && lastMove && lastMove.correct) {
      if (choice === SearchType.movie) {
        data.pid = lastMove.pid
      } else {
        data.mid = lastMove.mid
      }
    }

    try {
      await playerGameChoice(data, gameId!)
    } catch(err: any) {
      setErrorMessage(err.response.data)
      return
    }
  }, [history, lastMove, gameId, playerGameChoice])

  return (
    <Flex>
      <Box sx={{ mb: 6, mr: 6 }} flex="1">
        <Text variant="h1" fontSize="3xl" fontWeight="bold">
          {gameName}
        </Text>
        <Text variant="h3" fontSize="sm">
          Now Playing: The Movie Game
        </Text>
        <GameMoveJumbotron
          playerName={currentPlayerName}
          lastMove={lastMove}
          finalWinner={finalWinner}
        />
        <GamePlayerList
          players={players}
          currentPlayer={currentPlayer as string}
        />
        <GameMoveModal
          lastMove={lastMove}
          makeChoice={makeChoice}
          searchType={searchType}
          isOpen={isMoveModalOpen}
          onClose={onMoveModalClose}
          errorMessage={errorMessage}
        />
      </Box>
      {history && history.length > 0 &&
        <Box>
          <Text fontSize="lg">Choice History</Text>
          {history.map((move, idx, history) => {
            const lastMove = idx > 0 ? history[idx - 1] : undefined

            return <Text fontSize={"xs"} key={move.key} as="div">
              {move.player.name}
              {
                (lastMove && lastMove.correct) &&
                  (move.correct ? ' correctly ' : ' incorrectly ')
              }
              {move.toType === 'mid' ? ' chose movie: ' : ' chose person: '}
              <br />
              <em>{move.name}</em>
              <hr />
              <br />
            </Text>
          })}
        </Box>
      }
    </Flex>
  )
}

export default GameContainer
