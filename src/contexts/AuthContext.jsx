import { useEffect, useMemo, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { auth } from '../firebase/config'
import { AuthContext } from './AuthContextObject'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loadingAuth, setLoadingAuth] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoadingAuth(false)
    })

    return () => unsubscribe()
  }, [])

  const value = useMemo(
    () => ({
      user,
      loadingAuth,
      login: (email, password) => signInWithEmailAndPassword(auth, email, password),
      logout: () => signOut(auth),
      register: async (name, email, password) => {
        const response = await createUserWithEmailAndPassword(auth, email, password)
        await updateProfile(response.user, { displayName: name })
        return response
      },
      recoverPassword: (email) => sendPasswordResetEmail(auth, email),
    }),
    [loadingAuth, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

