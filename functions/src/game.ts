import admin from './fbase'

export const MAX_SCORE = "MOVIE".length

export interface Player {
  uuid: string
  name: string
  score?: number
  ready?: boolean
}

type idType = 'mid' | 'pid'

export interface GameMove {
  mid?: number
  pid?: number
  toType: idType
  correct?: boolean
  name: string
  photo: string
}

export default class Game {
  db: admin.database.Database
  players: { [key: string]: Player } = {}
  history: { [key: string]: GameMove } = {}

  currentPlayer?: string
  createdOn?: number
  gid?: string
  name?: string

  constructor(db: admin.database.Database) {
    this.db = db
  }

  async create(firstPlayer: Player, name?: string) {
    firstPlayer.score = 0

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
    // TODO: This could be better passed into the game move itself as it's evaluated outside of this class, would need to adjust tests
    move.correct = isCorrect

    const playerKey = this.sortedKeys(this.players).find((key) => this.players[key].uuid === uuid)!
    const player = this.players[playerKey]

    this.validatePlayer(player)

    if (isCorrect) {
      this.validateMove(move)
    } else {
      await this.db.ref(`games/${this.gid}/players/${playerKey}/score`).set((player.score || 0) + 1)
    }

    const playerKeyIdx = this.sortedKeys(this.players).findIndex((k) => k === playerKey)
    const nextPlayerUuid = this.players[this.sortedKeys(this.players)[
      playerKeyIdx + 1 === this.sortedKeys(this.players).length ? 0 : playerKeyIdx + 1
    ]].uuid

    const gameRefHistory = this.db.ref(`games/${this.gid}/history`)
    gameRefHistory.push(move)

    const [_updateCurrentPlayer, gameRefHistoryObject] = await Promise.all([
      this.db.ref(`games/${this.gid}/currentPlayer`).set(nextPlayerUuid),
      gameRefHistory.once("value")
    ])

    this.history = gameRefHistoryObject.val()
    this.currentPlayer = nextPlayerUuid
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

