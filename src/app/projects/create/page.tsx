import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function CreateProjectPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || (profile.role !== 'supervisor' && profile.role !== 'admin')) {
    redirect('/dashboard')
  }

  async function createProject(formData: FormData) {
    'use server'
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const target_gender = formData.get('target_gender') as string

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      await supabase.from('projects').insert({
        name,
        description,
        target_gender,
        created_by: user.id
      })
    }

    redirect('/dashboard')
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="text-gray-600 hover:text-teal-600 transition-colors"
          >
            رجوع
          </Link>
          <h1 className="text-lg font-bold text-teal-700">إنشاء مشروع جديد</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <form action={createProject} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">اسم المشروع</label>
              <input
                type="text"
                name="name"
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="مثال: المدرسة الإيمانية"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الوصف</label>
              <textarea
                name="description"
                rows={3}
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="وصف مختصر للمشروع..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الفئة المستهدفة</label>
              <select
                name="target_gender"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="both">الكل (ذكور وإناث)</option>
                <option value="male">ذكور فقط</option>
                <option value="female">إناث فقط</option>
              </select>
            </div>

            <div className="flex gap-4 pt-4 border-t">
              <button
                type="submit"
                className="flex-1 py-4 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition-all shadow-lg"
              >
                إنشاء المشروع
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
