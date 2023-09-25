import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardBody,
  Heading,
  SlideFade,
  VStack,
  Text
} from '@chakra-ui/react'

import { GameHistoryMove } from './Game'
import {getScoreString} from './GamePlayerList'

interface GameMoveJumbotronProps {
  playerName: string
  lastMove?: GameHistoryMove
}

const GameMoveJumbotron: React.FC<GameMoveJumbotronProps> = (({
  playerName, lastMove
}) => {
  const [ isMoveAlertOpen, setIsMoveAlertOpen ] = useState<boolean>(false)
  const [ currentMoveString, setCurrentMoveString ] = useState<string>('')
  const [ lastMoveString, setLastMoveString ] = useState<string>('')
  const [ lastMoveScoreString, setLastMoveScoreString ] = useState<string>('')

  useEffect(function openMoveAlertOnLastMoveChange() {
    if (!lastMove) {
      setIsMoveAlertOpen(false)
      return
    }

    let lastMoveString = lastMove.player.name + ' is '

    if (lastMove.correct) {
      lastMoveString += 'correct!'
    } else {
      lastMoveString += 'incorrect!'
    }

    const scoreString = `Score: ${getScoreString(lastMove.player)}`

    setLastMoveString(lastMoveString)
    setLastMoveScoreString(scoreString)
    setIsMoveAlertOpen(true)

    setTimeout(() => setIsMoveAlertOpen(false), 2500)
  }, [lastMove])

  useEffect(function updateCurrentMoveStringOnLastMoveAndPlayerNameChange() {
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

    setCurrentMoveString(currentMoveString)
  }, [lastMove, playerName])

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
      <SlideFade
        in={isMoveAlertOpen}
        offsetY={-20}
      >
        <Box
          bg="purple.500"
          rounded="md"
          shadow="md"
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
          }}
        >
          <Text>{lastMoveString}</Text>
          <Text>{lastMoveScoreString}</Text>
        </Box>
      </SlideFade>
    </CardBody>
  </Card>
})

export default GameMoveJumbotron
