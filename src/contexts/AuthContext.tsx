'use client';

import type { User as AppUserType } from '@/types'; // Renamed to avoid clash with Firebase User
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
      let errorMessage = 'Se ha producido un error inesperado durante el inicio de sesión.';
      if (error.code) {
        switch (error.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
          case 'auth/invalid-email':
          case 'auth/user-disabled':
          case 'auth/too-many-requests':
            errorMessage = 'Correo electrónico o contraseña no válidos.';
            break;
          default:
            // For other Firebase errors, you might still want to show a generic message
            // or log the specific error.message for debugging but show generic to user.
            errorMessage = 'Correo electrónico o contraseña no válidos.'; // Keep it generic for unknown auth errors too
            // console.error("Unhandled Firebase Auth Error Code:", error.code, error.message);
        }
      } else {
        // Non-Firebase errors, or Firebase errors without a 'code'
        errorMessage = error.message || 'Correo electrónico o contraseña no válidos.';
      }
      throw new Error(errorMessage);
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
