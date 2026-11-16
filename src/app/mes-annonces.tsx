
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import React, { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import AuthRequired from '../components/AuthRequired';
import ListingCard from '../components/ListingCard';
import ScreenHeader from '../components/ScreenHeader';
import { useAuth } from '../context/auth';
import { db } from '../firebaseConfig';
import {
  byDateDesc,
  Listing,
  listingFromDoc,
} from '../utils/listing';

const PRIMARY = '#003B95';
const DARK = '#1A202C';
const GREY = '#718096';

export default function MesAnnoncesScreen() {
  const { isLoggedIn, user } = useAuth();

  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    // Vérifier utilisateur connecté
    /* eslint-disable react-hooks/set-state-in-effect */
    if (!user?.uid) {
      setItems([]);
      setLoading(false);
      setFailed(false);
      return;
    }
    /* eslint-enable react-hooks/set-state-in-effect */

    setLoading(true);
    setFailed(false);

    console.log('MES ANNONCES UID:', user.uid);

    // Récupérer les annonces du propriétaire connecté
    const q = query(
      collection(db, 'listings'),
      where('ownerId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      q,

    (snapshot) => {
  console.log('SNAPSHOT SIZE:', snapshot.size);
  console.log('CURRENT UID:', user.uid);

  try {
    const myListings = snapshot.docs.map((document) => {
      console.log('DOC ID:', document.id);
      console.log('DOC OWNER:', document.data().ownerId);

      return listingFromDoc(document);
    });

    setItems(myListings.sort(byDateDesc));
    setLoading(false);
    setFailed(false);
  } catch (e: any) {
    console.log('LISTING PARSE ERROR:', e);
    setFailed(true);
    setLoading(false);
  }
},
      (error) => {
        console.log(
          'MES ANNONCES FIRESTORE ERROR:',
          error.code,
          error.message
        );

        setFailed(true);
        setItems([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();

  }, [user?.uid]);

  // Supprimer une annonce
  const confirmDelete = (item: Listing) => {
    Alert.alert(
      'Supprimer',
      'Voulez-vous supprimer cette annonce ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Supprimer',
          style: 'destructive',

          onPress: async () => {
            try {
              if (!user?.uid) {
                throw new Error('Utilisateur non connecté');
              }

              await deleteDoc(
                doc(db, 'listings', item.id)
              );

              Alert.alert(
                'Succès',
                'Annonce supprimée avec succès.'
              );

            } catch (error: any) {
              console.log(
                'DELETE LISTING ERROR:',
                error.code,
                error.message
              );

              Alert.alert(
                'Erreur',
                "Impossible de supprimer l'annonce. Vérifiez vos permissions."
              );
            }
          },
        },
      ]
    );
  };

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader title="Mes annonces" />

        <AuthRequired
          title="Mes annonces"
          heading="Connectez-vous pour voir vos annonces."
          description="Retrouvez ici toutes les annonces que vous avez publiées."
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Mes annonces" />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator
            color={PRIMARY}
            size="large"
          />

          <Text style={styles.loadingText}>
            Chargement de vos annonces...
          </Text>
        </View>
      ) : failed ? (
        <View style={styles.empty}>
          <Ionicons
            name="alert-circle-outline"
            size={56}
            color="#E53E3E"
          />

          <Text style={styles.emptyTitle}>
            Impossible de charger vos annonces
          </Text>

          <Text style={styles.emptyDesc}>
            Vérifiez votre connexion et les permissions Firestore.
          </Text>

          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              setFailed(false);
              setLoading(true);
              router.replace('/mes-annonces');
            }}
          >
            <Text style={styles.buttonText}>
              Réessayer
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}

          renderItem={({ item }) => (
        <ListingCard
  listing={item}
  onPress={() => router.push(`/listing/${item.id}` as any)}
  onDelete={() => confirmDelete(item)}
/>
          )}

          contentContainerStyle={
            items.length === 0
              ? styles.emptyWrap
              : styles.list
          }

          showsVerticalScrollIndicator={false}

          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons
                name="business-outline"
                size={56}
                color="#CBD5E0"
              />

              <Text style={styles.emptyTitle}>
                Aucune annonce publiée
              </Text>

              <Text style={styles.emptyDesc}>
                Publiez gratuitement votre propriété et recevez des offres rapidement.
              </Text>

              <TouchableOpacity
                style={styles.button}
                onPress={() =>
                  router.push('/ajouter-annonce')
                }
                activeOpacity={0.85}
              >
                <Text style={styles.buttonText}>
                  Publier une annonce
                </Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8FC',
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 12,
    color: GREY,
    fontSize: 14,
  },

  list: {
    padding: 20,
  },

  emptyWrap: {
    flexGrow: 1,
    justifyContent: 'center',
  },

  empty: {
    alignItems: 'center',
    paddingHorizontal: 32,
    justifyContent: 'center',
    flex: 1,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: DARK,
    marginTop: 16,
    textAlign: 'center',
  },

  emptyDesc: {
    fontSize: 14,
    color: GREY,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 24,
  },

  button: {
    backgroundColor: PRIMARY,
    height: 48,
    borderRadius: 14,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
