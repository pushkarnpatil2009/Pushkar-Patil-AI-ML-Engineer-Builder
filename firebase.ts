/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";
import firebaseConfig from "../firebase-applet-config.json";

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account"
});

// Initialize Firestore (CRITICAL: must specify the custom database ID from config)
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Firebase Storage
export const storage = getStorage(app);

// Initialize Firebase Realtime Database
export const rtdb = getDatabase(app, firebaseConfig.databaseURL);

// Validate Connection to Firestore (Per Firebase Integration Skill Guidelines)
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    if (error instanceof Error && error.message.includes("client is offline")) {
      console.error("Please check your Firebase configuration or internet connection.");
    }
  }
}

testFirestoreConnection();
