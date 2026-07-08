import { useEffect, useMemo, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { doc, setDoc, onSnapshot } from 'firebase/firestore'
import { auth, db } from '../firebase/config'
import { AuthContext } from './AuthContextObject'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loadingAuth, setLoadingAuth] = useState(true)

  useEffect(() => {
    let unsubscribeProfile = null

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      
      if (currentUser) {
        // Escutar em tempo real o perfil do usuário na coleção 'users' no Firestore
        const userDocRef = doc(db, 'users', currentUser.uid)
        unsubscribeProfile = onSnapshot(userDocRef, async (docSnap) => {
          if (docSnap.exists()) {
            const profileData = docSnap.data()
            setUserProfile(profileData)
            // Salvar plano no cache local para leitura em services que rodam fora de componentes React
            localStorage.setItem('user_plan', profileData.plan || 'demo')
          } else {
            // Se o documento de perfil não existir, cria com o plano de demonstração ('demo')
            const defaultProfile = {
              uid: currentUser.uid,
              name: currentUser.displayName || '',
              email: currentUser.email || '',
              plan: 'demo',
              createdAt: new Date().toISOString()
            }
            try {
              await setDoc(userDocRef, defaultProfile)
              setUserProfile(defaultProfile)
              localStorage.setItem('user_plan', 'demo')
            } catch (err) {
              console.error('Erro ao criar perfil do usuário:', err)
            }
          }
          setLoadingAuth(false)
        }, (error) => {
          console.error('Erro ao assinar perfil do usuário:', error)
          setLoadingAuth(false)
        })
      } else {
        setUserProfile(null)
        localStorage.removeItem('user_plan')
        if (unsubscribeProfile) {
          unsubscribeProfile()
          unsubscribeProfile = null
        }
        setLoadingAuth(false)
      }
    })

    return () => {
      unsubscribeAuth()
      if (unsubscribeProfile) unsubscribeProfile()
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      userProfile,
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
    [loadingAuth, user, userProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
