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
  const [curricula, setCurricula] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
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

      const [profileResult, projectResult, formsResult, curriculaResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', authUser.id).single(),
        supabase.from('projects').select('*').eq('id', projectId).single(),
        supabase.from('forms').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
        supabase.from('curricula').select('*').eq('project_id', projectId).order('created_at', { ascending: false })
      ])

      const profileData = profileResult.data
      const projectData = projectResult.data

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
      setForms(formsResult.data || [])
      setCurricula(curriculaResult.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
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

        {/* Forms Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">النماذج</h3>
            {(profile?.role === 'admin' || profile?.role === 'supervisor') && (
              <Link
                href={`/forms/create?project_id=${project.id}`}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                إضافة فورم
              </Link>
            )}
          </div>
          {forms.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-400">لا توجد فورمز في هذا المشروع بعد</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-sm font-medium text-gray-600">الاسم</th>
                    <th className="px-6 py-3 text-sm font-medium text-gray-600">تاريخ الإنشاء</th>
                    <th className="px-6 py-3 text-sm font-medium text-gray-600 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {forms.map(form => (
                    <tr key={form.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{form.name}</td>
                      <td className="px-6 py-4 text-gray-500 text-sm">{new Date(form.created_at).toLocaleDateString('ar-EG')}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link href={`/forms/${form.id}`} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="عرض">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          </Link>
                          {(profile?.role === 'admin' || profile?.role === 'supervisor') && (
                            <>
                              <Link href={`/forms/${form.id}/edit`} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="تعديل">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                              </Link>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Curricula Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">المناهج التعليمية</h3>
            {(profile?.role === 'admin' || profile?.role === 'supervisor') && (
              <Link
                href={`/admin/curricula/create?project_id=${project.id}`}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 text-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                إضافة منهج
              </Link>
            )}
          </div>
          {curricula.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-400">لا توجد مناهج في هذا المشروع بعد</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-sm font-medium text-gray-600">العنوان</th>
                    <th className="px-6 py-3 text-sm font-medium text-gray-600">تاريخ الإنشاء</th>
                    <th className="px-6 py-3 text-sm font-medium text-gray-600 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {curricula.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{c.title}</td>
                      <td className="px-6 py-4 text-gray-500 text-sm">{new Date(c.created_at).toLocaleDateString('ar-EG')}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link href={`/projects/${project.id}/curriculum`} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="عرض الدروس">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          </Link>
                          {(profile?.role === 'admin' || profile?.role === 'supervisor') && (
                            <Link href={`/admin/curricula/${c.id}/edit`} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="تعديل">
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}