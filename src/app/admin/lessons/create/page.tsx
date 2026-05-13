'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function CreateLessonContent() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [curriculumTitle, setCurriculumTitle] = useState('')
  const [projectId, setProjectId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const curriculumId = searchParams.get('curriculum_id')

  useEffect(() => {
    if (curriculumId) {
      supabase.from('curricula').select('title, project_id').eq('id', curriculumId).single().then(({ data }) => {
        if (data) {
          setCurriculumTitle(data.title)
          setProjectId(data.project_id)
        }
      })
    }
  }, [curriculumId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) { setError('يرجى إدخال عنوان الدرس'); return }
    if (!youtubeUrl.trim()) { setError('يرجى إدخال رابط يوتيوب'); return }
    if (!curriculumId) { setError('المنهج مطلوب'); return }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      // Get next order index
      const { data: existingLessons } = await supabase
        .from('lessons').select('order_index')
        .eq('curriculum_id', curriculumId)
        .order('order_index', { ascending: false })
        .limit(1)

      const nextOrder = (existingLessons && existingLessons.length > 0) ? existingLessons[0].order_index + 1 : 0

      const { error: insertError } = await supabase.from('lessons').insert({
        curriculum_id: curriculumId,
        title: title.trim(),
        description: description.trim(),
        youtube_url: youtubeUrl.trim(),
        order_index: nextOrder,
        created_by: user.id
      })

      if (insertError) throw insertError
      router.push(`/projects/${projectId}/curriculum`)
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
          <h1 className="text-lg font-bold text-emerald-700">إضافة درس جديد</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          {curriculumTitle && (
            <div className="mb-6 p-3 bg-gray-50 rounded-xl text-sm text-gray-600">
              المنهج: <span className="font-semibold text-gray-900">{curriculumTitle}</span>
            </div>
          )}
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">عنوان الدرس *</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent" placeholder="مثال: مقدمة في الفقه" required />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">الوصف</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent" placeholder="وصف مختصر للدرس..." />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">رابط يوتيوب *</label>
              <input type="url" value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent" placeholder="https://www.youtube.com/watch?v=..." required />
              <p className="text-xs text-gray-400">ادخل رابط الفيديو من يوتيوب</p>
            </div>

            <div className="flex gap-4 pt-4 border-t">
              <button type="submit" disabled={loading} className="flex-1 py-4 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-all disabled:opacity-50 shadow-lg shadow-emerald-200 flex items-center justify-center gap-2">
                {loading ? <><div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>جاري الإنشاء...</> : <>إضافة الدرس</>}
              </button>
              <Link href={projectId ? `/projects/${projectId}/curriculum` : '/admin'} className="px-6 py-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors">إلغاء</Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}

export default function CreateLessonPage() {
  return <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-600 border-t-transparent"></div></div>}><CreateLessonContent /></Suspense>
}
