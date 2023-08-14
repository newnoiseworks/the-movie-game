import * as functions from "firebase-functions";

import appApi from './api'

export const api = functions.https.onRequest(appApi)

