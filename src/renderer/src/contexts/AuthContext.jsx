import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase/fire'

const AuthContext = createContext(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchUserProfile = useCallback(async (user) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      if (userDoc.exists()) {
        setUserProfile(userDoc.data())
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }, [])

  const login = useCallback(async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password)
    await fetchUserProfile(result.user)
  }, [fetchUserProfile])

  const register = useCallback(async (email, password, fullName) => {
    const result = await createUserWithEmailAndPassword(auth, email, password)

    await updateProfile(result.user, {
      displayName: fullName
    })

    const userProfile = {
      uid: result.user.uid,
      email: result.user.email,
      fullName,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      secret:password,
      role: 'employee'
    }

    await setDoc(doc(db, 'users', result.user.uid), userProfile)
    setUserProfile(userProfile)
  }, [])

  const logout = useCallback(async () => {
    await signOut(auth)
    setUserProfile(null)
    setCurrentUser(null)
  }, [])

const resetPassword = (email) => sendPasswordResetEmail(auth, email);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user)
      if (user) {
        await fetchUserProfile(user)
      } else {
        setUserProfile(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [fetchUserProfile])

  const value = {
    currentUser,
    userProfile,
    login,
    register,
    logout,
    loading,
    resetPassword
  }

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>
}
