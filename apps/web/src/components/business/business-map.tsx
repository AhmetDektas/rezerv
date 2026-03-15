'use client'

import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps'
import { Navigation, MapPin } from 'lucide-react'

type Props = {
  lat: number
  lng: number
  name: string
  address?: string
}

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? ''

export function BusinessMap({ lat, lng, name, address }: Props) {
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address ?? `${lat},${lng}`)}`
  const position = { lat, lng }

  if (!MAPS_KEY) {
    return <MapPlaceholder name={name} googleMapsUrl={googleMapsUrl} />
  }

  return (
    <div className="relative w-full h-52 overflow-hidden">
      <APIProvider apiKey={MAPS_KEY}>
        <Map
          defaultCenter={position}
          defaultZoom={15}
          mapId="rezerv-business-map"
          gestureHandling="cooperative"
          disableDefaultUI
          className="w-full h-full"
        >
          <AdvancedMarker position={position} title={name}>
            <Pin background="#2563eb" glyphColor="#fff" borderColor="#1d4ed8" />
          </AdvancedMarker>
        </Map>
      </APIProvider>

      {/* Yol Tarifi Butonu */}
      <a
        href={googleMapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 bg-white text-blue-600 text-sm font-semibold px-3 py-1.5 rounded-full shadow-md hover:bg-blue-50 transition-colors"
      >
        <Navigation className="w-3.5 h-3.5" />
        Yol Tarifi
      </a>
    </div>
  )
}

function MapPlaceholder({ name, googleMapsUrl }: { name: string; googleMapsUrl: string }) {
  return (
    <div className="relative w-full h-52 bg-gradient-to-br from-blue-50 to-blue-100 flex flex-col items-center justify-center gap-2">
      <MapPin className="w-8 h-8 text-blue-400" />
      <span className="text-sm text-blue-500 font-medium">{name}</span>
      <span className="text-xs text-blue-400">Harita için API key gerekli</span>
      <a
        href={googleMapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-white text-blue-600 text-sm font-semibold px-3 py-1.5 rounded-full shadow-md hover:bg-blue-50 transition-colors"
      >
        <Navigation className="w-3.5 h-3.5" />
        Yol Tarifi
      </a>
    </div>
  )
}
