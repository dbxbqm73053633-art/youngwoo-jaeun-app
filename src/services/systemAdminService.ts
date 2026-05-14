import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { ensureAuth } from "./authService";

export async function isCurrentUserSystemAdmin() {
  const user = await ensureAuth();
  if (!user) return false;
  const snap = await getDoc(doc(db, "systemAdmins", user.uid));
  return snap.exists();
}
