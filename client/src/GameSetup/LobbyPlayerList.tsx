import React from 'react'
import {
  Link,
  Switch,
  Table,
  Thead,
  Tbody,
  Tfoot,
  Tr,
  Th,
  Td,
  // TableCaption,
  TableContainer, } from '@chakra-ui/react'

import { setToDB } from '../firebase'
import { getUID } from '../api'

export interface LobbyPlayer {
  name: string
  ready?: boolean
  uuid: string
  key: string
  score?: number
}

export interface LobbyPlayerListProps {
  players: LobbyPlayer[]
  gameId: string
  copyUrlFn: () => void
}

const PlayerRow: React.FC<{ player: LobbyPlayer, gameId: string }> = ({ player, gameId }) => {
  if (player.uuid === getUID()) {
    return <UserPlayerRow player={player} gameId={gameId} />
  }

  return <Tr key={player.key}>
    <Td>
      {player.name}
    </Td>
    <Td textAlign="right">
      <em>{!player.ready && "not "}ready</em>
    </Td>
  </Tr>
}

const UserPlayerRow: React.FC<{ player: LobbyPlayer, gameId: string }> = ({ player, gameId }) => (
  <Tr key={player.key}>
    <Td>
      {player.name} - <em>(you)</em>
    </Td>
    <Td textAlign="right">
      <Switch isChecked={player.ready} onChange={() => {
        setToDB(`games/${gameId}/players/${player.key}/ready`, !player.ready)
      }} />
    </Td>
  </Tr>
)

const LobbyPlayerList: React.FC<LobbyPlayerListProps> = ({
  players = [],
  gameId,
  copyUrlFn
}) => {
  const notUserPlayers = players.filter((p) => p.uuid !== getUID())
  const userPlayer = players.find((p) => p.uuid === getUID())

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
        {userPlayer && <UserPlayerRow
          player={userPlayer}
          key={userPlayer.key}
          gameId={gameId}
        />}
        {notUserPlayers.map((player) => (
          <PlayerRow
            player={player}
            key={player.key}
            gameId={gameId}
          />
        ))}
      </Tbody>
      <Tfoot>
        <Tr>
          <Td>
            <Link onClick={copyUrlFn}>(copy share link)</Link>
          </Td>
          <Td></Td>
        </Tr>
      </Tfoot>
    </Table>
  </TableContainer>
}

export default LobbyPlayerList

