'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
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
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const router = useRouter()
  const supabase = createClient()
  const { settings } = useAppSettings()
  const playerRef = useRef<any>(null)
  const completedRef = useRef(false)

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

      const { data: lessonData } = await supabase
        .from('lessons').select('*').eq('id', lessonId).single()

      if (!lessonData) { router.back(); return }
      setLesson(lessonData)

      const { data: progressData } = await supabase
        .from('lesson_progress').select('*')
        .eq('user_id', authUser.id)
        .eq('lesson_id', lessonId)
        .maybeSingle()

      setProgress(progressData)
      if (progressData?.completed) completedRef.current = true

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

  const markComplete = useCallback(async () => {
    if (!lessonId || !user || completedRef.current) return
    completedRef.current = true
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
    }
  }, [lessonId, user, progress, supabase])

  // Navigate to next lesson when video ends
  const onVideoEnded = useCallback(() => {
    markComplete()
    if (nextLesson) {
      setTimeout(() => {
        router.push(`/projects/${projectId}/curriculum/${nextLesson.id}`)
      }, 1500)
    }
  }, [markComplete, nextLesson, projectId, router])

  useEffect(() => {
    if (!lesson || !lesson.youtube_url || loading) return

    const videoId = extractYouTubeId(lesson.youtube_url)
    if (!videoId) return

    // Load YouTube IFrame API if not already loaded
    if (!(window as any).YT) {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      const firstScriptTag = document.getElementsByTagName('script')[0]
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag)

      ;(window as any).onYouTubeIframeAPIReady = () => {
        createPlayer(videoId)
      }
    } else {
      createPlayer(videoId)
    }

    function createPlayer(vId: string) {
      if (playerRef.current) {
        playerRef.current.destroy()
      }
      playerRef.current = new (window as any).YT.Player('youtube-player', {
        videoId: vId,
        playerVars: {
          autoplay: 1,
          rel: 0,
          modestbranding: 1
        },
        events: {
          onStateChange: (event: any) => {
            if (event.data === (window as any).YT.PlayerState.ENDED) {
              onVideoEnded()
            }
          }
        }
      })
    }
  }, [lesson, loading, onVideoEnded])

  function extractYouTubeId(url: string) {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/)
    return match ? match[1] : null
  }

  if (loading || !project || !lesson) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-600 border-t-transparent"></div>
      </div>
    )
  }

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
          <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
            <div id="youtube-player" className="absolute inset-0 w-full h-full" />
          </div>

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
