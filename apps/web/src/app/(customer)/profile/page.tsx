'use client';

import { useState } from 'react';

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: 'Kullanıcı Adı',
    email: 'kullanici@email.com',
    phone: '0555 000 0000',
  });
  const [form, setForm] = useState(profile);

  const handleSave = () => {
    setProfile(form);
    setIsEditing(false);
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Profilim</h1>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-600">
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-800">{profile.name}</p>
            <p className="text-sm text-gray-400">{profile.email}</p>
          </div>
        </div>

        <hr className="border-gray-100" />

        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Ad Soyad</label>
              <input
                className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">E-posta</label>
              <input
                className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Telefon</label>
              <input
                className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                className="flex-1 bg-blue-600 text-white text-sm font-medium py-2 rounded-xl hover:bg-blue-700 transition-colors"
              >
                Kaydet
              </button>
              <button
                onClick={() => { setForm(profile); setIsEditing(false); }}
                className="flex-1 bg-gray-100 text-gray-600 text-sm font-medium py-2 rounded-xl hover:bg-gray-200 transition-colors"
              >
                İptal
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Ad Soyad</span>
              <span className="text-gray-800 font-medium">{profile.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">E-posta</span>
              <span className="text-gray-800 font-medium">{profile.email}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Telefon</span>
              <span className="text-gray-800 font-medium">{profile.phone}</span>
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="mt-2 w-full bg-blue-50 text-blue-600 text-sm font-medium py-2 rounded-xl hover:bg-blue-100 transition-colors"
            >
              Profili Düzenle
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
