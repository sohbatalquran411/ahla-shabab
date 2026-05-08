'use client'

import { useEffect, useState, Fragment } from 'react'
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
  answers: any
  profiles?: any
}

interface Form {
  id: string
  name: string
  project_id: string
  target_gender?: string
  projects?: any
}

interface Project {
  id: string
  name: string
}

interface Question {
  id: string
  text: string
  type: string
  points: number
  options: any
}

export default function ResultsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  
  const [forms, setForms] = useState<Form[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  
  const [stats, setStats] = useState({
    total: 0,
    avgScore: 0,
    thisWeek: 0
  })

  // Filters for forms
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')

  // Active form view
  const [activeForm, setActiveForm] = useState<Form | null>(null)
  const [formQuestions, setFormQuestions] = useState<Question[]>([])
  const [formResponses, setFormResponses] = useState<FormResponse[]>([])
  const [loadingForm, setLoadingForm] = useState(false)

  useEffect(() => {
    checkUserAndFetchData()
  }, [])

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

      setProjects(projectsData || [])

      // Fetch forms
      const { data: formsData } = await supabase
        .from('forms')
        .select('id, name, project_id, target_gender, projects(name)')
        .eq('is_active', true)
        .order('name')

      // Filter forms by gender for supervisors
      let filteredForms = formsData || []
      if (profile.role === 'supervisor') {
        filteredForms = filteredForms.filter((f: any) =>
          f.target_gender === profile.gender || f.target_gender === 'both'
        )
      }
      setForms(filteredForms)

      // Fetch global stats (lightweight)
      const { data: statsData } = await supabase
        .from('form_responses')
        .select('score, max_score, submitted_at')
        
      if (statsData && statsData.length > 0) {
        const total = statsData.length
        const totalScore = statsData.reduce((sum, r) => sum + (Number(r.score) || 0), 0)
        const totalMax = statsData.reduce((sum, r) => sum + (Number(r.max_score) || 0), 0)
        const avgScore = totalMax > 0 ? (totalScore / totalMax * 100) : 0

        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        const thisWeek = statsData.filter(r =>
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

  async function handleFormClick(form: Form) {
    setActiveForm(form)
    setLoadingForm(true)
    try {
      // Fetch questions
      const { data: questions } = await supabase
        .from('questions')
        .select('id, text, type, points, options')
        .eq('form_id', form.id)
        .order('order_index')
      
      setFormQuestions(questions || [])

      // Fetch responses with answers
      const { data: responses } = await supabase
        .from('form_responses')
        .select(`
          id,
          form_id,
          user_id,
          score,
          max_score,
          submitted_at,
          answers,
          profiles!inner(name, email, gender)
        `)
        .eq('form_id', form.id)
        .order('submitted_at', { ascending: false })

      // Filter by gender if supervisor
      let filteredResponses = responses || []
      if (user?.role === 'supervisor') {
        filteredResponses = filteredResponses.filter((r: any) =>
          r.profiles?.gender === user.gender
        )
      }

      setFormResponses(filteredResponses as FormResponse[])
    } catch (error) {
      console.error('Error fetching form details:', error)
    }
    setLoadingForm(false)
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

  // Filter forms list
  const filteredFormsList = forms.filter(f => {
    if (selectedProject && f.project_id !== selectedProject) return false
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase()
      if (!f.name.toLowerCase().includes(searchLower) && !f.projects?.name?.toLowerCase().includes(searchLower)) {
        return false
      }
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
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  if (activeForm) {
                    setActiveForm(null)
                  } else {
                    router.back()
                  }
                }}
                className="flex items-center gap-2 text-gray-600 hover:text-emerald-600 transition-colors bg-gray-100 hover:bg-emerald-50 px-3 py-1.5 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                {activeForm ? 'رجوع للنماذج' : 'رجوع'}
              </button>
              <div className="h-6 w-px bg-gray-200"></div>
              <h1 className="text-2xl font-bold text-gray-900">
                {activeForm ? `ردود: ${activeForm.name}` : 'ردود النماذج'}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-500 hidden sm:inline">|</span>
              <span className="text-emerald-600 font-medium bg-emerald-50 px-3 py-1 rounded-full text-sm">
                {user?.role === 'admin' ? 'مدير النظام' : 'مشرف'}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!activeForm ? (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-blue-50 rounded-xl text-blue-600">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">إجمالي الردود بالنظام</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-emerald-50 rounded-xl text-emerald-600">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">متوسط الدرجات العام</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.avgScore.toFixed(1)}%</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-amber-50 rounded-xl text-amber-600">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">ردود هذا الأسبوع</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.thisWeek}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 border border-gray-100">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">بحث في النماذج</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="اسم النموذج أو المشروع..."
                      className="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                    <svg className="w-5 h-5 text-gray-400 absolute right-3 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>

                <div className="md:w-64">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">تصفية بالمشروع</label>
                  <select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                  >
                    <option value="">جميع المشاريع</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Forms Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFormsList.map(form => (
                <div 
                  key={form.id} 
                  onClick={() => handleFormClick(form)}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 cursor-pointer hover:shadow-md hover:border-emerald-200 transition-all group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-emerald-600 transition-colors">{form.name}</h3>
                  <p className="text-sm text-gray-500 mb-4 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    {form.projects?.name || 'بدون مشروع'}
                  </p>
                  
                  <div className="flex justify-end mt-6 pt-4 border-t border-gray-50">
                    <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 group-hover:translate-x-[-4px] transition-transform">
                      عرض الردود في جدول
                      <svg className="w-4 h-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </span>
                  </div>
                </div>
              ))}

              {filteredFormsList.length === 0 && (
                <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-gray-300">
                  <div className="p-4 bg-gray-50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center text-gray-400">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">لا توجد نماذج</h3>
                  <p className="text-gray-500">لم يتم العثور على نماذج تطابق بحثك</p>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Spreadsheet View for Active Form */
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden flex flex-col h-[calc(100vh-180px)]">
            {loadingForm ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent mb-4"></div>
                <p className="text-gray-500">جاري تحميل جدول الردود...</p>
              </div>
            ) : formResponses.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                <div className="p-4 bg-gray-50 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center text-gray-400">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">لا توجد ردود بعد</h3>
                <p className="text-gray-500 max-w-sm mx-auto">لم يقم أحد بالرد على هذا النموذج حتى الآن.</p>
              </div>
            ) : (
              <div className="flex-1 overflow-auto bg-gray-50">
                <table className="w-full border-collapse">
                  <thead className="bg-white sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-b border-r border-gray-200 whitespace-nowrap bg-gray-50 w-12 text-center">
                        #
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-b border-r border-gray-200 whitespace-nowrap bg-gray-50">
                        اسم المستخدم
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-b border-r border-gray-200 whitespace-nowrap bg-gray-50">
                        البريد الإلكتروني
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-b border-r border-gray-200 whitespace-nowrap bg-gray-50">
                        النتيجة
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-b border-r border-gray-200 whitespace-nowrap bg-gray-50">
                        النسبة
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-b border-r border-gray-200 whitespace-nowrap bg-gray-50">
                        تاريخ التقديم
                      </th>
                      {formQuestions.map((q, idx) => (
                        <th 
                          key={q.id} 
                          className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-b border-r border-gray-200 min-w-[250px] max-w-[400px] bg-white group"
                          title={q.text}
                        >
                          <div className="flex items-start gap-2">
                            <span className="text-emerald-600 font-bold shrink-0">س{idx + 1}:</span>
                            <span className="line-clamp-2 leading-tight">{q.text}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {formResponses.map((response, rIdx) => {
                      const percentage = getPercentageScore(Number(response.score), Number(response.max_score))
                      return (
                        <tr key={response.id} className="hover:bg-emerald-50/50 transition-colors">
                          <td className="px-4 py-3 text-sm text-gray-500 border-r border-gray-200 text-center bg-gray-50/50">
                            {rIdx + 1}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap border-r border-gray-200">
                            <div className="font-medium text-gray-900">{response.profiles?.name || 'غير معروف'}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap border-r border-gray-200">
                            <div className="text-sm text-gray-500">{response.profiles?.email}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap border-r border-gray-200 text-center font-medium">
                            <span className={getScoreColor(percentage)}>{Number(response.score).toFixed(1)}</span>
                            <span className="text-gray-400 mx-1">/</span>
                            <span className="text-gray-600">{Number(response.max_score).toFixed(1)}</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap border-r border-gray-200 text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getScoreBgColor(percentage)}`}>
                              {percentage}%
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 border-r border-gray-200">
                            {formatDate(response.submitted_at)}
                          </td>
                          {formQuestions.map(q => {
                            const answer = response.answers?.[q.id]
                            let displayValue = ''
                            
                            if (answer) {
                              if (Array.isArray(answer.value)) {
                                displayValue = answer.value.join('، ')
                              } else {
                                displayValue = String(answer.value || '')
                              }
                            }
                            
                            return (
                              <td 
                                key={q.id} 
                                className="px-4 py-3 text-sm text-gray-800 border-r border-gray-200 max-w-[400px] align-top"
                              >
                                {displayValue ? (
                                  <div className="whitespace-pre-wrap">{displayValue}</div>
                                ) : (
                                  <span className="text-gray-300">-</span>
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

