import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AuthRequired from '../../components/AuthRequired';
import { useAuth } from '../../context/auth';
import { markAsRead, sendMessage, useConversation, useMessages } from '../../services/chat';
import { formatWhen, Message, otherName, unreadFor } from '../../utils/conversation';

const PRIMARY = '#003B95';
const DARK = '#1A202C';
const GREY = '#718096';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isLoggedIn, user } = useAuth();
  const { conversation, loading, error } = useConversation(id);
  const messages = useMessages(id);

  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const myUid = user?.uid ?? '';
  const unreadMine = conversation && user ? unreadFor(conversation, myUid) : 0;

  // Ki yeft7 el chat (wala yjih message jdid) nwallou el messages "mqrayin"
  useEffect(() => {
    if (unreadMine > 0 && user && id) markAsRead(id, user.uid);
  }, [unreadMine, id, user]);

  // FlatList inverted: el a5er message ta7t
  const data = useMemo(() => [...messages].reverse(), [messages]);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/messages');
  };

  const onSend = async () => {
    if (!conversation || !user || sending) return;
    const value = text.trim();
    if (!value) return;
    setText('');
    setSending(true);
    try {
      await sendMessage(conversation, user.uid, value);
    } catch {
      setText(value);
      Alert.alert('Erreur', "Impossible d'envoyer le message. Vérifiez votre connexion.");
    } finally {
      setSending(false);
    }
  };

  if (!isLoggedIn || !user) {
    return (
      <SafeAreaView style={styles.container}>
        <AuthRequired
          title="Messages"
          heading="Connectez-vous pour voir les messages."
          description="Une fois connecté, vous trouverez vos messages ici."
        />
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator color={PRIMARY} />
      </SafeAreaView>
    );
  }

  if (!conversation) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} hitSlop={10}>
            <Ionicons name="arrow-back" size={24} color={DARK} />
          </TouchableOpacity>
        </View>
        <View style={styles.center}>
          <Text style={{ color: GREY, textAlign: 'center', paddingHorizontal: 24 }}>
            {error
              ? `Impossible de charger la conversation : ${error}`
              : 'Conversation introuvable.'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const name = otherName(conversation, myUid);

  const renderMessage = ({ item }: { item: Message }) => {
    const mine = item.senderId === myUid;
    return (
      <View style={[styles.bubbleRow, mine ? styles.rowMine : styles.rowTheirs]}>
        <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
          <Text style={[styles.bubbleText, mine && { color: '#FFFFFF' }]}>{item.text}</Text>
          <Text style={[styles.time, mine && { color: 'rgba(255,255,255,0.7)' }]}>
            {formatWhen(item.createdAtMs)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} hitSlop={10} style={{ marginRight: 10 }}>
          <Ionicons name="arrow-back" size={24} color={DARK} />
        </TouchableOpacity>

        {conversation.listingImage ? (
          <Image source={{ uri: conversation.listingImage }} style={styles.headerAvatar} />
        ) : (
          <View style={[styles.headerAvatar, styles.center]}>
            <MaterialIcons name="home-work" size={20} color={PRIMARY} />
          </View>
        )}

        <View style={{ flex: 1 }}>
          <Text style={styles.headerName} numberOfLines={1}>
            {name}
          </Text>
          {!!conversation.listingTitle && (
            <Text style={styles.headerListing} numberOfLines={1}>
              {conversation.listingTitle}
            </Text>
          )}
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={{ flex: 1 }}>
          <FlatList
            data={data}
            inverted
            keyExtractor={(m) => m.id}
            renderItem={renderMessage}
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />

          {messages.length === 0 && (
            <View style={styles.emptyChat} pointerEvents="none">
              <Text style={{ color: GREY }}>Écrivez votre premier message.</Text>
            </View>
          )}
        </View>

        {/* Zone de saisie */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Votre message..."
            placeholderTextColor="#9AA3B2"
            value={text}
            onChangeText={setText}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, !text.trim() && { opacity: 0.5 }]}
            activeOpacity={0.85}
            onPress={onSend}
            disabled={!text.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Ionicons name="send" size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F8FC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#E8EEF8',
  },
  headerName: { fontSize: 16, fontWeight: '700', color: DARK },
  headerListing: { fontSize: 12, color: PRIMARY, marginTop: 1 },

  bubbleRow: { flexDirection: 'row', marginVertical: 3 },
  rowMine: { justifyContent: 'flex-end' },
  rowTheirs: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '78%', paddingHorizontal: 14, paddingTop: 9, paddingBottom: 6, borderRadius: 18 },
  bubbleMine: { backgroundColor: PRIMARY, borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: '#FFFFFF', borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 15, color: DARK },
  time: { fontSize: 10, color: GREY, alignSelf: 'flex-end', marginTop: 3 },

  emptyChat: { ...StyleSheet.absoluteFill, justifyContent: 'center', alignItems: 'center' },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EDF2F7',
  },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 44,
    backgroundColor: '#F5F7FB',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 15,
    color: DARK,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});