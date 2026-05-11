import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../lib/firebase";
import { ensureAuth } from "../services/authService";

export function useAuth(autoSignIn = false) {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [loading, setLoading] = useState(autoSignIn);
  const [error, setError] = useState<Error | null>(null);

  const signIn = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const currentUser = await ensureAuth();
      setUser(currentUser);
      return currentUser;
    } catch (caught) {
      const nextError = caught instanceof Error ? caught : new Error(String(caught));
      setError(nextError);
      throw nextError;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  useEffect(() => {
    if (!autoSignIn || auth.currentUser) return;
    void signIn();
  }, [autoSignIn, signIn]);

  return { user, loading, error, signIn };
}
