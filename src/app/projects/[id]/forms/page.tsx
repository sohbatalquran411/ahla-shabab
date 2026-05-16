'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAppSettings } from '@/hooks/useAppSettings'
import Header from '@/components/Header'

type SortDir = 'asc' | 'desc' | null

export default function ProjectFormsPage({ params }: { params: Promise<{ id: string }> }) {
  const [projectId, setProjectId] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [project, setProject] = useState<any>(null)
  const [forms, setForms] = useState<any[]>([])
  const [userResponses, setUserResponses] = useState<any[]>([])
  const [expandedForm, setExpandedForm] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [resultSearch, setResultSearch] = useState('')
  const [resultSortCol, setResultSortCol] = useState<string>('submitted_at')
  const [resultSortDir, setResultSortDir] = useState<SortDir>('desc')

  const router = useRouter()
  const supabase = createClient()
  const { settings } = useAppSettings()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  useEffect(() => {
    params.then(({ id }) => setProjectId(id))
  }, [params])

  useEffect(() => {
    if (projectId) fetchData()
  }, [projectId])

  const fetchData = async () => {
    if (!projectId) return
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) { router.push('/login'); return }

      const [profileResult, projectResult, formsResult, responsesResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', authUser.id).single(),
        supabase.from('projects').select('*').eq('id', projectId).single(),
        supabase.from('forms').select('*').eq('project_id', projectId).eq('is_active', true),
        supabase.from('form_responses').select('*').eq('user_id', authUser.id)
      ])

      const profileData = profileResult.data
      const projectData = projectResult.data

      if (!profileData || profileData.status !== 'approved') { router.push('/login'); return }
      if (!projectData) { router.push('/dashboard'); return }

      setUser(authUser)
      setProfile(profileData)
      setProject(projectData)
      setForms(formsResult.data || [])
      setUserResponses(responsesResult.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteResponse = async (responseId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الاستجابة؟')) return
    try {
      const { error } = await supabase.from('form_responses').delete().eq('id', responseId)
      if (error) throw error
      setUserResponses(prev => prev.filter(r => r.id !== responseId))
    } catch (err) {
      console.error(err)
      alert('حدث خطأ أثناء الحذف')
    }
  }

  const handleResultSort = (col: string) => {
    if (resultSortCol === col) {
      if (resultSortDir === 'asc') setResultSortDir('desc')
      else if (resultSortDir === 'desc') setResultSortDir(null)
      else setResultSortDir('asc')
    } else {
      setResultSortCol(col)
      setResultSortDir('asc')
    }
  }

  const getSortIcon = (col: string) => {
    if (resultSortCol !== col) {
      return (
        <svg className="w-3 h-3 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      )
    }
    if (resultSortDir === 'asc') {
      return (
        <svg className="w-3 h-3 text-blue-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      )
    }
    return (
      <svg className="w-3 h-3 text-blue-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    )
  }

  const handleCardClick = (form: any, isCompleted: boolean) => {
    if (form.allow_multiple) {
      router.push(`/forms/${form.id}`)
    } else if (isCompleted) {
      alert('يوجد تسجيل سابق')
    } else {
      router.push(`/forms/${form.id}`)
    }
  }

  const processedResponses = useMemo(() => {
    const expandedId = expandedForm
    if (!expandedId) return []
    let result = [...(userResponses.filter(r => r.form_id === expandedId))]

    if (resultSearch.trim()) {
      const q = resultSearch.toLowerCase().trim()
      result = result.filter(r =>
        new Date(r.submitted_at).toLocaleString('ar-EG').toLowerCase().includes(q) ||
        String(r.score).includes(q)
      )
    }

    if (resultSortDir) {
      result.sort((a, b) => {
        let aVal: any, bVal: any
        if (resultSortCol === 'submitted_at') {
          aVal = new Date(a.submitted_at).getTime()
          bVal = new Date(b.submitted_at).getTime()
        } else if (resultSortCol === 'score') {
          aVal = Number(a.score) || 0
          bVal = Number(b.score) || 0
        } else {
          return 0
        }
        if (aVal < bVal) return resultSortDir === 'asc' ? -1 : 1
        if (aVal > bVal) return resultSortDir === 'asc' ? 1 : -1
        return 0
      })
    }

    return result
  }, [expandedForm, userResponses, resultSearch, resultSortCol, resultSortDir])

  if (loading || !project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      <Header user={user} settings={settings} onMenuClick={() => setSidebarOpen(true)} />

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm transition-opacity" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 right-0 z-50 w-2/3 max-w-sm bg-white shadow-2xl transform transition-transform duration-300 lg:hidden ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col bg-white">
          <div className="px-6 pt-8 pb-6 border-b border-gray-100 text-center relative">
            <button onClick={() => setSidebarOpen(false)} className="absolute top-4 left-4 p-2 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-blue-50 flex items-center justify-center border-2 border-blue-100 shadow-sm overflow-hidden">
              {settings.app_logo ? <img src={settings.app_logo} alt="شعار" className="w-full h-full object-cover" /> : <img src="/icon.svg" alt="شعار" className="w-full h-full object-cover" />}
            </div>
            <h1 className="text-gray-900 font-bold text-xl mb-1">{settings.app_name}</h1>
            <p className="text-gray-500 text-sm">{settings.app_description}</p>
          </div>
          <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-2">
            <Link href="/dashboard" onClick={() => setSidebarOpen(false)} className="flex items-center gap-4 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-2xl transition-all">الرئيسية</Link>
            <Link href="/profile" onClick={() => setSidebarOpen(false)} className="flex items-center gap-4 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-2xl transition-all">الملف الشخصي</Link>
            {user?.role === 'admin' && <Link href="/admin" onClick={() => setSidebarOpen(false)} className="flex items-center gap-4 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-2xl transition-all">لوحة تحكم المدير</Link>}
          </nav>
          <div className="p-4 border-t border-gray-100">
            <button onClick={handleLogout} className="flex items-center justify-center gap-3 w-full px-4 py-3.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl transition-all">تسجيل الخروج</button>
          </div>
        </div>
      </aside>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href={`/projects/${projectId}`} className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors mb-4">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            رجوع للمشروع
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          <p className="text-gray-500 mt-1">النماذج المتاحة في هذا المشروع</p>
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-6">الفورمز المتاحة</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {forms.map((form) => {
            const formResponses = userResponses.filter(r => r.form_id === form.id)
            const isCompleted = formResponses.length > 0

            return (
              <div key={form.id} className={`bg-white rounded-2xl overflow-hidden shadow-sm border transition-all ${expandedForm === form.id ? 'border-blue-300 shadow-md' : 'hover:shadow-lg hover:border-blue-200 border-gray-100'}`}>
                {/* Image / Icon */}
                <div
                  className="relative cursor-pointer"
                  onClick={() => handleCardClick(form, isCompleted)}
                >
                  {form.image_url ? (
                    <div className="w-full h-44 overflow-hidden">
                      <img
                        src={form.image_url}
                        alt={form.name}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-44 flex items-center justify-center bg-blue-50">
                      <svg className="w-16 h-16 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5">
                  <h4 className="text-lg font-bold text-gray-900 mb-1.5">{form.name}</h4>
                  {form.description && (
                    <p className="text-gray-500 text-sm line-clamp-2 mb-4">{form.description}</p>
                  )}

                  <div className="flex items-center justify-between">
                    {form.allow_multiple ? (
                      <>
                        {isCompleted && (
                          <button
                            onClick={() => setExpandedForm(prev => prev === form.id ? null : form.id)}
                            className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${expandedForm === form.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            عرض النتائج
                          </button>
                        )}
                        {!isCompleted && <div />}
                      </>
                    ) : isCompleted ? (
                      <span className="text-gray-500 text-sm font-medium">تم التسجيل مسبقاً</span>
                    ) : (
                      <button
                        onClick={() => router.push(`/forms/${form.id}`)}
                        className="text-blue-600 font-medium text-sm flex items-center gap-1 hover:text-blue-700"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        تسجيل جديد
                      </button>
                    )}
                  </div>
                </div>

                {/* Results Table */}
                {expandedForm === form.id && (
                  <div>
                    <div className="px-4 py-2 border-t border-gray-100 bg-gray-50/50 flex items-center gap-3">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={resultSearch}
                          onChange={(e) => setResultSearch(e.target.value)}
                          placeholder="بحث في النتائج..."
                          className="w-full pr-9 pl-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <svg className="w-4 h-4 text-gray-400 absolute right-3 top-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <span className="text-xs text-gray-500 shrink-0">{processedResponses.length} نتيجة</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-sm">
                        <thead className="bg-gray-50 text-gray-600">
                          <tr>
                            <th
                              className="p-3 pr-6 cursor-pointer hover:bg-gray-100 select-none"
                              onClick={() => handleResultSort('submitted_at')}
                            >
                              <div className="flex items-center gap-1.5">
                                التاريخ والوقت {getSortIcon('submitted_at')}
                              </div>
                            </th>
                            <th
                              className="p-3 cursor-pointer hover:bg-gray-100 select-none"
                              onClick={() => handleResultSort('score')}
                            >
                              <div className="flex items-center gap-1.5">
                                النتيجة {getSortIcon('score')}
                              </div>
                            </th>
                            <th className="p-3 pl-6">إجراءات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {processedResponses.length === 0 ? (
                            <tr><td colSpan={3} className="p-6 text-center text-gray-400">
                              {resultSearch ? 'لا توجد نتائج تطابق بحثك' : 'لا توجد تسجيلات بعد'}
                            </td></tr>
                          ) : (
                            processedResponses.map(r => (
                              <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="p-3 pr-6 text-gray-900" dir="ltr">{new Date(r.submitted_at).toLocaleString('ar-EG')}</td>
                                <td className="p-3 text-blue-600 font-medium">{r.score} / {r.max_score}</td>
                                <td className="p-3 pl-6">
                                  {form.allow_delete_responses && (
                                    <button onClick={() => handleDeleteResponse(r.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg" title="حذف">
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {forms.length === 0 && (
            <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-gray-100">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <p className="text-gray-500">لا توجد فورمز في هذا المشروع حالياً</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
