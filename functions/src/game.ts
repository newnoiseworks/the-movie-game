import * as admin from "firebase-admin"

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
    newPlayer.score = 0
    const gamePlayersRef = this.db.ref(`games/${this.gid}/players`)

    try {
      await gamePlayersRef.push(newPlayer).once("value")

      return this.get(this.gid!)
    } catch(err) {
      throw err
    }
  }

  async playerReady(uuid: string) {
    const playerKey = Object.keys(this.players).find((key) => this.players[key].uuid === uuid)

    await this.db.ref(`games/${this.gid}/players/${playerKey}`).update({ ready: true })
  }

  playerMove(
    isCorrect: boolean,
    uuid: string
  ) {
  }
}

