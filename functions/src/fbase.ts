import * as admin from "firebase-admin"

var serviceAccount = require("../the-movie-game-fbase-admin-sdk.json")

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FBASE_REALTIME_DB_URL
  })
}

export default admin

