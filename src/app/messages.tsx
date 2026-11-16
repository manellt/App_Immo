import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AuthRequired from '../components/AuthRequired';
import BottomNav from '../components/BottomNav';
import { useAuth } from '../context/auth';
import { useConversations } from '../services/chat';
import { Conversation, formatWhen, otherName, unreadFor } from '../utils/conversation';

const PRIMARY = '#003B95';
const DARK = '#1A202C';
const GREY = '#718096';

// = InboxScreen mta3 Flutter
export default function MessagesScreen() {
  const { isLoggedIn, user } = useAuth();
  const { conversations, loading, error } = useConversations();

  // ===== Mouch connecté =====
  if (!isLoggedIn || !user) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
          <AuthRequired
            title="Messages"
            heading="Connectez-vous pour voir les messages."
            description="Une fois connecté, vous trouverez vos messages ici."
          />
        </ScrollView>
        <BottomNav active="messages" />
      </SafeAreaView>
    );
  }

  const myUid = user.uid;
  const totalUnread = conversations.reduce((sum, c) => sum + unreadFor(c, myUid), 0);

  const renderTile = ({ item: c }: { item: Conversation }) => {
    const name = otherName(c, myUid);
    const mine = c.lastSenderId === myUid;
    const unread = unreadFor(c, myUid);

    return (
      <TouchableOpacity
        style={styles.tile}
        activeOpacity={0.7}
        onPress={() => router.push(`/chat/${c.id}` as any)}
      >
        {c.listingImage ? (
          <Image source={{ uri: c.listingImage }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarEmpty]}>
            <MaterialIcons name="home-work" size={26} color={PRIMARY} />
          </View>
        )}

        <View style={{ flex: 1 }}>
          <View style={styles.rowTop}>
            <Text style={styles.name} numberOfLines={1}>
              {name}
            </Text>
            <Text
              style={[
                styles.when,
                unread > 0 && { fontWeight: '700', color: PRIMARY },
              ]}
            >
              {formatWhen(c.updatedAtMs)}
            </Text>
          </View>

          <Text style={styles.listingTitle} numberOfLines={1}>
            {c.listingTitle}
          </Text>

          <View style={styles.rowBottom}>
            <Text
              style={[
                styles.lastMessage,
                unread > 0 && { fontWeight: '700', color: DARK },
              ]}
              numberOfLines={1}
            >
              {mine ? 'Vous : ' : ''}
              {c.lastMessage}
            </Text>
            {unread > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{unread > 9 ? '9+' : unread}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ===== Connecté =====
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Messages</Text>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={PRIMARY} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={{ color: GREY, textAlign: 'center', padding: 24 }}>Erreur : {error}</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(c) => c.id}
          renderItem={renderTile}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={conversations.length === 0 ? { flexGrow: 1 } : undefined}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.center}>
              <View style={styles.empty}>
                <Ionicons name="chatbubble-outline" size={64} color={PRIMARY} />
                <Text style={styles.emptyTitle}>Aucun message pour le moment.</Text>
                <Text style={styles.emptyDesc}>
                  Contactez un propriétaire depuis une annonce pour démarrer une conversation.
                </Text>
              </View>
            </View>
          }
        />
      )}

      <BottomNav active="messages" messagesCount={totalUnread} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: DARK,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 8,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  empty: { alignItems: 'center', padding: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: DARK, marginTop: 16, textAlign: 'center' },
  emptyDesc: { color: GREY, textAlign: 'center', marginTop: 8 },

  tile: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14 },
  avatar: { width: 56, height: 56, borderRadius: 28, marginRight: 14, backgroundColor: '#E8EEF8' },
  avatarEmpty: { justifyContent: 'center', alignItems: 'center' },
  rowTop: { flexDirection: 'row', alignItems: 'center' },
  name: { flex: 1, fontSize: 16, fontWeight: '700', color: DARK },
  when: { fontSize: 12, color: GREY, marginLeft: 8 },
  listingTitle: { fontSize: 12, color: PRIMARY, marginTop: 2 },
  rowBottom: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  lastMessage: { flex: 1, fontSize: 14, color: GREY },
  unreadBadge: {
    marginLeft: 8,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    backgroundColor: '#E53935',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  separator: { height: 1, backgroundColor: '#EDF2F7', marginLeft: 90 },
});