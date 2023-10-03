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
  TableContainer, } from '@chakra-ui/react'

import { LobbyPlayer } from './LobbyPage'

interface PlayerRowProps {
  player: LobbyPlayer
}

const PlayerRow: React.FC<PlayerRowProps> = ({ player }) => {
  return <Tr key={player.key} data-testid={`player-row-${player.key}`}>
    <Td>
      {player.name}
    </Td>
    <Td textAlign="right">
      <em>{!player.ready && "not "}ready</em>
    </Td>
  </Tr>
}

interface UserPlayerRowProps extends PlayerRowProps {
  gameId: string
  setToDB: (path: string, data: any) => Promise<void>
}

const UserPlayerRow: React.FC<UserPlayerRowProps> = ({ 
  player,
  gameId,
  setToDB
}) => (
  <Tr key={player.key} data-testid={`user-row-${player.key}`}>
    <Td data-testid="lobby-player-list-user-nametag">
      {player.name} - <em>(you)</em>
    </Td>
    <Td textAlign="right">
      <Switch 
        data-testid="lobby-player-list-user-ready-switch"
        isChecked={player.ready} 
        onChange={() => {
          setToDB(`games/${gameId}/players/${player.key}/ready`, !player.ready)
        }}
      />
    </Td>
  </Tr>
)

export interface LobbyPlayerListProps {
  players: LobbyPlayer[]
  gameId: string
  copyUrlFn: () => void
  uuid: string
  setToDB: (path: string, data: any) => Promise<void>
}

const LobbyPlayerList: React.FC<LobbyPlayerListProps> = ({
  players = [],
  gameId,
  copyUrlFn,
  uuid,
  setToDB
}) => {
  const notUserPlayers = players.filter((p) => p.uuid !== uuid)
  const userPlayer = players.find((p) => p.uuid === uuid)

  return <TableContainer>
    <Table variant="striped" colorScheme="purple">
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
          setToDB={setToDB}
        />}
        {notUserPlayers.map((player) => (
          <PlayerRow
            player={player}
            key={player.key}
          />
        ))}
      </Tbody>
      <Tfoot>
        <Tr>
          <Td>
            <Link data-testid="lobby-player-list-copy-share-link" onClick={copyUrlFn}>(copy share link)</Link>
          </Td>
          <Td></Td>
        </Tr>
      </Tfoot>
    </Table>
  </TableContainer>
}

export default LobbyPlayerList

