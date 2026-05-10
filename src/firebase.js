import { initializeApp } from 'firebase/app'

import {
  getAuth,
  GoogleAuthProvider,
} from 'firebase/auth'

import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyAqJVKhKNTxU6wt7DY-dVW5rKHh4QCYdzs",
  authDomain: "finanzapp-7d9e6.firebaseapp.com",
  projectId: "finanzapp-7d9e6",
  storageBucket: "finanzapp-7d9e6.firebasestorage.app",
  messagingSenderId: "106728515539",
  appId: "1:106728515539:web:4d47450e004cac031b7126"
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)

export const provider = new GoogleAuthProvider()

export const db = getFirestore(app)