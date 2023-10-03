import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useList, useObjectVal } from 'react-firebase-hooks/database'
import { useCopyToClipboard } from 'usehooks-ts'

import { getUID, isHeartbeatOn, setupHeartbeatInterval } from '../api'
import { getFromDB } from '../firebase'

import { LobbyPlayer } from './LobbyPlayerList'
import LobbyContainer from './LobbyContainer'

const GameLobby: React.FC = () => {
  const [ , copy ] = useCopyToClipboard()
  const { gameId } = useParams()
  const navigate = useNavigate()

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

  if (gameNameLoading || playerLoading) {
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
      gameId={gameId!}
      isHeartbeatOn={isHeartbeatOn}
      setupHeartbeatInterval={setupHeartbeatInterval}
      uuid={getUID()}
    />
  )
}

export default GameLobby

