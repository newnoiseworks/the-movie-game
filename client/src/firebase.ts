import { initializeApp } from "firebase/app"
import { getAuth, connectAuthEmulator, signInAnonymously } from "firebase/auth"
import { getDatabase, ref, set, onDisconnect } from "firebase/database"

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
  projectId: process.env.REACT_APP_FIREBASE_DATABASE_URL,
  storageBucket: process.env.REACT_APP_FIREBASE_DATABASE_URL,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getDatabase(app)

function anonymousSignIn(cb?: Function) {
  signInAnonymously(auth)
  .then(() => {
    console.log("Signing in user anonymously")

    if (cb) {
      cb()
    }
  })
  .catch((err) => {
    throw err
  })
}

function getFromDB(query: string) {
  return ref(db, query)
}

function setToDB(query: string, data: Object) {
  return set(getFromDB(query), data)
}

function removeOnDisconnect(query: string) {
  onDisconnect(getFromDB(query)).remove()
}

if (process.env.NODE_ENV === "development") {
  connectAuthEmulator(
    auth,
    `http://${process.env.REACT_APP_FIREBASE_AUTH_DOMAIN}:9099`
  )
}

export {
  auth,
  anonymousSignIn,
  app,
  getFromDB,
  removeOnDisconnect,
  setToDB,
}

