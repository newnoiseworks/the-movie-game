import admin from './fbase'

export const MAX_SCORE = "MOVIE".length
export const HEARTBEAT_TIME = 1000 * 10

export interface Player {
  uuid: string
  name: string
  heartbeat?: number
  score?: number
  ready?: boolean
}

type idType = 'mid' | 'pid'

export interface GameMove {
  toType: idType
  name: string
  photo: string
  mid?: number
  pid?: number
}

export interface GameMoveHistory extends GameMove {
  correct: boolean
  player: Player
}

export default class Game {
  db: admin.database.Database
  players: { [key: string]: Player } = {}
  history: { [key: string]: GameMoveHistory } = {}

  currentPlayer?: string
  createdOn?: number
  gid?: string
  name?: string

  constructor(db: admin.database.Database) {
    this.db = db
  }

  async create(firstPlayer: Player, name?: string) {
    firstPlayer.score = 0
    firstPlayer.heartbeat = new Date().getTime()

    const gamesRef = this.db.ref("games")

    const gameRef = gamesRef.push({
      createdOn: new Date().getTime(),
      currentPlayer: firstPlayer.uuid,
      name: name || `${firstPlayer.name}'s game`
    })

    this.gid = gameRef.key as string

    await gameRef.once("value")

    const gamesPlayerRef = this.db.ref(`games/${this.gid}/players`)

    gamesPlayerRef.push(firstPlayer)

    await gamesPlayerRef.once("value")

    await this.get(this.gid)

    return gameRef.key
  }

  async get(gid: string) {
    let gameRef
    this.gid = gid

    gameRef = (await this.db.ref(`games/${gid}`).once("value")).val()

    if (!gameRef) {
      this.gid = undefined
      return this
    }

    this.currentPlayer = gameRef.currentPlayer
    this.players = gameRef.players
    this.createdOn = gameRef.createdOn
    this.name = gameRef.name
    this.history = gameRef.history || {}

    return this
  }

  async join(newPlayer: Player) {
    if (!this.canPlayerJoin(newPlayer)) {
      return false
    }

    newPlayer.score = 0
    newPlayer.heartbeat = new Date().getTime()

    const gamePlayersRef = this.db.ref(`games/${this.gid}/players`)

    try {
      await gamePlayersRef.push(newPlayer).once("value")

      this.players = (await gamePlayersRef.once('value')).val()

      return true
    } catch(err) {
      throw err
    }
  }

  canPlayerJoin(newPlayer: Player) {
    if (this.isPlayerAlreadyInGame(newPlayer)) {
      return false
    }

    if (Object.keys(this.players).length > 1 && this.areAllPlayersReady()) {
      return false
    }

    return true
  }

  async heartbeat(uuid: string) {
    const playerKey = this.getPlayerKeyFrom(uuid)

    await this.db.ref(`games/${this.gid}/players/${playerKey}/heartbeat`).set(new Date().getTime())

    const playersSnap = await this.db.ref(`games/${this.gid}/players/`).once("value")
    const players = playersSnap.val() as { [key: string]: Player }

    if (
      Object.keys(players).
      filter((key) => (players[key].score || 0) < MAX_SCORE).length <= 1
    ) {
      return
    }

    const heartbeatCutoff = new Date().getTime() - (3 * HEARTBEAT_TIME)

    for (const playerKey in players) {
      const player = players[playerKey]

      if (player.heartbeat! <= heartbeatCutoff) {
        player.score = MAX_SCORE
      }
    }

    await this.db.ref(`games/${this.gid}/players`).set(players)
    await this.get(this.gid!)
  }

  isPlayerAlreadyInGame(newPlayer: Player) {
    for (var playerKey in this.players) {
      const player = this.players[playerKey]

      if (player.uuid === newPlayer.uuid) {
        return true
      }
    }

    return false
  }

  areAllPlayersReady() {
    let allPlayersReady = true

    for (var playerKey in this.players) {
      const player = this.players[playerKey]

      if (!player.ready) {
        allPlayersReady = false
      }
    }

    return allPlayersReady
  }

  async playerReady(uuid: string, ready: boolean = true) {
    const playerKey = this.sortedKeys(this.players).find((key) => this.players[key].uuid === uuid)!

    await this.db.ref(`games/${this.gid}/players/${playerKey}`).update({ ready })

    this.players[playerKey].ready = ready
  }

