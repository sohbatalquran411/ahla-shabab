'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAppSettings } from '@/hooks/useAppSettings'
import Header from '@/components/Header'

export default function LessonPage({ params }: { params: Promise<{ id: string; lessonId: string }> }) {
  const [projectId, setProjectId] = useState<string | null>(null)
  const [lessonId, setLessonId] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [project, setProject] = useState<any>(null)
  const [lesson, setLesson] = useState<any>(null)
  const [progress, setProgress] = useState<any>(null)
  const [prevLesson, setPrevLesson] = useState<any>(null)
  const [nextLesson, setNextLesson] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const router = useRouter()
  const supabase = createClient()
  const { settings } = useAppSettings()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  useEffect(() => {
    params.then(({ id, lessonId }) => {
      setProjectId(id)
      setLessonId(lessonId)
    })
  }, [params])

  useEffect(() => {
    if (projectId && lessonId) fetchData()
  }, [projectId, lessonId])

  const fetchData = async () => {
    if (!projectId || !lessonId) return
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

      // Fetch lesson
      const { data: lessonData } = await supabase
        .from('lessons').select('*').eq('id', lessonId).single()

      if (!lessonData) { router.back(); return }
      setLesson(lessonData)

      // Fetch user's progress
      const { data: progressData } = await supabase
        .from('lesson_progress').select('*')
        .eq('user_id', authUser.id)
        .eq('lesson_id', lessonId)
        .maybeSingle()

      setProgress(progressData)

      // Fetch all lessons in same curriculum for navigation
      const { data: allLessons } = await supabase
        .from('lessons').select('*')
        .eq('curriculum_id', lessonData.curriculum_id)
        .order('order_index')

      const sorted = (allLessons || []).sort((a: any, b: any) => a.order_index - b.order_index)
      const currentIdx = sorted.findIndex((l: any) => l.id === lessonId)

      if (currentIdx > 0) setPrevLesson(sorted[currentIdx - 1])
      if (currentIdx < sorted.length - 1) setNextLesson(sorted[currentIdx + 1])

    } catch (error) {
      console.error('Error fetching lesson:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = async () => {
    if (!lessonId || !user || completing) return
    setCompleting(true)
    try {
      if (progress?.id) {
        await supabase
          .from('lesson_progress')
          .update({ completed: true, completed_at: new Date().toISOString() })
          .eq('id', progress.id)
      } else {
        const { data } = await supabase
          .from('lesson_progress')
          .insert({
            user_id: user.id,
            lesson_id: lessonId,
            completed: true,
            completed_at: new Date().toISOString()
          })
          .select()
          .single()

        if (data) setProgress(data)
        else setProgress({ completed: true })
      }

      setProgress((prev: any) => ({ ...prev, completed: true }))
    } catch (error) {
      console.error('Error marking lesson complete:', error)
      alert('حدث خطأ أثناء حفظ التقدم')
    } finally {
      setCompleting(false)
    }
  }

  function getYouTubeEmbedUrl(url: string) {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/)
    return match ? `https://www.youtube.com/embed/${match[1]}` : null
  }

  if (loading || !project || !lesson) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-600 border-t-transparent"></div>
      </div>
    )
  }

  const embedUrl = getYouTubeEmbedUrl(lesson.youtube_url)
  const isCompleted = progress?.completed

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      <Header user={user} settings={settings} onMenuClick={() => setSidebarOpen(true)} />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Back */}
        <Link href={`/projects/${projectId}/curriculum`} className="inline-flex items-center gap-2 text-gray-600 hover:text-emerald-600 transition-colors mb-6">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          رجوع للمنهج
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Video Player */}
          {embedUrl ? (
            <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
              <iframe
                src={embedUrl}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={lesson.title}
              />
            </div>
          ) : (
            <div className="w-full h-64 bg-gray-100 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <svg className="w-12 h-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <p className="text-sm">رابط الفيديو غير صالح</p>
              </div>
            </div>
          )}

          {/* Lesson Content */}
          <div className="p-6">
            {/* Status Badge */}
            <div className="flex items-center gap-3 mb-4">
              {isCompleted ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  تم الانتهاء
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  لم يكتمل بعد
                </span>
              )}
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">{lesson.title}</h1>
            {lesson.description && (
              <p className="text-gray-600 leading-relaxed mb-6">{lesson.description}</p>
            )}

            {/* Complete Button */}
            <button
              onClick={handleComplete}
              disabled={completing || isCompleted}
              className={`w-full py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                isCompleted
                  ? 'bg-emerald-100 text-emerald-600 cursor-default'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200'
              } disabled:opacity-50`}
            >
              {completing ? (
                <><div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>جاري الحفظ...</>
              ) : isCompleted ? (
                <><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>لقد أكملت هذا الدرس ✓</>
              ) : (
                <><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>تم الانتهاء من الدرس</>
              )}
            </button>

            {/* Navigation */}
            <div className="mt-6 flex items-center justify-between gap-4">
              {prevLesson ? (
                <Link
                  href={`/projects/${projectId}/curriculum/${prevLesson.id}`}
                  className="flex items-center gap-2 px-4 py-2.5 text-gray-600 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-sm font-medium"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  الدرس السابق: {prevLesson.title}
                </Link>
              ) : <div />}
              {nextLesson ? (
                <Link
                  href={`/projects/${projectId}/curriculum/${nextLesson.id}`}
                  className="flex items-center gap-2 px-4 py-2.5 text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  الدرس التالي: {nextLesson.title}
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ) : <div />}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
