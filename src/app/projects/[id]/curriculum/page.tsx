'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAppSettings } from '@/hooks/useAppSettings'
import Header from '@/components/Header'

export default function CurriculumPage({ params }: { params: Promise<{ id: string }> }) {
  const [projectId, setProjectId] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [project, setProject] = useState<any>(null)
  const [curricula, setCurricula] = useState<any[]>([])
  const [allLessons, setAllLessons] = useState<any[]>([])
  const [progress, setProgress] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [deleteCurriculumId, setDeleteCurriculumId] = useState<string | null>(null)
  const [deleteLessonId, setDeleteLessonId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const router = useRouter()
  const supabase = createClient()
  const { settings } = useAppSettings()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleDeleteCurriculum = async () => {
    if (!deleteCurriculumId || deleting) return
    setDeleting(true)
    try {
      await supabase.from('curricula').delete().eq('id', deleteCurriculumId)
      setCurricula(prev => prev.filter(c => c.id !== deleteCurriculumId))
      setAllLessons(prev => prev.filter(l => l.curriculum_id !== deleteCurriculumId))
      setDeleteCurriculumId(null)
    } catch (error) {
      console.error('Error deleting curriculum:', error)
      alert('حدث خطأ أثناء حذف المنهج')
    } finally {
      setDeleting(false)
    }
  }

  const handleDeleteLesson = async () => {
    if (!deleteLessonId || deleting) return
    setDeleting(true)
    try {
      await supabase.from('lessons').delete().eq('id', deleteLessonId)
      setAllLessons(prev => prev.filter(l => l.id !== deleteLessonId))
      setDeleteLessonId(null)
    } catch (error) {
      console.error('Error deleting lesson:', error)
      alert('حدث خطأ أثناء حذف الدرس')
    } finally {
      setDeleting(false)
    }
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

      const { data: profileData } = await supabase
        .from('profiles').select('*').eq('id', authUser.id).single()

      if (!profileData || profileData.status !== 'approved') { router.push('/login'); return }

      const { data: projectData } = await supabase
        .from('projects').select('*').eq('id', projectId).single()

      if (!projectData) { router.push('/dashboard'); return }

      setUser(authUser)
      setProfile(profileData)
      setProject(projectData)

      // Fetch curricula
      const { data: curriculaData } = await supabase
        .from('curricula').select('*').eq('project_id', projectId).order('created_at')

      setCurricula(curriculaData || [])

      if (curriculaData && curriculaData.length > 0) {
        const curriculumIds = curriculaData.map(c => c.id)

        // Fetch all lessons for all curricula
        const { data: lessonsData } = await supabase
          .from('lessons').select('*')
          .in('curriculum_id', curriculumIds)
          .order('order_index')

        setAllLessons(lessonsData || [])

        // Fetch user's progress for all lessons
        const lessonIds = (lessonsData || []).map(l => l.id)
        if (lessonIds.length > 0) {
          const { data: progressData } = await supabase
            .from('lesson_progress').select('*')
            .eq('user_id', authUser.id)
            .in('lesson_id', lessonIds)

          const progressMap: Record<string, any> = {}
          ;(progressData || []).forEach((p: any) => {
            progressMap[p.lesson_id] = p
          })
          setProgress(progressMap)
        }
      }
    } catch (error) {
      console.error('Error fetching curriculum data:', error)
    } finally {
      setLoading(false)
    }
  }

  function getYouTubeId(url: string) {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/)
    return match ? match[1] : null
  }

  function isLessonLocked(lesson: any, lessons: any[], prog: Record<string, any>) {
    if (lesson.order_index === 0) return false
    const prevLesson = lessons.find(l => l.order_index === lesson.order_index - 1)
    if (!prevLesson) return false
    return !prog[prevLesson.id]?.completed
  }

  if (loading || !project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      <Header user={user} settings={settings} onMenuClick={() => setSidebarOpen(true)} />

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 right-0 z-50 w-2/3 max-w-sm bg-white shadow-2xl transform transition-transform lg:hidden ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col bg-white p-6">
          <button onClick={() => setSidebarOpen(false)} className="self-end p-2 text-gray-400 hover:text-gray-600">X</button>
          <nav className="mt-8 space-y-3">
            <Link href="/dashboard" onClick={() => setSidebarOpen(false)} className="block px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl">الرئيسية</Link>
            <Link href="/profile" onClick={() => setSidebarOpen(false)} className="block px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl">الملف الشخصي</Link>
            {profile?.role === 'admin' && (
              <Link href="/admin" onClick={() => setSidebarOpen(false)} className="block px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl">لوحة تحكم المدير</Link>
            )}
          </nav>
          <button onClick={handleLogout} className="mt-auto px-4 py-3 bg-red-50 text-red-600 rounded-xl">تسجيل الخروج</button>
        </div>
      </aside>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Link href={`/projects/${projectId}`} className="inline-flex items-center gap-2 text-gray-600 hover:text-emerald-600 transition-colors mb-6">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          رجوع للمشروع
        </Link>

        {/* Page Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{project.name}</h1>
          <p className="text-gray-500">المنهج التعليمي — تابع الدروس بالترتيب</p>
        </div>

        {curricula.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
            <div className="w-20 h-20 mx-auto mb-4 bg-gray-50 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">لا يوجد منهج تعليمي بعد</h3>
            <p className="text-gray-500 text-sm">لم يتم إضافة دروس لهذا المشروع بعد</p>
            {(profile?.role === 'admin' || profile?.role === 'supervisor') && (
              <Link
                href={`/admin/curricula/create?project_id=${project.id}`}
                className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                إضافة منهج جديد
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {curricula.map(curriculum => {
              const lessons = allLessons.filter(l => l.curriculum_id === curriculum.id)
              const sortedLessons = [...lessons].sort((a, b) => a.order_index - b.order_index)
              const completedCount = sortedLessons.filter(l => progress[l.id]?.completed).length

              return (
                <div key={curriculum.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  {/* Curriculum Header */}
                  <div className="p-6 border-b border-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900 mb-1">{curriculum.title}</h2>
                        {curriculum.description && (
                          <p className="text-gray-500 text-sm">{curriculum.description}</p>
                        )}
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-emerald-600">{completedCount}</div>
                        <div className="text-xs text-gray-400">من أصل {sortedLessons.length} دروس</div>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    {sortedLessons.length > 0 && (
                      <div className="mt-4 w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${(completedCount / sortedLessons.length) * 100}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Lessons List */}
                  <div className="divide-y divide-gray-50">
                    {sortedLessons.map((lesson, idx) => {
                      const isCompleted = progress[lesson.id]?.completed
                      const isLocked = isLessonLocked(lesson, sortedLessons, progress)

                      return (
                        <div key={lesson.id} className={`p-5 ${isLocked ? 'opacity-50' : ''}`}>
                          <div className="flex items-center gap-4">
                            {/* Number/Status Circle */}
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${
                              isCompleted
                                ? 'bg-emerald-100 text-emerald-600'
                                : isLocked
                                  ? 'bg-gray-100 text-gray-400'
                                  : 'bg-blue-100 text-blue-600'
                            }`}>
                              {isCompleted ? (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : isLocked ? (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                              ) : (
                                idx + 1
                              )}
                            </div>

                            {/* Lesson Info */}
                            <div className="flex-1 min-w-0">
                              <h3 className={`font-semibold ${isCompleted ? 'text-emerald-700' : 'text-gray-900'}`}>
                                {lesson.title}
                              </h3>
                              {lesson.description && (
                                <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{lesson.description}</p>
                              )}
                              {lesson.youtube_url && (
                                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                  فيديو
                                </p>
                              )}
                            </div>

                              {/* Action Button */}
                              <div className="flex items-center gap-1">
                                {isCompleted ? (
                                  <Link
                                    href={`/projects/${projectId}/curriculum/${lesson.id}`}
                                    className="shrink-0 px-4 py-2 text-sm font-medium text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
                                  >
                                    إعادة المشاهدة
                                  </Link>
                                ) : isLocked ? (
                                  <span className="shrink-0 px-4 py-2 text-sm font-medium text-gray-400 bg-gray-50 rounded-lg">
                                    مقفول
                                  </span>
                                ) : (
                                  <Link
                                    href={`/projects/${projectId}/curriculum/${lesson.id}`}
                                    className="shrink-0 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                                  >
                                    مشاهدة
                                  </Link>
                                )}
                                {(profile?.role === 'admin' || profile?.role === 'supervisor') && (
                                  <button
                                    onClick={() => setDeleteLessonId(lesson.id)}
                                    className="shrink-0 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    title="حذف الدرس"
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                      )
                    })}
                  </div>

                  {/* Admin Actions */}
                  {(profile?.role === 'admin' || profile?.role === 'supervisor') && (
                    <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-wrap gap-2">
                      <Link
                        href={`/admin/lessons/create?curriculum_id=${curriculum.id}`}
                        className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        إضافة درس
                      </Link>
                      <Link
                        href={`/admin/curricula/${curriculum.id}/edit`}
                        className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        تعديل المنهج
                      </Link>
                      <button
                        onClick={() => setDeleteCurriculumId(curriculum.id)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        حذف المنهج
                      </button>
                    </div>
                  )}
                </div>
              )
            })}

            {/* Add New Curriculum Button (Admin) */}
            {(profile?.role === 'admin' || profile?.role === 'supervisor') && (
              <div className="text-center">
                <Link
                  href={`/admin/curricula/create?project_id=${project.id}`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-dashed border-gray-300 text-gray-600 rounded-xl hover:border-emerald-400 hover:text-emerald-600 transition-colors font-medium"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  إضافة منهج جديد
                </Link>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Delete Curriculum Confirmation Modal */}
      {deleteCurriculumId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteCurriculumId(null)} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">تأكيد حذف المنهج</h3>
            <p className="text-gray-600 text-center mb-6">
              هل أنت متأكد من حذف هذا المنهج؟
              <br />
              <span className="text-red-500 text-sm">سيتم حذف جميع الدروس المرتبطة به. هذا الإجراء لا يمكن التراجع عنه.</span>
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteCurriculumId(null)} disabled={deleting} className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 disabled:opacity-50">إلغاء</button>
              <button onClick={handleDeleteCurriculum} disabled={deleting} className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {deleting ? <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>جاري الحذف...</> : <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>حذف المنهج</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Lesson Confirmation Modal */}
      {deleteLessonId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteLessonId(null)} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">تأكيد حذف الدرس</h3>
            <p className="text-gray-600 text-center mb-6">هل أنت متأكد من حذف هذا الدرس؟ هذا الإجراء لا يمكن التراجع عنه.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteLessonId(null)} disabled={deleting} className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 disabled:opacity-50">إلغاء</button>
              <button onClick={handleDeleteLesson} disabled={deleting} className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {deleting ? <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>جاري الحذف...</> : <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>حذف الدرس</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
