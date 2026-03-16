'use client'

import { useState } from 'react'
import { User, Mail, Phone, Edit3 } from 'lucide-react'

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState({ name: 'Kullanıcı Adı', email: 'kullanici@email.com', phone: '0555 000 0000' })
  const [form, setForm] = useState(profile)

  const handleSave = () => { setProfile(form); setIsEditing(false) }

  return (
    <div className="max-w-lg mx-auto space-y-4 py-2">
      <h1 className="text-xl font-bold" style={{ color: '#191919' }}>Profilim</h1>

      {/* Avatar Kartı */}
      <div className="bg-white rounded-2xl p-5 card-shadow">
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white"
            style={{ backgroundColor: '#5d3ebc' }}
          >
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm truncate" style={{ color: '#191919' }}>{profile.name}</p>
            <p className="text-xs mt-0.5 truncate" style={{ color: '#a2a2a2' }}>{profile.email}</p>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="shrink-0 p-2 rounded-xl transition-colors"
              style={{ backgroundColor: '#f3f0fe', color: '#5d3ebc' }}
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Bilgi Kartı */}
      <div className="bg-white rounded-2xl p-5 space-y-4 card-shadow">
        {isEditing ? (
          <>
            {[
              { label: 'Ad Soyad', key: 'name' as const, icon: User },
              { label: 'E-posta', key: 'email' as const, icon: Mail },
              { label: 'Telefon', key: 'phone' as const, icon: Phone },
            ].map(({ label, key, icon: Icon }) => (
              <div key={key}>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: '#6f6f6f' }}>{label}</label>
                <div className="relative">
                  <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#a2a2a2' }} />
                  <input
                    className="w-full pl-9 pr-4 py-2.5 text-sm border rounded-xl focus:outline-none transition-colors"
                    style={{ borderColor: '#e2e2e2', color: '#191919', fontFamily: 'inherit' }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#5d3ebc'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#e2e2e2'}
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  />
                </div>
              </div>
            ))}
            <div className="flex gap-3 pt-1">
              <button onClick={handleSave} className="flex-1 py-2.5 text-sm font-semibold rounded-xl text-white transition-colors" style={{ backgroundColor: '#5d3ebc' }}>
                Kaydet
              </button>
              <button onClick={() => { setForm(profile); setIsEditing(false) }} className="flex-1 py-2.5 text-sm font-semibold rounded-xl transition-colors" style={{ backgroundColor: '#f4f4f4', color: '#3e3e3e' }}>
                İptal
              </button>
            </div>
          </>
        ) : (
          <>
            {[
              { label: 'Ad Soyad', value: profile.name, icon: User },
              { label: 'E-posta', value: profile.email, icon: Mail },
              { label: 'Telefon', value: profile.phone, icon: Phone },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: '#f3f0fe' }}>
                  <Icon className="w-4 h-4" style={{ color: '#5d3ebc' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs" style={{ color: '#a2a2a2' }}>{label}</p>
                  <p className="text-sm font-semibold truncate" style={{ color: '#191919' }}>{value}</p>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
