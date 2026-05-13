'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAppSettings } from '@/hooks/useAppSettings'
import Header from '@/components/Header'

export default function ProjectFormsPage({ params }: { params: Promise<{ id: string }> }) {
  const [projectId, setProjectId] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [project, setProject] = useState<any>(null)
  const [forms, setForms] = useState<any[]>([])
  const [userResponses, setUserResponses] = useState<any[]>([])
  const [expandedForm, setExpandedForm] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [deletingResponse, setDeletingResponse] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

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

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm transition-opacity" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Mobile Sidebar */}
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
        {/* Header */}
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

        {/* Forms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {forms.map((form) => {
            const formResponses = userResponses.filter(r => r.form_id === form.id)
            const isCompleted = formResponses.length > 0

            return (
              <div key={form.id} className={`bg-white rounded-2xl shadow-sm border transition-all ${expandedForm === form.id ? 'border-blue-300 shadow-md' : 'hover:shadow-lg hover:border-blue-200 border-gray-100'}`}>
                <div className={`p-6 cursor-pointer ${expandedForm === form.id ? 'pb-4' : ''}`} onClick={() => setExpandedForm(prev => prev === form.id ? null : form.id)}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    </div>
                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      <div className={`p-2 rounded-lg transition-colors ${expandedForm === form.id ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}>
                        <svg className={`w-5 h-5 transition-transform ${expandedForm === form.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>
                  </div>

                  <h4 className="text-lg font-bold text-gray-900 mb-2">{form.name}</h4>
                  <p className="text-gray-600 text-sm line-clamp-2">{form.description || 'لا يوجد وصف'}</p>

                  <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                    <Link href={`/forms/${form.id}`} onClick={e => e.stopPropagation()} className="text-blue-600 font-medium text-sm flex items-center gap-1 hover:text-blue-700">
                      {isCompleted && !form.allow_multiple ? 'لقد قمت بالتسجيل مسبقاً' : 'تسجيل جديد'}
                      <svg className="w-4 h-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </Link>
                    {isCompleted && (
                      <span className="text-sm text-green-600 font-medium bg-green-50 px-3 py-1.5 rounded-lg">{formResponses.length} تسجيل</span>
                    )}
                  </div>
                </div>

                {expandedForm === form.id && (
                  <div className="border-t border-gray-100 overflow-x-auto">
                    <table className="w-full text-right text-sm">
                      <thead className="bg-gray-50 text-gray-600">
                        <tr>
                          <th className="p-3 pr-6">التاريخ والوقت</th>
                          <th className="p-3">النتيجة</th>
                          <th className="p-3 pl-6">إجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {formResponses.length === 0 ? (
                          <tr><td colSpan={3} className="p-6 text-center text-gray-400">لا توجد تسجيلات بعد</td></tr>
                        ) : (
                          formResponses.map(r => (
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
