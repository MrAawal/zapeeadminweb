// UserModel.ts
import { collection, getDocs, doc, updateDoc, deleteDoc, Timestamp } from "firebase/firestore";
import { db } from "../firebase/firebase";

export interface User {
  userId: string;
  username: string;
  email: string;
  phone: string;
  createdTimestamp: Timestamp;  // Firestore Timestamp
  notActive?: boolean;
}

// Fetch all users
export async function fetchUsers(): Promise<User[]> {
  const usersCol = collection(db, "users");
  const userSnapshot = await getDocs(usersCol);
  return userSnapshot.docs.map(doc => ({
    userId: doc.id,
    ...(doc.data() as Omit<User, "userId">),
  }));
}

// Search users by phone (client-side filter)
export async function searchUsersByPhone(phoneSearch: string): Promise<User[]> {
  if (!phoneSearch) {
    return fetchUsers();
  }
  const allUsers = await fetchUsers();
  return allUsers.filter(user =>
    user.phone.toLowerCase().includes(phoneSearch.toLowerCase())
  );
}

// Toggle user active status (assumes notActive field in Firestore)
export async function toggleUserActiveStatus(userId: string, currentlyActive: boolean): Promise<void> {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, { notActive: !currentlyActive });
}

// Delete user from Firestore
export async function deleteUser(userId: string): Promise<void> {
  const userRef = doc(db, "users", userId);
  await deleteDoc(userRef);
}

import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";

const auth = getAuth();

async function registerUser(email: string, password: string) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log("User registered:", user.uid);
    // Optionally save user profile data to Firestore
  } catch (error) {
    console.error("Registration error:", error);
  }
}

