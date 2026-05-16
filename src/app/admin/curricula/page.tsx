import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminCurriculaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  const { data: curricula } = await supabase
    .from('curricula')
    .select('*, projects(name)')
    .order('created_at', { ascending: false })

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2 text-gray-600 hover:text-emerald-600 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            رجوع للوحة التحكم
          </Link>
          <h1 className="text-lg font-bold text-emerald-700">المحتوى التعليمي</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-right">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">العنوان</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">المشروع</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">تاريخ الإنشاء</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(curricula || []).map((c: any) => (
                <tr key={c.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 font-medium text-gray-900">{c.title}</td>
                  <td className="px-6 py-4 text-gray-500">{c.projects?.name || '—'}</td>
                  <td className="px-6 py-4 text-gray-500 text-sm">{new Date(c.created_at).toLocaleDateString('ar-SA')}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <Link href={`/admin/curricula/${c.id}/edit`} className="px-3 py-1.5 text-sm bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors">تعديل</Link>
                      <Link href={`/projects/${c.project_id}/curriculum`} className="px-3 py-1.5 text-sm bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors">عرض الدروس</Link>
                    </div>
                  </td>
                </tr>
              ))}
              {(!curricula || curricula.length === 0) && (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400">لا يوجد محتوى بعد</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
