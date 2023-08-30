import admin from './fbase'

import Game, {
  GameErrorCantMoveWhenNotCurrentPlayer,
  GameErrorCantMoveWithMaxScore,
  GameErrorMovieOrArtfulLiarAlreadyChosen,
  MAX_SCORE,
  Player
} from './game'

const db = admin.database()

const gid = "test-gid-1234"
const uuid = "test-uuid-1234"
const name = "test-name"
const uuid2 = uuid + "_2"
const name2 = name + "_2"
const uuid3 = uuid + "_3"
const name3 = name + "_3"
const gameName = "test-game"

const mid1 = 1
const pid1 = 1
const mid2 = 2
const pid2 = 2

afterAll(async () => {
  await db.ref("games").set({})
  db.goOffline()
})

describe("Game#create", () => {
  test("creates a game and sets up objects on db", async () => {
    const createdOn = new Date().getTime()
    const gameKey = await new Game(db).create({ uuid, name }, gameName)

    const gameRef = (await db.ref(`games/${gameKey}`).once("value")).val()
    const firstPlayer = gameRef.players[Object.keys(gameRef.players)[0]]

    expect(Object.keys(gameRef.players).length).toEqual(1)
    expect(firstPlayer.uuid).toEqual(uuid)
    expect(firstPlayer.name).toEqual(name)
    expect(gameRef.currentPlayer).toEqual(uuid)
    expect(gameRef.name).toEqual(gameName)
    expect(gameRef.createdOn - createdOn).toBeLessThan(500)
  })

  test("makes a game name based on user name if no game name provided", async () => {
    const gameKey = await new Game(db).create({ uuid, name })

    const gameRef = (await db.ref(`games/${gameKey}`).once("value")).val()

    expect(gameRef.name).toEqual(`${name}'s game`)
  })
})

describe("Game#get", () => {
  beforeEach(async () => {
    await db.ref(`games/${gid}`).set({
      players: {
        [uuid]: { uuid, name },
        [uuid2]: { uuid: uuid2, name: name2 }
      },
      createdOn: new Date().getTime(),
      name: gameName
    })
  })

  test("gets game from server DB with provided gid", async () => {
    const gameRef = await new Game(db).get(gid)

    const gameRefFromServer = (await db.ref(`games/${gid}`).once('value')).val()

    const firstPlayerFromServer: Player = gameRefFromServer.players[Object.keys(gameRefFromServer.players)[0]] as Player
    const secondPlayerFromServer: Player = gameRefFromServer.players[Object.keys(gameRefFromServer.players)[1]]

    expect(Object.keys(gameRefFromServer.players).length).toEqual(2)
    expect(firstPlayerFromServer.uuid).toEqual(uuid)
    expect(firstPlayerFromServer.name).toEqual(name)
    expect(secondPlayerFromServer.uuid).toEqual(uuid2)
    expect(secondPlayerFromServer.name).toEqual(name2)

    const firstPlayer: Player = gameRef.players[Object.keys(gameRef.players)[0]] as Player
    const secondPlayer: Player = gameRef.players[Object.keys(gameRef.players)[1]]

    expect(Object.keys(gameRef.players).length).toEqual(Object.keys(gameRefFromServer.players).length)
    expect(firstPlayer.uuid).toEqual(firstPlayerFromServer.uuid)
    expect(firstPlayer.name).toEqual(firstPlayerFromServer.name)
    expect(secondPlayer.uuid).toEqual(secondPlayerFromServer.uuid)
    expect(secondPlayer.name).toEqual(secondPlayerFromServer.name)
    expect(gameRef.currentPlayer).toEqual(gameRefFromServer.currentPlayer)
    expect(gameRef.name).toEqual(gameName)
  })
})

