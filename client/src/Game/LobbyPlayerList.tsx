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

export interface LobbyPlayer {
  name: string
  ready?: boolean
}

export interface LobbyPlayerListProps {
  players: LobbyPlayer[]
  gameId: string
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
        {players.map((player) =>
          <Tr>
            <Td>{player.name}</Td>
            <Td textAlign="right">
              <em>{!player.ready && "not "}ready</em>
            </Td>
          </Tr>
        )}
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

