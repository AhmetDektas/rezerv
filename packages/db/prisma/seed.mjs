/**
 * Rezerv Seed Script
 * Run: node packages/db/prisma/seed.mjs
 */
import { createRequire } from 'module'
const require = createRequire(import.meta.url)

// We use a dynamic import so this works in both local and Docker contexts
async function main() {
  const { PrismaClient } = await import('@prisma/client')
  const bcrypt = require('bcryptjs')

  const prisma = new PrismaClient()

  console.log('🌱 Seed başlıyor...')

  // ── Users ──────────────────────────────────────────────────────────────────

  const hash = (pw) => bcrypt.hashSync(pw, 10)

  const owners = [
    { id: 'owner_berber_1', name: 'Mehmet Yılmaz', email: 'mehmet@erkekberber.com', phone: '05301234501', password: hash('berber123'), role: 'BUSINESS_OWNER' },
    { id: 'owner_spa_1',    name: 'Ayşe Demir',   email: 'ayse@luxspa.com',          phone: '05301234502', password: hash('spa123'),    role: 'BUSINESS_OWNER' },
    { id: 'owner_fit_1',    name: 'Ali Çelik',    email: 'ali@fitlife.com',           phone: '05301234503', password: hash('fit123'),    role: 'BUSINESS_OWNER' },
    { id: 'owner_vet_1',    name: 'Dr. Zeynep',   email: 'zeynep@patiklinik.com',     phone: '05301234504', password: hash('vet123'),    role: 'BUSINESS_OWNER' },
    { id: 'owner_cafe_1',   name: 'Selin Koç',    email: 'selin@moodcafe.com',        phone: '05301234505', password: hash('cafe123'),   role: 'BUSINESS_OWNER' },
  ]

  for (const owner of owners) {
    await prisma.user.upsert({
      where: { email: owner.email },
      update: {},
      create: owner,
    })
  }

  // Test customer
  await prisma.user.upsert({
    where: { email: 'test@rezerv.com' },
    update: {},
    create: {
      id: 'customer_test_1',
      name: 'Test Kullanıcı',
      email: 'test@rezerv.com',
      phone: '05551234567',
      password: hash('test1234'),
      role: 'CUSTOMER',
    },
  })

  console.log('✓ Kullanıcılar oluşturuldu')

  // ── Businesses ─────────────────────────────────────────────────────────────

  const businesses = [
    {
      id: 'biz_berber_1',
      name: 'Erkek Berber & Kuaför',
      slug: 'erkek-berber-kuafor',
      category: 'HEALTH',
      description: 'Profesyonel erkek kuaförü. Saç kesimi, sakal tıraşı, bakım hizmetleri.',
      address: 'Kadıköy, İstanbul',
      lat: 40.9907,
      lng: 29.0285,
      phone: '05301234501',
      email: 'mehmet@erkekberber.com',
      ownerId: 'owner_berber_1',
      isActive: true,
      requiresDeposit: false,
      coverImage: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&q=80',
    },
    {
      id: 'biz_spa_1',
      name: 'Lux Spa & Masaj',
      slug: 'lux-spa-masaj',
      category: 'HEALTH',
      description: 'Premium spa deneyimi. Masaj, cilt bakımı, hamam hizmetleri.',
      address: 'Beşiktaş, İstanbul',
      lat: 41.0430,
      lng: 29.0092,
      phone: '05301234502',
      email: 'ayse@luxspa.com',
      ownerId: 'owner_spa_1',
      isActive: true,
      requiresDeposit: true,
      depositType: 'FIXED',
      depositAmount: 150,
      coverImage: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80',
    },
    {
      id: 'biz_fit_1',
      name: 'FitLife Spor Salonu',
      slug: 'fitlife-spor-salonu',
      category: 'SPORTS',
      description: 'Modern ekipmanlarla dolu spor salonu. Kişisel antrenör, grup dersleri.',
      address: 'Şişli, İstanbul',
      lat: 41.0602,
      lng: 28.9877,
      phone: '05301234503',
      email: 'ali@fitlife.com',
      ownerId: 'owner_fit_1',
      isActive: true,
      requiresDeposit: false,
      coverImage: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
    },
    {
      id: 'biz_vet_1',
      name: 'Pati Veteriner Kliniği',
      slug: 'pati-veteriner-klinigi',
      category: 'VETERINARY',
      description: 'Evcil hayvanlarınız için kapsamlı sağlık hizmetleri. 7/24 acil servis.',
      address: 'Üsküdar, İstanbul',
      lat: 41.0255,
      lng: 29.0150,
      phone: '05301234504',
      email: 'zeynep@patiklinik.com',
      ownerId: 'owner_vet_1',
      isActive: true,
      requiresDeposit: true,
      depositType: 'FIXED',
      depositAmount: 100,
      coverImage: 'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=800&q=80',
    },
    {
      id: 'biz_cafe_1',
      name: 'Mood Cafe & Kahvaltı',
      slug: 'mood-cafe-kahvalti',
      category: 'FOOD_DRINK',
      description: 'Kahvaltı ve brunch mekanı. Özel masa rezervasyonu, canlı müzik.',
      address: 'Moda, Kadıköy, İstanbul',
      lat: 40.9795,
      lng: 29.0253,
      phone: '05301234505',
      email: 'selin@moodcafe.com',
      ownerId: 'owner_cafe_1',
      isActive: true,
      requiresDeposit: true,
      depositType: 'FIXED',
      depositAmount: 200,
      coverImage: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80',
    },
  ]

  for (const biz of businesses) {
    await prisma.business.upsert({
      where: { id: biz.id },
      update: {},
      create: biz,
    })
  }

  console.log('✓ İşletmeler oluşturuldu')

  // ── Business Hours ─────────────────────────────────────────────────────────
  // dayOfWeek: 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun

  const defaultHours = (bizId, closeSunday = true) =>
    [0, 1, 2, 3, 4, 5, 6].map((day) => ({
      businessId: bizId,
      dayOfWeek: day,
      openTime: '09:00',
      closeTime: '22:00',
      isClosed: closeSunday && day === 6,
    }))

  for (const biz of businesses) {
    await prisma.businessHour.deleteMany({ where: { businessId: biz.id } })
    await prisma.businessHour.createMany({ data: defaultHours(biz.id) })
  }

  console.log('✓ Çalışma saatleri oluşturuldu')

  // ── Time Slots (next 30 days, 09:00-22:00, 1h intervals) ──────────────────

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (const biz of businesses) {
    const slots = []
    for (let d = 0; d < 30; d++) {
      const date = new Date(today)
      date.setDate(today.getDate() + d)
      const jsDay = date.getDay() // 0=Sun
      const ourDay = jsDay === 0 ? 6 : jsDay - 1

      // Skip Sunday for businesses except vet
      if (ourDay === 6 && biz.id !== 'biz_vet_1') continue

      for (let h = 9; h < 22; h++) {
        const startTime = `${String(h).padStart(2, '0')}:00`
        const endTime = `${String(h + 1).padStart(2, '0')}:00`
        slots.push({
          businessId: biz.id,
          date: new Date(date),
          startTime,
          endTime,
          capacity: biz.category === 'SPORTS' ? 10 : biz.category === 'FOOD_DRINK' ? 6 : 1,
          booked: 0,
        })
      }
    }
    // Remove existing unbooked slots
    await prisma.timeSlot.deleteMany({ where: { businessId: biz.id, booked: 0 } })
    if (slots.length > 0) {
      await prisma.timeSlot.createMany({ data: slots, skipDuplicates: true })
    }
    console.log(`  → ${biz.name}: ${slots.length} slot`)
  }

  console.log('✓ Zaman slotları oluşturuldu')

  // ── Services ────────────────────────────────────────────────────────────────

  const servicesData = [
    // Erkek Berber
    { businessId: 'biz_berber_1', name: 'Saç Kesimi', description: 'Klasik veya modern saç kesimi', price: 150, duration: 30, isActive: true },
    { businessId: 'biz_berber_1', name: 'Sakal Tıraşı', description: 'Bıçak ile geleneksel sakal tıraşı', price: 100, duration: 20, isActive: true },
    { businessId: 'biz_berber_1', name: 'Saç + Sakal', description: 'Saç kesimi ve sakal tıraşı kombine', price: 220, duration: 50, isActive: true },
    { businessId: 'biz_berber_1', name: 'Cilt Bakımı', description: 'Yüz temizliği ve nem maskesi', price: 250, duration: 45, isActive: true },
    // Lux Spa
    { businessId: 'biz_spa_1', name: 'İsveç Masajı', description: 'Rahatlatıcı tam vücut masajı', price: 400, duration: 60, isActive: true },
    { businessId: 'biz_spa_1', name: 'Derin Doku Masajı', description: 'Kas gerginliği için yoğun masaj', price: 500, duration: 60, isActive: true },
    { businessId: 'biz_spa_1', name: 'Hamam & Kese', description: 'Geleneksel Türk hamamı deneyimi', price: 350, duration: 90, isActive: true },
    { businessId: 'biz_spa_1', name: 'Yüz Bakımı', description: 'Cilt yenileme ve nem tedavisi', price: 450, duration: 75, isActive: true },
    // FitLife Spor
    { businessId: 'biz_fit_1', name: 'Kişisel Antrenör (1 Saat)', description: 'Bire bir antrenman seansı', price: 300, duration: 60, isActive: true },
    { businessId: 'biz_fit_1', name: 'Grup Dersi - Yoga', description: 'Sabah yoga seansı (maks. 10 kişi)', price: 120, duration: 60, isActive: true },
    { businessId: 'biz_fit_1', name: 'Grup Dersi - Pilates', description: 'Core güçlendirme pilates', price: 130, duration: 60, isActive: true },
    { businessId: 'biz_fit_1', name: 'Grup Dersi - Spinning', description: 'Yoğun kardiyo spinning', price: 100, duration: 45, isActive: true },
    // Pati Veteriner
    { businessId: 'biz_vet_1', name: 'Genel Muayene', description: 'Kapsamlı sağlık kontrolü', price: 200, duration: 30, isActive: true },
    { businessId: 'biz_vet_1', name: 'Aşılama', description: 'Yıllık rutin aşı uygulaması', price: 150, duration: 20, isActive: true },
    { businessId: 'biz_vet_1', name: 'Tüy Bakımı & Tıraş', description: 'Köpek veya kedi tıraşı', price: 250, duration: 60, isActive: true },
    { businessId: 'biz_vet_1', name: 'Diş Bakımı', description: 'Ultrasonik diş taşı temizliği', price: 400, duration: 45, isActive: true },
    // Mood Cafe
    { businessId: 'biz_cafe_1', name: 'Kahvaltı Rezervasyonu', description: 'Açık büfe kahvaltı (kişi başı)', price: 250, duration: 90, isActive: true },
    { businessId: 'biz_cafe_1', name: 'Brunch Paketi', description: 'Özel brunch menüsü (2 kişilik)', price: 600, duration: 120, isActive: true },
    { businessId: 'biz_cafe_1', name: 'Özel Masa Rezervasyonu', description: 'Doğum günü veya özel gün masası', price: 200, duration: 180, isActive: true },
  ]

  await prisma.service.deleteMany({
    where: { businessId: { in: ['biz_berber_1', 'biz_spa_1', 'biz_fit_1', 'biz_vet_1', 'biz_cafe_1'] } },
  })
  await prisma.service.createMany({ data: servicesData, skipDuplicates: true })

  console.log('✓ Hizmetler oluşturuldu')
  console.log('\n🎉 Seed tamamlandı!\n')
  console.log('İşletme paneli giriş bilgileri:')
  console.log('  Erkek Berber: mehmet@erkekberber.com / berber123')
  console.log('  Lux Spa:      ayse@luxspa.com / spa123')
  console.log('  FitLife:      ali@fitlife.com / fit123')
  console.log('  Pati Vet:     zeynep@patiklinik.com / vet123')
  console.log('  Mood Cafe:    selin@moodcafe.com / cafe123')
  console.log('\nMüşteri hesabı:')
  console.log('  test@rezerv.com / test1234')

  await prisma.$disconnect()
}

main().catch((e) => { console.error(e); process.exit(1) })
