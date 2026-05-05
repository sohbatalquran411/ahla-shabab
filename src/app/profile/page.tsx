import Link from 'next/link'

export default function ProfilePage() {
  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">الملف الشخصي</h1>
      <p className="text-gray-600 mb-8">هذه الصفحة قيد التطوير...</p>
      <Link href="/dashboard" className="px-6 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700">
        العودة للرئيسية
      </Link>
    </div>
  )
}
