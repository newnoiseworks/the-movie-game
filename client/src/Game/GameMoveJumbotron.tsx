import React from 'react'
import {
  Card,
  CardBody,
  Heading,
  VStack,
  Text
} from '@chakra-ui/react'

import { GameMove } from './Game'

interface GameMoveJumbotronProps {
  playerName: string
  lastMove?: GameMove
}

const GameMoveJumbotron: React.FC<GameMoveJumbotronProps> = (({
  playerName, lastMove
}) => {

  let currentMoveString = playerName + ' '

  if (!lastMove) {
    currentMoveString += 'has to choose a movie or person to start!'
  } else {
    if (lastMove.toType === 'mid') {
      currentMoveString += 'has to choose a person from the movie ' + lastMove.mid
    } else {
      currentMoveString += 'has to choose a movie containing ' + lastMove.pid
    }
  }

  return <Card sx={{ mt: 6, mb: 4 }}>
    <CardBody>
      <VStack>
        <Heading size="md">
          {`${playerName}'s move`}
        </Heading>
        <Text>
          {currentMoveString}
        </Text>
      </VStack>
    </CardBody>
  </Card>
})

export default GameMoveJumbotron
