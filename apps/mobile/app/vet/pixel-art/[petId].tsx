import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useState, useCallback } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '@/src/lib/api'
import { useAuthStore } from '@/src/store/auth'
import { createEmptyPixelArt, PIXEL_ART_SIZE } from '@rezerv/utils'

const SCREEN_WIDTH = Dimensions.get('window').width
const GRID_PADDING = 20
const CELL_SIZE = Math.floor((SCREEN_WIDTH - GRID_PADDING * 2) / PIXEL_ART_SIZE)

const PALETTE = [
  // Siyahlar & Griler
  '#000000', '#3d3d3d', '#7a7a7a', '#b4b4b4', '#ffffff',
  // Esmerler (köpek/kedi tüyleri için)
  '#3b1f0a', '#7a3b10', '#c47d3a', '#e8b87a', '#f5d9a8',
  // Turuncu/Sarı
  '#ff6b00', '#ff9500', '#ffd000', '#fff176',
  // Kırmızı/Pembe
  '#cc0000', '#ff4444', '#ff88aa', '#ffccdd',
  // Yeşil
  '#1a5c00', '#3a9e00', '#6fcf00', '#b5f575',
  // Mavi
  '#0033cc', '#0077ff', '#44aaff', '#aad4ff',
  // Mor
  '#5500aa', '#9933ff', '#cc77ff',
  // Özel: Burun/Göz renkleri
  '#222222', '#4a3728', '#ff9eb5', '#c2a680',
]

// Hayvan şablonları (köpek, kedi)
const TEMPLATES: Record<string, (color1: string, color2: string) => string[]> = {
  dog: (c1, c2) => {
    const g = createEmptyPixelArt('#ffffff')
    // Basit köpek silueti (16x16)
    const dogPattern = [
      [3,2,c1],[4,2,c1],[5,2,c1],[6,2,c1],[7,2,c1],[8,2,c1],[9,2,c1],[10,2,c1],[11,2,c1],[12,2,c1],
      [2,3,c1],[3,3,c2],[4,3,c2],[5,3,c1],[6,3,c2],[7,3,c2],[8,3,c2],[9,3,c2],[10,3,c2],[11,3,c2],[12,3,c1],[13,3,c1],
      [2,4,c1],[3,4,c2],[4,4,'#222222'],[5,4,c2],[6,4,c2],[7,4,c2],[8,4,c2],[9,4,c2],[10,4,'#222222'],[11,4,c2],[12,4,c2],[13,4,c1],
      [2,5,c1],[3,5,c2],[4,5,c2],[5,5,c2],[6,5,c2],[7,5,'#ff9eb5'],[8,5,c2],[9,5,c2],[10,5,c2],[11,5,c2],[12,5,c2],[13,5,c1],
      [3,6,c1],[4,6,c1],[5,6,c1],[6,6,c1],[7,6,c1],[8,6,c1],[9,6,c1],[10,6,c1],[11,6,c1],[12,6,c1],
      [4,7,c1],[5,7,c1],[6,7,c1],[7,7,c1],[8,7,c1],[9,7,c1],[10,7,c1],[11,7,c1],
      [4,8,c1],[5,8,c1],[6,8,c1],[7,8,c1],[8,8,c1],[9,8,c1],[10,8,c1],[11,8,c1],
      [3,9,c1],[4,9,c1],[11,9,c1],[12,9,c1],
      [3,10,c1],[4,10,c1],[11,10,c1],[12,10,c1],
      [3,11,c1],[4,11,c1],[11,11,c1],[12,11,c1],
      [3,12,c1],[4,12,c1],[5,12,c1],[10,12,c1],[11,12,c1],[12,12,c1],
    ]
    dogPattern.forEach(([x, y, color]) => { g[y * PIXEL_ART_SIZE + x] = color as string })
    return g
  },
}

