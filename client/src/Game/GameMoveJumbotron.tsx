import React from 'react'
import {
  Card,
  CardBody,
  Heading,
  VStack,
  Text
} from '@chakra-ui/react'

import { GameHistoryMove } from './Game'

interface GameMoveJumbotronProps {
  playerName: string
  lastMove?: GameHistoryMove
}

const GameMoveJumbotron: React.FC<GameMoveJumbotronProps> = (({
  playerName, lastMove
}) => {

  let currentMoveString = playerName + ' '

  if (!lastMove) {
    currentMoveString += 'has to choose a movie or person to start!'
  } else if (lastMove.correct) {
    if (lastMove.toType === 'mid') {
      currentMoveString += 'has to choose a person from the movie ' + lastMove.name
    } else {
      currentMoveString += 'has to choose a movie containing ' + lastMove.name
    }
  } else if (!lastMove.correct) {
    if (lastMove.toType === 'mid') {
      currentMoveString += 'has to choose a movie - any movie!'
    } else {
      currentMoveString += 'has to choose a person from a movie!'
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
