'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface FormResponse {
  id: string
  form_id: string
  user_id: string
  score: number
  max_score: number
  submitted_at: string
  profiles?: any
  forms?: any
}

interface Form {
  id: string
  name: string
  project_id: string
  projects?: any
}

interface Project {
  id: string
  name: string
}

export default function ResultsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [responses, setResponses] = useState<FormResponse[]>([])
  const [forms, setForms] = useState<Form[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [stats, setStats] = useState({
    total: 0,
    avgScore: 0,
    thisWeek: 0
  })

  // Filters
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [selectedForm, setSelectedForm] = useState<string>('')
  const [selectedGender, setSelectedGender] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [selectedResponse, setSelectedResponse] = useState<FormResponse | null>(null)
  const [responseDetails, setResponseDetails] = useState<any>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)

  useEffect(() => {
    checkUserAndFetchData()
  }, [])

  useEffect(() => {
    if (selectedProject) {
      const projectForms = forms.filter(f => f.project_id === selectedProject)
      setSelectedForm('')
    }
  }, [selectedProject])

  async function checkUserAndFetchData() {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (!authUser) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (!profile || (profile.role !== 'admin' && profile.role !== 'supervisor')) {
        router.push('/dashboard')
        return
      }

      setUser(profile)
      await fetchData(profile)
    } catch (error) {
      console.error('Error:', error)
      router.push('/login')
    }
  }

  async function fetchData(profile: any) {
    try {
      // Fetch projects
      const { data: projectsData } = await supabase
        .from('projects')
        .select('id, name')
        .order('name')

      // Filter by gender for supervisors
      let filteredProjects = projectsData || []
      if (profile.role === 'supervisor') {
        filteredProjects = filteredProjects.filter((p: any) => {
          return true // RLS handles this
        })
      }
      setProjects(filteredProjects)

      // Fetch forms
      const { data: formsData } = await supabase
        .from('forms')
        .select('id, name, project_id, projects(name)')
        .eq('is_active', true)
        .order('name')

      // Filter by gender for supervisors
      let filteredForms = formsData || []
      if (profile.role === 'supervisor') {
        filteredForms = filteredForms.filter((f: any) =>
          f.target_gender === profile.gender || f.target_gender === 'both'
        )
      }
      setForms(filteredForms)

      // Fetch form responses with profiles and forms info
      const { data: responsesData, error } = await supabase
        .from('form_responses')
        .select(`
          id,
          form_id,
          user_id,
          score,
          max_score,
          submitted_at,
          profiles(name, email, gender),
          forms(name, project_id)
        `)
        .order('submitted_at', { ascending: false })
        .limit(100)

      if (error) {
        console.error('Error fetching responses:', error)
      }

      // Filter by gender for supervisors
      let filteredResponses = responsesData || []
      if (profile.role === 'supervisor') {
        filteredResponses = filteredResponses.filter((r: any) =>
          r.profiles?.gender === profile.gender
        )
      }

      setResponses(filteredResponses)

      // Calculate stats
      if (filteredResponses.length > 0) {
        const total = filteredResponses.length
        const totalScore = filteredResponses.reduce((sum, r) => sum + (Number(r.score) || 0), 0)
        const totalMax = filteredResponses.reduce((sum, r) => sum + (Number(r.max_score) || 0), 0)
        const avgScore = totalMax > 0 ? (totalScore / totalMax * 100) : 0

        // This week
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        const thisWeek = filteredResponses.filter(r =>
          new Date(r.submitted_at) >= weekAgo
        ).length

        setStats({ total, avgScore, thisWeek })
      }

      setLoading(false)
    } catch (error) {
      console.error('Error:', error)
      setLoading(false)
    }
  }

  async function viewResponseDetails(response: FormResponse) {
    setSelectedResponse(response)
    setShowModal(true)
    setLoadingDetails(true)

    try {
      // Fetch questions and answers
      const { data: questions } = await supabase
.from('questions')
        .select('id, text, type, points, options')
        .eq('form_id', response.form_id)
        .order('order_index')

      const answers = responseDetails?.answers || {}

      setResponseDetails({ questions, answers })
    } catch (error) {
      console.error('Error fetching details:', error)
    }

    setLoadingDetails(false)
  }

  function getPercentageScore(score: number, maxScore: number) {
    if (!maxScore || maxScore === 0) return 0
    return Math.round((score / maxScore) * 100)
  }

  function getScoreColor(percentage: number) {
    if (percentage >= 80) return 'text-emerald-600'
    if (percentage >= 60) return 'text-amber-600'
    return 'text-red-600'
  }

  function getScoreBgColor(percentage: number) {
    if (percentage >= 80) return 'bg-emerald-100 text-emerald-800'
    if (percentage >= 60) return 'bg-amber-100 text-amber-800'
    return 'bg-red-100 text-red-800'
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Filter responses
  const filteredResponses = responses.filter(r => {
    // Project filter
    if (selectedProject && r.forms?.project_id !== selectedProject) return false

    // Form filter
    if (selectedForm && r.form_id !== selectedForm) return false

    // Gender filter
    if (selectedGender && r.profiles?.gender !== selectedGender) return false

    // Search
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase()
      const nameMatch = r.profiles?.name?.toLowerCase().includes(searchLower)
      const emailMatch = r.profiles?.email?.toLowerCase().includes(searchLower)
      if (!nameMatch && !emailMatch) return false
    }

    return true
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                رجوع
              </button>
              <div className="h-6 w-px bg-gray-200"></div>
              <h1 className="text-2xl font-bold text-gray-900">ردود النماذج</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-500">|</span>
              <span className="text-emerald-600 font-medium">
                {user?.role === 'admin' ? 'مدير النظام' : 'مشرف'}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">إجمالي الردود</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-100 rounded-xl">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">متوسط الدرجات</p>
                <p className="text-2xl font-bold text-gray-900">{stats.avgScore.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-100 rounded-xl">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">نذا الأسبوع</p>
                <p className="text-2xl font-bold text-gray-900">{stats.thisWeek}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">بحث</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="اسم أو بريد المستخدم..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            {/* Project Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المشروع</label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">جميع المشاريع</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Form Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">النموذج</label>
              <select
                value={selectedForm}
                onChange={(e) => setSelectedForm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                disabled={!selectedProject}
              >
                <option value="">جميع النماذج</option>
                {forms
                  .filter(f => !selectedProject || f.project_id === selectedProject)
                  .map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
              </select>
            </div>

            {/* Gender Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الجنس</label>
              <select
                value={selectedGender}
                onChange={(e) => setSelectedGender(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">الكل</option>
                <option value="male">ذكور</option>
                <option value="female">إناث</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {filteredResponses.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد نتائج</h3>
              <p className="text-gray-500">لم يتم تقديم أي ردود بعد</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      المستخدم
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      النموذج
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      النتيجة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      النسبة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      التاريخ
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      إجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredResponses.map((response) => {
                    const percentage = getPercentageScore(Number(response.score), Number(response.max_score))
                    return (
                      <tr key={response.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              response.profiles?.gender === 'male' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'
                            }`}>
                              {response.profiles?.name?.charAt(0) || '?'}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{response.profiles?.name || 'غير معروف'}</div>
                              <div className="text-sm text-gray-500">{response.profiles?.email}</div>
                            </div>
                          </div>
                        </td>
<td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{response.forms?.name || 'غير معروف'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`font-bold ${getScoreColor(percentage)}`}>
                            {Number(response.score).toFixed(1)}
                          </span>
                          <span className="text-gray-400"> / </span>
                          <span className="text-gray-500">
                            {Number(response.max_score).toFixed(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreBgColor(percentage)}`}>
                            {percentage}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(response.submitted_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => viewResponseDetails(response)}
                            className="text-emerald-600 hover:text-emerald-900 font-medium"
                          >
                            عرض التفاصيل
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Details Modal */}
      {showModal && selectedResponse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">تفاصيل الإجابة</h2>
                  <p className="text-gray-500 mt-1">
                    {selectedResponse.profiles?.name} - {selectedResponse.forms?.name}
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="mt-4 flex items-center gap-4">
                <span className={`px-4 py-2 rounded-full text-lg font-bold ${getScoreBgColor(getPercentageScore(Number(selectedResponse.score), Number(selectedResponse.max_score)))}`}>
                  {getPercentageScore(Number(selectedResponse.score), Number(selectedResponse.max_score))}%
                </span>
                <span className="text-gray-600">
                  {Number(selectedResponse.score).toFixed(1)} / {Number(selectedResponse.max_score).toFixed(1)} درجة
                </span>
              </div>
            </div>

            <div className="p-6">
              {loadingDetails ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent mx-auto"></div>
                </div>
              ) : responseDetails?.questions?.length > 0 ? (
                <div className="space-y-6">
                  {responseDetails.questions.map((q: any, index: number) => {
                    const answer = responseDetails.answers?.[q.id]
                    const isCorrect = answer?.is_correct
                    
                    return (
                      <div key={q.id} className="border rounded-xl p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm font-medium">
                              {index + 1}
                            </span>
                            <span className="font-medium text-gray-900">{q.text}</span>
                          </div>
                          {isCorrect ? (
                            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs">
                              صحيح
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                              خطأ
                            </span>
                          )}
                        </div>
                        
                        {q.type === 'text' || q.type === 'textarea' ? (
                          <div className="mt-3 bg-gray-50 rounded-lg p-3">
                            <p className="text-gray-700">{answer?.value || 'لم يتم الإجابة'}</p>
                          </div>
                        ) : q.type === 'scale' ? (
                          <div className="mt-3 flex items-center gap-2">
                            <span className="text-gray-600">الإجابة:</span>
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                              {answer?.value || 'لم يتم الإجابة'}
                            </span>
                          </div>
                        ) : (
                          <div className="mt-3">
                            <p className="text-sm text-gray-600">الإجابة:</p>
                            <p className="font-medium text-gray-900 mt-1">
                              {Array.isArray(answer?.value) ? answer.value.join(', ') : answer?.value || 'لم يتم الإجابة'}
                            </p>
                            {q.options?.length > 0 && (
                              <div className="mt-2 text-sm text-gray-500">
                                الخيارات: {q.options.map((o: any) => o.text).join(', ')}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="mt-3 flex items-center gap-4 text-sm">
                          <span className="text-gray-500">
                            النقاط: {q.points || 0}
                          </span>
                          {answer?.points !== undefined && (
                            <span className={answer.points > 0 ? 'text-emerald-600' : 'text-red-600'}>
                              الدرجة: {answer.points}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>لا توجد تفاصيل إضافية</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t bg-gray-50">
              <button
                onClick={() => setShowModal(false)}
                className="w-full px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition font-medium"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

