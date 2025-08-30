import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";  // <-- Import storage

const firebaseConfig = {
  apiKey: "AIzaSyDfpob3h04yRnIVKyRglwU89aDcdbOIaEo",
  authDomain: "firelogin-1d14f.firebaseapp.com",
  databaseURL: "https://firelogin-1d14f-default-rtdb.firebaseio.com",
  projectId: "firelogin-1d14f",
  storageBucket: "firelogin-1d14f.appspot.com",
  messagingSenderId: "531533294608",
  appId: "1:531533294608:web:4990e97575d6889e6b2e95",
  measurementId: "G-1M6YL6WHH4"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);  // <-- Export storage

export default app;