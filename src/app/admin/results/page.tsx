'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
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

type SortDir = 'asc' | 'desc' | null

function getDisplayAnswer(q: Question, answerVal: any) {
  if (answerVal === undefined || answerVal === null || answerVal === '') return ''

  let options = q.options
  if (typeof options === 'string') {
    try { options = JSON.parse(options) } catch (e) { options = [] }
  }

  if (q.type === 'text' || q.type === 'textarea' || q.type === 'scale') {
    return String(answerVal)
  }

  if (q.type === 'single_choice' || q.type === 'multiple_choice' || q.type === 'dropdown' || q.type === 'ranking') {
    let opts = Array.isArray(options) ? options : (options?.options || [])

    const findText = (id: string) => {
      const opt = opts.find((o: any) => o.id === id)
      if (opt) return opt.text
      return id
    }

    if (Array.isArray(answerVal)) {
      return answerVal.map(findText).join('، ')
    } else if (typeof answerVal === 'object' && answerVal !== null) {
      const optText = findText(answerVal.option_id || '')
      const count = answerVal.count
      return count ? `${optText} (×${count})` : optText
    } else {
      return findText(String(answerVal))
    }
  }

  if (q.type === 'matrix') {
    let rows = options?.matrix_rows || []
    let cols = options?.matrix_columns || []
    if (rows.length === 0 && Array.isArray(options) && options[0]?.sub_options) {
      rows = options
      cols = options[0].sub_options
    }

    let res: string[] = []
    if (typeof answerVal === 'object' && answerVal !== null) {
      Object.keys(answerVal).forEach(rowId => {
        const rowText = rows.find((r: any) => r.id === rowId)?.text || rowId
        let colVals = answerVal[rowId]
        if (!Array.isArray(colVals)) colVals = [colVals]

        const colTexts = colVals.map((colId: string) => {
          return cols.find((c: any) => c.id === colId)?.text || colId
        })

        res.push(`${rowText}: ${colTexts.join('، ')}`)
      })
      return res.join('\n')
    }
    return JSON.stringify(answerVal)
  }

  return String(answerVal)
}

