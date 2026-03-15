import { BusinessMap } from '@/components/business/business-map'
import { BusinessInfo } from '@/components/business/business-info'
import { SlotPicker } from '@/components/business/slot-picker'
import { api } from '@/lib/api'

type Props = { params: Promise<{ slug: string }> }

export default async function BusinessPage({ params }: Props) {
  const { slug } = await params
  const { data: business } = await api.get<{ data: any }>(`/api/businesses/${slug}`)

  return (
    <div className="max-w-2xl mx-auto space-y-0">
      {/* Google Maps — üst bölge */}
      <BusinessMap lat={business.lat} lng={business.lng} name={business.name} />

      {/* İşletme Bilgileri */}
      <div className="bg-white rounded-b-2xl shadow-sm px-5 py-5 space-y-4">
        <BusinessInfo business={business} />
        <hr className="border-gray-100" />
        <SlotPicker business={business} />
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: Props) {
  try {
    const { slug } = await params
    const { data: business } = await api.get<{ data: any }>(`/api/businesses/${slug}`)
    return {
      title: business.name,
      description: business.description,
    }
  } catch {
    return { title: 'İşletme' }
  }
}
