import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

import { useAuth } from '../context/auth';

type FavoriteState = {
  userId: string;
  ids: Set<string>;
  loading: boolean;
  error: string | null;
};

const EMPTY_IDS = new Set<string>();
const cache = new Map<string, Set<string>>();
const listeners = new Map<string, Set<(ids: Set<string>) => void>>();
const writeQueues = new Map<string, Promise<void>>();

const storageKey = (uid: string) => `favorites:${uid}`;

async function loadFavorites(uid: string): Promise<Set<string>> {
  const cached = cache.get(uid);
  if (cached) return cached;

  const stored = await AsyncStorage.getItem(storageKey(uid));
  const parsed: unknown = stored ? JSON.parse(stored) : [];
  if (!Array.isArray(parsed) || !parsed.every((id) => typeof id === 'string')) {
    throw new Error('Données de favoris locales invalides.');
  }

  const ids = new Set(parsed);
  cache.set(uid, ids);
  return ids;
}

function publishFavorites(uid: string, ids: Set<string>) {
  cache.set(uid, ids);
  listeners.get(uid)?.forEach((listener) => listener(new Set(ids)));
}

export function useFavoriteIds() {
  const { user } = useAuth();
  const userId = user?.uid ?? null;
  const [state, setState] = useState<FavoriteState | null>(null);

  useEffect(() => {
    if (!userId) return;

    let active = true;
    const listener = (ids: Set<string>) => {
      if (active) setState({ userId, ids, loading: false, error: null });
    };
    const userListeners = listeners.get(userId) ?? new Set();
    userListeners.add(listener);
    listeners.set(userId, userListeners);

    loadFavorites(userId)
      .then((ids) => {
        if (active) setState({ userId, ids, loading: false, error: null });
      })
      .catch((error: unknown) => {
        if (active) {
          setState({
            userId,
            ids: EMPTY_IDS,
            loading: false,
            error: error instanceof Error ? error.message : 'Impossible de charger les favoris.',
          });
        }
      });

    return () => {
      active = false;
      userListeners.delete(listener);
      if (userListeners.size === 0) listeners.delete(userId);
    };
  }, [userId]);

  if (!userId) {
    return { ids: EMPTY_IDS, loading: false, error: null };
  }

  if (state?.userId !== userId) {
    return { ids: EMPTY_IDS, loading: true, error: null };
  }

  return { ids: state.ids, loading: state.loading, error: state.error };
}

async function updateFavorite(
  uid: string,
  listingId: string,
  desiredState?: boolean
): Promise<boolean> {
  const previous = writeQueues.get(uid) ?? Promise.resolve();
  const operation = previous.then(async () => {
    const current = await loadFavorites(uid);
    const shouldBeFavorite = desiredState ?? !current.has(listingId);
    const updated = new Set(current);

    if (shouldBeFavorite) updated.add(listingId);
    else updated.delete(listingId);

    await AsyncStorage.setItem(storageKey(uid), JSON.stringify([...updated]));
    publishFavorites(uid, updated);
    return shouldBeFavorite;
  });

  writeQueues.set(uid, operation.then(() => undefined, () => undefined));
  return operation;
}

export function toggleFavorite(uid: string, listingId: string): Promise<boolean> {
  return updateFavorite(uid, listingId);
}

export function removeFavorite(uid: string, listingId: string): Promise<boolean> {
  return updateFavorite(uid, listingId, false);
}
