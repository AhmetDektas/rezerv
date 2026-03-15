import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react-native'
import { useState } from 'react'
import { api } from '@/src/lib/api'
import { CATEGORIES } from '@rezerv/types'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function HomeScreen() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['businesses', selectedCategory],
    queryFn: () =>
      api.get<{ data: any[] }>(
        `/api/businesses?${selectedCategory ? `category=${selectedCategory}&` : ''}limit=20`
      ),
  })

  const businesses = data?.data ?? []

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>
            Rezerv<Text style={styles.dot}>.</Text>
          </Text>
          <Text style={styles.subtitle}>Kolay rezervasyon, sıfır bekleme</Text>
        </View>

        {/* Arama */}
        <View style={styles.searchContainer}>
          <Search size={16} color="#9ca3af" style={styles.searchIcon} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="İşletme veya kategori ara..."
            placeholderTextColor="#9ca3af"
            style={styles.searchInput}
          />
        </View>

        {/* Kategoriler */}
        <Text style={styles.sectionTitle}>Kategoriler</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
              style={[
                styles.categoryCard,
                selectedCategory === cat.id && styles.categoryCardActive,
              ]}
            >
              <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
              <Text
                style={[
                  styles.categoryLabel,
                  selectedCategory === cat.id && styles.categoryLabelActive,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* İşletmeler */}
        <Text style={styles.sectionTitle}>
          {selectedCategory
            ? CATEGORIES.find((c) => c.id === selectedCategory)?.label
            : 'Tüm İşletmeler'}
        </Text>

        {isLoading ? (
          <View style={styles.loadingGrid}>
            {[1, 2, 3, 4].map((i) => (
              <View key={i} style={styles.skeletonCard} />
            ))}
          </View>
        ) : businesses.length === 0 ? (
          <Text style={styles.emptyText}>Sonuç bulunamadı</Text>
        ) : (
          <View style={styles.businessGrid}>
            {businesses.map((b: any) => (
              <TouchableOpacity
                key={b.id}
                style={styles.businessCard}
                onPress={() => router.push(`/business/${b.slug}`)}
              >
                <View style={styles.businessCover}>
                  <Text style={styles.businessEmoji}>
                    {CATEGORIES.find((c) => c.id === b.category)?.emoji}
                  </Text>
                </View>
                <View style={styles.businessInfo}>
                  <Text style={styles.businessName} numberOfLines={1}>
                    {b.name}
                  </Text>
                  <Text style={styles.businessAddress} numberOfLines={1}>
                    {b.address}
                  </Text>
                  {b.requiresDeposit && (
                    <Text style={styles.depositBadge}>💰 Kaparo gerekli</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  logo: { fontSize: 28, fontWeight: '800', color: '#111827' },
  dot: { color: '#2563eb' },
  subtitle: { fontSize: 14, color: '#6b7280', marginTop: 2 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 20,
    marginVertical: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#111827' },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 12,
  },
  categoriesScroll: { paddingLeft: 20 },
  categoryCard: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    minWidth: 80,
  },
  categoryCardActive: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  categoryEmoji: { fontSize: 28 },
  categoryLabel: { fontSize: 12, fontWeight: '600', color: '#374151', marginTop: 6 },
  categoryLabelActive: { color: '#2563eb' },
  loadingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
  skeletonCard: {
    width: '47%',
    height: 160,
    backgroundColor: '#e5e7eb',
    borderRadius: 16,
  },
  businessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
  businessCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  businessCover: {
    height: 80,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  businessEmoji: { fontSize: 32, opacity: 0.4 },
  businessInfo: { padding: 10 },
  businessName: { fontSize: 13, fontWeight: '700', color: '#111827' },
  businessAddress: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  depositBadge: { fontSize: 10, color: '#d97706', marginTop: 4, fontWeight: '600' },
  emptyText: { textAlign: 'center', color: '#9ca3af', fontSize: 14, padding: 32 },
})
