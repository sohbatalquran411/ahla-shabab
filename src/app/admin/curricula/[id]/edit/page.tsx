'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { LessonType } from '@/types'

const EMPTY_ROW = { title: '', description: '', type: 'video' as LessonType, youtube_url: '', audio_url: '', content: '' }

const FORMAT_BUTTONS = [
  { cmd: 'bold', label: 'B', style: 'font-bold' },
  { cmd: 'italic', label: 'I', style: 'italic' },
  { cmd: 'underline', label: 'U', style: 'underline' },
  { cmd: 'insertOrderedList', label: '1.', icon: 'list-ol' },
  { cmd: 'insertUnorderedList', label: '•', icon: 'list-ul' },
]

export default function EditCurriculumPage({ params }: { params: Promise<{ id: string }> }) {
  const [curriculumId, setCurriculumId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isSequential, setIsSequential] = useState(true)
  const [projectId, setProjectId] = useState('')
  const [lessons, setLessons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Bulk add
  const [newRows, setNewRows] = useState(Array(5).fill(null).map(() => ({ ...EMPTY_ROW })))
  const [bulkAdding, setBulkAdding] = useState(false)

  // Rich text editor
  const editorRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // Inline edit
  const [editId, setEditId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editType, setEditType] = useState<LessonType>('video')
  const [editUrl, setEditUrl] = useState('')
  const [editAudioUrl, setEditAudioUrl] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editing, setEditing] = useState(false)

  // Delete
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    params.then(({ id }) => setCurriculumId(id))
  }, [params])

  useEffect(() => {
    if (curriculumId) fetchData()
  }, [curriculumId])

  const fetchData = async () => {
    if (!curriculumId) return
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: curriculum } = await supabase.from('curricula').select('*').eq('id', curriculumId).single()
      if (!curriculum) { router.back(); return }

      setTitle(curriculum.title)
      setDescription(curriculum.description || '')
      setIsSequential(curriculum.is_sequential ?? true)
      setProjectId(curriculum.project_id)

      const { data: lessonsData } = await supabase
        .from('lessons').select('*')
        .eq('curriculum_id', curriculumId)
        .order('order_index')

      setLessons(lessonsData || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) { setError('يرجى إدخال عنوان المحتوى'); return }
    setSaving(true)
    try {
      const { error: updateError } = await supabase.from('curricula').update({
        title: title.trim(),
        description: description.trim(),
        is_sequential: isSequential,
        updated_at: new Date().toISOString()
      }).eq('id', curriculumId)
      if (updateError) throw updateError
    } catch (err: any) {
      setError(err.message || 'حدث خطأ')
    } finally {
      setSaving(false)
    }
  }

  const updateRow = (idx: number, field: string, value: any) => {
    setNewRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r))
  }

  const addRows = () => {
    setNewRows(prev => [...prev, ...Array(5).fill(null).map(() => ({ ...EMPTY_ROW }))])
  }

  const handleBulkAdd = async () => {
    const valid = newRows.filter(r => {
      if (r.type === 'video') return r.title.trim() && r.youtube_url.trim()
      if (r.type === 'audio') return r.title.trim() && r.audio_url.trim()
      return r.title.trim() && r.content.trim()
    })
    if (valid.length === 0) { setError('لم يتم إدخال أي دروس صالحة'); return }
    setBulkAdding(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      let nextOrder = lessons.length > 0 ? Math.max(...lessons.map(l => l.order_index)) + 1 : 0

      const toInsert = valid.map(r => {
        let youtubeUrl = r.youtube_url?.trim() || ''
        if (r.type === 'video' && youtubeUrl && !youtubeUrl.includes('youtube') && !youtubeUrl.includes('youtu.be')) {
          youtubeUrl = `https://www.youtube.com/watch?v=${youtubeUrl}`
        }
        return {
          curriculum_id: curriculumId,
          title: r.title.trim(),
          description: r.description.trim(),
          type: r.type,
          youtube_url: youtubeUrl,
          audio_url: r.audio_url?.trim() || null,
          content: r.content?.trim() || null,
          allow_comments: true,
          order_index: nextOrder++,
          created_by: user.id
        }
      })

      const { data: inserted, error: insertError } = await supabase.from('lessons').insert(toInsert).select('*')
      if (insertError) throw insertError

      setLessons(prev => [...prev, ...(inserted || [])].sort((a, b) => a.order_index - b.order_index))
      setNewRows(Array(5).fill(null).map(() => ({ ...EMPTY_ROW })))
    } catch (err: any) {
      setError(err.message || 'حدث خطأ')
    } finally {
      setBulkAdding(false)
    }
  }

  const startEdit = (lesson: any) => {
    setEditId(lesson.id)
    setEditTitle(lesson.title)
    setEditDesc(lesson.description || '')
    setEditType(lesson.type || 'video')
    setEditUrl(lesson.youtube_url || '')
    setEditAudioUrl(lesson.audio_url || '')
    setEditContent(lesson.content || '')
  }

  const cancelEdit = () => {
    setEditId(null)
  }

  const handleEdit = async () => {
    if (!editTitle.trim() || !editId) return
    if (editType === 'video' && !editUrl.trim()) return
    if (editType === 'audio' && !editAudioUrl.trim()) return
    if (editType === 'text' && !editContent.trim()) return
    setEditing(true)
    try {
      let youtubeUrl = editUrl.trim()
      if (editType === 'video' && youtubeUrl && !youtubeUrl.includes('youtube') && !youtubeUrl.includes('youtu.be')) {
        youtubeUrl = `https://www.youtube.com/watch?v=${youtubeUrl}`
      }
      const { error: updateError } = await supabase.from('lessons').update({
        title: editTitle.trim(),
        description: editDesc.trim(),
        type: editType,
        youtube_url: editType === 'video' ? youtubeUrl : null,
        audio_url: editType === 'audio' ? editAudioUrl.trim() : null,
        content: editType === 'text' ? editContent.trim() : null,
        updated_at: new Date().toISOString()
      }).eq('id', editId)
      if (updateError) throw updateError

      setLessons(prev => prev.map(l =>
        l.id === editId ? {
          ...l,
          title: editTitle.trim(),
          description: editDesc.trim(),
          type: editType,
          youtube_url: editType === 'video' ? youtubeUrl : null,
          audio_url: editType === 'audio' ? editAudioUrl.trim() : null,
          content: editType === 'text' ? editContent.trim() : null,
        } : l
      ))
      setEditId(null)
    } catch (err: any) {
      setError(err.message || 'حدث خطأ')
    } finally {
      setEditing(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      const { error: deleteError } = await supabase.from('lessons').delete().eq('id', deleteId)
      if (deleteError) throw deleteError
      setLessons(prev => prev.filter(l => l.id !== deleteId))
      setDeleteId(null)
    } catch (err: any) {
      setError(err.message || 'حدث خطأ')
    } finally {
      setDeleting(false)
    }
  }

  const execFormat = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val)
    const activeEl = document.activeElement as HTMLElement
    activeEl?.focus()
  }

  const handleTextColor = () => {
    const color = prompt('أدخل كود اللون (مثال: #ff0000)')
    if (color) execFormat('foreColor', color)
  }

  const handleDirection = (dir: 'rtl' | 'ltr') => {
    document.execCommand('justifyLeft', false, undefined)
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0) {
      const node = sel.getRangeAt(0).commonAncestorContainer
      const block = node instanceof HTMLElement ? node : node.parentElement
      if (block) block.style.direction = dir
    }
  }

  const renderRichEditor = (content: string, onChange: (val: string) => void, editorKey: string) => {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-1 flex-wrap bg-gray-100 p-2 rounded-lg border border-gray-200">
          {FORMAT_BUTTONS.map(btn => (
            <button
              key={btn.cmd}
              type="button"
              onMouseDown={e => { e.preventDefault(); execFormat(btn.cmd) }}
              className={`px-2.5 py-1 rounded hover:bg-white transition-colors text-sm ${btn.style || ''}`}
              title={btn.cmd}
            >
              {btn.label}
            </button>
          ))}
          <span className="w-px h-5 bg-gray-300 mx-1" />
          <button type="button" onMouseDown={e => { e.preventDefault(); handleTextColor() }} className="px-2.5 py-1 rounded hover:bg-white transition-colors text-sm" title="لون النص">A</button>
          <select
            onMouseDown={e => e.preventDefault()}
            onChange={e => execFormat('fontSize', e.target.value)}
            className="px-2 py-1 rounded bg-white border border-gray-200 text-xs"
          >
            <option value="">حجم</option>
            <option value="1">صغير</option>
            <option value="3">وسط</option>
            <option value="5">كبير</option>
          </select>
          <span className="w-px h-5 bg-gray-300 mx-1" />
          <button type="button" onMouseDown={e => { e.preventDefault(); handleDirection('rtl') }} className="px-2.5 py-1 rounded hover:bg-white transition-colors text-sm font-bold" title="اتجاه من اليمين">RTL</button>
          <button type="button" onMouseDown={e => { e.preventDefault(); handleDirection('ltr') }} className="px-2.5 py-1 rounded hover:bg-white transition-colors text-sm font-bold" title="اتجاه من اليسار">LTR</button>
        </div>
        <div
          ref={el => { editorRefs.current[editorKey] = el }}
          contentEditable
          dir="rtl"
          className="w-full min-h-[200px] px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-right prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: content }}
          onInput={e => onChange((e.target as HTMLElement).innerHTML)}
          onPaste={e => {
            e.preventDefault()
            const text = e.clipboardData.getData('text/plain')
            document.execCommand('insertText', false, text)
          }}
        />
      </div>
    )
  }

  const renderTypeColumn = (row: any, idx: number, field: 'new' | 'edit') => {
    const setVal = field === 'new'
      ? (val: string) => updateRow(idx, 'youtube_url', val)
      : (val: string) => setEditUrl(val)
    const val = field === 'new' ? row.youtube_url : editUrl

    if (row.type === 'video') {
      return (
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={val}
            onChange={e => setVal(e.target.value)}
            className="flex-1 px-2 py-1.5 bg-white border border-gray-200 rounded focus:ring-1 focus:ring-emerald-500 focus:border-transparent text-sm font-mono"
            placeholder="BKcJetZvOeM"
            dir="ltr"
          />
          {val && !val.includes('youtube') && !val.includes('youtu.be') && (
            <span className="text-xs text-gray-400 shrink-0 max-w-[160px] truncate" dir="ltr">
              youtube.com/watch?v={val}
            </span>
          )}
        </div>
      )
    }
    if (row.type === 'audio') {
      const audioVal = field === 'new' ? row.audio_url : editAudioUrl
      const setAudioVal = field === 'new'
        ? (val: string) => updateRow(idx, 'audio_url', val)
        : (val: string) => setEditAudioUrl(val)
      return (
        <input
          type="text"
          value={audioVal}
          onChange={e => setAudioVal(e.target.value)}
          className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded focus:ring-1 focus:ring-emerald-500 focus:border-transparent text-sm"
          placeholder="رابط SoundCloud..."
          dir="ltr"
        />
      )
    }
    if (row.type === 'text') {
      const contentVal = field === 'new' ? row.content : editContent
      const setContentVal = field === 'new'
        ? (val: string) => updateRow(idx, 'content', val)
        : (val: string) => setEditContent(val)
      const editorKey = field === 'new' ? `new-${idx}` : `edit-${editId}`
      return (
        <div className="min-w-[400px]">
          {renderRichEditor(contentVal, setContentVal, editorKey)}
        </div>
      )
    }
    return null
  }

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-600 border-t-transparent"></div></div>

  const TYPE_LABELS: Record<LessonType, string> = { video: 'فيديو', audio: 'صوت', text: 'نص مكتوب' }

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-emerald-600 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            رجوع
          </button>
          <h1 className="text-lg font-bold text-emerald-700">تعديل المحتوى</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Curriculum Details */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">عنوان المحتوى *</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent" required />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">الوصف</label>
                <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
              </div>
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
              <button type="submit" disabled={saving} className="flex-1 py-4 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-all disabled:opacity-50 shadow-lg shadow-emerald-200 flex items-center justify-center gap-2">
                {saving ? <span className="flex items-center gap-2"><div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>جاري الحفظ...</span> : <span>حفظ التعديلات</span>}
              </button>
              <Link href={projectId ? `/projects/${projectId}/curriculum` : '/admin'} className="px-6 py-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors">إلغاء</Link>
            </div>
          </form>
        </div>

        {/* Bulk Add Lessons */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">إضافة دروس جديدة</h2>
            <button onClick={addRows} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              إضافة 5 أسطر
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 w-10 text-gray-500">#</th>
                  <th className="px-4 py-3 text-gray-600">النوع</th>
                  <th className="px-4 py-3 text-gray-600">العنوان</th>
                  <th className="px-4 py-3 text-gray-600">الرابط / المحتوى</th>
                  <th className="px-4 py-3 text-gray-600">الوصف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {newRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50">
                    <td className="px-4 py-2 text-gray-400 text-center">{idx + 1}</td>
                    <td className="px-4 py-2">
                      <select
                        value={row.type}
                        onChange={e => updateRow(idx, 'type', e.target.value)}
                        className="px-2 py-1.5 bg-white border border-gray-200 rounded text-sm"
                      >
                        <option value="video">فيديو</option>
                        <option value="audio">صوت</option>
                        <option value="text">نص</option>
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={row.title}
                        onChange={e => updateRow(idx, 'title', e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded focus:ring-1 focus:ring-emerald-500 focus:border-transparent text-sm"
                        placeholder="عنوان الدرس"
                      />
                    </td>
                    <td className="px-4 py-2">
                      {renderTypeColumn(row, idx, 'new')}
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={row.description}
                        onChange={e => updateRow(idx, 'description', e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded focus:ring-1 focus:ring-emerald-500 focus:border-transparent text-sm"
                        placeholder="وصف (اختياري)"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
            <p className="text-xs text-gray-400">
              {newRows.filter(r => {
                if (r.type === 'video') return r.title.trim() && r.youtube_url.trim()
                if (r.type === 'audio') return r.title.trim() && r.audio_url.trim()
                return r.title.trim() && r.content.trim()
              }).length} دروس صالحة للإضافة
            </p>
            <button
              onClick={handleBulkAdd}
              disabled={bulkAdding}
              className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50"
            >
              {bulkAdding ? (
                <span className="flex items-center gap-2"><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>جاري الحفظ...</span>
              ) : (
                <span className="flex items-center gap-2"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>حفظ الدروس الجديدة</span>
              )}
            </button>
          </div>
        </div>

        {/* Existing Lessons */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">الدروس الحالية ({lessons.length})</h2>
          </div>
          {lessons.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-400">لا توجد دروس في هذا المحتوى بعد</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 w-10 text-gray-500">#</th>
                    <th className="px-4 py-3 text-gray-600">النوع</th>
                    <th className="px-4 py-3 text-gray-600">العنوان</th>
                    <th className="px-4 py-3 text-gray-600">الرابط / المحتوى</th>
                    <th className="px-4 py-3 text-gray-600">الوصف</th>
                    <th className="px-4 py-3 text-gray-600 w-24 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {lessons.map((lesson, idx) => (
                    <tr key={lesson.id} className="hover:bg-gray-50/50">
                      {editId === lesson.id ? (
                        <>
                          <td className="px-4 py-2 text-gray-400 text-center">{idx + 1}</td>
                          <td className="px-4 py-2">
                            <select value={editType} onChange={e => setEditType(e.target.value as LessonType)} className="px-2 py-1.5 bg-white border border-gray-200 rounded text-sm">
                              <option value="video">فيديو</option>
                              <option value="audio">صوت</option>
                              <option value="text">نص</option>
                            </select>
                          </td>
                          <td className="px-4 py-2">
                            <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded focus:ring-1 focus:ring-emerald-500 text-sm" />
                          </td>
                          <td className="px-4 py-2">
                            {editType === 'video' ? (
                              <input type="text" value={editUrl} onChange={e => setEditUrl(e.target.value)} className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded focus:ring-1 focus:ring-emerald-500 text-sm font-mono" dir="ltr" placeholder="YouTube URL" />
                            ) : editType === 'audio' ? (
                              <input type="text" value={editAudioUrl} onChange={e => setEditAudioUrl(e.target.value)} className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded focus:ring-1 focus:ring-emerald-500 text-sm" dir="ltr" placeholder="SoundCloud URL" />
                            ) : (
                              <div className="min-w-[300px]">
                                <div className="flex items-center gap-1 flex-wrap bg-gray-100 p-1.5 rounded border border-gray-200 mb-1">
                                  {FORMAT_BUTTONS.map(btn => (
                                    <button key={btn.cmd} type="button" onMouseDown={e => { e.preventDefault(); execFormat(btn.cmd) }} className={`px-2 py-0.5 rounded hover:bg-white text-xs ${btn.style || ''}`}>{btn.label}</button>
                                  ))}
                                  <button type="button" onMouseDown={e => { e.preventDefault(); handleTextColor() }} className="px-2 py-0.5 rounded hover:bg-white text-xs">لون</button>
                                  <button type="button" onMouseDown={e => { e.preventDefault(); handleDirection('rtl') }} className="px-2 py-0.5 rounded hover:bg-white text-xs font-bold">RTL</button>
                                  <button type="button" onMouseDown={e => { e.preventDefault(); handleDirection('ltr') }} className="px-2 py-0.5 rounded hover:bg-white text-xs font-bold">LTR</button>
                                </div>
                                <div
                                  contentEditable
                                  dir="rtl"
                                  className="w-full min-h-[120px] px-3 py-2 bg-white border border-gray-200 rounded text-sm"
                                  dangerouslySetInnerHTML={{ __html: editContent }}
                                  onInput={e => setEditContent((e.target as HTMLElement).innerHTML)}
                                  onPaste={e => { e.preventDefault(); document.execCommand('insertText', false, e.clipboardData.getData('text/plain')) }}
                                />
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-2">
                            <input type="text" value={editDesc} onChange={e => setEditDesc(e.target.value)} className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded focus:ring-1 focus:ring-emerald-500 text-sm" />
                          </td>
                          <td className="px-4 py-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={handleEdit} disabled={editing} className="px-3 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-xs font-medium">
                                {editing ? '...' : 'حفظ'}
                              </button>
                              <button onClick={cancelEdit} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-xs font-medium">
                                إلغاء
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 text-gray-400 text-center">{idx + 1}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                              lesson.type === 'video' ? 'bg-blue-100 text-blue-700' :
                              lesson.type === 'audio' ? 'bg-purple-100 text-purple-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {lesson.type === 'video' ? '🎬 فيديو' : lesson.type === 'audio' ? '🎧 صوت' : '📝 نص'}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900">{lesson.title}</td>
                          <td className="px-4 py-3">
                            {lesson.type === 'video' && lesson.youtube_url && (
                              <a href={lesson.youtube_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 font-mono text-xs truncate block max-w-[250px]" dir="ltr">
                                {lesson.youtube_url}
                              </a>
                            )}
                            {lesson.type === 'audio' && lesson.audio_url && (
                              <a href={lesson.audio_url} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:text-purple-800 text-xs truncate block max-w-[250px]" dir="ltr">
                                {lesson.audio_url}
                              </a>
                            )}
                            {lesson.type === 'text' && (
                              <span className="text-xs text-gray-500">محتوى نصي ({lesson.content?.length || 0} حرف)</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{lesson.description || '—'}</td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => startEdit(lesson)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="تعديل">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                              </button>
                              <button onClick={() => setDeleteId(lesson.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="حذف">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteId(null)} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">تأكيد حذف الدرس</h3>
            <p className="text-gray-600 text-center mb-6">هل أنت متأكد من حذف هذا الدرس؟ هذا الإجراء لا يمكن التراجع عنه.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} disabled={deleting} className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 disabled:opacity-50">إلغاء</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {deleting ? <span className="flex items-center gap-2"><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>جاري الحذف...</span> : <span>حذف الدرس</span>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
