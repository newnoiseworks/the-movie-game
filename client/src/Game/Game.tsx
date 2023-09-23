import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useList, useObjectVal } from 'react-firebase-hooks/database'
import {
  Container,
  useDisclosure,
  Text,
} from '@chakra-ui/react'

import { getFromDB } from '../firebase'
import {getUID} from '../api'
import GamePlayerList from './GamePlayerList'
import GameMoveModal, { SearchType } from './GameMoveModal'

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
  const { isOpen: isMoveModalOpen, onOpen: onMoveModalOpen, onClose: onMoveModalClose } = useDisclosure()

  const [ players, setPlayers ] = useState<GamePlayer[]>([])
  const [ searchType, setSearchType ] = useState<SearchType>(SearchType.both)

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
    if (currentPlayer && history && getUID() === currentPlayer) {
      if (history.length === 0) {
        setSearchType(SearchType.both)
        onMoveModalOpen()
      } else {
        const historyKeys = history.map((h) => h.key).sort()
        const lastMoveKey = historyKeys[historyKeys.length - 1]
        const lastMoveSnapshot = history.find((h) => h.key === lastMoveKey)

        if (lastMoveSnapshot) {
          const lastMove = lastMoveSnapshot.val() as GameMove

          if (lastMove.toType === 'mid') {
            setSearchType(SearchType.movie)
          } else {
            setSearchType(SearchType.person)
          }

          onMoveModalOpen()
        }
      }
    }
  }, [currentPlayer, history, onMoveModalOpen])

  function makeChoice(_id: number, _choice: SearchType) {

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
        <GamePlayerList
          players={players}
          currentPlayer={currentPlayer as string}
        />
        <GameMoveModal 
          makeChoice={makeChoice}
          searchType={searchType}
          isOpen={isMoveModalOpen} 
          onClose={onMoveModalClose} 
        />
      </Container>
    </Container>
  )
}

export default Game