export default function PixelArtScreen() {
  const { petId } = useLocalSearchParams<{ petId: string }>()
  const { token } = useAuthStore()

  const { data: petData } = useQuery({
    queryKey: ['pet', petId],
    queryFn: () => api.get<{ data: any }>(`/api/pets/${petId}`, token ?? undefined),
    enabled: !!petId,
  })

  const pet = petData?.data

  const [grid, setGrid] = useState<string[]>(() => {
    if (pet?.pixelArt && Array.isArray(pet.pixelArt)) return pet.pixelArt as string[]
    return createEmptyPixelArt('#ffffff')
  })

  const [selectedColor, setSelectedColor] = useState('#000000')
  const [isDrawing, setIsDrawing] = useState(false)

  const paint = useCallback(
    (index: number) => {
      setGrid((prev) => {
        const next = [...prev]
        next[index] = selectedColor
        return next
      })
    },
    [selectedColor]
  )

  const saveMutation = useMutation({
    mutationFn: () =>
      api.put(`/api/pets/${petId}/pixel-art`, { pixelArt: grid }, token ?? undefined),
    onSuccess: () => Alert.alert('Kaydedildi!', 'Pixel art hayvanınıza eklendi.'),
    onError: (err: Error) => Alert.alert('Hata', err.message),
  })

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {pet?.name ?? 'Hayvanın'} için Pixel Art
        </Text>
        <Text style={styles.subtitle}>16×16 piksel editör</Text>
      </View>

      {/* Grid */}
      <View style={styles.gridWrapper}>
        <View style={styles.grid}>
          {grid.map((color, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.cell, { backgroundColor: color }]}
              onPress={() => paint(index)}
              activeOpacity={1}
            />
          ))}
        </View>
      </View>

      {/* Araçlar */}
      <View style={styles.tools}>
        <TouchableOpacity
          style={styles.toolBtn}
          onPress={() => setGrid(createEmptyPixelArt('#ffffff'))}
        >
          <Text style={styles.toolBtnText}>🗑️ Temizle</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.toolBtn}
          onPress={() => {
            if (pet?.type === 'DOG') {
              setGrid(TEMPLATES.dog('#c47d3a', '#e8b87a'))
            } else {
              Alert.alert('Şablon', 'Bu hayvan tipi için şablon yakında eklenecek.')
            }
          }}
        >
          <Text style={styles.toolBtnText}>🐾 Şablon</Text>
        </TouchableOpacity>
      </View>

      {/* Renk Paleti */}
      <Text style={styles.paletteTitle}>Renk Seç</Text>
      <View style={styles.palette}>
        {PALETTE.map((color) => (
          <TouchableOpacity
            key={color}
            onPress={() => setSelectedColor(color)}
            style={[
              styles.colorSwatch,
              { backgroundColor: color },
              selectedColor === color && styles.colorSwatchActive,
            ]}
          />
        ))}
      </View>

      {/* Seçili renk */}
      <View style={styles.selectedColorRow}>
        <View style={[styles.selectedColorPreview, { backgroundColor: selectedColor }]} />
        <Text style={styles.selectedColorHex}>{selectedColor}</Text>
      </View>

      {/* Kaydet */}
      <TouchableOpacity
        style={[styles.saveBtn, saveMutation.isPending && styles.saveBtnDisabled]}
        onPress={() => saveMutation.mutate()}
        disabled={saveMutation.isPending}
      >
        <Text style={styles.saveBtnText}>
          {saveMutation.isPending ? 'Kaydediliyor...' : '💾 Kaydet'}
        </Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  title: { fontSize: 20, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 13, color: '#9ca3af', marginTop: 2 },
  gridWrapper: {
    paddingHorizontal: GRID_PADDING,
    alignItems: 'center',
    marginVertical: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: CELL_SIZE * PIXEL_ART_SIZE,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderWidth: 0.5,
    borderColor: '#f3f4f6',
  },
  tools: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  toolBtn: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  toolBtnText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  paletteTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  palette: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 8,
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  colorSwatchActive: {
    borderWidth: 3,
    borderColor: '#2563eb',
    transform: [{ scale: 1.15 }],
  },
  selectedColorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    marginTop: 14,
    marginBottom: 20,
  },
  selectedColorPreview: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  selectedColorHex: { fontSize: 14, fontWeight: '600', color: '#374151' },
  saveBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 18,
    paddingVertical: 16,
    marginHorizontal: 20,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },
})
