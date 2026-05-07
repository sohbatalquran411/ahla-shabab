'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const [projectId, setProjectId] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [project, setProject] = useState<any>(null)
  const [forms, setForms] = useState<any[]>([])
  const [completedFormIds, setCompletedFormIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteModal, setDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()

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
      setCompletedFormIds(responsesData?.map((r: any) => r.form_id) || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
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
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            رجوع
          </button>
          <h1 className="text-lg font-bold text-blue-700">{project.name}</h1>
          
          {/* Management buttons removed as requested - management should be in admin panel only */}
          <div className="w-8" />
        </div>
      </header>

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
          {/* Add form button removed */}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {forms.map((form) => {
            const isCompleted = completedFormIds.includes(form.id)
            
            return (
              <div
                key={form.id}
                className={`bg-white rounded-2xl p-6 shadow-sm border transition-all hover:shadow-lg hover:border-blue-200 ${
                  isCompleted ? 'border-green-200' : 'border-gray-100'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex items-center gap-2">
                    {isCompleted && (
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                        مكتمل ✓
                      </span>
                    )}
                    {/* Edit form button removed */}
                  </div>
                </div>
                <Link href={`/forms/${form.id}`}>
                  <h4 className="text-lg font-bold text-gray-900 mb-2 hover:text-blue-600 transition-colors">{form.name}</h4>
                  <p className="text-gray-600 text-sm line-clamp-2">
                    {form.description || 'لا يوجد وصف'}
                  </p>
                  <div className="mt-4">
                    <span className="text-blue-600 font-medium text-sm flex items-center gap-1">
                      {isCompleted ? 'عرض النتيجة' : 'ابدأ الآن'}
                      <svg className="w-4 h-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </span>
                  </div>
                </Link>
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

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setDeleteModal(false)}
          />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">تأكيد الحذف</h3>
            <p className="text-gray-600 text-center mb-6">
              هل أنت متأكد من حذف مشروع "<strong>{project.name}</strong>"؟
              <br />
              <span className="text-red-500 text-sm">هذا الإجراء لا يمكن التراجع عنه.</span>
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal(false)}
                disabled={deleting}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                إلغاء
              </button>
              <button
                onClick={handleDeleteProject}
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
                    حذف
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