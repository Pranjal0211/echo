import type { InboxItem, Profile } from "@echo/contracts";
import { useCallback, useEffect, useState } from "react";
import { api, ApiClientError } from "./api.ts";

/** Current time, refreshed every minute so waiting badges stay honest. */
export function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);
  return now;
}

export function useInbox() {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const { items } = await api.inbox();
      setItems(items);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load the inbox.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { items, loading, error, reload };
}

export interface ProfileState {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  /** The database has no profile yet (fresh Supabase without demo data). */
  missing: boolean;
  /** Replace the profile with the one an API call returned. */
  setProfile: (profile: Profile) => void;
}

export function useProfile(): ProfileState {
  const [profile, setProfileState] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    api
      .profile()
      .then(({ profile }) => setProfileState(profile))
      .catch((err: unknown) => {
        setMissing(err instanceof ApiClientError && err.status === 404);
        setError(err instanceof Error ? err.message : "Couldn't load your profile.");
      })
      .finally(() => setLoading(false));
  }, []);

  const setProfile = useCallback((next: Profile) => {
    setProfileState(next);
    setMissing(false);
    setError(null);
  }, []);

  return { profile, loading, error, missing, setProfile };
}

/** Run one API action at a time, with a busy flag and a readable error. */
export function useAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = useCallback(async <T,>(action: () => Promise<T>): Promise<T | undefined> => {
    setBusy(true);
    setError(null);
    try {
      return await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      return undefined;
    } finally {
      setBusy(false);
    }
  }, []);
  return { run, busy, error };
}
