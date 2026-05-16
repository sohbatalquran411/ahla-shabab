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
  const [comments, setComments] = useState<any[]>([])
  const [commentText, setCommentText] = useState('')
  const [sendingComment, setSendingComment] = useState(false)
  const [allOpen, setAllOpen] = useState(false)

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

      // Get curriculum to check is_sequential
      const { data: curriculum } = await supabase
        .from('curricula').select('is_sequential').eq('id', lessonData.curriculum_id).single()
      setAllOpen(!curriculum?.is_sequential)

      const { data: allLessons } = await supabase
        .from('lessons').select('*')
        .eq('curriculum_id', lessonData.curriculum_id)
        .order('order_index')

      const sorted = (allLessons || []).sort((a: any, b: any) => a.order_index - b.order_index)
      const currentIdx = sorted.findIndex((l: any) => l.id === lessonId)

      if (currentIdx > 0) setPrevLesson(sorted[currentIdx - 1])
      if (currentIdx < sorted.length - 1) setNextLesson(sorted[currentIdx + 1])

      // Load comments
      if (lessonData.allow_comments !== false) {
        const { data: commentsData } = await supabase
          .from('lesson_comments').select('*, profiles(name)')
          .eq('lesson_id', lessonId)
          .order('created_at', { ascending: true })

        setComments(commentsData || [])
      }

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

  // Video ended handler
  const onVideoEnded = useCallback(() => {
    markComplete()
    if (nextLesson) {
      setTimeout(() => {
        router.push(`/projects/${projectId}/curriculum/${nextLesson.id}`)
      }, 1500)
    }
  }, [markComplete, nextLesson, projectId, router])

  // YouTube player setup
  useEffect(() => {
    if (!lesson || lesson.type !== 'video' || !lesson.youtube_url || loading) return

    const videoId = extractYouTubeId(lesson.youtube_url)
    if (!videoId) return

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
        playerVars: { autoplay: 1, rel: 0, modestbranding: 1 },
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

  const handleSendComment = async () => {
    if (!commentText.trim() || !lessonId || !user) return
    setSendingComment(true)
    try {
      const { data, error } = await supabase
        .from('lesson_comments')
        .insert({
          lesson_id: lessonId,
          user_id: user.id,
          content: commentText.trim()
        })
        .select('*, profiles(name)')
        .single()

      if (error) throw error
      setComments(prev => [...prev, data])
      setCommentText('')
    } catch (error) {
      console.error('Error sending comment:', error)
    } finally {
      setSendingComment(false)
    }
  }

  function getYouTubeId(url: string) {
    return extractYouTubeId(url)
  }

  function getSoundCloudEmbedUrl(url: string) {
    return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%2300a86b&auto_play=true&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false`
  }

  if (loading || !project || !lesson) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-600 border-t-transparent"></div>
      </div>
    )
  }

  const isCompleted = progress?.completed
  const TYPE_INFO: Record<string, { icon: string; label: string }> = {
    video: { icon: '🎬', label: 'فيديو' },
    audio: { icon: '🎧', label: 'صوت' },
    text: { icon: '📝', label: 'نص مكتوب' },
  }
  const typeInfo = TYPE_INFO[lesson.type] || TYPE_INFO.video

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      <Header user={user} settings={settings} onMenuClick={() => setSidebarOpen(true)} />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <Link href={`/projects/${projectId}/curriculum`} className="inline-flex items-center gap-2 text-gray-600 hover:text-emerald-600 transition-colors mb-6">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          رجوع للمحتوى
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Video Player */}
          {lesson.type === 'video' && lesson.youtube_url && (
            <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
              <div id="youtube-player" className="absolute inset-0 w-full h-full" />
            </div>
          )}

          {/* Audio Player */}
          {lesson.type === 'audio' && lesson.audio_url && (
            <div className="p-6 bg-gradient-to-br from-purple-50 to-white">
              <div className="max-w-lg mx-auto text-center">
                <div className="w-24 h-24 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
                <iframe
                  width="100%"
                  height="166"
                  scrolling="no"
                  frameBorder="no"
                  allow="autoplay"
                  src={getSoundCloudEmbedUrl(lesson.audio_url)}
                  className="rounded-xl"
                />
              </div>
            </div>
          )}

          {/* Text Content */}
          {lesson.type === 'text' && lesson.content && (
            <div className="p-8 bg-white">
              <div
                className="prose prose-lg max-w-none leading-relaxed"
                dangerouslySetInnerHTML={{ __html: lesson.content }}
              />
              {/* Manual complete for text */}
              <div className="mt-8 text-center">
                {!isCompleted ? (
                  <button
                    onClick={markComplete}
                    className="px-8 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium"
                  >
                    تمت القراءة ✓
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-100 text-emerald-700 rounded-xl font-medium">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    تمت القراءة
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Lesson Content */}
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                {typeInfo.icon} {typeInfo.label}
              </span>
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

            {/* Audio mark complete button */}
            {lesson.type === 'audio' && !isCompleted && (
              <div className="mb-6 text-center">
                <button
                  onClick={markComplete}
                  className="px-8 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium"
                >
                  تم الاستماع ✓
                </button>
              </div>
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
                  السابق: {prevLesson.title}
                </Link>
              ) : <div />}
              {nextLesson && (allOpen || isCompleted) ? (
                <Link
                  href={`/projects/${projectId}/curriculum/${nextLesson.id}`}
                  className="flex items-center gap-2 px-4 py-2.5 text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  التالي: {nextLesson.title}
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ) : nextLesson && !allOpen && !isCompleted ? (
                <span className="shrink-0 px-4 py-2.5 text-sm font-medium text-gray-400 bg-gray-50 rounded-xl flex items-center gap-2">
                  التالي: {nextLesson.title}
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
              ) : <div />}
            </div>
          </div>
        </div>

        {/* Comments Section */}
        {lesson.allow_comments !== false && (
          <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              التعليقات ({comments.length})
            </h2>

            {/* Add Comment */}
            <div className="flex gap-3 mb-6">
              <input
                type="text"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendComment() } }}
                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="اكتب تعليقك..."
              />
              <button
                onClick={handleSendComment}
                disabled={sendingComment || !commentText.trim()}
                className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 font-medium"
              >
                {sendingComment ? '...' : 'إرسال'}
              </button>
            </div>

            {/* Comments List */}
            {comments.length === 0 ? (
              <p className="text-center text-gray-400 py-6">لا توجد تعليقات بعد. كن أول من يعلق!</p>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3 p-4 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold shrink-0">
                      {comment.profiles?.name?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900 text-sm">
                          {comment.profiles?.name || 'مستخدم'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(comment.created_at).toLocaleDateString('ar-EG', {
                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-gray-700 text-sm leading-relaxed">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
