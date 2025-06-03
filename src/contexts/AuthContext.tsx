'use client';

import type { User as AppUserType } from '@/types'; // Renamed to avoid clash with Firebase User
// import type { User as FirestoreUser } from '@/types/firestore';
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { getStoredUser, setStoredUser } from '@/lib/authStore';
import { auth as firebaseAuth } from '@/lib/firebase'; // Import Firebase auth instance
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, type User as FirebaseUserType } from 'firebase/auth';
import { getUser as getFirestoreUser } from '@/lib/users'; // To fetch user details from Firestore

interface AuthContextType {
 user: AppUserType | null;
 isAuthenticated: boolean;
 isLoading: boolean;
 login: (email: string, pass: string) => Promise<AppUserType | null>;
 logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser: FirebaseUserType | null) => {
      if (firebaseUser) {
        // User is signed in with Firebase, now get additional details from Firestore
        try {
          const firestoreUserDoc = await getFirestoreUser(firebaseUser.uid);
          if (firestoreUserDoc) {
            const appUser: AppUserType = {
              id: firebaseUser.uid,
              email: firestoreUserDoc.email, // Prefer email from Firestore if available
              name: firestoreUserDoc.name,
              role: firestoreUserDoc.role,
              avatar: firestoreUserDoc.avatar,
            };
            setUser(appUser);
            setStoredUser(appUser); // Also update localStorage
          } else {
            // No corresponding user in Firestore, logout
            console.warn('Firebase user exists, but no Firestore record found. Logging out.');
            await signOut(firebaseAuth);
            setUser(null);
            setStoredUser(null);
          }
        } catch (error) {
          console.error("Error fetching Firestore user data:", error);
          await signOut(firebaseAuth); // Logout on error
          setUser(null);
          setStoredUser(null);
        }
      } else {
        // User is signed out
        const storedUser = getStoredUser(); // Check if user was stored from a previous session
        if (storedUser) {
          setUser(storedUser);
        } else {
          setUser(null);
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, []);


  const login = useCallback(async (email: string, pass: string): Promise<AppUserType | null> => {
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, pass);
      const firebaseUser = userCredential.user;

      if (firebaseUser) {
        // Fetch additional user details from Firestore
        const firestoreUserDoc = await getFirestoreUser(firebaseUser.uid);
        if (firestoreUserDoc) {
          const appUser: AppUserType = {
            id: firebaseUser.uid,
            email: firestoreUserDoc.email,
            name: firestoreUserDoc.name,
            role: firestoreUserDoc.role,
            avatar: firestoreUserDoc.avatar,
          };
          setUser(appUser);
          setStoredUser(appUser);
          setIsLoading(false);
          return appUser;
        } else {
          // Firestore user document not found, treat as login failure
          await signOut(firebaseAuth); // Sign out the Firebase user
          throw new Error('User details not found in database.');
        }
      }
      setIsLoading(false);
      return null; // Should not happen if signInWithEmailAndPassword succeeds
    } catch (error: any) {
      setIsLoading(false);
      console.error('Login failed:', error);
      // Firebase errors often have a 'code' property, e.g., 'auth/user-not-found', 'auth/wrong-password'
      // You might want to provide more specific error messages based on error.code
      throw new Error(error.message || 'Invalid email or password.');
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await signOut(firebaseAuth);
      setUser(null);
      setStoredUser(null);
    } catch (error) {
      console.error("Error during logout:", error);
      // Handle logout error if necessary, though typically it might just clear local state
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user && !isLoading, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
