import type { InboxItem, Profile } from "@echo/contracts";
import { useCallback, useEffect, useState } from "react";
import { api } from "./api.ts";

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

export function useProfile(): Profile | null {
  const [profile, setProfile] = useState<Profile | null>(null);
  useEffect(() => {
    api
      .profile()
      .then(({ profile }) => setProfile(profile))
      .catch(() => setProfile(null));
  }, []);
  return profile;
}
