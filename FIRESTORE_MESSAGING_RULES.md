# Firestore messaging rules

Merge these rules into the project's existing `firestore.rules`, then deploy them
to the Firebase project used by the app. Updating this file alone does not change
the rules already deployed in Firebase.

The rules match the conversation fields used by `src/services/chat.ts`. They
allow participants to list/read their conversations, create a conversation with
the owner of a listing, send messages, and update unread counts.

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() {
      return request.auth != null;
    }

    function isParticipant(data) {
      return signedIn() && request.auth.uid in data.participants;
    }

    function otherParticipant(data) {
      return data.participants[0] == request.auth.uid
        ? data.participants[1]
        : data.participants[0];
    }

    match /conversations/{conversationId} {
      allow read: if isParticipant(resource.data);

      allow create: if signedIn()
        && request.auth.uid in request.resource.data.participants
        && request.resource.data.participants is list
        && request.resource.data.participants.size() == 2
        && request.resource.data.participants[0] != request.resource.data.participants[1]
        && request.resource.data.listingId is string
        && request.resource.data.listingId.size() > 0
        && get(/databases/$(database)/documents/listings/$(request.resource.data.listingId)).data.ownerId
          in request.resource.data.participants
        && request.resource.data.names is map
        && request.resource.data.names.keys().hasAll(request.resource.data.participants)
        && request.resource.data.listingTitle is string
        && request.resource.data.listingImage is string
        && request.resource.data.lastMessage == ''
        && request.resource.data.lastSenderId == ''
        && request.resource.data.unread is map
        && request.resource.data.unread.keys().hasAll(request.resource.data.participants)
        && request.resource.data.unread.keys().hasOnly(request.resource.data.participants)
        && request.resource.data.unread[request.resource.data.participants[0]] == 0
        && request.resource.data.unread[request.resource.data.participants[1]] == 0
        && request.resource.data.createdAt == request.time
        && request.resource.data.updatedAt == request.time;

      allow update: if isParticipant(resource.data)
        && request.resource.data.participants == resource.data.participants
        && request.resource.data.diff(resource.data).affectedKeys()
          .hasOnly(['lastMessage', 'lastSenderId', 'updatedAt', 'unread'])
        && request.resource.data.lastMessage is string
        && request.resource.data.lastMessage.size() <= 2000
        && request.resource.data.updatedAt == request.time
        && request.resource.data.unread is map
        && request.resource.data.unread.keys().hasAll(resource.data.participants)
        && request.resource.data.unread.keys().hasOnly(resource.data.participants)
        && (
          (
            request.resource.data.lastSenderId == request.auth.uid
            && request.resource.data.lastMessage.size() > 0
            && request.resource.data.unread[request.auth.uid] == resource.data.unread[request.auth.uid]
            && request.resource.data.unread[otherParticipant(resource.data)]
              == resource.data.unread[otherParticipant(resource.data)] + 1
          )
          ||
          (
            request.resource.data.lastMessage == resource.data.lastMessage
            && request.resource.data.lastSenderId == resource.data.lastSenderId
            && request.resource.data.unread[request.auth.uid] == 0
            && request.resource.data.unread[otherParticipant(resource.data)]
              == resource.data.unread[otherParticipant(resource.data)]
          )
        );

      match /messages/{messageId} {
        allow read: if isParticipant(
          get(/databases/$(database)/documents/conversations/$(conversationId)).data
        );

        allow create: if isParticipant(
            get(/databases/$(database)/documents/conversations/$(conversationId)).data
          )
          && request.resource.data.senderId == request.auth.uid
          && request.resource.data.text is string
          && request.resource.data.text.size() > 0
          && request.resource.data.text.size() <= 2000
          && request.resource.data.createdAt == request.time;
      }
    }
  }
}
```
