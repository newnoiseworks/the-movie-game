import admin from './fbase'

export const MAX_SCORE = "MOVIE".length

export interface Player {
  uuid: string
  name: string
  score?: number
  ready?: boolean
}

export default class Game {

  db: admin.database.Database
  players: { [key: string]: Player } = {}

  currentPlayer?: string
  createdOn?: number
  gid?: string

  constructor(db: admin.database.Database) {
    this.db = db
  }

  async create(firstPlayer: Player) {
    firstPlayer.score = 0

    const gamesRef = this.db.ref("games")

    const gameRef = gamesRef.push({
      createdOn: new Date().getTime(),
      currentPlayer: firstPlayer.uuid
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
    isCorrect: boolean
  ) {
    const playerKey = Object.keys(this.players).find((key) => this.players[key].uuid === uuid)!
    const player = this.players[playerKey]

    if (player.score === MAX_SCORE || player.uuid != this.currentPlayer) {
      return false
    }

    if (!isCorrect) {
      await this.db.ref(`games/${this.gid}/players/${playerKey}/score`).set((player.score || 0) + 1)
    }

    const playerKeyIdx = Object.keys(this.players).findIndex((k) => k === playerKey)
    const nextPlayerUuid = this.players[Object.keys(this.players)[
      playerKeyIdx + 1 === Object.keys(this.players).length ? 0 : playerKeyIdx + 1
    ]].uuid

    await this.db.ref(`games/${this.gid}/currentPlayer`).set(nextPlayerUuid)
    this.currentPlayer = nextPlayerUuid

    return true
  }
}

