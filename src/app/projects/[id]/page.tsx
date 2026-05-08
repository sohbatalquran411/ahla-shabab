'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAppSettings } from '@/hooks/useAppSettings'
import Header from '@/components/Header'

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const [projectId, setProjectId] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [project, setProject] = useState<any>(null)
  const [forms, setForms] = useState<any[]>([])
  const [userResponses, setUserResponses] = useState<any[]>([])
  const [expandedForm, setExpandedForm] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleteFormId, setDeleteFormId] = useState<string | null>(null)
  const [deleteProjectModal, setDeleteProjectModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
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
    if (projectId) {
      fetchData()
    }
  }, [projectId])

  const fetchData = async () => {
    if (!projectId) return

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (!authUser) {
        router.push('/login')
        return
      }

      // Run all independent queries in parallel
      const [profileResult, projectResult, formsResult, responsesResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', authUser.id).single(),
        supabase.from('projects').select('*').eq('id', projectId).single(),
        supabase.from('forms').select('*').eq('project_id', projectId).eq('is_active', true),
        supabase.from('form_responses').select('*').eq('user_id', authUser.id)
      ])

      const profileData = profileResult.data
      const projectData = projectResult.data
      const formsData = formsResult.data
      const responsesData = responsesResult.data

      if (!profileData || profileData.status !== 'approved') {
        router.push('/login')
        return
      }

      if (!projectData) {
        router.push('/dashboard')
        return
      }

      setUser(authUser)
      setProfile(profileData)
      setProject(projectData)
      setForms(formsData || [])
      setUserResponses(responsesData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }


  const handleDeleteResponse = async (responseId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الاستجابة؟')) return;
    try {
      const { error } = await supabase.from('form_responses').delete().eq('id', responseId);
      if (error) throw error;
      setUserResponses(prev => prev.filter(r => r.id !== responseId));
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء الحذف');
    }
  };

  const handleDeleteForm = async () => {
    if (!deleteFormId || profile?.role !== 'admin') return

    setDeleting(true)
    try {
      const { error } = await supabase
        .from('forms')
        .delete()
        .eq('id', deleteFormId)

      if (error) throw error

      setForms(prev => prev.filter(f => f.id !== deleteFormId))
      setDeleteFormId(null)
    } catch (error) {
      console.error('Error deleting form:', error)
      alert('حدث خطأ أثناء حذف الفورم')
    } finally {
      setDeleting(false)
    }
  }

  const handleDeleteProject = async () => {
    if (!projectId || profile?.role !== 'admin') return

    setDeleting(true)
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)

      if (error) throw error

      router.push('/projects')
    } catch (error) {
      console.error('Error deleting project:', error)
      alert('حدث خطأ أثناء حذف المشروع')
    } finally {
      setDeleting(false)
    }
  }

  const getIcon = (iconName: string) => {
    const icons: Record<string, any> = {
      mosque: (
        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      ),
      sun: (
        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      quran: (
        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    }
    return icons[iconName] || icons.mosque
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
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={`
        fixed inset-y-0 right-0 z-50 w-2/3 max-w-sm bg-white shadow-2xl transform transition-transform duration-300 lg:hidden
        ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="h-full flex flex-col bg-white">
          <div className="px-6 pt-8 pb-6 border-b border-gray-100 text-center relative">
            <button 
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 left-4 p-2 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-blue-50 flex items-center justify-center border-2 border-blue-100 shadow-sm overflow-hidden">
              {settings.app_logo ? (
                <img src={settings.app_logo} alt="شعار" className="w-full h-full object-cover" />
              ) : (
                <img src="/icon.svg" alt="شعار" className="w-full h-full object-cover" />
              )}
            </div>
            <h1 className="text-gray-900 font-bold text-xl mb-1">{settings.app_name}</h1>
            <p className="text-gray-500 text-sm">{settings.app_description}</p>
          </div>

          <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-2">
            <Link href="/dashboard" onClick={() => setSidebarOpen(false)} className="flex items-center gap-4 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-2xl transition-all duration-200 active:scale-95">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
              </div>
              <span className="font-medium">الرئيسية</span>
            </Link>

            <Link href="/profile" onClick={() => setSidebarOpen(false)} className="flex items-center gap-4 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-2xl transition-all duration-200 active:scale-95">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 01 8 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </div>
              <span className="font-medium">الملف الشخصي</span>
            </Link>

            {user?.role === 'admin' && (
              <>
                <div className="h-px bg-gray-200 my-4"></div>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-3 px-3">الإدارة</p>
                <Link href="/admin" onClick={() => setSidebarOpen(false)} className="flex items-center gap-4 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-2xl transition-all duration-200 active:scale-95">
                  <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  </div>
                  <span className="font-medium">لوحة تحكم المدير</span>
                </Link>
              </>
            )}
          </nav>

          <div className="p-4 border-t border-gray-100">
            <button onClick={handleLogout} className="flex items-center justify-center gap-3 w-full px-4 py-3.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl transition-all duration-200 active:scale-95">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              <span className="font-medium">تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Project Info */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 mb-8">
          {project.image_url ? (
            <div className="w-full h-56 overflow-hidden">
              <img 
                src={project.image_url} 
                alt={project.name} 
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div
              className="w-full h-56 flex items-center justify-center text-6xl"
              style={{ backgroundColor: `${project.color}15`, color: project.color }}
            >
              {getIcon(project.icon)}
            </div>
          )}
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{project.name}</h2>
            <p className="text-gray-600">{project.description}</p>
            <div className="mt-3 flex items-center gap-2">
              <span className={`px-3 py-1 text-sm rounded-full ${
                project.target_gender === 'male' 
                  ? 'bg-blue-100 text-blue-700' 
                  : project.target_gender === 'female'
                    ? 'bg-pink-100 text-pink-700'
                    : 'bg-purple-100 text-purple-700'
              }`}>
                {project.target_gender === 'male' ? 'للشباب فقط' : project.target_gender === 'female' ? 'للبنات فقط' : 'للجميع'}
              </span>
            </div>
          </div>
        </div>

        {/* Forms */}
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">الفورمز المتاحة</h3>
          {profile?.role === 'admin' && (
            <Link
              href={`/forms/create?project_id=${project.id}`}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              إضافة فورم جديد
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {forms.map((form) => {
            
            const formResponses = userResponses.filter(r => r.form_id === form.id)
            const isCompleted = formResponses.length > 0
            
            return (
              <div
                key={form.id}
                className={`bg-white rounded-2xl shadow-sm border transition-all ${
                  expandedForm === form.id ? 'border-blue-300 shadow-md' : 'hover:shadow-lg hover:border-blue-200 border-gray-100'
                }`}
              >
                <div className={`p-6 cursor-pointer ${expandedForm === form.id ? 'pb-4' : ''}`} onClick={() => setExpandedForm(prev => prev === form.id ? null : form.id)}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      {profile?.role === 'admin' && (
                        <div className="flex gap-1 relative z-10">
                          <Link href={`/forms/${form.id}/edit`} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="تعديل الفورم">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </Link>
                          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteFormId(form.id) }} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="حذف الفورم">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      )}
                      <div className={`p-2 rounded-lg transition-colors ${expandedForm === form.id ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}>
                        <svg className={`w-5 h-5 transition-transform ${expandedForm === form.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
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
                      <span className="text-sm text-green-600 font-medium bg-green-50 px-3 py-1.5 rounded-lg">
                        {formResponses.length} تسجيل
                      </span>
                    )}
                  </div>
                </div>

                {/* Expanded responses table */}
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
                          <tr>
                            <td colSpan={3} className="p-6 text-center text-gray-400">لا توجد تسجيلات بعد</td>
                          </tr>
                        ) : (
                          formResponses.map(r => (
                            <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="p-3 pr-6 text-gray-900" dir="ltr">{new Date(r.submitted_at).toLocaleString('ar-EG')}</td>
                              <td className="p-3 text-blue-600 font-medium">{r.score} / {r.max_score}</td>
                              <td className="p-3 pl-6">
                                {form.allow_delete_responses && (
                                  <button onClick={() => handleDeleteResponse(r.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors flex items-center gap-1" title="حذف">
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
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-500">لا توجد فورمز في هذا المشروع حالياً</p>
            </div>
          )}
        </div>
      </main>

      
      {/* Delete Form Confirmation Modal */}
      {deleteFormId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setDeleteFormId(null)}
          />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">تأكيد حذف الفورم</h3>
            <p className="text-gray-600 text-center mb-6">
              هل أنت متأكد من حذف هذا الفورم؟
              <br />
              <span className="text-red-500 text-sm">سيتم حذف جميع الأسئلة والردود المرتبطة به. هذا الإجراء لا يمكن التراجع عنه.</span>
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteFormId(null)}
                disabled={deleting}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                إلغاء
              </button>
              <button
                onClick={handleDeleteForm}
                disabled={deleting}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    جاري الحذف...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    حذف الفورم
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}