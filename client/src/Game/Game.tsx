import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useList, useObjectVal } from 'react-firebase-hooks/database'
import {
  Container,
  Text,
} from '@chakra-ui/react'

import { getFromDB } from '../firebase'
import {getUID} from '../api'
import GamePlayerList from './GamePlayerList'

export interface GamePlayer {
  uuid: string
  name: string
  key: string
  score?: number
  ready?: boolean
}

type idType = 'mid' | 'pid'

interface GameMove {
  mid?: number
  pid?: number
  toType: idType
}

const Game: React.FC = () => {
  const { gameId } = useParams()
  const [ playerSnaps, playerLoading ] = useList(getFromDB(`games/${gameId}/players`))
  const [ gameName, gameNameLoading, gameNameError ] = useObjectVal<string>(getFromDB(`games/${gameId}/name`))
  const [ currentPlayer ] = useObjectVal<string>(getFromDB(`games/${gameId}/currentPlayer`))
  const [ history ] = useList(getFromDB(`games/${gameId}/history`))

  const [ players, setPlayers ] = useState<GamePlayer[]>([])

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
  }, [playerLoading, playerSnaps, setPlayers])

  useEffect(function setupGameMoveModalOnCurrentPlayerChanges() {
    if (getUID() === currentPlayer) {
      if (!history) {
        console.log('show first move modal')
      } else {
        const historyKeys = history.map((h) => h.key).sort()
        const lastMoveKey = historyKeys[historyKeys.length - 1]
        const lastMoveSnapshot = history.find((h) => h.key === lastMoveKey)

        if (lastMoveSnapshot) {
          const lastMove = lastMoveSnapshot.val() as GameMove

          if (lastMove.toType === 'mid') {
            // show person modal
          } else {
            // show movie modal
          }
        }
      }
    }
  }, [currentPlayer, history])

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
        <GamePlayerList
          players={players}
          currentPlayer={currentPlayer as string}
        />
      </Container>
    </Container>
  )
}

export default Game
