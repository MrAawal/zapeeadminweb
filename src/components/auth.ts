// authService.ts
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, User } from "firebase/auth";

const auth = getAuth();

/**
 * Registers a new user with email and password.
 * @param email User email
 * @param password User password
 * @returns UID string of created user or null on failure
 */
export async function registerUser(email: string, password: string): Promise<string | null> {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user.uid;
  } catch (error) {
    console.error("Registration error:", error);
    return null;
  }
}

/**
 * Signs in an existing user.
 * @param email User email
 * @param password User password
 * @returns Firebase User object or null on failure
 */
export async function signInUser(email: string, password: string): Promise<User | null> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Sign in error:", error);
    return null;
  }
}

/**
 * Signs out the current user.
 */
export async function signOutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Sign out error:", error);
  }
}

/**
 * Gets the current authenticated user's UID.
 * @returns UID string or null if no user logged in
 */
export function getCurrentUserUid(): string | null {
  const user = auth.currentUser;
  return user ? user.uid : null;
}
