import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useList, useObjectVal } from 'react-firebase-hooks/database'
import { useCopyToClipboard, useCountdown } from 'usehooks-ts'

import { getUID, isHeartbeatOn, setupHeartbeatInterval, joinGame } from '../api'
import { getFromDB, setToDB } from '../firebase'

import LobbyContainer from './LobbyContainer'

export interface LobbyPlayer {
  name: string
  ready?: boolean
  uuid: string
  key: string
  score?: number
}

const GameLobby: React.FC = () => {
  const [ , copy ] = useCopyToClipboard()
  const { gameId } = useParams()
  const navigate = useNavigate()
  const [count, { startCountdown, resetCountdown }] = useCountdown({ countStart: 10 })

  const [ playerSnaps, playerLoading, playerError ] = useList(getFromDB(`games/${gameId}/players`))
  const [ gameName, gameNameLoading, gameNameError ] = useObjectVal<string>(getFromDB(`games/${gameId}/name`))
  const [ players, setPlayers ] = useState<LobbyPlayer[]>([])

  function copyUrlFn() {
    copy(global.window.location.href)
  }

  useEffect(function setupPlayerArrayOnFirebaseSnapshotChanges() {
    if (!playerLoading && playerSnaps) {
      const _players: LobbyPlayer[] = []

      playerSnaps.forEach((snap) => {
        var player = snap.val()

        if (!_players.find((p) => p.uuid === player.uuid)) {
          _players.push({ key: snap.key, ...player })
        }
      })

      setPlayers(_players)
    }
  }, [playerLoading, playerSnaps])

  if (!gameId) {
    navigate('/')
    return <></>
  }

  if (gameNameLoading || !gameName || playerLoading) {
    return <>"Loading game..."</>
  }

  if (gameNameError || playerError) {
    return <>"Error loading game..."</>
  }

  return (
    <LobbyContainer
      players={players}
      copyUrlFn={copyUrlFn}
      gameName={gameName}
      gameId={gameId}
      isHeartbeatOn={isHeartbeatOn}
      setupHeartbeatInterval={setupHeartbeatInterval}
      uuid={getUID()}
      setToDB={setToDB}
      count={count}
      startCountdown={startCountdown}
      resetCountdown={resetCountdown}
      joinGame={joinGame}
    />
  )
}

export default GameLobby

