import admin from './fbase'

import Game, {
  GameMoveHistory,
  GameErrorCantMoveWhenNotCurrentPlayer,
  GameErrorCantMoveWithMaxScore,
  GameErrorMovieOrArtfulLiarAlreadyChosen,
  GameErrorPreviousArtfulLiarDoesntMatchCurrent,
  GameErrorPreviousMovieDoesntMatchCurrent,
  MAX_SCORE,
  HEARTBEAT_TIME,
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
const mid3 = 3
const pid3 = 3

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

  test("if player is incorrect, adjust score, currentPlayer uuid should adjust, mark history as wrong, record choice name and photo URL", async () => {
    let gameObj = (await db.ref(`games/${gameKey}`).once("value")).val() as Game
    let firstUser = gameObj.players[Object.keys(gameObj.players)[0]]!
    const firstCurrentPlayer = gameObj.currentPlayer

    expect(firstUser.score).toEqual(0)
    expect(firstCurrentPlayer).toBe(uuid)

    await game.playerMove(uuid, false, { mid: mid1, pid: pid1, toType: 'pid', name: 'Actor Name', photo: 'url' })

    gameObj = (await db.ref(`games/${gameKey}`).once("value")).val()
    firstUser = gameObj.players[Object.keys(gameObj.players)[0]]!
    const lastMove = gameObj.history[Object.keys(gameObj.history).sort()[Object.keys(gameObj.history).length - 1]]
    const secondCurrentPlayer = gameObj.currentPlayer

    expect(lastMove.correct).toBeFalsy()
    expect(lastMove.name).toEqual('Actor Name')
    expect(lastMove.photo).toEqual('url')
    expect(firstUser.score).toEqual(1)
    expect(firstCurrentPlayer).not.toBe(secondCurrentPlayer)
    expect(secondCurrentPlayer).toBe(uuid2)
    expect(game.currentPlayer).toBe(uuid2)
  })

  test("if player is correct, no score change, currentPlayer uuid should adjust, history should mark as correct, record choice name and photo URL", async () => {
    let gameObj = (await db.ref(`games/${gameKey}`).once("value")).val() as Game
    let firstUser = gameObj.players[Object.keys(gameObj.players)[0]]!
    const firstCurrentPlayer = gameObj.currentPlayer

    expect(firstUser.score).toEqual(0)
    expect(firstCurrentPlayer).toBe(uuid)

    await game.playerMove(uuid, true, { mid: mid1, pid: pid1, toType: 'pid', name: 'Actor Name', photo: 'url' })

    gameObj = (await db.ref(`games/${gameKey}`).once("value")).val()
    firstUser = gameObj.players[Object.keys(gameObj.players)[0]]!
    const lastMove = gameObj.history[Object.keys(gameObj.history).sort()[Object.keys(gameObj.history).length - 1]]
    const secondCurrentPlayer = gameObj.currentPlayer

    expect(lastMove.correct).toBeTruthy()
    expect(lastMove.name).toEqual('Actor Name')
    expect(lastMove.photo).toEqual('url')
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

    await expect(game.playerMove(uuid, false, { mid: mid1, pid: pid1, toType: 'pid', name: 'Actor Name', photo: 'url' })).rejects.toThrow(GameErrorCantMoveWithMaxScore)

    gameObj = (await db.ref(`games/${gameKey}`).once("value")).val()
    firstUser = gameObj.players[Object.keys(gameObj.players)[0]]!
    const secondCurrentPlayer = gameObj.currentPlayer

    expect(firstUser.score).toEqual(MAX_SCORE)
    expect(firstCurrentPlayer).toBe(secondCurrentPlayer)
    expect(secondCurrentPlayer).toBe(uuid2)
    expect(game.currentPlayer).toBe(uuid2)
  })

  test("if player two has hit max score, skip from player one to three when assigning currentPlayer", async() => {
    const playerKey = Object.keys(game.players).find((k) => game.players[k].uuid === uuid2)

    await db.ref(`games/${gameKey}/players/${playerKey}/score`).set(MAX_SCORE)

    await game.get(game.gid!)

    let gameObj = (await db.ref(`games/${gameKey}`).once("value")).val()
    const firstCurrentPlayer = gameObj.currentPlayer
    expect(firstCurrentPlayer).toBe(uuid)

    await game.playerMove(uuid, false, { mid: mid1, pid: pid1, toType: 'pid', name: 'Actor Name', photo: 'url' })

    gameObj = (await db.ref(`games/${gameKey}`).once("value")).val()
    const secondCurrentPlayer = gameObj.currentPlayer

    expect(secondCurrentPlayer).toBe(uuid3)
  })

  test("if player isn't currentPlayer on DB object, don't do anything", async () => {
    await game.get(game.gid!)

    let gameObj = (await db.ref(`games/${gameKey}`).once("value")).val()
    const firstCurrentPlayer = gameObj.currentPlayer

    expect(firstCurrentPlayer).toBe(uuid)

    await expect(game.playerMove(uuid2, false, { mid: mid1, pid: pid1, toType: 'pid', name: 'Actor Name', photo: 'url' })).rejects.toThrow(GameErrorCantMoveWhenNotCurrentPlayer)

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
      name: 'Actor Name',
      photo: 'url'
    })

    await game.playerMove(uuid2, true, {
      pid: pid2,
      mid: mid2,
      toType: 'mid',
      name: 'Movie Name',
      photo: 'url'
    })

    await expect(game.playerMove(uuid3, true, {
      mid: mid2,
      pid: pid2, // this artful liar has already been chosen in the first step
      toType: 'pid',
      name: 'Actor Name',
      photo: 'url'
    })).rejects.toThrow(GameErrorMovieOrArtfulLiarAlreadyChosen)
  })

  test("player cannot choose a movie that has already been picked", async () => {
    await game.get(game.gid!)

    await game.playerMove(uuid, true, {
      pid: pid2,
      toType: 'pid',
      name: 'Actor Name',
      photo: 'url'
    })

    await game.playerMove(uuid2, true, {
      pid: pid2,
      mid: mid2,
      toType: 'mid',
      name: 'Movie Name',
      photo: 'url'
    })

    await game.playerMove(uuid3, true, {
      mid: mid2,
      pid: pid1, // this artful liar has already been chosen in the first step
      toType: 'pid',
      name: 'Actor Name',
      photo: 'url'
    })

    await expect(game.playerMove(uuid, true, {
      pid: pid1,
      mid: mid2, // this movie has already been chosen in the third step
      toType: 'mid',
      name: 'Movie Name',
      photo: 'url'

    })).rejects.toThrow(GameErrorMovieOrArtfulLiarAlreadyChosen)
  })

  test("player can't choose an artful liar from a movie that wasn't the last movie chosen", async () => {
    await game.get(game.gid!)

    await game.playerMove(uuid, true, {
      pid: pid2,
      toType: 'pid',
      name: 'Actor Name',
      photo: 'url'
    })

    await game.playerMove(uuid2, true, {
      pid: pid2,
      mid: mid2,
      toType: 'mid',
      name: 'Movie Name',
      photo: 'url'
    })

    await game.playerMove(uuid3, true, {
      mid: mid2,
      pid: pid3,
      toType: 'pid',
      name: 'Actor Name',
      photo: 'url'
    })

    await game.playerMove(uuid, true, {
      pid: pid3,
      mid: mid3,
      toType: 'mid',
      name: 'Movie Name',
      photo: 'url'
    })

    await expect(game.playerMove(uuid2, true, {
      mid: mid1, // should not match last chosen
      pid: pid1,
      toType: 'pid',
      name: 'Actor Name',
      photo: 'url'
    })).rejects.toThrow(GameErrorPreviousArtfulLiarDoesntMatchCurrent)
  })

  test("player can't choose a movie from an artful liar that wasn't from the last artful liar chosen", async () => {
    await game.get(game.gid!)

    await game.playerMove(uuid, true, {
      pid: pid2,
      toType: 'pid',
      name: 'Actor Name',
      photo: 'url'
    })

    await game.playerMove(uuid2, true, {
      pid: pid2,
      mid: mid2,
      toType: 'mid',
      name: 'Movie Name',
      photo: 'url'
    })

    await game.playerMove(uuid3, true, {
      mid: mid2,
      pid: pid3,
      toType: 'pid',
      name: 'Actor Name',
      photo: 'url'
    })

    await expect(game.playerMove(uuid, true, {
      pid: pid1,
      mid: mid3,
      toType: 'mid',
      name: 'Movie Name',
      photo: 'url'
    })).rejects.toThrow(GameErrorPreviousMovieDoesntMatchCurrent)
  })

  test("player cannot choose an artful liar incorrectly that has already been picked, and the incorrect choice should take precedence such that the score and current player is adjusted", async () => {
    let gameObj = (await db.ref(`games/${gameKey}`).once("value")).val() as Game
    let thirdUser = gameObj.players[Object.keys(gameObj.players)[2]]!
    const firstCurrentPlayer = gameObj.currentPlayer

    expect(thirdUser.score).toEqual(0)
    expect(firstCurrentPlayer).toBe(uuid)

    await game.get(game.gid!)

    await game.playerMove(uuid, true, {
      pid: pid2,
      toType: 'pid',
      name: 'Actor Name',
      photo: 'url'
    })

    await game.playerMove(uuid2, true, {
      pid: pid2,
      mid: mid2,
      toType: 'mid',
      name: 'Movie Name',
      photo: 'url'
    })

    await game.playerMove(uuid3, false, {
      mid: mid2,
      pid: pid2,
      toType: 'pid',
      name: 'Actor Name',
      photo: 'url'
    })

    gameObj = (await db.ref(`games/${gameKey}`).once("value")).val()
    thirdUser = gameObj.players[Object.keys(gameObj.players)[2]]!
    const secondCurrentPlayer = gameObj.currentPlayer

    expect(thirdUser.score).toEqual(1)
    expect(secondCurrentPlayer).toBe(firstCurrentPlayer)
    expect(secondCurrentPlayer).toBe(uuid)
    expect(game.currentPlayer).toBe(uuid)
  })

  test("player object sans ready are stored on history object", async () => {
    await game.get(game.gid!)

    await game.playerMove(uuid, true, {
      pid: pid2,
      toType: 'pid',
      name: 'Actor Name',
      photo: 'url'
    })

    await game.playerMove(uuid2, false, {
      pid: pid2,
      mid: mid2,
      toType: 'mid',
      name: 'Movie Name',
      photo: 'url'
    })

    const gameObj = (await db.ref(`games/${gameKey}`).once("value")).val()
    const history: { [key: string]: GameMoveHistory } = gameObj.history
    const lastMove = history[Object.keys(history)[Object.keys(history).length - 1]]

    expect(lastMove.player.uuid).toEqual(uuid2)
    expect(lastMove.player.score).toBe(1)
    expect(lastMove.player.name).toBe(name2)
    expect(game.currentPlayer).toBe(uuid3)
  })
})

