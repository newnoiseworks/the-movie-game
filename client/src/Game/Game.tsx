import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useList, useObjectVal } from 'react-firebase-hooks/database'
import {
  useDisclosure,
  Text,
  Flex,
  Box,
} from '@chakra-ui/react'
import { uniq } from 'underscore'

import { getFromDB } from '../firebase'
import { getUID, playerGameChoice, isHeartbeatOn, setupHeartbeatInterval } from '../api'
import GamePlayerList, { MAX_SCORE } from './GamePlayerList'
import GameMoveModal, {SearchType} from './GameMoveModal'
import GameMoveJumbotron from './GameMoveJumbotron'

export interface GamePlayer {
  uuid: string
  name: string
  key: string
  heartbeat?: number
  score?: number
  ready?: boolean
}

export interface GameMove {
  mid?: number
  pid?: number
  toType: 'mid' | 'pid'
  correct?: boolean
}

export interface GameHistoryMove extends GameMove {
  name: string
  photo: string
  player: GamePlayer
}

const Game: React.FC = () => {
  const { gameId } = useParams()
  const [ playerSnaps, playerLoading ] = useList(getFromDB(`games/${gameId}/players`))
  const [ gameName, gameNameLoading, gameNameError ] = useObjectVal<string>(getFromDB(`games/${gameId}/name`))
  const [ currentPlayer ] = useObjectVal<string>(getFromDB(`games/${gameId}/currentPlayer`))
  const [ history ] = useList(getFromDB(`games/${gameId}/history`))
  const { isOpen: isMoveModalOpen, onOpen: onMoveModalOpen, onClose: onMoveModalClose } = useDisclosure()

  const [ players, setPlayers ] = useState<GamePlayer[]>([])
  const [ finalWinner, setFinalWinner ] = useState<GamePlayer>()
  const [ currentPlayerName, setCurrentPlayerName ] = useState<string>('')
  const [ searchType, setSearchType ] = useState<SearchType>(SearchType.both)
  const [ lastMove, setLastMove ] = useState<GameHistoryMove>()
  const [ errorMessage, setErrorMessage ] = useState<string>()

  useEffect(function setupPlayerArrayOnFirebaseSnapshotChanges() {
    if (!playerLoading && playerSnaps) {
      const _players: GamePlayer[] = []

      playerSnaps.forEach((snap) => {
        var player = snap.val()

        if (!_players.find((p) => p.uuid === player.uuid)) {
          _players.push({ key: snap.key, ...player })
        }
      })

      setPlayers(_players)
    }
  }, [playerLoading, playerSnaps])

  useEffect(function setupHeartbeatIfPlayerHasnt() {
    if (gameId && !isHeartbeatOn() && players.find((p) => p.uuid === getUID())) {
      setupHeartbeatInterval(gameId)
    }
  }, [players, gameId])

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
        const lastMoveSnapshot = history.find((h) => h.key === lastMoveKey)

        if (lastMoveSnapshot) {
          const lastMove = lastMoveSnapshot.val()
          setLastMove(lastMove as GameHistoryMove)

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
    if (currentPlayer && getUID() === currentPlayer && !finalWinner) {
      onMoveModalOpen()
    } else {
      onMoveModalClose()
    }
  }, [currentPlayer, onMoveModalOpen, onMoveModalClose, finalWinner])

  async function makeChoice(id: number, choice: SearchType) {
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
  }

  return (
    <Flex>
      <Box sx={{ mb: 6, mr: 6 }} flex="1">
        {gameNameLoading && "Loading game..."}
        {gameNameError && `Error loading game... ${gameNameError}`}
        <Text variant="h1" fontSize="3xl" fontWeight="bold">
          {gameName}
        </Text>
        <Text variant="h3" fontSize="sm">
          Lobby - The Movie Game
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
          {history && uniq(history, h => h.key).map((h, idx, history) => {
            const lastMove = idx > 0 ? history[idx - 1].val() as GameHistoryMove : undefined
            const move = h.val() as GameHistoryMove

            return <Text fontSize={"xs"} key={h.key} as="div">
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

export default Game
