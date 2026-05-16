'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function CreateCurriculumContent() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isSequential, setIsSequential] = useState(true)
  const [projectName, setProjectName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const projectId = searchParams.get('project_id')

  useEffect(() => {
    if (projectId) {
      supabase.from('projects').select('name').eq('id', projectId).single().then(({ data }) => {
        if (data) setProjectName(data.name)
      })
    }
  }, [projectId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) { setError('يرجى إدخال عنوان المحتوى'); return }
    if (!projectId) { setError('المشروع مطلوب'); return }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: newCurriculum, error: insertError } = await supabase.from('curricula').insert({
        project_id: projectId,
        title: title.trim(),
        description: description.trim(),
        is_sequential: isSequential,
        created_by: user.id
      }).select('id').single()

      if (insertError) throw insertError
      router.push(`/admin/curricula/${newCurriculum.id}/edit`)
    } catch (err: any) {
      setError(err.message || 'حدث خطأ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-emerald-600 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            رجوع
          </button>
          <h1 className="text-lg font-bold text-emerald-700">إضافة محتوى جديد</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          {projectName && (
            <div className="mb-6 p-3 bg-gray-50 rounded-xl text-sm text-gray-600">
              المشروع: <span className="font-semibold text-gray-900">{projectName}</span>
            </div>
          )}
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">عنوان المحتوى *</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent" placeholder="مثال: دورة الفقه المبسط" required />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">الوصف</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent" placeholder="وصف مختصر للمحتوى..." />
            </div>

            {/* Sequential Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="font-medium text-gray-900">الترتيب التسلسلي</p>
                <p className="text-sm text-gray-500">إذا كان مفعّلاً، لا يفتح الدرس التالي إلا بعد إنهاء الدرس الحالي</p>
              </div>
              <button
                type="button"
                onClick={() => setIsSequential(!isSequential)}
                className={`relative w-14 h-7 rounded-full transition-colors ${isSequential ? 'bg-emerald-500' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${isSequential ? 'translate-x-7' : 'translate-x-0.5'}`} />
              </button>
            </div>

            <div className="flex gap-4 pt-4 border-t">
              <button type="submit" disabled={loading} className="flex-1 py-4 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-all disabled:opacity-50 shadow-lg shadow-emerald-200 flex items-center justify-center gap-2">
                {loading ? <><div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>جاري الإنشاء...</> : <>إضافة المحتوى</>}
              </button>
              <Link href={projectId ? `/projects/${projectId}/curriculum` : '/admin'} className="px-6 py-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors">إلغاء</Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}

export default function CreateCurriculumPage() {
  return <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-600 border-t-transparent"></div></div>}><CreateCurriculumContent /></Suspense>
}
