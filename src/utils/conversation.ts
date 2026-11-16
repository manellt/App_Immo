import type { DocumentData } from 'firebase/firestore';

// ⚠️ Hedha el schema elli khmemt fih (collection "conversations").
// Ken Flutter (chat_data.dart) yestعmel esmé champs o5rin, badlhom fi blasa wa7da: fi conversationFromDoc.
export type Conversation = {
  id: string;
  participants: string[]; // [uidA, uidB]
  names: Record<string, string>; // { uid: esm }
  listingId: string;
  listingTitle: string;
  listingImage: string;
  lastMessage: string;
  lastSenderId: string;
  unread: Record<string, number>; // { uid: 3adad el messages ghir mqrayin }
  updatedAtMs: number | null;
};

export type Message = {
  id: string;
  senderId: string;
  text: string;
  createdAtMs: number | null;
};

const str = (v: unknown) => (typeof v === 'string' ? v : '');

function strMap(v: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      if (typeof val === 'string') out[k] = val;
    }
  }
  return out;
}

function numMap(v: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      if (typeof val === 'number') out[k] = val;
    }
  }
  return out;
}

type DocLike = {
  id: string;
  data: (options?: { serverTimestamps?: 'estimate' | 'previous' | 'none' }) => DocumentData | undefined;
};

export function conversationFromDoc(doc: DocLike): Conversation {
  const d = doc.data({ serverTimestamps: 'estimate' }) ?? {};
  const participants = d.participants ?? d.members ?? d.users;
  return {
    id: doc.id,
    participants: Array.isArray(participants) ? participants.filter((p: unknown) => typeof p === 'string') : [],
    names: strMap(d.names ?? d.participantNames ?? d.userNames),
    listingId: str(d.listingId),
    listingTitle: str(d.listingTitle),
    listingImage: str(d.listingImage ?? d.listingImageUrl),
    lastMessage: str(d.lastMessage),
    lastSenderId: str(d.lastSenderId),
    unread: numMap(d.unread ?? d.unreadCounts),
    updatedAtMs: d.updatedAt?.toMillis ? d.updatedAt.toMillis() : null,
  };
}

export function messageFromDoc(doc: DocLike): Message {
  const d = doc.data({ serverTimestamps: 'estimate' }) ?? {};
  return {
    id: doc.id,
    senderId: str(d.senderId),
    text: str(d.text),
    createdAtMs: d.createdAt?.toMillis ? d.createdAt.toMillis() : null,
  };
}

// = Conversation.otherName(myUid) / unreadFor(myUid) mta3 Flutter
export const otherId = (c: Conversation, myUid: string) =>
  c.participants.find((p) => p !== myUid) ?? '';

export const otherName = (c: Conversation, myUid: string) =>
  c.names[otherId(c, myUid)] || 'Utilisateur';

export const unreadFor = (c: Conversation, myUid: string) => c.unread[myUid] ?? 0;

const pad = (n: number) => n.toString().padStart(2, '0');

// Lyoum: "14:05", sinon "13/11"
export function formatWhen(ms: number | null): string {
  const t = new Date(ms ?? Date.now());
  const now = new Date();
  const sameDay =
    t.getFullYear() === now.getFullYear() &&
    t.getMonth() === now.getMonth() &&
    t.getDate() === now.getDate();
  return sameDay ? `${pad(t.getHours())}:${pad(t.getMinutes())}` : `${pad(t.getDate())}/${pad(t.getMonth() + 1)}`;
}