describe("Game#join", () => {
  test("joins a game with the given user", async () => {
    const game = new Game(db)
    const gameKey = await game.create({ uuid, name })

    let updatedPlayerList = (await db.ref(`games/${gameKey}/players`).once('value')).val()

    expect(Object.keys(updatedPlayerList).length).toEqual(1)

    await game.join({ uuid: uuid2, name: name2 })

    updatedPlayerList = (await db.ref(`games/${gameKey}/players`).once('value')).val()

    const firstPlayer: Player = updatedPlayerList[Object.keys(updatedPlayerList)[0]]
    const secondPlayer: Player = updatedPlayerList[Object.keys(updatedPlayerList)[1]]

    expect(Object.keys(game.players).length).toEqual(2)
    expect(Object.keys(updatedPlayerList).length).toEqual(2)
    expect(firstPlayer.uuid).toEqual(uuid)
    expect(firstPlayer.name).toEqual(name)
    expect(secondPlayer.uuid).toEqual(uuid2)
    expect(secondPlayer.name).toEqual(name2)
  })

  test("cannot join game where all users are ready", async () => {
    const game = new Game(db)
    const gameKey = await game.create({ uuid, name })

    const didPlayerTwoJoin = await game.join({ uuid: uuid2, name: name2 })
    expect(didPlayerTwoJoin).toBeTruthy()

    await game.playerReady(uuid)
    await game.playerReady(uuid2)

    const didPlayerThreeJoin = await game.join({ uuid: uuid3, name: name3 })
    expect(didPlayerThreeJoin).toBeFalsy()

    const gameRefFromServer = (await db.ref(`games/${gameKey}`).once('value')).val()

    expect(Object.keys(gameRefFromServer.players).length).toEqual(2)
  })

  test("cannot join same game twice", async () => {
    const game = new Game(db)
    await game.create({ uuid, name })

    const didPlayerTwoJoin = await game.join({ uuid: uuid2, name: name2 })
    expect(didPlayerTwoJoin).toBeTruthy()

    const didPlayerTwoJoinTwice = await game.join({ uuid: uuid2, name: name2 })
    expect(didPlayerTwoJoinTwice).toBeFalsy()
  })
})

describe("Game#playerReady", () => {
  test("sets a player's ready flag to true", async () => {
    const game = new Game(db)
    const gameKey = await game.create({ uuid, name })

    await game.playerReady(uuid)

    const playerList = (await db.ref(`games/${gameKey}/players`).once('value')).val()

    const firstPlayer = playerList[Object.keys(playerList).find((key) => playerList[key].uuid === uuid)!]

    expect(playerList[Object.keys(playerList).find((key) => playerList[key].uuid === uuid)!].uuid).toEqual(uuid)
    expect(firstPlayer.ready).toBeTruthy()
  })

  test("sets a players' ready flag to false", async () => {
    const game = new Game(db)
    const gameKey = await game.create({ uuid, name })

    await game.playerReady(uuid)
    await game.playerReady(uuid, false)

    const playerList = (await db.ref(`games/${gameKey}/players`).once('value')).val()
    const firstPlayer = playerList[Object.keys(playerList).find((key) => playerList[key].uuid === uuid)!]

    expect(playerList[Object.keys(playerList).find((key) => playerList[key].uuid === uuid)!].uuid).toEqual(uuid)
    expect(firstPlayer.ready).toBeFalsy()
  })
})

