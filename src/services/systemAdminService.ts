import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { ensureAuth } from "./authService";

export async function isCurrentUserSystemAdmin() {
  const user = await ensureAuth();
  if (!user) {
    if (import.meta.env.DEV) {
      console.info("[systemAdmin debug]", {
        currentUid: null,
        path: null,
        documentExists: false,
        active: null,
        role: null,
        systemAdmin: false,
      });
    }
    return false;
  }

  const ref = doc(db, "systemAdmins", user.uid);
  const snap = await getDoc(ref);
  const data = snap.exists() ? snap.data() : null;
  const active = data?.active === true;
  const role = typeof data?.role === "string" ? data.role : null;
  const systemAdmin = active && role === "owner";

  if (import.meta.env.DEV) {
    console.info("[systemAdmin debug]", {
      currentUid: user.uid,
      path: `systemAdmins/${user.uid}`,
      documentIdMatchesUid: snap.exists() ? snap.id === user.uid : false,
      documentExists: snap.exists(),
      loadedDocument: data,
      active,
      role,
      systemAdmin,
    });
  }

  return systemAdmin;
}
