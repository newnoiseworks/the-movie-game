import React from 'react'
import {
  Link,
  Table,
  Thead,
  Tbody,
  Tfoot,
  Tr,
  Th,
  Td,
  // TableCaption,
  TableContainer,
} from '@chakra-ui/react'

import { getUID } from '../api'

export interface LobbyPlayer {
  name: string
  ready?: boolean
  uuid: string
  key: string
}

export interface LobbyPlayerListProps {
  players: LobbyPlayer[]
  gameId: string
}

const PlayerRow: React.FC<{ player: LobbyPlayer }> = ({
  player
}) => {
  if (player.uuid === getUID()) {
    return <UserPlayerRow player={player} /> 
  }

  return <Tr key={player.key}>
    <Td>
      {player.name} - <em>{!player.ready && "not "}ready</em>
    </Td>
    <Td textAlign="right">
      ...
    </Td>
  </Tr>
}

const UserPlayerRow: React.FC<{ player: LobbyPlayer }> = ({ player }) => {
  return <Tr key={player.key}>
    <Td>
      {player.name} - <em>{!player.ready && "not "}ready</em>
    </Td>
    <Td textAlign="right">
      switch thing
    </Td>
  </Tr>
}

const LobbyPlayerList: React.FC<LobbyPlayerListProps> = ({
  players = []
}) => {
  return <TableContainer>
    <Table variant="striped" colorScheme="purple">
      {/*<TableCaption>caption</TableCaption>*/}
      <Thead>
        <Tr>
          <Th>Players</Th>
          <Th textAlign="right">Ready To Play?</Th>
        </Tr>
      </Thead>
      <Tbody>
        {players.map((player) => (
          <PlayerRow player={player} key={player.key} />
        ))}
      </Tbody>
      <Tfoot>
        <Tr>
          <Td>
            <Link href="#">(copy share link)</Link>
          </Td>
          <Td></Td>
        </Tr>
      </Tfoot>
    </Table>
  </TableContainer>
}

export default LobbyPlayerList

