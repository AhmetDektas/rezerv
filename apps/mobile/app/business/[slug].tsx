import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useQuery, useMutation } from '@tanstack/react-query'
import MapView, { Marker } from 'react-native-maps'
import { format, addDays, isSameDay } from 'date-fns'
import { tr } from 'date-fns/locale'
import { useState } from 'react'
import { Navigation, Phone, MapPin, Clock } from 'lucide-react-native'
import { api } from '@/src/lib/api'
import { useAuthStore } from '@/src/store/auth'
import { CATEGORIES } from '@rezerv/types'
import { formatCurrency } from '@rezerv/utils'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function BusinessScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const { token } = useAuthStore()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null)

  const { data: bizData } = useQuery({
    queryKey: ['business', slug],
    queryFn: () => api.get<{ data: any }>(`/api/businesses/${slug}`),
  })

  const business = bizData?.data

  const dateStr = format(selectedDate, 'yyyy-MM-dd')
  const { data: slotsData, isLoading: slotsLoading } = useQuery({
    queryKey: ['slots', business?.id, dateStr],
    queryFn: () =>
      api.get<{ data: any[] }>(`/api/slots/business/${business.id}?date=${dateStr}`),
    enabled: !!business?.id,
  })

  const slots = slotsData?.data ?? []

  const reserveMutation = useMutation({
    mutationFn: (slotId: string) =>
      api.post('/api/reservations', { businessId: business.id, slotId }, token ?? undefined),
    onSuccess: () => {
      setSelectedSlotId(null)
      Alert.alert('Başarılı', 'Rezervasyonunuz oluşturuldu!')
    },
    onError: (err: Error) => Alert.alert('Hata', err.message),
  })

  const days = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i))

  if (!business) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    )
  }

  const category = CATEGORIES.find((c) => c.id === business.category)

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Google Maps */}
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: business.lat,
          longitude: business.lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        scrollEnabled={false}
        zoomEnabled={false}
      >
        <Marker
          coordinate={{ latitude: business.lat, longitude: business.lng }}
          title={business.name}
        />
      </MapView>

      {/* Yol tarifi butonu */}
      <TouchableOpacity
        style={styles.directionsBtn}
        onPress={() =>
          Linking.openURL(
            `https://www.google.com/maps/search/?api=1&query=${business.lat},${business.lng}`
          )
        }
      >
        <Navigation size={14} color="#2563eb" />
        <Text style={styles.directionsBtnText}>Yol Tarifi</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        {/* İşletme Başlık */}
        <View style={styles.businessHeader}>
          <View style={styles.businessIcon}>
            <Text style={styles.businessEmoji}>{category?.emoji}</Text>
          </View>
          <View style={styles.businessHeaderText}>
            <Text style={styles.businessName}>{business.name}</Text>
            <Text style={styles.categoryLabel}>{category?.label}</Text>
          </View>
        </View>

        {business.description && (
          <Text style={styles.description}>{business.description}</Text>
        )}

        {/* Adres + Telefon */}
        <View style={styles.infoRow}>
          <MapPin size={14} color="#9ca3af" />
          <Text style={styles.infoText}>{business.address}</Text>
        </View>
        <TouchableOpacity
          style={styles.infoRow}
          onPress={() => Linking.openURL(`tel:${business.phone}`)}
        >
          <Phone size={14} color="#9ca3af" />
          <Text style={[styles.infoText, { color: '#2563eb' }]}>{business.phone}</Text>
        </TouchableOpacity>

        {/* Kaparo Uyarısı */}
        {business.requiresDeposit && (
          <View style={styles.depositBanner}>
            <Text style={styles.depositText}>
              💰 Kaparo gerekli:{' '}
              {business.depositType === 'FIXED' && business.depositAmount
                ? formatCurrency(business.depositAmount)
                : `%${business.depositPercent}`}
            </Text>
          </View>
        )}

        <View style={styles.divider} />

        {/* Rezervasyon Bölümü */}
        <Text style={styles.sectionTitle}>Rezervasyon Yap</Text>

        {/* Tarih Seçici */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.datesScroll}
        >
          {days.map((day) => {
            const isSelected = isSameDay(day, selectedDate)
            return (
              <TouchableOpacity
                key={day.toISOString()}
                onPress={() => {
                  setSelectedDate(day)
                  setSelectedSlotId(null)
                }}
                style={[styles.dayBtn, isSelected && styles.dayBtnActive]}
              >
                <Text style={[styles.dayName, isSelected && styles.dayNameActive]}>
                  {format(day, 'EEE', { locale: tr })}
                </Text>
                <Text style={[styles.dayNumber, isSelected && styles.dayNumberActive]}>
                  {format(day, 'd')}
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>

        {/* Slotlar */}
        {slotsLoading ? (
          <View style={styles.slotsGrid}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <View key={i} style={styles.slotSkeleton} />
            ))}
          </View>
        ) : slots.length === 0 ? (
          <View style={styles.emptySlots}>
            <Clock size={28} color="#d1d5db" />
            <Text style={styles.emptySlotsText}>Bu tarih için müsait saat yok</Text>
          </View>
        ) : (
          <View style={styles.slotsGrid}>
            {slots.map((slot: any) => {
              const isSelected = selectedSlotId === slot.id
              return (
                <TouchableOpacity
                  key={slot.id}
                  disabled={slot.isFull}
                  onPress={() => setSelectedSlotId(isSelected ? null : slot.id)}
                  style={[
                    styles.slotBtn,
                    slot.isFull && styles.slotBtnFull,
                    isSelected && styles.slotBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.slotTime,
                      slot.isFull && styles.slotTimeFull,
                      isSelected && styles.slotTimeActive,
                    ]}
                  >
                    {slot.startTime}
                  </Text>
                  {slot.isFull && (
                    <Text style={styles.slotFullText}>Dolu</Text>
                  )}
                </TouchableOpacity>
              )
            })}
          </View>
        )}

        {/* Rezervasyon Butonu */}
        {selectedSlotId && (
          <TouchableOpacity
            style={[styles.reserveBtn, reserveMutation.isPending && styles.reserveBtnDisabled]}
            onPress={() => {
              if (!token) {
                Alert.alert('Giriş Gerekli', 'Rezervasyon yapmak için giriş yapmalısınız.')
                return
              }
              reserveMutation.mutate(selectedSlotId)
            }}
            disabled={reserveMutation.isPending}
          >
            <Text style={styles.reserveBtnText}>
              {reserveMutation.isPending
                ? 'İşleniyor...'
                : business.requiresDeposit
                  ? 'Kaparo Öde ve Rezerve Et'
                  : 'Rezervasyonu Onayla'}
            </Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 32 }} />
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#9ca3af' },
  map: { width: '100%', height: 200 },
  directionsBtn: {
    position: 'absolute',
    top: 160,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  directionsBtnText: { fontSize: 13, fontWeight: '700', color: '#2563eb' },
  content: { padding: 20 },
  businessHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  businessIcon: {
    width: 52,
    height: 52,
    backgroundColor: '#eff6ff',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  businessEmoji: { fontSize: 26 },
  businessHeaderText: { flex: 1 },
  businessName: { fontSize: 20, fontWeight: '800', color: '#111827' },
  categoryLabel: { fontSize: 13, color: '#2563eb', fontWeight: '600', marginTop: 2 },
  description: { fontSize: 14, color: '#6b7280', lineHeight: 20, marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  infoText: { fontSize: 13, color: '#6b7280', flex: 1 },
  depositBanner: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  depositText: { fontSize: 13, color: '#92400e', fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#f3f4f6', marginVertical: 20 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 14 },
  datesScroll: { marginBottom: 16 },
  dayBtn: {
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    marginRight: 8,
    backgroundColor: '#f9fafb',
  },
  dayBtnActive: { backgroundColor: '#2563eb' },
  dayName: { fontSize: 11, fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase' },
  dayNameActive: { color: '#bfdbfe' },
  dayNumber: { fontSize: 18, fontWeight: '800', color: '#374151', marginTop: 2 },
  dayNumberActive: { color: '#fff' },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  slotBtn: {
    width: '30%',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
  },
  slotBtnActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  slotBtnFull: { backgroundColor: '#f9fafb', borderColor: '#f3f4f6' },
  slotTime: { fontSize: 14, fontWeight: '700', color: '#374151' },
  slotTimeActive: { color: '#fff' },
  slotTimeFull: { color: '#d1d5db' },
  slotFullText: { fontSize: 10, color: '#d1d5db', marginTop: 2 },
  slotSkeleton: {
    width: '30%',
    height: 48,
    backgroundColor: '#f3f4f6',
    borderRadius: 14,
  },
  emptySlots: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptySlotsText: { fontSize: 13, color: '#9ca3af' },
  reserveBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  reserveBtnDisabled: { opacity: 0.6 },
  reserveBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },
})
