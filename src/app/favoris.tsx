import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AuthRequired from '../components/AuthRequired';
import BottomNav from '../components/BottomNav';
import ListingCard from '../components/ListingCard';
import { useAuth } from '../context/auth';
import { removeFavorite, useFavoriteIds } from '../services/favorites';
import { useListings } from '../services/listings';
import type { Listing } from '../utils/listing';
import { showToast } from '../utils/toast';

const PRIMARY = '#003B95';
const DARK = '#1A202C';
const GREY = '#718096';

export default function FavorisScreen() {
  const { isLoggedIn, user } = useAuth();
  const { listings, loading: listingsLoading } = useListings();
  const { ids: favoriteIds, loading: favoritesLoading, error: favoritesError } =
    useFavoriteIds();
  const loading = listingsLoading || favoritesLoading;

  // Les annonces elli 3malt 3lihom ❤️
  const items = useMemo(
    () => listings.filter((l) => favoriteIds.has(l.id)),
    [listings, favoriteIds]
  );

  const remove = async (l: Listing) => {
    if (!user) return;
    try {
      await removeFavorite(user.uid, l.id);
      showToast('Retiré des favoris.');
    } catch {
      showToast('Action impossible. Vérifiez votre connexion.');
    }
  };

  // ===== Mouch connecté =====
  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
          <AuthRequired
            title="Favoris"
            heading="Connectez-vous pour voir vos listes de souhaits."
            description="Vous pouvez créer ou modifier des listes de souhaits une fois que vous êtes connecté."
          />
        </ScrollView>
        <BottomNav active="favoris" />
      </SafeAreaView>
    );
  }

  // ===== Connecté =====
  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={loading ? [] : items}
        keyExtractor={(l) => l.id}
        renderItem={({ item }) => (
       <ListingCard
  listing={item}
  onPress={() => router.push(`/listing/${item.id}` as any)}
  isFavorite
  onToggleFavorite={() => remove(item)}
/>
        )}
        ListHeaderComponent={<Text style={styles.title}>Favoris</Text>}
        ListEmptyComponent={
          loading ? (
            <View style={styles.empty}>
              <ActivityIndicator color={PRIMARY} />
            </View>
          ) : favoritesError ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Impossible de charger les favoris</Text>
              <Text style={styles.emptyDesc}>{favoritesError}</Text>
            </View>
          ) : (
            <View style={styles.empty}>
              <Ionicons name="heart-outline" size={56} color="#CBD5E0" />
              <Text style={styles.emptyTitle}>Aucun favori pour le moment</Text>
              <Text style={styles.emptyDesc}>
                Appuyez sur le cœur d’une annonce pour la retrouver ici.
              </Text>
              <TouchableOpacity
                style={styles.button}
                activeOpacity={0.85}
                onPress={() => router.replace('/')}
              >
                <Text style={styles.buttonText}>Explorer les biens</Text>
              </TouchableOpacity>
            </View>
          )
        }
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      <BottomNav active="favoris" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F8FC' },
  list: { paddingHorizontal: 20, paddingTop: 32, paddingBottom: 24, flexGrow: 1 },
  title: { fontSize: 32, fontWeight: '800', color: DARK, marginBottom: 24 },
  empty: { alignItems: 'center', paddingTop: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: DARK, marginTop: 16 },
  emptyDesc: { fontSize: 14, color: GREY, textAlign: 'center', marginTop: 6, marginBottom: 24 },
  button: {
    backgroundColor: PRIMARY,
    height: 48,
    borderRadius: 14,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});