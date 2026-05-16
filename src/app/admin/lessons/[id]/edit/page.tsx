'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { LessonType } from '@/types'

export default function EditLessonPage({ params }: { params: Promise<{ id: string }> }) {
  const [lessonId, setLessonId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<LessonType>('video')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [audioUrl, setAudioUrl] = useState('')
  const [content, setContent] = useState('')
  const [curriculumId, setCurriculumId] = useState('')
  const [projectId, setProjectId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    params.then(({ id }) => setLessonId(id))
  }, [params])

  useEffect(() => {
    if (lessonId) fetchData()
  }, [lessonId])

  const fetchData = async () => {
    if (!lessonId) return
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: lesson } = await supabase.from('lessons').select('*').eq('id', lessonId).single()
      if (!lesson) { router.back(); return }

      setTitle(lesson.title)
      setDescription(lesson.description || '')
      setType(lesson.type || 'video')
      setYoutubeUrl(lesson.youtube_url || '')
      setAudioUrl(lesson.audio_url || '')
      setContent(lesson.content || '')
      setCurriculumId(lesson.curriculum_id)

      const { data: curriculum } = await supabase.from('curricula').select('project_id').eq('id', lesson.curriculum_id).single()
      if (curriculum) setProjectId(curriculum.project_id)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) { setError('يرجى إدخال عنوان الدرس'); return }
    if (type === 'video' && !youtubeUrl.trim()) { setError('يرجى إدخال رابط يوتيوب'); return }
    if (type === 'audio' && !audioUrl.trim()) { setError('يرجى إدخال رابط صوت'); return }
    if (type === 'text' && !content.trim()) { setError('يرجى إدخال المحتوى النصي'); return }

    setSaving(true)
    try {
      const { error: updateError } = await supabase.from('lessons').update({
        title: title.trim(),
        description: description.trim(),
        type,
        youtube_url: type === 'video' ? youtubeUrl.trim() : null,
        audio_url: type === 'audio' ? audioUrl.trim() : null,
        content: type === 'text' ? content.trim() : null,
        updated_at: new Date().toISOString()
      }).eq('id', lessonId)

      if (updateError) throw updateError
      router.push(`/projects/${projectId}/curriculum`)
    } catch (err: any) {
      setError(err.message || 'حدث خطأ')
    } finally {
      setSaving(false)
    }
  }

  const execFormat = (cmd: string) => {
    document.execCommand(cmd, false)
  }

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-600 border-t-transparent"></div></div>

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-emerald-600 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            رجوع
          </button>
          <h1 className="text-lg font-bold text-emerald-700">تعديل الدرس</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">عنوان الدرس *</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent" required />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">النوع</label>
              <div className="grid grid-cols-3 gap-3">
                {(['video', 'audio', 'text'] as LessonType[]).map(t => (
                  <button key={t} type="button" onClick={() => setType(t)}
                    className={`p-3 rounded-xl font-medium transition-all border-2 ${
                      type === t ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {t === 'video' ? '🎬 فيديو' : t === 'audio' ? '🎧 صوت' : '📝 نص'}
                  </button>
                ))}
              </div>
            </div>

            {type === 'video' && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">رابط يوتيوب *</label>
                <input type="url" value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
              </div>
            )}

            {type === 'audio' && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">رابط SoundCloud *</label>
                <input type="url" value={audioUrl} onChange={e => setAudioUrl(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent" placeholder="https://soundcloud.com/..." />
              </div>
            )}

            {type === 'text' && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">المحتوى النصي *</label>
                <div className="flex items-center gap-1 flex-wrap bg-gray-100 p-2 rounded-lg border border-gray-200 mb-2">
                  {[
                    { cmd: 'bold', label: 'B', style: 'font-bold' },
                    { cmd: 'italic', label: 'I', style: 'italic' },
                    { cmd: 'underline', label: 'U', style: 'underline' },
                    { cmd: 'insertOrderedList', label: '1.' },
                    { cmd: 'insertUnorderedList', label: '•' },
                  ].map(btn => (
                    <button key={btn.cmd} type="button" onMouseDown={e => { e.preventDefault(); execFormat(btn.cmd) }} className={`px-2.5 py-1 rounded hover:bg-white text-sm ${btn.style || ''}`}>{btn.label}</button>
                  ))}
                </div>
                <div
                  contentEditable
                  dir="rtl"
                  className="w-full min-h-[250px] px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: content }}
                  onInput={e => setContent((e.target as HTMLElement).innerHTML)}
                  onPaste={e => { e.preventDefault(); document.execCommand('insertText', false, e.clipboardData.getData('text/plain')) }}
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">الوصف</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
            </div>

            <div className="flex gap-4 pt-4 border-t">
              <button type="submit" disabled={saving} className="flex-1 py-4 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-all disabled:opacity-50 shadow-lg shadow-emerald-200 flex items-center justify-center gap-2">
                {saving ? <><div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>جاري الحفظ...</> : <>حفظ التعديلات</>}
              </button>
              <Link href={projectId ? `/projects/${projectId}/curriculum` : '/admin'} className="px-6 py-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors">إلغاء</Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
