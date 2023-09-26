import React, { useState, useEffect, useRef } from 'react'
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
import { getScoreString } from './GamePlayerList'

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
  const [ lastMoveMaxScoreHit, setLastMoveMaxScoreHit ] = useState<boolean>(false)

  const secondToLastMoveRef = useRef<GameHistoryMove>()

  useEffect(function openMoveAlertOnLastMoveChange() {
    if (
      !lastMove ||
      (secondToLastMoveRef.current && !secondToLastMoveRef.current.correct)
    ) {
      setIsMoveAlertOpen(false)
      secondToLastMoveRef.current = lastMove
      return
    }

    secondToLastMoveRef.current = lastMove

    const scoreString = `Score: ${getScoreString(lastMove.player)}`
    setLastMoveScoreString(scoreString)

    let lastMoveString = lastMove.player.name + ' is '

    if (lastMove.correct) {
      lastMoveString += 'correct!'
    } else {
      lastMoveString += 'incorrect!'
    }

    // TODO: Might be better to check against MAX SCORE and centralize that
    // as an int, somewhere, someday, maybe
    setLastMoveMaxScoreHit(scoreString.indexOf('*') === -1)

    setLastMoveString(lastMoveString)
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
          bg={lastMoveMaxScoreHit ? "red.500" : "purple.500"}
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
          {lastMoveMaxScoreHit && lastMove &&
            <Text>{lastMove.player.name} is knocked out of the game!</Text>
          }
        </Box>
      </SlideFade>
    </CardBody>
  </Card>
})

export default GameMoveJumbotron
