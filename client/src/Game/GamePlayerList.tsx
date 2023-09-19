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

const PlayerRow: React.FC<{ player: GamePlayer, currentPlayer: string }> = ({ player, currentPlayer }) => {
  let scoreString = ""

  if (player.score) {
    for (let i = 0; i < player.score; i++) {
      scoreString += "*"
    }
  }

  return <Tr key={player.key}>
    <Td>
      {player.name}
      {currentPlayer === player.uuid && 'waiting for move'}
    </Td>
    <Td textAlign="right">
      {scoreString}
    </Td>
  </Tr>
}

const GamePlayerList: React.FC<GamePlayerListProps> = ({
  players = [],
  currentPlayer
}) => {
  return <TableContainer>
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
}

export default GamePlayerList

