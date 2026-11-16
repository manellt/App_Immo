import { Ionicons } from '@expo/vector-icons';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import {
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { db } from '../firebaseConfig';

const PRIMARY = '#003B95';
const DARK = '#1A202C';
const GREY = '#718096';
const RED = '#E53E3E';

type Profile = {
  name?: string;
  phone?: string;
  avatarUrl?: string;
  avatarBase64?: string;
};

// ================= MENU ITEM =================

function MenuItem({
  icon,
  label,
  onPress,
  last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.menuItem, !last && styles.menuItemBorder]}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <Ionicons name={icon} size={22} color={PRIMARY} />

      <Text style={styles.menuText}>{label}</Text>

      <Ionicons name="chevron-forward" size={18} color={GREY} />
    </TouchableOpacity>
  );
}

// ================= PROFIL SCREEN =================

export default function ProfilScreen() {
  const { isLoggedIn, user, userName, logout } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [uploading, setUploading] = useState(false);

  // Récupérer le profil depuis Firestore
  useEffect(() => {
    if (!user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProfile(null);
      return;
    }

    const unsub = onSnapshot(
      doc(db, 'profiles', user.uid),
      (snap) => {
        setProfile((snap.data() as Profile) ?? null);
      },
      (error) => {
        console.log('Erreur profil:', error);
      }
    );

    return unsub;
  }, [user]);

  const displayName = profile?.name?.trim() || userName;

  const avatarUri = profile?.avatarBase64
    ? `data:image/jpeg;base64,${profile.avatarBase64}`
    : profile?.avatarUrl || user?.photoURL || null;

  // ================= CHANGER PHOTO =================

  const pickAvatar = async () => {
    if (!user || uploading) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (result.canceled) return;

      setUploading(true);

      const ctx = ImageManipulator.manipulate(
        result.assets[0].uri
      );

      ctx.resize({ width: 256 });

      const rendered = await ctx.renderAsync();

      const saved = await rendered.saveAsync({
        format: SaveFormat.JPEG,
        compress: 0.6,
        base64: true,
      });

      if (!saved.base64) {
        throw new Error('Image vide');
      }

      await setDoc(
        doc(db, 'profiles', user.uid),
        {
          name: profile?.name ?? displayName,
          email: user.email ?? '',
          avatarBase64: saved.base64,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      Alert.alert('Succès', 'Photo de profil modifiée !');

    } catch (error) {
      console.log(error);
      Alert.alert(
        'Erreur',
        'Impossible de changer la photo. Réessayez.'
      );
    } finally {
      setUploading(false);
    }
  };

  // ================= NAVIGATION =================

  const onPublish = () => {
    if (isLoggedIn) {
      router.push('../ajouter-annonce');
    } else {
      router.push('/login');
    }
  };

  // ================= DECONNEXION =================

  const onLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vraiment vous déconnecter ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Se déconnecter',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              router.replace('/login');
            } catch (error) {
              console.log('Erreur déconnexion:', error);
              Alert.alert(
                'Erreur',
                'Impossible de se déconnecter.'
              );
            }
          },
        },
      ]
    );
  };

  // ================= PUBLISH CARD =================

  const publishCard = (
    <TouchableOpacity
      style={styles.publishCard}
      activeOpacity={0.85}
      onPress={onPublish}
    >
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={styles.publishTitle}>
          Publier votre propriété
        </Text>

        <Text style={styles.publishDesc}>
          Publiez gratuitement et recevez des offres rapidement.
        </Text>
      </View>

      <Ionicons name="business" size={44} color={PRIMARY} />
    </TouchableOpacity>
  );

  // ================= RENDER =================

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {!isLoggedIn ? (
          <AuthRequired
            title="Profil"
            description="Commencez votre recherche du logement parfait en vous connectant ou en créant un compte dès maintenant !"
            showRegister
          >
            <View style={{ marginTop: 24 }}>
              {publishCard}
            </View>
          </AuthRequired>
        ) : (
          <View style={styles.wrap}>

            {/* Avatar */}
            <View style={styles.avatarWrap}>
              <TouchableOpacity
                onPress={pickAvatar}
                activeOpacity={0.85}
              >
                {avatarUri ? (
                  <Image
                    source={{ uri: avatarUri }}
                    style={styles.avatar}
                  />
                ) : (
                  <View
                    style={[
                      styles.avatar,
                      styles.avatarFallback,
                    ]}
                  >
                    <Text style={styles.avatarLetter}>
                      {displayName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}

                {uploading && (
                  <View style={styles.avatarLoading}>
                    <ActivityIndicator color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.editBadge}
                onPress={pickAvatar}
                activeOpacity={0.85}
                hitSlop={8}
              >
                <Ionicons
                  name="pencil"
                  size={14}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            </View>

            {/* Informations utilisateur */}
            <Text style={styles.name}>
              {displayName}
            </Text>

            <Text style={styles.info}>
              {user?.email}
            </Text>

            {!!profile?.phone && (
              <Text style={styles.info}>
                {profile.phone}
              </Text>
            )}

            {/* Menu */}
          
<View style={styles.menu}>
  <MenuItem
    icon="business-outline"
    label="Mes annonces"
    onPress={() => router.push('/mes-annonces')}
  />
  <MenuItem
    icon="settings-outline"
    label="Paramètres"
    onPress={() => router.push('/parametres')}
    last
  />
</View>

            {/* Déconnexion */}
            <TouchableOpacity
              style={styles.logoutRow}
              activeOpacity={0.7}
              onPress={onLogout}
            >
              <Ionicons
                name="log-out-outline"
                size={22}
                color={RED}
              />

              <Text style={styles.logoutText}>
                Déconnexion
              </Text>
            </TouchableOpacity>

          </View>
        )}
      </ScrollView>

      <BottomNav active="profil" />
    </SafeAreaView>
  );
}

// ================= STYLES =================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  wrap: {
    paddingHorizontal: 24,
    paddingTop: 40,
    alignItems: 'center',
  },

  avatarWrap: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },

  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#EDF2F7',
  },

  avatarFallback: {
    backgroundColor: PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },

  avatarLetter: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: '700',
  },

  avatarLoading: {
    ...StyleSheet.absoluteFill,
    borderRadius: 50,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  editBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: PRIMARY,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  name: {
    fontSize: 22,
    fontWeight: '700',
    color: PRIMARY,
    marginBottom: 4,
  },

  info: {
    fontSize: 13,
    color: GREY,
    marginTop: 2,
  },

  menu: {
    alignSelf: 'stretch',
    marginTop: 32,
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },

  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
  },

  menuText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: DARK,
    marginLeft: 14,
  },

  logoutRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 40,
    paddingVertical: 12,
  },

  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: RED,
    marginLeft: 14,
  },

  publishCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    padding: 18,
    backgroundColor: '#FFFFFF',
  },

  publishTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: DARK,
    marginBottom: 6,
  },

  publishDesc: {
    fontSize: 14,
    lineHeight: 20,
    color: GREY,
  },
});
