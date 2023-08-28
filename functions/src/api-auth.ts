import { DecodedIdToken } from "firebase-admin/auth"
import { Request, Response, NextFunction, } from 'express'

declare global {
  module Express {
    interface Request {
      idToken?: DecodedIdToken
    }
  }
}

import admin from './fbase'

export default async function(request: Request, response: Response, next: NextFunction) {
  const auth = admin.auth()
  let decodedToken: DecodedIdToken

  try {
    decodedToken = await auth.verifyIdToken(request.body.token)
  } catch (err) {
    if (process.env.NODE_ENV !== 'test') {
      console.error(err)
    }

    response.status(401)
    response.send()
    return next(err)
  }

  request.idToken = decodedToken
  return next()
}
