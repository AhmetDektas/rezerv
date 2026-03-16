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
            <Pin background="#5d3ebc" glyphColor="#fff" borderColor="#4c3398" />
          </AdvancedMarker>
        </Map>
      </APIProvider>

      {/* Yol Tarifi Butonu */}
      <a
        href={googleMapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 bg-white text-sm font-semibold px-3 py-1.5 rounded-full shadow-md hover:bg-purple-50 transition-colors"
        style={{ color: '#5d3ebc' }}
      >
        <Navigation className="w-3.5 h-3.5" />
        Yol Tarifi
      </a>
    </div>
  )
}

function MapPlaceholder({ name, googleMapsUrl }: { name: string; googleMapsUrl: string }) {
  return (
    <div className="relative w-full h-52 flex flex-col items-center justify-center gap-2" style={{ background: 'linear-gradient(135deg, #f3f0fe 0%, #e8e0fc 100%)' }}>
      <MapPin className="w-8 h-8" style={{ color: '#5d3ebc' }} />
      <span className="text-sm font-medium" style={{ color: '#5d3ebc' }}>{name}</span>
      <span className="text-xs" style={{ color: '#a2a2a2' }}>📍 Harita konumu</span>
      <a
        href={googleMapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-white text-sm font-semibold px-3 py-1.5 rounded-full shadow-md hover:bg-purple-50 transition-colors"
      >
        <Navigation className="w-3.5 h-3.5" />
        Yol Tarifi
      </a>
    </div>
  )
}
