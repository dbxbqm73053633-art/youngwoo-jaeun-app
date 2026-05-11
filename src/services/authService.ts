import { signInAnonymously } from "firebase/auth";
import { auth } from "../lib/firebase";

export async function ensureAuth() {
  if (!auth.currentUser) {
    await signInAnonymously(auth);
  }

  return auth.currentUser;
}
