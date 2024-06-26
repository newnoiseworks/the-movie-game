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

  if (!request.headers.authorization) {
    send401(response)
    return next("No authorization key in headers")
  }

  try {
    const token = request.headers.authorization.replace("Bearer ", "")
    decodedToken = await auth.verifyIdToken(token)
  } catch (err) {
    if (process.env.NODE_ENV !== 'test') {
      console.error(err)
    }

    send401(response)
    return next(err)
  }

  request.idToken = decodedToken
  return next()
}

function send401(response: Response) {
  response.status(401)
  response.send()
}
