import { createContext, useContext, useEffect, useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/fire";



const AuthContext = createContext(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};



export const AuthProvider = ({
  // eslint-disable-next-line react/prop-types
  children,
}) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async (email, password) => {
    await signInWithEmailAndPassword(auth, email, password);

    // // Update last login
    // const userRef = doc(db, 'users', result.user.uid);
    // await setDoc(userRef, {
    //   lastLogin: new Date().toISOString()
    // }, { merge: true });
  };

  const register = async (
    email,
    password,
    fullName
  ) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);

    // Update the user's display name
    await updateProfile(result.user, {
      displayName: fullName,
    });

    // Create user profile in Firestore
    const userProfile = {
      uid: result.user.uid,
      email: result.user.email,
      fullName,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      role: "user", // Default role
    };

    await setDoc(doc(db, "users", result.user.uid), userProfile);
  };

  const logout = async () => {
    await signOut(auth);
    setUserProfile(null);
  };

  const fetchUserProfile = async (user) => {
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        setUserProfile(userDoc.data());
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchUserProfile(user);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    login,
    register,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
