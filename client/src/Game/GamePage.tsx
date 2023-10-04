import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useList, useObjectVal } from 'react-firebase-hooks/database'

import { getFromDB } from '../firebase'
import {
  getUID,
  isHeartbeatOn,
  playerGameChoice,
  searchForPeople,
  searchForMovie,
  setupHeartbeatInterval
} from '../api'

import GameContainer from './GameContainer'
import { uniq } from 'underscore'

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
  key: string
}

const GamePage: React.FC = () => {
  const { gameId } = useParams()
  const [ playerSnaps, playerLoading, playerError ] = useList(getFromDB(`games/${gameId}/players`))
  const [ gameName, gameNameLoading, gameNameError ] = useObjectVal<string>(getFromDB(`games/${gameId}/name`))
  const [ currentPlayer, , currentPlayerError ] = useObjectVal<string>(getFromDB(`games/${gameId}/currentPlayer`))
  const [ historySnaps, historyLoading, historyError ] = useList(getFromDB(`games/${gameId}/history`))

  const [ players, setPlayers ] = useState<GamePlayer[]>([])
  const [ history, setHistory ] = useState<GameHistoryMove[]>([])

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

  useEffect(function setupGameHistoryFromFirebaseSnapshots() {
    if (historySnaps && !historyLoading) {
      const _history: GameHistoryMove[] = historySnaps.map((snap) => ({
        ...snap.val(),
        key: snap.key
      }))

      setHistory(uniq(_history, h => h.key))
    }
  }, [historySnaps, historyLoading, historyError])

  if(!gameId || !gameName || !currentPlayer || playerLoading || historyLoading || gameNameLoading) {
    return <>Loading...</>
  }

  if (playerError || gameNameError || currentPlayerError) {
    return <>Error loading content!...</>
  }

  return (
    <GameContainer
      gameId={gameId}
      players={players}
      history={history}
      gameName={gameName}
      currentPlayer={currentPlayer}
      playerGameChoice={playerGameChoice}
      isHeartbeatOn={isHeartbeatOn}
      setupHeartbeatInterval={setupHeartbeatInterval}
      searchForMovie={searchForMovie}
      searchForPeople={searchForPeople}
      uuid={getUID()}
    />
  )
}

export default GamePage
