'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const EMPTY_ROW = { title: '', description: '', youtube_url: '' }

export default function EditCurriculumPage({ params }: { params: Promise<{ id: string }> }) {
  const [curriculumId, setCurriculumId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [projectId, setProjectId] = useState('')
  const [lessons, setLessons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Bulk add
  const [newRows, setNewRows] = useState(Array(5).fill(null).map(() => ({ ...EMPTY_ROW })))
  const [bulkAdding, setBulkAdding] = useState(false)

  // Inline edit
  const [editId, setEditId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editUrl, setEditUrl] = useState('')
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
    if (!title.trim()) { setError('يرجى إدخال عنوان المنهج'); return }
    setSaving(true)
    try {
      const { error: updateError } = await supabase.from('curricula').update({
        title: title.trim(),
        description: description.trim(),
        updated_at: new Date().toISOString()
      }).eq('id', curriculumId)
      if (updateError) throw updateError
    } catch (err: any) {
      setError(err.message || 'حدث خطأ')
    } finally {
      setSaving(false)
    }
  }

  const updateRow = (idx: number, field: string, value: string) => {
    setNewRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r))
  }

  const addRows = () => {
    setNewRows(prev => [...prev, ...Array(5).fill(null).map(() => ({ ...EMPTY_ROW }))])
  }

  const handleBulkAdd = async () => {
    const valid = newRows.filter(r => r.title.trim() && r.youtube_url.trim())
    if (valid.length === 0) { setError('لم يتم إدخال أي دروس صالحة'); return }
    setBulkAdding(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      let nextOrder = lessons.length > 0 ? Math.max(...lessons.map(l => l.order_index)) + 1 : 0

      const toInsert = valid.map(r => {
        let url = r.youtube_url.trim()
        if (!url.includes('youtube') && !url.includes('youtu.be')) {
          url = `https://www.youtube.com/watch?v=${url}`
        }
        return {
          curriculum_id: curriculumId,
          title: r.title.trim(),
          description: r.description.trim(),
          youtube_url: url,
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
    setEditUrl(lesson.youtube_url)
  }

  const cancelEdit = () => {
    setEditId(null)
  }

  const handleEdit = async () => {
    if (!editTitle.trim() || !editUrl.trim() || !editId) return
    setEditing(true)
    try {
      const { error: updateError } = await supabase.from('lessons').update({
        title: editTitle.trim(),
        description: editDesc.trim(),
        youtube_url: editUrl.trim(),
        updated_at: new Date().toISOString()
      }).eq('id', editId)
      if (updateError) throw updateError

      setLessons(prev => prev.map(l =>
        l.id === editId ? { ...l, title: editTitle.trim(), description: editDesc.trim(), youtube_url: editUrl.trim() } : l
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

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-600 border-t-transparent"></div></div>

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-emerald-600 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            رجوع
          </button>
          <h1 className="text-lg font-bold text-emerald-700">تعديل المنهج</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Curriculum Details */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">عنوان المنهج *</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent" required />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">الوصف</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
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
                  <th className="px-4 py-3 text-gray-600">اسم الفيديو</th>
                  <th className="px-4 py-3 text-gray-600">كود الفيديو</th>
                  <th className="px-4 py-3 text-gray-600">الوصف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {newRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50">
                    <td className="px-4 py-2 text-gray-400 text-center">{idx + 1}</td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={row.title}
                        onChange={e => updateRow(idx, 'title', e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded focus:ring-1 focus:ring-emerald-500 focus:border-transparent text-sm"
                        placeholder="اسم الفيديو"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={row.youtube_url}
                          onChange={e => updateRow(idx, 'youtube_url', e.target.value)}
                          className="flex-1 px-2 py-1.5 bg-white border border-gray-200 rounded focus:ring-1 focus:ring-emerald-500 focus:border-transparent text-sm font-mono"
                          placeholder="BKcJetZvOeM"
                          dir="ltr"
                        />
                        {row.youtube_url && !row.youtube_url.includes('youtube') && !row.youtube_url.includes('youtu.be') && (
                          <span className="text-xs text-gray-400 shrink-0 max-w-[160px] truncate" dir="ltr">
                            youtube.com/watch?v={row.youtube_url}
                          </span>
                        )}
                      </div>
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
              {newRows.filter(r => r.title.trim() && r.youtube_url.trim()).length} دروس صالحة للإضافة
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
            <div className="px-6 py-12 text-center text-gray-400">لا توجد دروس في هذا المنهج بعد</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 w-10 text-gray-500">#</th>
                    <th className="px-4 py-3 text-gray-600">اسم الفيديو</th>
                    <th className="px-4 py-3 text-gray-600">رابط المشاهدة</th>
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
                            <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded focus:ring-1 focus:ring-emerald-500 text-sm" />
                          </td>
                          <td className="px-4 py-2">
                            <input type="text" value={editUrl} onChange={e => setEditUrl(e.target.value)} className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded focus:ring-1 focus:ring-emerald-500 text-sm font-mono" dir="ltr" />
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
                          <td className="px-4 py-3 font-medium text-gray-900">{lesson.title}</td>
                          <td className="px-4 py-3">
                            <a href={lesson.youtube_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 font-mono text-xs truncate block max-w-[300px]" dir="ltr">
                              {lesson.youtube_url}
                            </a>
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
