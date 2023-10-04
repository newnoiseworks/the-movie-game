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

import { GameHistoryMove, GamePlayer } from './GamePage'
import { getScoreString, MAX_SCORE } from './GamePlayerList'

export interface GameMoveJumbotronProps {
  playerName: string
  lastMove?: GameHistoryMove
  finalWinner?: GamePlayer
}

const GameMoveJumbotron: React.FC<GameMoveJumbotronProps> = (({
  playerName, lastMove, finalWinner
}) => {
  const [ isMoveAlertOpen, setIsMoveAlertOpen ] = useState<boolean>(false)
  const [ isFinalWinnerAlertOpen, setFinalWinnerAlertOpen ] = useState<boolean>(false)
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

    setLastMoveMaxScoreHit(lastMove.player.score === MAX_SCORE)

    setLastMoveString(lastMoveString)
    setIsMoveAlertOpen(true)

    setTimeout(() => {
      setIsMoveAlertOpen(false)

      if (finalWinner) {
        setTimeout(() => {
          setFinalWinnerAlertOpen(true)
        }, 2500)
      }
    }, 2500)
  }, [lastMove, finalWinner])

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
        <Heading size="md" data-testid="game-jumbotron-current-player-name">
          {`${playerName}'s move`}
        </Heading>
        <Text data-testid="game-jumbotron-current-move-string">
          {currentMoveString}
        </Text>
      </VStack>
      <SlideFade
        in={isMoveAlertOpen}
        offsetY={-20}
      >
        <Box
          data-testid="game-move-jumbotron-last-move-box"
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
          <Text data-testid="game-jumbotron-last-move-string">{lastMoveString}</Text>
          <Text data-testid="game-jumbotron-last-move-score-string">{lastMoveScoreString}</Text>
          {lastMoveMaxScoreHit && lastMove &&
            <Text data-testid="game-jumbotron-last-move-knocked-out-message">{lastMove.player.name} is knocked out of the game!</Text>
          }
        </Box>
      </SlideFade>
      {
        finalWinner &&
        <SlideFade
          in={!!isFinalWinnerAlertOpen}
          offsetY={-20}
        >
          <Box
            data-testid="game-jumbotron-final-winner-box"
            bg="green.500"
            rounded="md"
            shadow="md"
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
            }}
          >
            <Text>{finalWinner.name}</Text>
            <Text>Final Score: {getScoreString(finalWinner)}</Text>
            {!finalWinner.score &&
              <Text>Flawless Victory!</Text>
            }
          </Box>
        </SlideFade>
      }
    </CardBody>
  </Card>
})

export default GameMoveJumbotron