  async playerMove(
    uuid: string,
    isCorrect: boolean,
    move: GameMove
  ) {
    const playerKey = this.sortedKeys(this.players).find((key) => this.players[key].uuid === uuid)!
    const player = this.players[playerKey]

    this.validatePlayer(player)

    if (isCorrect) {
      this.validateMove(move)
    } else {
      const score = (player.score || 0) + 1
      await this.db.ref(`games/${this.gid}/players/${playerKey}/score`).set((player.score || 0) + 1)
      player.score = score
    }

    const gameRefHistory = this.db.ref(`games/${this.gid}/history`)
    const gameMoveHistory: GameMoveHistory = {
      ...move,
      correct: isCorrect,
      player
    }

    gameRefHistory.push(gameMoveHistory)

    const nextPlayerUuid = this.getNextPlayer(playerKey)

    const [_updateCurrentPlayer, gameRefHistoryObject] = await Promise.all([
      this.db.ref(`games/${this.gid}/currentPlayer`).set(nextPlayerUuid),
      gameRefHistory.once("value")
    ])

    this.history = gameRefHistoryObject.val()
    this.currentPlayer = nextPlayerUuid
  }

  getNextPlayer(formerCurrentPlayerKey: string): string {
    const playerKeyIdx = this.sortedKeys(this.players).findIndex((k) => k === formerCurrentPlayerKey)
    
    const nextPlayerKey = this.sortedKeys(this.players)[
      playerKeyIdx + 1 === this.sortedKeys(this.players).length ? 0 : playerKeyIdx + 1
    ]

    const player = this.players[nextPlayerKey]

    if (player.score && player.score === MAX_SCORE) {
      return this.getNextPlayer(nextPlayerKey)
    }

    return player.uuid
  }

  validatePlayer(player: Player) {
    if (player.score === MAX_SCORE) {
      throw new GameErrorCantMoveWithMaxScore()
    }

    if (player.uuid != this.currentPlayer) {
      throw new GameErrorCantMoveWhenNotCurrentPlayer()
    }
  }

  validateMove(move: GameMove) {
    const lastMove = this.history[
      this.sortedKeys(this.history)[this.sortedKeys(this.history).length - 1]
    ]

    if (lastMove && !lastMove.correct) {
      return
    }

    if (move.toType === 'pid') {
      if (this.sortedKeys(this.history).find(
        (moveKey) => {
          const historicalMove = this.history[moveKey]
          return historicalMove.toType === 'pid' && historicalMove.pid === move.pid
        }
      )) {
        throw new GameErrorMovieOrArtfulLiarAlreadyChosen()
      }

      if (lastMove && lastMove.mid !== move.mid) {
        throw new GameErrorPreviousArtfulLiarDoesntMatchCurrent()
      }
    }

    if (move.toType === 'mid') {
      if (this.sortedKeys(this.history).find(
        (moveKey) => {
          const historicalMove = this.history[moveKey]
          return historicalMove.toType === 'mid' && historicalMove.mid === move.mid
        }
      )) {
        throw new GameErrorMovieOrArtfulLiarAlreadyChosen()
      }

      if (lastMove && lastMove.pid !== move.pid) {
        throw new GameErrorPreviousMovieDoesntMatchCurrent()
      }
    }
  }

  getPlayerKeyFrom(uuid: string) {
    return this.sortedKeys(this.players).find((key) => this.players[key].uuid === uuid)
  }

  sortedKeys(obj: object) {
    return Object.keys(obj).sort()
  }
}

export class GameErrorCantMoveWithMaxScore extends Error {
  constructor() {
    super("Player can't make a move due to having lost by hitting max score")
    this.name = GameErrorCantMoveWithMaxScore.name
  }
}

export class GameErrorCantMoveWhenNotCurrentPlayer extends Error {
  constructor() {
    super("Player can't make a move when their uid is not the game's curent player")
    this.name = GameErrorCantMoveWhenNotCurrentPlayer.name
  }
}

export class GameErrorMovieOrArtfulLiarAlreadyChosen extends Error {
  constructor() {
    super("This movie or artful liar has already been chosen")
    this.name = GameErrorMovieOrArtfulLiarAlreadyChosen.name
  }
}

export class GameErrorPreviousArtfulLiarDoesntMatchCurrent extends Error {
  constructor() {
    super("Passed in artful liar doesn't match previous one")
    this.name = GameErrorPreviousArtfulLiarDoesntMatchCurrent.name
  }
}

export class GameErrorPreviousMovieDoesntMatchCurrent extends Error {
  constructor() {
    super("Passed in movie doesn't match previous one")
    this.name = GameErrorPreviousMovieDoesntMatchCurrent.name
  }
}

