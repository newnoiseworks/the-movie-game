import React from 'react'
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer, } from '@chakra-ui/react'

import { GamePlayer } from './Game'

interface GamePlayerListProps {
  players: GamePlayer[]
  currentPlayer: string
}

export const MAX_SCORE = 'MOVIE'.split('').length

export function getScoreString(player: GamePlayer) {
  let scoreString = "*****"
  const gameWord = 'MOVIE'.split('')

  if (player.score) {
    scoreString = ""

    for (let i = 0; i < player.score; i++) {
      scoreString += gameWord[i]
    }

    for (let i = gameWord.length; i > player.score; i--) {
      scoreString += "*"
    }
  }

  return scoreString
}

const PlayerRow: React.FC<{ player: GamePlayer, currentPlayer: string }> = ({ player, currentPlayer }) => {
  const score = player.score || 0
  const lost = score >= MAX_SCORE

  return <Tr key={player.key}>
    <Td>
      <em style={{ textDecoration: lost ? "line-through" : '' }}>{player.name}</em>
      {currentPlayer === player.uuid && ' waiting for move'}
      {lost && ' is out!'}
    </Td>
    <Td textAlign="right">
      {getScoreString(player)}
    </Td>
  </Tr>
}

const GamePlayerList: React.FC<GamePlayerListProps> = ({
  players = [],
  currentPlayer
}) => (
  <TableContainer>
    <Table variant="striped" colorScheme="purple">
      <Thead>
        <Tr>
          <Th>Players</Th>
          <Th textAlign="right">Score</Th>
        </Tr>
      </Thead>
      <Tbody>
        {players.map((player) => (
          <PlayerRow
            player={player}
            key={player.key}
            currentPlayer={currentPlayer}
          />
        ))}
      </Tbody>
    </Table>
  </TableContainer>
)

export default GamePlayerList

