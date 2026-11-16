import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
  writeBatch,
  type DocumentData,
  type Unsubscribe,
} from 'firebase/firestore';

import { db } from '../firebaseConfig';

export type Conversation = {
  id: string;
  listingId: string;
  listingTitle: string;
  listingImageUrl: string;
  participants: string[];
  participantNames: Record<string, string>;
  lastMessage: string;
  lastMessageSenderId: string;
  updatedAtMs: number;
};

export type ChatMessage = {
  id: string;
  senderId: string;
  text: string;
  createdAtMs: number;
};

function timestampToMs(value: unknown): number {
  if (
    typeof value === 'object' &&
    value !== null &&
    'toMillis' in value &&
    typeof value.toMillis === 'function'
  ) {
    return value.toMillis();
  }
  return 0;
}

function conversationFromDoc(id: string, data: DocumentData): Conversation {
  const names =
    typeof data.participantNames === 'object' && data.participantNames !== null
      ? (data.participantNames as Record<string, string>)
      : {};

  return {
    id,
    listingId: typeof data.listingId === 'string' ? data.listingId : '',
    listingTitle: typeof data.listingTitle === 'string' ? data.listingTitle : 'Annonce',
    listingImageUrl: typeof data.listingImageUrl === 'string' ? data.listingImageUrl : '',
    participants: Array.isArray(data.participants)
      ? data.participants.filter((id: unknown): id is string => typeof id === 'string')
      : [],
    participantNames: names,
    lastMessage: typeof data.lastMessage === 'string' ? data.lastMessage : '',
    lastMessageSenderId:
      typeof data.lastMessageSenderId === 'string' ? data.lastMessageSenderId : '',
    updatedAtMs: timestampToMs(data.updatedAt),
  };
}

export function watchConversations(
  uid: string,
  onUpdate: (conversations: Conversation[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  const conversationsQuery = query(
    collection(db, 'conversations'),
    where('participants', 'array-contains', uid)
  );

  return onSnapshot(
    conversationsQuery,
    (snapshot) => {
      const conversations = snapshot.docs
        .map((item) => conversationFromDoc(item.id, item.data()))
        .sort((a, b) => b.updatedAtMs - a.updatedAtMs);
      onUpdate(conversations);
    },
    onError
  );
}

export function watchMessages(
  conversationId: string,
  onUpdate: (messages: ChatMessage[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  const messagesQuery = query(
    collection(db, 'conversations', conversationId, 'messages'),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(
    messagesQuery,
    (snapshot) => {
      onUpdate(
        snapshot.docs.map((item) => {
          const data = item.data();
          return {
            id: item.id,
            senderId: typeof data.senderId === 'string' ? data.senderId : '',
            text: typeof data.text === 'string' ? data.text : '',
            createdAtMs: timestampToMs(data.createdAt),
          };
        })
      );
    },
    onError
  );
}

export async function getOrCreateConversation({
  userId,
  userName,
  recipientId,
  recipientName,
  listingId,
  listingTitle,
  listingImageUrl,
}: {
  userId: string;
  userName: string;
  recipientId: string;
  recipientName: string;
  listingId: string;
  listingTitle: string;
  listingImageUrl: string;
}): Promise<string> {
  if (!userId || !recipientId || userId === recipientId || !listingId) {
    throw new Error('Cette conversation ne peut pas être ouverte.');
  }

  const existing = await getDocs(
    query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', userId)
    )
  );
  const match = existing.docs.find((item) => {
    const data = item.data();
    return (
      data.listingId === listingId &&
      Array.isArray(data.participants) &&
      data.participants.includes(recipientId)
    );
  });

  if (match) return match.id;

  const conversation = await addDoc(collection(db, 'conversations'), {
    listingId,
    listingTitle,
    listingImageUrl,
    participants: [userId, recipientId],
    participantNames: {
      [userId]: userName,
      [recipientId]: recipientName,
    },
    lastMessage: '',
    lastMessageSenderId: '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return conversation.id;
}

export async function sendChatMessage(
  conversationId: string,
  senderId: string,
  text: string
): Promise<void> {
  const cleanText = text.trim();
  if (!cleanText) return;
  if (cleanText.length > 2000) {
    throw new Error('Le message ne peut pas dépasser 2 000 caractères.');
  }

  const batch = writeBatch(db);
  const conversationRef = doc(db, 'conversations', conversationId);
  const messageRef = doc(collection(conversationRef, 'messages'));

  batch.set(messageRef, {
    senderId,
    text: cleanText,
    createdAt: serverTimestamp(),
  });
  batch.update(conversationRef, {
    lastMessage: cleanText,
    lastMessageSenderId: senderId,
    updatedAt: serverTimestamp(),
  });

  await batch.commit();
}
