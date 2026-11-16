import {
    addDoc,
    collection,
    doc,
    getDocs,
    increment,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
    where,
    writeBatch,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { useAuth } from '../context/auth';
import { db } from '../firebaseConfig';
import {
    Conversation,
    conversationFromDoc,
    Message,
    messageFromDoc,
    otherId,
    unreadFor,
} from '../utils/conversation';
import type { Listing } from '../utils/listing';

// = conversationsProvider: conversations mta3 el user, live
export function useConversations(enabled = true) {
  const { user } = useAuth();
  const uid = user?.uid;
  const [state, setState] = useState<{
    uid: string;
    conversations: Conversation[];
    error: string | null;
  } | null>(null);

  useEffect(() => {
    if (!enabled || !uid) return;

    const q = query(collection(db, 'conversations'), where('participants', 'array-contains', uid));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => conversationFromDoc(d));
        list.sort((a, b) => (b.updatedAtMs ?? Date.now()) - (a.updatedAtMs ?? Date.now()));
        setState({ uid, conversations: list, error: null });
      },
      (err) => {
        console.log('CONVERSATIONS ERROR', err?.code, err?.message);
        setState({
          uid,
          conversations: [],
          error: err?.message ?? 'Erreur',
        });
      }
    );
    return unsub;
  }, [uid, enabled]);

  if (!enabled || !uid) {
    return { conversations: [], loading: false, error: null };
  }

  if (state?.uid !== uid) {
    return { conversations: [], loading: true, error: null };
  }

  return { ...state, loading: false };
}

// Total des messages ghir mqrayin (lel badge 3la "Messages" fel bottom bar)
export function useUnreadTotal(enabled = true): number {
  const { user } = useAuth();
  const { conversations } = useConversations(enabled);
  if (!user) return 0;
  return conversations.reduce((sum, c) => sum + unreadFor(c, user.uid), 0);
}

// Conversation wa7da (lel page chat)
export function useConversation(id?: string) {
  const [state, setState] = useState<{
    id: string;
    conversation: Conversation | null;
    error: string | null;
  } | null>(null);

  useEffect(() => {
    if (!id) return;

    const unsub = onSnapshot(
      doc(db, 'conversations', id),
      (snap) => {
        setState({
          id,
          conversation: snap.exists() ? conversationFromDoc(snap) : null,
          error: null,
        });
      },
      (error) => {
        console.log('CONVERSATION ERROR', error?.code, error?.message);
        setState({
          id,
          conversation: null,
          error: error?.message ?? 'Erreur',
        });
      }
    );
    return unsub;
  }, [id]);

  if (!id) return { conversation: null, loading: false, error: null };
  if (state?.id !== id) return { conversation: null, loading: true, error: null };
  return { ...state, loading: false };
}

// Messages mta3 conversation (conversations/{id}/messages), live
export function useMessages(id?: string) {
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (!id) return;
    const q = query(collection(db, 'conversations', id, 'messages'), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(
      q,
      (snap) => setMessages(snap.docs.map((d) => messageFromDoc(d))),
      (err) => console.log('MESSAGES ERROR', err?.code, err?.message)
    );
    return unsub;
  }, [id]);

  return messages;
}

export async function sendMessage(conv: Conversation, myUid: string, text: string) {
  const clean = text.trim();
  if (!clean) return;

  const other = otherId(conv, myUid);
  const batch = writeBatch(db);

  batch.set(doc(collection(db, 'conversations', conv.id, 'messages')), {
    senderId: myUid,
    text: clean,
    createdAt: serverTimestamp(),
  });

  const update: Record<string, unknown> = {
    lastMessage: clean,
    lastSenderId: myUid,
    updatedAt: serverTimestamp(),
  };
  if (other) update[`unread.${other}`] = increment(1);
  batch.update(doc(db, 'conversations', conv.id), update);

  await batch.commit();
}

export async function markAsRead(convId: string, myUid: string) {
  try {
    await updateDoc(doc(db, 'conversations', convId), { [`unread.${myUid}`]: 0 });
  } catch (error) {
    console.log('MARK AS READ ERROR', error);
  }
}

// Bech tebda conversation m3a sa7eb annonce (testa3mlou fel page détail ba3d: bouton "Contacter")
export async function startConversation(
  listing: Listing,
  me: { uid: string; name: string }
): Promise<string> {
  if (!listing.ownerId) throw new Error('Annonce sans propriétaire');
  if (listing.ownerId === me.uid) throw new Error('own-listing');

  try {
    const existing = await getDocs(
      query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', me.uid)
      )
    );
    const match = existing.docs.find((conversation) => {
      const data = conversation.data();
      return (
        data.listingId === listing.id &&
        Array.isArray(data.participants) &&
        data.participants.includes(listing.ownerId)
      );
    });
    if (match) return match.id;
  } catch (error) {
    const code =
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      typeof error.code === 'string'
        ? error.code
        : '';
    if (code !== 'permission-denied') throw error;
  }

  const conversation = await addDoc(collection(db, 'conversations'), {
    participants: [me.uid, listing.ownerId],
    names: { [me.uid]: me.name, [listing.ownerId]: listing.ownerName || 'Propriétaire' },
    listingId: listing.id,
    listingTitle: listing.title,
    listingImage: listing.imageUrls[0] ?? '',
    lastMessage: '',
    lastSenderId: '',
    unread: { [me.uid]: 0, [listing.ownerId]: 0 },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return conversation.id;
}