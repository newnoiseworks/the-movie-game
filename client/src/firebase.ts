import { initializeApp } from "firebase/app"
import { getAuth, connectAuthEmulator, signInAnonymously } from "firebase/auth"
import { getDatabase, ref, onValue } from "firebase/database"

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
  db,
  ref,
  getFromDB,
  onValue
}