function getRawAnswerValue(q: Question, answerVal: any): any {
  if (answerVal === undefined || answerVal === null || answerVal === '') return ''
  if (q.type === 'single_choice' || q.type === 'dropdown') {
    if (typeof answerVal === 'object') return answerVal.option_id || ''
    return String(answerVal)
  }
  return answerVal
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

  const [selectedProject, setSelectedProject] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')

  const [activeForm, setActiveForm] = useState<Form | null>(null)
  const [formQuestions, setFormQuestions] = useState<Question[]>([])
  const [formResponses, setFormResponses] = useState<FormResponse[]>([])
  const [loadingForm, setLoadingForm] = useState(false)

  const [responseSearch, setResponseSearch] = useState('')
  const [sortColumn, setSortColumn] = useState<string>('submitted_at')
  const [sortDirection, setSortDirection] = useState<SortDir>('desc')
  const [showAnalytics, setShowAnalytics] = useState(false)

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
      const { data: projectsData } = await supabase
        .from('projects')
        .select('id, name')
        .order('name')

      setProjects(projectsData || [])

      const { data: formsData } = await supabase
        .from('forms')
        .select('id, name, project_id, projects(name)')
        .eq('is_active', true)
        .order('name')

      let filteredForms = formsData || []
      setForms(filteredForms)

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
    setResponseSearch('')
    setSortColumn('submitted_at')
    setSortDirection('desc')
    setShowAnalytics(false)
    try {
      const { data: questions } = await supabase
        .from('questions')
        .select('id, text, type, points, options')
        .eq('form_id', form.id)
        .order('order_index')

      setFormQuestions(questions || [])

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

  function handleSort(col: string) {
    if (sortColumn === col) {
      if (sortDirection === 'asc') setSortDirection('desc')
      else if (sortDirection === 'desc') setSortDirection(null)
      else setSortDirection('asc')
    } else {
      setSortColumn(col)
      setSortDirection('asc')
    }
  }

  function getSortIcon(col: string) {
    if (sortColumn !== col) {
      return (
        <svg className="w-3 h-3 text-gray-300 group-hover:text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      )
    }
    if (sortDirection === 'asc') {
      return (
        <svg className="w-3 h-3 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      )
    }
    return (
      <svg className="w-3 h-3 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    )
  }

  // Filtered + sorted responses
  const processedResponses = useMemo(() => {
    let result = [...formResponses]

    // Filter by search
    if (responseSearch.trim()) {
      const q = responseSearch.toLowerCase().trim()
      result = result.filter(r =>
        (r.profiles?.name || '').toLowerCase().includes(q) ||
        (r.profiles?.email || '').toLowerCase().includes(q)
      )
    }

    // Sort
    if (sortDirection) {
      result.sort((a, b) => {
        let aVal: any, bVal: any
        switch (sortColumn) {
          case 'name':
            aVal = a.profiles?.name || ''
            bVal = b.profiles?.name || ''
            break
          case 'email':
            aVal = a.profiles?.email || ''
            bVal = b.profiles?.email || ''
            break
          case 'score':
            aVal = Number(a.score) || 0
            bVal = Number(b.score) || 0
            break
          case 'percentage':
            aVal = getPercentageScore(Number(a.score), Number(a.max_score))
            bVal = getPercentageScore(Number(b.score), Number(b.max_score))
            break
          case 'submitted_at':
            aVal = new Date(a.submitted_at).getTime()
            bVal = new Date(b.submitted_at).getTime()
            break
          default:
            // Question column
            if (sortColumn.startsWith('q_')) {
              const qId = sortColumn.replace('q_', '')
              const q = formQuestions.find(q => q.id === qId)
              aVal = getRawAnswerValue(q!, a.answers?.[qId])
              bVal = getRawAnswerValue(q!, b.answers?.[qId])
            } else {
              return 0
            }
        }
        if (typeof aVal === 'string') aVal = aVal.toLowerCase()
        if (typeof bVal === 'string') bVal = bVal.toLowerCase()
        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
        return 0
      })
    }

    return result
  }, [formResponses, responseSearch, sortColumn, sortDirection, formQuestions])

  // Analytics computation
  const analyticsData = useMemo(() => {
    if (!showAnalytics || formQuestions.length === 0) return []

    return formQuestions.map(q => {
      let options: any[] = []
      if (typeof q.options === 'string') {
        try { options = JSON.parse(q.options) } catch { options = [] }
      } else {
        options = Array.isArray(q.options) ? q.options : (q.options?.options || [])
      }

      const totalResponses = formResponses.length
      const counts: Record<string, number> = {}
      let answeredCount = 0

      if (q.type === 'single_choice' || q.type === 'dropdown') {
        formResponses.forEach(r => {
          const val = r.answers?.[q.id]
          let id = ''
          if (typeof val === 'object' && val !== null) id = val.option_id || ''
          else if (val) id = String(val)
          if (id) {
            counts[id] = (counts[id] || 0) + 1
            answeredCount++
          }
        })

        const labels = options.map(o => ({
          id: o.id,
          text: o.text,
          count: counts[o.id] || 0,
          percentage: totalResponses > 0 ? Math.round(((counts[o.id] || 0) / totalResponses) * 100) : 0
        }))

        return { q, type: q.type, labels, totalResponses, answeredCount }

      } else if (q.type === 'multiple_choice') {
        formResponses.forEach(r => {
          const val = r.answers?.[q.id]
          if (val) {
            const ids = Array.isArray(val) ? val : [val]
            ids.forEach((id: string) => {
              if (id) {
                counts[id] = (counts[id] || 0) + 1
                answeredCount++
              }
            })
          }
        })

        const labels = options.map(o => ({
          id: o.id,
          text: o.text,
          count: counts[o.id] || 0,
          percentage: totalResponses > 0 ? Math.round(((counts[o.id] || 0) / totalResponses) * 100) : 0
        }))

        return { q, type: q.type, labels, totalResponses, answeredCount }

      } else if (q.type === 'scale') {
        formResponses.forEach(r => {
          const val = r.answers?.[q.id]
          if (val !== undefined && val !== null && val !== '') {
            const key = String(val)
            counts[key] = (counts[key] || 0) + 1
            answeredCount++
          }
        })

        const scaleKeys = Object.keys(counts).sort((a, b) => Number(a) - Number(b))
        const labels = scaleKeys.map(k => ({
          id: k,
          text: k,
          count: counts[k],
          percentage: totalResponses > 0 ? Math.round((counts[k] / totalResponses) * 100) : 0
        }))

        return { q, type: q.type, labels, totalResponses, answeredCount }

      } else if (q.type === 'text' || q.type === 'textarea') {
        formResponses.forEach(r => {
          const val = r.answers?.[q.id]
          if (val !== undefined && val !== null && val !== '') {
            answeredCount++
          }
        })
        return { q, type: q.type, labels: [], totalResponses, answeredCount }

      } else if (q.type === 'matrix') {
        let rows = options?.matrix_rows || []
        let cols = options?.matrix_columns || []
        if (rows.length === 0 && Array.isArray(options) && options[0]?.sub_options) {
          rows = options
          cols = options[0].sub_options
        }

        const matrixCounts: Record<string, Record<string, number>> = {}
        rows.forEach((row: any) => { matrixCounts[row.id] = {} })
        formResponses.forEach(r => {
          const val = r.answers?.[q.id]
          if (typeof val === 'object' && val !== null) {
            Object.keys(val).forEach(rowId => {
              if (matrixCounts[rowId]) {
                const colIds = Array.isArray(val[rowId]) ? val[rowId] : [val[rowId]]
                colIds.forEach((colId: string) => {
                  if (colId) {
                    matrixCounts[rowId][colId] = (matrixCounts[rowId][colId] || 0) + 1
                    answeredCount++
                  }
                })
              }
            })
          }
        })

        const rowData = rows.map((row: any) => ({
          id: row.id,
          text: row.text,
          columns: cols.map((col: any) => ({
            id: col.id,
            text: col.text,
            count: matrixCounts[row.id]?.[col.id] || 0,
            percentage: totalResponses > 0 ? Math.round(((matrixCounts[row.id]?.[col.id] || 0) / totalResponses) * 100) : 0
          }))
        }))

        return { q, type: q.type, rowData, totalResponses, answeredCount }

      } else {
        return { q, type: 'other', labels: [], totalResponses, answeredCount }
      }
    })
  }, [showAnalytics, formQuestions, formResponses])

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
              <>
                {/* Toolbar: Search + Analytics Toggle */}
                <div className="px-4 py-3 bg-white border-b border-gray-200 flex items-center gap-4 flex-wrap">
                  <div className="relative flex-1 min-w-[200px]">
                    <input
                      type="text"
                      value={responseSearch}
                      onChange={(e) => setResponseSearch(e.target.value)}
                      placeholder="بحث باسم المستخدم أو البريد..."
                      className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                    />
                    <svg className="w-4 h-4 text-gray-400 absolute left-3 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-500">
                    {processedResponses.length} / {formResponses.length} ردود
                  </span>
                  <button
                    onClick={() => setShowAnalytics(!showAnalytics)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${showAnalytics ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    {showAnalytics ? 'إخفاء التحليل' : 'عرض التحليل'}
                  </button>
                </div>

                {/* Analytics Section */}
                {showAnalytics && analyticsData.length > 0 && (
                  <div className="border-b border-gray-200 bg-gray-50/50 overflow-auto max-h-[50vh]">
                    <div className="p-6 space-y-8">
                      {analyticsData.map((item) => (
                        <div key={item.q.id} className="bg-white rounded-xl border border-gray-200 p-5">
                          <h4 className="text-base font-bold text-gray-900 mb-1">{item.q.text}</h4>
                          <p className="text-xs text-gray-400 mb-4">
                            {item.answeredCount} إجابة من {item.totalResponses}
                          </p>

                          {item.type === 'text' || item.type === 'textarea' ? (
                            <div className="text-sm text-gray-500 bg-gray-50 rounded-lg px-4 py-3">
                              {item.answeredCount > 0
                                ? 'إجابات نصية - يمكنك الاطلاع عليها في الجدول أدناه'
                                : 'لا توجد إجابات نصية'}
                            </div>
                          ) : item.type === 'matrix' ? (
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm border-collapse">
                                <thead>
                                  <tr>
                                    <th className="text-right p-2 border border-gray-200 bg-gray-50 font-medium text-gray-600"></th>
                                    {(item as any).rowData[0]?.columns.map((col: any) => (
                                      <th key={col.id} className="text-center p-2 border border-gray-200 bg-gray-50 font-medium text-gray-600">{col.text}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {(item as any).rowData.map((row: any) => (
                                    <tr key={row.id}>
                                      <td className="p-2 border border-gray-200 font-medium text-gray-700">{row.text}</td>
                                      {row.columns.map((col: any) => (
                                        <td key={col.id} className="p-2 border border-gray-200 text-center">
                                          <div className="flex flex-col items-center gap-1">
                                            <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden" dir="ltr">
                                              <div
                                                className="h-full rounded-full transition-all duration-500"
                                                style={{ width: `${col.percentage}%`, background: 'linear-gradient(135deg, #10b981, #34d399)' }}
                                              />
                                            </div>
                                            <span className="text-xs text-gray-500">{col.count} ({col.percentage}%)</span>
                                          </div>
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {(item as any).labels?.map((label: any) => (
                                <div key={label.id}>
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm text-gray-700">{label.text}</span>
                                    <span className="text-xs text-gray-500">{label.count} ({label.percentage}%)</span>
                                  </div>
                                  <div className="w-full bg-gray-100 rounded-full h-5 overflow-hidden" dir="ltr">
                                    <div
                                      className="h-full rounded-full transition-all duration-500"
                                      style={{ width: `${label.percentage}%`, background: 'linear-gradient(135deg, #10b981, #34d399)' }}
                                    />
                                  </div>
                                </div>
                              ))}
                              {item.labels.length === 0 && (
                                <div className="text-sm text-gray-400">لا توجد بيانات</div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Table */}
                <div className="flex-1 overflow-auto bg-gray-50">
                  <table className="w-full border-collapse">
                    <thead className="bg-white sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th
                          className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-b border-r border-gray-200 whitespace-nowrap bg-gray-50 w-12 text-center cursor-pointer group hover:bg-gray-100 select-none"
                          onClick={() => handleSort('#')}
                        >
                          #
                        </th>
                        <th
                          className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-b border-r border-gray-200 whitespace-nowrap bg-gray-50 cursor-pointer group hover:bg-gray-100 select-none"
                          onClick={() => handleSort('name')}
                        >
                          <div className="flex items-center gap-1.5">
                            اسم المستخدم {getSortIcon('name')}
                          </div>
                        </th>
                        <th
                          className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-b border-r border-gray-200 whitespace-nowrap bg-gray-50 cursor-pointer group hover:bg-gray-100 select-none"
                          onClick={() => handleSort('email')}
                        >
                          <div className="flex items-center gap-1.5">
                            البريد الإلكتروني {getSortIcon('email')}
                          </div>
                        </th>
                        <th
                          className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-b border-r border-gray-200 whitespace-nowrap bg-gray-50 cursor-pointer group hover:bg-gray-100 select-none"
                          onClick={() => handleSort('score')}
                        >
                          <div className="flex items-center gap-1.5">
                            النتيجة {getSortIcon('score')}
                          </div>
                        </th>
                        <th
                          className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-b border-r border-gray-200 whitespace-nowrap bg-gray-50 cursor-pointer group hover:bg-gray-100 select-none"
                          onClick={() => handleSort('percentage')}
                        >
                          <div className="flex items-center gap-1.5">
                            النسبة {getSortIcon('percentage')}
                          </div>
                        </th>
                        <th
                          className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-b border-r border-gray-200 whitespace-nowrap bg-gray-50 cursor-pointer group hover:bg-gray-100 select-none"
                          onClick={() => handleSort('submitted_at')}
                        >
                          <div className="flex items-center gap-1.5">
                            تاريخ التقديم {getSortIcon('submitted_at')}
                          </div>
                        </th>
                        {formQuestions.map((q, idx) => (
                          <th
                            key={q.id}
                            className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-b border-r border-gray-200 min-w-[250px] max-w-[400px] bg-white group cursor-pointer hover:bg-gray-50 select-none"
                            title={q.text}
                            onClick={() => handleSort(`q_${q.id}`)}
                          >
                            <div className="flex items-start gap-1.5">
                              <span className="text-emerald-600 font-bold shrink-0">س{idx + 1}:</span>
                              <span className="line-clamp-2 leading-tight">{q.text}</span>
                              <span className="shrink-0">{getSortIcon(`q_${q.id}`)}</span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {processedResponses.length === 0 ? (
                        <tr>
                          <td colSpan={6 + formQuestions.length} className="p-8 text-center text-gray-400">
                            لا توجد نتائج تطابق بحثك
                          </td>
                        </tr>
                      ) : (
                        processedResponses.map((response, rIdx) => {
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
                                const answerVal = response.answers?.[q.id]
                                const displayValue = getDisplayAnswer(q, answerVal)

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
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
