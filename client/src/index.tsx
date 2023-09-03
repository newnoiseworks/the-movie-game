import React from 'react'
import ReactDOM from 'react-dom/client'

import App from './App'
import './firebase.ts'

const warningElems = document.getElementsByClassName("firebase-emulator-warning")

if (process.env.NODE_ENV === 'development' && warningElems.length > 0) {
  setTimeout(() => {
    warningElems[0].remove()
  }, 1500)
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();