describe("Game#heartbeat", () => {
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

  test("hearbeat should be setup initially on join", () => {
    expect(game.players[Object.keys(game.players)[0]].heartbeat).toBeTruthy()
    expect(game.players[Object.keys(game.players)[0]].heartbeat).toBeGreaterThan(0)
  })

  test("calling hearbeat should update DB heartbeat timestamp", async () => {
    const firstPlayerKey = game.getPlayerKeyFrom(uuid)!
    const heartbeatsAgo = new Date().getTime() - (HEARTBEAT_TIME)

    await db.ref(`games/${gameKey}/players/${firstPlayerKey}/heartbeat`).set(heartbeatsAgo)

    await game.get(gameKey!)

    expect(game.players[firstPlayerKey].heartbeat).toBe(heartbeatsAgo)

    const initialHeartbeat = game.players[firstPlayerKey].heartbeat

    await game.heartbeat(uuid)

    expect(game.players[firstPlayerKey].heartbeat).toBeGreaterThan(initialHeartbeat!)
  })

  test("calling hearbeat should give full score to users who haven't made an update in at least 3 heartbeats", async () => {
    const secondPlayerKey = game.getPlayerKeyFrom(uuid2)

    const threeHeartbeatsAgo = new Date().getTime() - 1000 -  (3 * HEARTBEAT_TIME)

    await db.ref(`games/${gameKey}/players/${secondPlayerKey}/heartbeat`).set(threeHeartbeatsAgo)

    await game.heartbeat(uuid)

    expect(game.players[secondPlayerKey!].score).toBe(MAX_SCORE)
  })

  test("if final winner, loss of heartbeat shouldn't result in loss", async () => {
    const firstPlayerKey = game.getPlayerKeyFrom(uuid)!
    const secondPlayerKey = game.getPlayerKeyFrom(uuid2)!
    const thirdPlayerKey = game.getPlayerKeyFrom(uuid3)!
    const heartbeatsAgo = new Date().getTime() - 1000 - (3 * HEARTBEAT_TIME)

    await Promise.all([
      db.ref(`games/${gameKey}/players/${firstPlayerKey}/heartbeat`).set(heartbeatsAgo),
      db.ref(`games/${gameKey}/players/${secondPlayerKey}/score`).set(MAX_SCORE),
      db.ref(`games/${gameKey}/players/${thirdPlayerKey}/score`).set(MAX_SCORE)
    ])

    await game.heartbeat(uuid2)

    expect(game.players[firstPlayerKey!].score).toBe(0)
  })
})