describe("Game#playerMove", () => {
  let game: Game
  let gameKey: string | null

  beforeEach(async () => {
    game = new Game(db)
    gameKey = await game.create({ uuid, name })

    await game.join({ uuid: uuid2, name: name2 })
    await game.join({ uuid: uuid3, name: name3 })

    await game.playerReady(uuid, true)
    await game.playerReady(uuid2, true)
    await game.playerReady(uuid3, true)
  })

  test("if player is incorrect, adjust score, currentPlayer uuid should adjust", async () => {
    let gameObj = (await db.ref(`games/${gameKey}`).once("value")).val() as Game
    let firstUser = gameObj.players[Object.keys(gameObj.players)[0]]!
    const firstCurrentPlayer = gameObj.currentPlayer

    expect(firstUser.score).toEqual(0)
    expect(firstCurrentPlayer).toBe(uuid)

    await game.playerMove(uuid, false, { mid: mid1, pid: pid1, toType: 'pid' })

    gameObj = (await db.ref(`games/${gameKey}`).once("value")).val()
    firstUser = gameObj.players[Object.keys(gameObj.players)[0]]!
    const secondCurrentPlayer = gameObj.currentPlayer

    expect(firstUser.score).toEqual(1)
    expect(firstCurrentPlayer).not.toBe(secondCurrentPlayer)
    expect(secondCurrentPlayer).toBe(uuid2)
    expect(game.currentPlayer).toBe(uuid2)
  })

  test("if player is correct, no score change, currentPlayer uuid should adjust", async () => {
    let gameObj = (await db.ref(`games/${gameKey}`).once("value")).val() as Game
    let firstUser = gameObj.players[Object.keys(gameObj.players)[0]]!
    const firstCurrentPlayer = gameObj.currentPlayer

    expect(firstUser.score).toEqual(0)
    expect(firstCurrentPlayer).toBe(uuid)

    await game.playerMove(uuid, true, { mid: mid1, pid: pid1, toType: 'pid' })

    gameObj = (await db.ref(`games/${gameKey}`).once("value")).val()
    firstUser = gameObj.players[Object.keys(gameObj.players)[0]]!
    const secondCurrentPlayer = gameObj.currentPlayer

    expect(firstUser.score).toEqual(0)
    expect(firstCurrentPlayer).not.toBe(secondCurrentPlayer)
    expect(secondCurrentPlayer).toBe(uuid2)
    expect(game.currentPlayer).toBe(uuid2)
  })

  test("if player has already hit max score, don't do anything", async () => {
    const playerKey = Object.keys(game.players).find((k) => game.players[k].uuid === uuid)

    await db.ref(`games/${gameKey}/players/${playerKey}/score`).set(MAX_SCORE)
    await db.ref(`games/${gameKey}/currentPlayer`).set(game.players[Object.keys(game.players)[1]].uuid)

    await game.get(game.gid!)

    let gameObj = (await db.ref(`games/${gameKey}`).once("value")).val()
    let firstUser = gameObj.players[Object.keys(gameObj.players)[0]]!
    const firstCurrentPlayer = gameObj.currentPlayer

    expect(firstUser.score).toEqual(MAX_SCORE)
    expect(firstCurrentPlayer).toBe(uuid2)

    await expect(game.playerMove(uuid, false, { mid: mid1, pid: pid1, toType: 'pid' })).rejects.toThrow(GameErrorCantMoveWithMaxScore)

    gameObj = (await db.ref(`games/${gameKey}`).once("value")).val()
    firstUser = gameObj.players[Object.keys(gameObj.players)[0]]!
    const secondCurrentPlayer = gameObj.currentPlayer

    expect(firstUser.score).toEqual(MAX_SCORE)
    expect(firstCurrentPlayer).toBe(secondCurrentPlayer)
    expect(secondCurrentPlayer).toBe(uuid2)
    expect(game.currentPlayer).toBe(uuid2)
  })

  test("if player isn't currentPlayer on DB object, don't do anything", async () => {
    await game.get(game.gid!)

    let gameObj = (await db.ref(`games/${gameKey}`).once("value")).val()
    const firstCurrentPlayer = gameObj.currentPlayer

    expect(firstCurrentPlayer).toBe(uuid)

    await expect(game.playerMove(uuid2, false, { mid: mid1, pid: pid1, toType: 'pid' })).rejects.toThrow(GameErrorCantMoveWhenNotCurrentPlayer)

    gameObj = (await db.ref(`games/${gameKey}`).once("value")).val()
    const secondCurrentPlayer = gameObj.currentPlayer

    expect(firstCurrentPlayer).toBe(secondCurrentPlayer)
    expect(secondCurrentPlayer).toBe(uuid)
    expect(game.currentPlayer).toBe(uuid)
  })

  test("player cannot choose an artful liar that has already been picked", async () => {
    await game.get(game.gid!)

    await game.playerMove(uuid, true, {
      pid: pid2,
      toType: 'pid',
    })

    await game.playerMove(uuid2, true, {
      pid: pid2,
      mid: mid2,
      toType: 'mid'
    })

    await expect(game.playerMove(uuid3, true, {
      mid: mid2,
      pid: pid2, // this artful liar has already been chosen in the first step
      toType: 'pid'
    })).rejects.toThrow(GameErrorMovieOrArtfulLiarAlreadyChosen)
  })

  test("player cannot choose a movie that has already been picked", async () => {
    await game.get(game.gid!)

    await game.playerMove(uuid, true, {
      pid: pid2,
      toType: 'pid',
    })

    await game.playerMove(uuid2, true, {
      pid: pid2,
      mid: mid2,
      toType: 'mid'
    })

    await game.playerMove(uuid3, true, {
      mid: mid2,
      pid: pid1, // this artful liar has already been chosen in the first step
      toType: 'pid'
    })

    await expect(game.playerMove(uuid, true, {
      pid: pid1,
      mid: mid2, // this movie has already been chosen in the third step
      toType: 'mid',
    })).rejects.toThrow(GameErrorMovieOrArtfulLiarAlreadyChosen)
  })
})
