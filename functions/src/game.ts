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
  fromType?: idType
  toType: idType
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
    this.gid = gid

    const gameRef = (await this.db.ref(`games/${gid}`).once("value")).val()

    this.currentPlayer = gameRef.currentPlayer
    this.players = gameRef.players
    this.createdOn = gameRef.createdOn
    this.name = gameRef.name

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
    let allPlayersReady = true

    for (var playerKey in this.players) {
      const player = this.players[playerKey]

      if (player.uuid === newPlayer.uuid) {
        return false
      }

      if (!player.ready) {
        allPlayersReady = false
      }
    }

    return !allPlayersReady
  }

  async playerReady(uuid: string, ready: boolean = true) {
    const playerKey = Object.keys(this.players).find((key) => this.players[key].uuid === uuid)!

    await this.db.ref(`games/${this.gid}/players/${playerKey}`).update({ ready })

    this.players[playerKey].ready = ready
  }

  async playerMove(
    uuid: string,
    isCorrect: boolean,
    move: GameMove
  ) {
    const playerKey = Object.keys(this.players).find((key) => this.players[key].uuid === uuid)!
    const player = this.players[playerKey]

    this.validatePlayerMove(player, move)

    if (!isCorrect) {
      await this.db.ref(`games/${this.gid}/players/${playerKey}/score`).set((player.score || 0) + 1)
    }

    const playerKeyIdx = Object.keys(this.players).findIndex((k) => k === playerKey)
    const nextPlayerUuid = this.players[Object.keys(this.players)[
      playerKeyIdx + 1 === Object.keys(this.players).length ? 0 : playerKeyIdx + 1
    ]].uuid

    const gameRef = this.db.ref(`games/${this.gid}/history`)
    gameRef.push(move)

    const [_updateCurrentPlayer, gameRefObject] = await Promise.all([
      this.db.ref(`games/${this.gid}/currentPlayer`).set(nextPlayerUuid),
      gameRef.once("value")
    ])

    this.history = gameRefObject.val()
    this.currentPlayer = nextPlayerUuid
  }

  validatePlayerMove(
    player: Player,
    move: GameMove
  ) {
    if (player.score === MAX_SCORE) {
      throw new GameErrorCantMoveWithMaxScore()
    }

    if (player.uuid != this.currentPlayer) {
      throw new GameErrorCantMoveWhenNotCurrentPlayer()
    }

    if (move.toType === 'pid' && Object.keys(this.history).find(
      (moveKey) => this.history[moveKey].pid === move.pid
    ) || move.toType === 'mid' && Object.keys(this.history).find(
      (moveKey) => this.history[moveKey].mid === move.mid
    )) {
      throw new GameErrorMovieOrArtfulLiarAlreadyChosen()
    }
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

