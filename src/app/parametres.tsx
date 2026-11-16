import { Ionicons } from '@expo/vector-icons';
import { sendPasswordResetEmail, updateProfile } from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AuthRequired from '../components/AuthRequired';
import ScreenHeader from '../components/ScreenHeader';
import { useAuth } from '../context/auth';
import { auth, db } from '../firebaseConfig';

const PRIMARY = '#003B95';
const DARK = '#1A202C';
const GREY = '#718096';

type Profile = { name?: string; phone?: string };
type Field = 'name' | 'phone';

function Row({
  icon,
  label,
  value,
  onPress,
  last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  last?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.row, !last && styles.rowBorder]}
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
      disabled={!onPress}
    >
      <Ionicons name={icon} size={22} color={PRIMARY} />
      <View style={{ flex: 1, marginLeft: 14 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {!!value && (
          <Text style={styles.rowValue} numberOfLines={1}>
            {value}
          </Text>
        )}
      </View>
      {onPress && <Ionicons name="chevron-forward" size={18} color={GREY} />}
    </TouchableOpacity>
  );
}

export default function ParametresScreen() {
  const { isLoggedIn, user, userName } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState<Field | null>(null);
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProfile(null);
      return;
    }
    const unsub = onSnapshot(
      doc(db, 'profiles', user.uid),
      (snap) => setProfile((snap.data() as Profile) ?? null),
      () => {}
    );
    return unsub;
  }, [user]);

  const displayName = profile?.name?.trim() || userName;

  const openEdit = (field: Field) => {
    setValue(field === 'name' ? displayName : profile?.phone ?? '');
    setError(null);
    setEditing(field);
  };

  const save = async () => {
    if (!user || !editing) return;
    const v = value.trim();

    if (editing === 'name' && v.length < 2) {
      setError('Entrez votre nom');
      return;
    }
    if (editing === 'phone' && v && !/^[0-9+\s]{8,15}$/.test(v)) {
      setError('Numéro de téléphone invalide');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (editing === 'name') {
        await updateProfile(user, { displayName: v });
        await setDoc(
          doc(db, 'profiles', user.uid),
          { name: v, email: user.email ?? '' },
          { merge: true }
        );
        refreshUser(); // bech el esm yetbaddel fel accueil zeda
      } else {
        await setDoc(
          doc(db, 'profiles', user.uid),
          { phone: v, email: user.email ?? '' },
          { merge: true }
        );
      }
      setEditing(null);
    } catch {
      setError("Impossible d'enregistrer. Réessayez.");
    } finally {
      setSaving(false);
    }
  };

  const changePassword = () => {
    if (!user?.email) return;
    Alert.alert(
      'Changer le mot de passe',
      `Nous allons envoyer un lien de réinitialisation à ${user.email}.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Envoyer',
          onPress: async () => {
            try {
              auth.languageCode = 'fr';
              await sendPasswordResetEmail(auth, user.email!);
              Alert.alert('Email envoyé', 'Vérifiez votre boîte mail (et vos spams).');
            } catch {
              Alert.alert('Erreur', "Impossible d'envoyer l'email. Réessayez.");
            }
          },
        },
      ]
    );
  };

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader title="Paramètres" />
        <AuthRequired
          title="Paramètres"
          heading="Connectez-vous pour gérer votre compte."
          description="Modifiez votre nom, votre téléphone et votre mot de passe une fois connecté."
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Paramètres" />

      <ScrollView contentContainerStyle={{ padding: 24 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.section}>Informations personnelles</Text>
        <View style={styles.group}>
          <Row icon="person-outline" label="Nom complet" value={displayName} onPress={() => openEdit('name')} />
          <Row
            icon="call-outline"
            label="Téléphone"
            value={profile?.phone || 'Ajouter un numéro'}
            onPress={() => openEdit('phone')}
          />
          <Row icon="mail-outline" label="Email" value={user?.email ?? ''} last />
        </View>

        <Text style={styles.section}>Sécurité</Text>
        <View style={styles.group}>
          <Row
            icon="lock-closed-outline"
            label="Changer le mot de passe"
            onPress={changePassword}
            last
          />
        </View>

        <Text style={styles.section}>À propos</Text>
        <View style={styles.group}>
          <Row icon="information-circle-outline" label="Version" value="1.0.0" last />
        </View>
      </ScrollView>

      {/* Modal de modification */}
      <Modal
        visible={editing !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditing(null)}
      >
        <KeyboardAvoidingView
          style={styles.backdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {editing === 'name' ? 'Modifier le nom' : 'Modifier le téléphone'}
            </Text>
            <View style={styles.inputBox}>
              <TextInput
                style={styles.input}
                value={value}
                onChangeText={setValue}
                autoFocus
                placeholder={editing === 'name' ? 'Nom complet' : '+216 20 123 456'}
                placeholderTextColor="#A0AEC0"
                keyboardType={editing === 'phone' ? 'phone-pad' : 'default'}
                autoCapitalize={editing === 'name' ? 'words' : 'none'}
              />
            </View>
            {!!error && <Text style={styles.error}>{error}</Text>}

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setEditing(null)} disabled={saving}>
                <Text style={styles.modalCancel}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={save} disabled={saving}>
                {saving ? (
                  <ActivityIndicator color={PRIMARY} />
                ) : (
                  <Text style={styles.modalSave}>Enregistrer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  section: {
    fontSize: 13,
    fontWeight: '700',
    color: GREY,
    textTransform: 'uppercase',
    marginTop: 8,
    marginBottom: 8,
    letterSpacing: 0.4,
  },
  group: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#EDF2F7' },
  rowLabel: { fontSize: 15, fontWeight: '600', color: DARK },
  rowValue: { fontSize: 13, color: GREY, marginTop: 2 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: DARK, marginBottom: 14 },
  inputBox: {
    backgroundColor: '#F7FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    justifyContent: 'center',
  },
  input: { fontSize: 15, color: '#2D3748' },
  error: { color: '#E53E3E', fontSize: 13, marginTop: 8 },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 24,
    marginTop: 18,
  },
  modalCancel: { fontSize: 15, fontWeight: '600', color: GREY },
  modalSave: { fontSize: 15, fontWeight: '700', color: PRIMARY },
});

function refreshUser() {
    throw new Error('Function not implemented.');
}
