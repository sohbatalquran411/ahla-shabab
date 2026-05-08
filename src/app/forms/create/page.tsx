'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import ImageUpload from '@/components/ImageUpload'
import type { QuestionType, QuestionOption } from '@/types'

// Question type definitions with detailed explanations
// Question type definitions with detailed explanations
const QUESTION_TYPES = {
  text: { label: 'نص', icon: 'T', description: 'إجابة نصية قصيرة', explanation: 'مثال: "ما اسمك؟"' },
  textarea: { label: 'نص طويل', icon: '¶', description: 'إجابة مفصلة', explanation: 'مثال: "صف تجربتك"' },
  single_choice: { label: 'اختيار واحد', icon: '○', description: 'اختيار إجابة واحدة', explanation: 'مثال: "نعم أو لا"' },
  multiple_choice: { label: 'اختيار متعدد', icon: '☑', description: 'اختيار عدة إجابات', explanation: 'مثال: "الهوايات"' },
  dropdown: { label: 'قائمة منسدلة', icon: '▼', description: 'اختيار من قائمة', explanation: 'قائمة مضغوطة لتوفير المساحة' },
  scale: { label: 'تقييم', icon: '⭐', description: 'تقييم من 1 إلى 5', explanation: 'مثال: تقييم الأداء' },
  ranking: { label: 'ترتيب', icon: '#', description: 'ترتيب العناصر', explanation: 'ترتيب العناصر حسب الأولوية' },
  matrix: { label: 'مصفوفة', icon: '⊞', description: 'خيارات مشتركة', explanation: 'عدة أسئلة مع نفس الخيارات' },
  date: { label: 'تاريخ', icon: '📅', description: 'إدخال تاريخ', explanation: 'مثال: "تاريخ الميلاد"' },
  time: { label: 'وقت', icon: '⏰', description: 'إدخال وقت', explanation: 'مثال: "وقت الحضور"' },
  file_upload: { label: 'رفع ملف', icon: '📎', description: 'إرفاق ملف أو صورة', explanation: 'مثال: رفع السيرة الذاتية أو صورة' }
} as const

interface MatrixRow {
  id: string
  text: string
  required: boolean
}

interface MatrixColumn {
  id: string
  text: string
  points: number
}

interface Question {
  id: string
  text: string
  type: QuestionType
  required: boolean
  points: number
  options: QuestionOption[]
  sub_options?: QuestionOption[] // For nested options like prayer times
  // Matrix-specific
  matrix_rows?: MatrixRow[]
  matrix_columns?: MatrixColumn[]
  // Dropdown bulk
  bulk_text?: string
  correct_option_id?: string
  dropdown_type?: 'single' | 'multiple'
  correct_option_ids?: string[]
}

interface FormData {
  name: string
  description: string
  target_gender: 'male' | 'female' | 'both'
  allow_multiple: boolean
  image_url: string
  questions: Question[]
  time_limit?: number | null
  expires_at?: string | null
  allow_delete_responses?: boolean
  randomize_questions?: boolean
}

interface ExistingForm {
  id: string
  name: string
  project_id: string
  questions: any[]
}

function CreateFormContent() {
  const [projectId, setProjectId] = useState<string>('')
  const [projectName, setProjectName] = useState<string>('')
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [existingForms, setExistingForms] = useState<ExistingForm[]>([])
  const [showQuestionPicker, setShowQuestionPicker] = useState(false)
  const [questionMenuOpen, setQuestionMenuOpen] = useState(false)
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    target_gender: 'both',
    allow_multiple: false,
    time_limit: null,
    expires_at: '',
    allow_delete_responses: false,
    randomize_questions: false,
    image_url: '',
    questions: []
  })

  const router = useRouter()
  

  const parseOptions = (options: any): any[] => {
    if (!options) return []
    if (typeof options === 'string') {
      try {
        return JSON.parse(options)
      } catch {
        return []
      }
    }
    return Array.isArray(options) ? options : []
  }

const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const project_id = searchParams.get('project_id')
    if (project_id) {
      setProjectId(project_id)
      fetchData(project_id)
    } else {
      router.push('/dashboard')
    }
  }, [searchParams])

  const fetchData = async (projId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!profileData || (profileData.role !== 'supervisor' && profileData.role !== 'admin')) {
        router.push('/dashboard')
        return
      }

      setProfile(profileData)

      const { data: project } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projId)
        .single()

      if (!project) {
        router.push('/dashboard')
        return
      }

      setProjectName(project.name)

      // Get existing forms for question reuse
      const { data: forms } = await supabase
        .from('forms')
        .select('*, questions(*)')
        .eq('project_id', projId)

      setExistingForms(forms || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const addQuestion = (type: QuestionType) => {
    const newQuestion: Question = {
      id: `q_${Date.now()}`,
      text: '',
      type,
      required: false,
      points: 0,
      options: [],
      sub_options: []
    }

    // Add default options based on type
    if (type === 'single_choice' || type === 'multiple_choice') {
      newQuestion.options = [
        { id: `opt_${Date.now()}_1`, text: '', points: 0 },
        { id: `opt_${Date.now()}_2`, text: '', points: 0 }
      ]
    } else if (type === 'scale') {
      newQuestion.options = [
        { id: `opt_${Date.now()}_1`, text: '1', points: 1 },
        { id: `opt_${Date.now()}_2`, text: '2', points: 2 },
        { id: `opt_${Date.now()}_3`, text: '3', points: 3 },
        { id: `opt_${Date.now()}_4`, text: '4', points: 4 },
        { id: `opt_${Date.now()}_5`, text: '5', points: 5 }
      ]
    } else if (type === 'matrix') {
      newQuestion.matrix_rows = [
        { id: `row_${Date.now()}_1`, text: '', required: true },
        { id: `row_${Date.now()}_2`, text: '', required: false }
      ]
      newQuestion.matrix_columns = [
        { id: `col_${Date.now()}_1`, text: '', points: 0 },
        { id: `col_${Date.now()}_2`, text: '', points: 0 }
      ]
    } else if (type === 'dropdown') {
      newQuestion.dropdown_type = 'single'
      newQuestion.correct_option_ids = []
    }

    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }))
  }

  const updateQuestion = (index: number, updates: Partial<Question>) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q: any, i: number) => 
        i === index ? { ...q, ...updates } : q
      )
    }))
  }

  const removeQuestion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter((_: any, i: number) => i !== index)
    }))
  }

  const addOption = (questionIndex: number) => {
    const newOption: QuestionOption = {
      id: `opt_${Date.now()}`,
      text: '',
      points: 0
    }

    updateQuestion(questionIndex, {
      options: [...formData.questions[questionIndex].options, newOption]
    })
  }

  const removeOption = (questionIndex: number, optionIndex: number) => {
    updateQuestion(questionIndex, {
      options: parseOptions(formData.questions[questionIndex].options).filter((_: any, i: number) => i !== optionIndex)
    })
  }

  const updateOption = (questionIndex: number, optionIndex: number, updates: Partial<QuestionOption>) => {
    updateQuestion(questionIndex, {
      options: parseOptions(formData.questions[questionIndex].options).map((opt: any, i: number) =>
        i === optionIndex ? { ...opt, ...updates } : opt
      )
    })
  }

  const addMatrixRow = (questionIndex: number) => {
    const question = formData.questions[questionIndex]
    const newRow = { id: `row_${Date.now()}`, text: '', required: false }
    updateQuestion(questionIndex, {
      matrix_rows: [...(question.matrix_rows || []), newRow]
    })
  }

  const removeMatrixRow = (questionIndex: number, rowIndex: number) => {
    const question = formData.questions[questionIndex]
    updateQuestion(questionIndex, {
      matrix_rows: (question.matrix_rows || []).filter((_: any, i: number) => i !== rowIndex)
    })
  }

  const updateMatrixRow = (questionIndex: number, rowIndex: number, updates: Partial<MatrixRow>) => {
    const question = formData.questions[questionIndex]
    updateQuestion(questionIndex, {
      matrix_rows: (question.matrix_rows || []).map((row: any, i: number) =>
        i === rowIndex ? { ...row, ...updates } : row
      )
    })
  }

  const addMatrixColumn = (questionIndex: number) => {
    const question = formData.questions[questionIndex]
    const newCol = { id: `col_${Date.now()}`, text: '', points: 0 }
    updateQuestion(questionIndex, {
      matrix_columns: [...(question.matrix_columns || []), newCol]
    })
  }

  const removeMatrixColumn = (questionIndex: number, colIndex: number) => {
    const question = formData.questions[questionIndex]
    updateQuestion(questionIndex, {
      matrix_columns: (question.matrix_columns || []).filter((_: any, i: number) => i !== colIndex)
    })
  }

  const updateMatrixColumn = (questionIndex: number, colIndex: number, updates: Partial<MatrixColumn>) => {
    const question = formData.questions[questionIndex]
    updateQuestion(questionIndex, {
      matrix_columns: (question.matrix_columns || []).map((col: any, i: number) =>
        i === colIndex ? { ...col, ...updates } : col
      )
    })
  }

  const parseBulkText = (questionIndex: number) => {
    const question = formData.questions[questionIndex]
    if (!question.bulk_text) return

    const lines = question.bulk_text.split('\n').filter((l: string) => l.trim())
    const newOptions = lines.map((line: string) => ({
      id: `opt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      text: line.trim(),
      points: 0
    }))

    updateQuestion(questionIndex, {
      options: newOptions,
      bulk_text: ''
    })
  }

  const addSubOption = (questionIndex: number, optionIndex: number) => {
    const newSubOption: QuestionOption = {
      id: `subopt_${Date.now()}`,
      text: '',
      points: 0
    }

    const question = formData.questions[questionIndex]
    const option = question.options[optionIndex]
    
    const updatedOptions = [...question.options]
    updatedOptions[optionIndex] = {
      ...option,
      sub_options: [...(option.sub_options || []), newSubOption]
    }

    updateQuestion(questionIndex, { options: updatedOptions })
  }

  const removeSubOption = (questionIndex: number, optionIndex: number, subOptionIndex: number) => {
    const question = formData.questions[questionIndex]
    const option = question.options[optionIndex]
    
    const updatedOptions = [...question.options]
    updatedOptions[optionIndex] = {
      ...option,
      sub_options: parseOptions(option.sub_options).filter((_: any, i: number) => i !== subOptionIndex)
    }

    updateQuestion(questionIndex, { options: updatedOptions })
  }

  const updateSubOption = (questionIndex: number, optionIndex: number, subOptionIndex: number, updates: Partial<QuestionOption>) => {
    const question = formData.questions[questionIndex]
    const option = question.options[optionIndex]
    
    const updatedOptions = [...question.options]
    updatedOptions[optionIndex] = {
      ...option,
      sub_options: parseOptions(option.sub_options).map((sub: any, i: number) =>
        i === subOptionIndex ? { ...sub, ...updates } : sub
      )
    }

    updateQuestion(questionIndex, { options: updatedOptions })
  }

  const importQuestion = (question: any) => {
    const newQuestion: Question = {
      id: `q_${Date.now()}`,
      text: question.text,
      type: question.type,
      required: question.required || false,
      points: question.points || 0,
      options: parseOptions(question.options),
      sub_options: parseOptions(question.sub_options)
    }

    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }))
    setShowQuestionPicker(false)
  }

  const saveForm = async () => {
    if (!formData.name.trim()) {
      alert('يرجن إدخال اسم الفورم')
      return
    }

    if ((formData.questions || []).length === 0) {
      alert('يرجن إضافة سؤال واحد على الأقل')
      return
    }

    setSaving(true)
    try {
      // Create form
      const { data: form, error: formError } = await supabase
        .from('forms')
        .insert({
          project_id: projectId,
          name: formData.name,
          description: formData.description,
          target_gender: formData.target_gender,
          allow_multiple: formData.allow_multiple,
          time_limit: formData.time_limit,
          expires_at: formData.expires_at || null,
          allow_delete_responses: formData.allow_delete_responses,
          randomize_questions: formData.randomize_questions,
          image_url: formData.image_url,
          created_by: profile.id,
          is_active: true
        })
        .select()
        .single()

      if (formError) throw formError

      // Create questions
      const questionsToInsert = (formData.questions || []).map((q: any, index: number) => {
        let optionsData: any

        if (q.type === 'matrix') {
          optionsData = {
            matrix_rows: (q.matrix_rows || []).map((row: any) => ({
              id: row.id,
              text: row.text,
              required: row.required
            })),
            matrix_columns: (q.matrix_columns || []).map((col: any) => ({
              id: col.id,
              text: col.text,
              points: col.points || 0
            }))
          }
        } else if (q.type === 'dropdown') {
          const items = parseOptions(q.options).map((opt: any) => ({
            id: opt.id,
            text: opt.text,
            points: opt.points || 0
          }))
          optionsData = {
            dropdown_type: q.dropdown_type || 'single',
            correct_option_ids: q.dropdown_type === 'multiple' ? (q.correct_option_ids || []) : (q.correct_option_id ? [q.correct_option_id] : []),
            options: items
          }
        } else {
          optionsData = parseOptions(q.options).map((opt: any) => ({
            ...opt,
            sub_options: parseOptions(opt.sub_options).map((sub: any) => sub)
          }))
        }

        return {
          form_id: form.id,
          text: q.text,
          type: q.type,
          required: q.required,
          points: q.points,
          order_index: index,
          options: JSON.stringify(optionsData)
        }
      })

      const { error: questionsError } = await supabase
        .from('questions')
        .insert(questionsToInsert)

      if (questionsError) throw questionsError

      router.push(`/projects/${projectId}`)
    } catch (error) {
      console.error('Error saving form:', error)
      alert('حدث خطأ أثناء حفظ الفورم')
    } finally {
      setSaving(false)
    }
  }

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    const newQuestions = [...formData.questions]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    
    if (targetIndex < 0 || targetIndex >= newQuestions.length) return
    
    ;[newQuestions[index], newQuestions[targetIndex]] = [newQuestions[targetIndex], newQuestions[index]]
    
    setFormData(prev => ({ ...prev, questions: newQuestions }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            رجوع
          </button>
          <h1 className="text-lg font-bold text-blue-700">إنشاء فورم جديد</h1>
          <button
            onClick={saveForm}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                جاري الحفظ...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                حفظ
              </>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Form Basic Info */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">معلومات الفورم</h2>

          {(() => {
            const questions = formData.questions || []
            let totalPoints = 0
            questions.forEach((q: any) => {
              if (q.type === 'file_upload') return
              if (q.type === 'single_choice') {
                totalPoints += Math.max(0, ...parseOptions(q.options).map((o:any) => o.points || 0))
              } else if (q.type === 'multiple_choice') {
                totalPoints += parseOptions(q.options).reduce((s:number, o:any) => s + (o.points || 0), 0)
              } else if (q.type === 'dropdown') {
                const opts = parseOptions(q.options)
                if (q.dropdown_type === 'multiple') {
                  totalPoints += (q.correct_option_ids || []).reduce((s:number, id:string) => {
                    const opt = opts.find((o:any) => o.id === id)
                    return s + (opt?.points || 0)
                  }, 0)
                } else {
                  const opt = opts.find((o:any) => o.id === q.correct_option_id)
                  totalPoints += opt?.points || 0
                }
              } else if (q.type === 'ranking') {
                totalPoints += parseOptions(q.options).reduce((s:number, o:any) => s + (o.points || 0), 0)
              } else if (q.type === 'matrix') {
                const colSum = (q.matrix_columns || []).reduce((s:number, c:any) => s + (c.points || 0), 0)
                totalPoints += colSum * (q.matrix_rows || []).length
              } else if (q.type === 'scale') {
                totalPoints += Math.max(5, ...parseOptions(q.options).map((o:any) => o.points || 0))
              } else {
                totalPoints += q.points || 0
              }
            })
            return (
              <div className="flex items-center gap-4 mb-6 p-3 bg-gradient-to-l from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-sm text-gray-600">عدد الأسئلة:</span>
                  <span className="font-bold text-gray-900">{questions.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">إجمالي النقاط:</span>
                  <span className="font-bold text-blue-700">{totalPoints}</span>
                </div>
              </div>
            )
          })()}
          
          <div className="space-y-4">
            {/* Image Upload */}
            <ImageUpload
              onImageUploaded={(url) => setFormData(prev => ({ ...prev, image_url: url }))}
              currentImage={formData.image_url}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">اسم الفورم *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="مثال: تقييم أداء الصلاة"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الوصف</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="وصف مختصر للنموذج..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الفئة المستندفة</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'both', label: 'الكل', color: 'purple' },
                  { value: 'male', label: 'ذكور فقط', color: 'blue' },
                  { value: 'female', label: 'إناث فقط', color: 'pink' }
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => setFormData(prev => ({ ...prev, target_gender: option.value as any }))}
className={`px-4 py-3 rounded-xl font-medium transition-all ${
                      formData.target_gender === option.value
                        ? option.color === 'purple' ? 'bg-purple-600 text-white shadow-lg' :
                          option.color === 'blue' ? 'bg-blue-600 text-white shadow-lg' :
                          'bg-pink-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Allow Multiple */}
            <div className="bg-amber-50 rounded-xl p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.allow_multiple}
                  onChange={(e) => setFormData(prev => ({ ...prev, allow_multiple: e.target.checked }))}
                  className="w-5 h-5 mt-1 text-blue-600 rounded focus:ring-blue-500"
                />
                <div>
                  <span className="font-medium text-gray-800 block">السماح بالتسجيل المتعدد</span>
                  <span className="text-sm text-gray-600">تفعيل هذا الخيار يسمح للمستخدم بإعادة ملء النموذج عدة مرات يومياً</span>
                </div>
              </label>
            </div>

            {/* Timer Limit */}
            <div className="bg-green-50 rounded-xl p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.time_limit !== null && formData.time_limit !== undefined}
                  onChange={(e) => setFormData(prev => ({ ...prev, time_limit: e.target.checked ? 10 : null }))}
                  className="w-5 h-5 mt-1 text-green-600 rounded focus:ring-green-500"
                />
                <div className="flex-1">
                  <span className="font-medium text-gray-800 block">تحديد وقت للإجابة</span>
                  <span className="text-sm text-gray-600">تفعيل عداد تنازلي للمستخدمين لإكمال النموذج خلال مدة محددة</span>
                  {formData.time_limit !== null && formData.time_limit !== undefined && (
                    <div className="mt-2">
                      <label className="text-sm text-gray-600 ml-2">الوقت (بالدقائق):</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.time_limit}
                        onChange={(e) => setFormData(prev => ({ ...prev, time_limit: parseInt(e.target.value) || 1 }))}
                        className="w-24 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-center"
                      />
                    </div>
                  )}
                </div>
              </label>
            </div>

            {/* Expiration Date */}
            <div className="bg-red-50 rounded-xl p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!formData.expires_at}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    expires_at: e.target.checked ? new Date(Date.now() + 86400000).toISOString().slice(0, 16) : ''
                  }))}
                  className="w-5 h-5 mt-1 text-red-600 rounded focus:ring-red-500"
                />
                <div className="flex-1">
                  <span className="font-medium text-gray-800 block">تاريخ ووقت الإغلاق</span>
                  <span className="text-sm text-gray-600">إغلاق النموذج تلقائياً في تاريخ ووقت محدد</span>
                  {formData.expires_at && (
                    <div className="mt-2">
                      <input
                        type="datetime-local"
                        value={formData.expires_at}
                        onChange={(e) => setFormData(prev => ({ ...prev, expires_at: e.target.value }))}
                        className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg"
                      />
                    </div>
                  )}
                </div>
              </label>
            </div>

            {/* Allow Delete Responses */}
            <div className="bg-orange-50 rounded-xl p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.allow_delete_responses || false}
                  onChange={(e) => setFormData(prev => ({ ...prev, allow_delete_responses: e.target.checked }))}
                  className="w-5 h-5 mt-1 text-orange-600 rounded focus:ring-orange-500"
                />
                <div>
                  <span className="font-medium text-gray-800 block">السماح بحذف الردود</span>
                  <span className="text-sm text-gray-600">إظهار زر حذف بجانب كل تسجيل ليتمكن المستخدم من حذف ردوده بنفسه</span>
                </div>
              </label>
            </div>

            {/* Randomize Questions */}
            <div className="bg-purple-50 rounded-xl p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.randomize_questions || false}
                  onChange={(e) => setFormData(prev => ({ ...prev, randomize_questions: e.target.checked }))}
                  className="w-5 h-5 mt-1 text-purple-600 rounded focus:ring-purple-500"
                />
                <div>
                  <span className="font-medium text-gray-800 block">ترتيب عشوائي للأسئلة</span>
                  <span className="text-sm text-gray-600">عرض الأسئلة بترتيب مختلف لكل مستخدم لمنع الغش</span>
                </div>
              </label>
            </div>

            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-blue-800 font-medium mb-2">المشروع: {projectName}</p>
              <p className="text-blue-600 text-sm">جميع الأسئلة ستضاف لهذا المشروع</p>
            </div>
          </div>
        </div>

        {/* Questions Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              الأسئلة ({(formData.questions || []).length})
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setShowQuestionPicker(true)}
                className="px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                استرداد سؤال
              </button>
            </div>
          </div>


          {/* Questions List */}
          <div className="space-y-4">
            {(formData.questions || []).map((question: any, qIndex: number) => (
              <div key={question.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex items-start gap-3 mb-4">
                  <span className="w-8 h-8 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center font-bold text-sm">
                    {qIndex + 1}
                  </span>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={question.text}
                      onChange={(e) => updateQuestion(qIndex, { text: e.target.value })}
                      placeholder="اكتب السؤال هنا..."
                      className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => moveQuestion(qIndex, 'up')}
                      disabled={qIndex === 0}
                      className="p-2 text-gray-500 hover:bg-gray-200 rounded-lg disabled:opacity-30"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => moveQuestion(qIndex, 'down')}
                      disabled={qIndex === (formData.questions || []).length - 1}
                      className="p-2 text-gray-500 hover:bg-gray-200 rounded-lg disabled:opacity-30"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => removeQuestion(qIndex)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Question Settings */}
                <div className="flex flex-wrap gap-4 mb-4 ms-2 sm:ms-11">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={question.required}
                      onChange={(e) => updateQuestion(qIndex, { required: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-700">مطلوب</span>
                  </label>
                  
                  {!['single_choice', 'multiple_choice', 'dropdown', 'ranking', 'matrix'].includes(question.type) && (
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-700">النقاط:</label>
                    <input
                      type="number"
                      min="0"
                      value={question.points}
                      onChange={(e) => updateQuestion(qIndex, { points: Number(e.target.value) })}
                      className="w-20 px-2 py-1 bg-white border border-gray-200 rounded-lg text-center"
                    />
                  </div>
                  )}

                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                    {QUESTION_TYPES[question.type as QuestionType]?.label}
                  </span>
                  {(() => {
                    if (question.type === 'file_upload') return null
                    let total = 0
                    if (question.type === 'single_choice') {
                      total = Math.max(0, ...parseOptions(question.options).map((o:any) => o.points || 0))
                    } else if (question.type === 'multiple_choice') {
                      total = parseOptions(question.options).reduce((s:number, o:any) => s + (o.points || 0), 0)
                    } else if (question.type === 'dropdown') {
                      const opts = parseOptions(question.options)
                      if (question.dropdown_type === 'multiple') {
                        total = (question.correct_option_ids || []).reduce((s:number, id:string) => {
                          const opt = opts.find((o:any) => o.id === id)
                          return s + (opt?.points || 0)
                        }, 0)
                      } else {
                        const opt = opts.find((o:any) => o.id === question.correct_option_id)
                        total = opt?.points || 0
                      }
                    } else if (question.type === 'ranking') {
                      total = parseOptions(question.options).reduce((s:number, o:any) => s + (o.points || 0), 0)
                    } else if (question.type === 'matrix') {
                      const colSum = (question.matrix_columns || []).reduce((s:number, c:any) => s + (c.points || 0), 0)
                      total = colSum * (question.matrix_rows || []).length
                    } else if (question.type === 'scale') {
                      total = Math.max(5, ...parseOptions(question.options).map((o:any) => o.points || 0))
                    } else {
                      total = question.points || 0
                    }
                    return <span className="text-xs text-blue-600 font-medium me-2">({total} نقطة)</span>
                  })()}
                </div>

                {/* Matrix specific UI */}
                {question.type === 'matrix' && (
                  <div className="ms-2 sm:ms-11 space-y-6">
                    {/* Rows */}
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-3">الصفوف:</p>
                      <div className="space-y-2">
                        {(question.matrix_rows || []).map((row: any, rIndex: number) => (
                          <div key={row.id} className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-white rounded-lg p-3 border border-gray-200">
                            <span className="text-gray-400">⊞</span>
                            <input
                              type="text"
                              value={row.text}
                              onChange={(e) => updateMatrixRow(qIndex, rIndex, { text: e.target.value })}
                              placeholder="نص السؤال..."
                              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500"
                            />
                            <label className="flex items-center gap-1 text-sm whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={row.required}
                                onChange={(e) => updateMatrixRow(qIndex, rIndex, { required: e.target.checked })}
                                className="w-4 h-4 text-blue-600 rounded"
                              />
                              إجباري
                            </label>
                            <button
                              onClick={() => removeMatrixRow(qIndex, rIndex)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => addMatrixRow(qIndex)}
                          className="w-full py-2 border-2 border-dashed border-gray-300 text-gray-500 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          إضافة صف
                        </button>
                      </div>
                    </div>
                    {/* Columns */}
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-3">رؤوس الأعمدة:</p>
                      <div className="space-y-2">
                        {(question.matrix_columns || []).map((col: any, cIndex: number) => (
                          <div key={col.id} className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-amber-50 rounded-lg p-3 border border-amber-200">
                            <span className="text-gray-400">☐</span>
                            <input
                              type="text"
                              value={col.text}
                              onChange={(e) => updateMatrixColumn(qIndex, cIndex, { text: e.target.value })}
                              placeholder="عنوان العمود..."
                              className="flex-1 px-3 py-2 border border-amber-200 rounded-lg focus:ring-1 focus:ring-blue-500 bg-white"
                            />
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-500">الدرجة:</span>
                              <input
                                type="number"
                                min="0"
                                value={col.points}
                                onChange={(e) => updateMatrixColumn(qIndex, cIndex, { points: Number(e.target.value) })}
                                className="w-16 px-2 py-2 border border-amber-200 rounded-lg text-center bg-white"
                              />
                            </div>
                            <button
                              onClick={() => removeMatrixColumn(qIndex, cIndex)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => addMatrixColumn(qIndex)}
                          className="w-full py-2 border-2 border-dashed border-amber-300 text-amber-600 rounded-lg hover:border-amber-400 hover:text-amber-700 transition-colors flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          إضافة عمود
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bulk text import for dropdown */}
                {question.type === 'dropdown' && (
                  <div className="ms-2 sm:ms-11 space-y-3">
                    {/* Single / Multi toggle */}
                    <div className="flex gap-3 bg-gray-50 rounded-lg p-2 border border-gray-200">
                      <button
                        type="button"
                        onClick={() => updateQuestion(qIndex, { dropdown_type: 'single', correct_option_ids: [], correct_option_id: undefined })}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${question.dropdown_type === 'single' ? 'bg-white text-blue-700 shadow-sm border border-blue-200' : 'text-gray-600 hover:text-gray-800'}`}
                      >
                        اختيار واحد
                      </button>
                      <button
                        type="button"
                        onClick={() => updateQuestion(qIndex, { dropdown_type: 'multiple', correct_option_id: undefined })}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${question.dropdown_type === 'multiple' ? 'bg-white text-blue-700 shadow-sm border border-blue-200' : 'text-gray-600 hover:text-gray-800'}`}
                      >
                        اختيار متعدد
                      </button>
                    </div>

                    <p className="text-sm font-medium text-gray-700">الخيارات:</p>
                    {/* Bulk import */}
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                      <p className="text-xs text-blue-700 mb-2">إضافة خيارات دفعة واحدة (كل سطر خيار):</p>
                      <textarea
                        value={question.bulk_text || ''}
                        onChange={(e) => updateQuestion(qIndex, { bulk_text: e.target.value })}
                        placeholder="الخيار الأول
الخيار الثاني
الخيار الثالث"
                        rows={3}
                        className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm focus:ring-1 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => parseBulkText(qIndex)}
                        disabled={!question.bulk_text?.trim()}
                        className="mt-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        إضافة الخيارات
                      </button>
                    </div>
                    {/* Options list */}
                    {parseOptions(question.options).map((option: any, oIndex: number) => {
                      const isMulti = question.dropdown_type === 'multiple'
                      const correctIds = question.correct_option_ids || []
                      const isCorrect = isMulti ? correctIds.includes(option.id) : question.correct_option_id === option.id
                      return (
                      <div key={option.id} className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3">
                          <span className="text-gray-400">▼</span>
                          <input
                            type="text"
                            value={option.text}
                            onChange={(e) => updateOption(qIndex, oIndex, { text: e.target.value })}
                            placeholder="نص الخيار..."
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500"
                          />
                          <div className="flex items-center gap-2">
                            <label className="flex items-center gap-1 text-sm whitespace-nowrap">
                              <input
                                type={isMulti ? 'checkbox' : 'radio'}
                                name={`correct_${question.id}`}
                                checked={isCorrect}
                                onChange={() => {
                                  if (isMulti) {
                                    const newIds = isCorrect
                                      ? correctIds.filter((id: string) => id !== option.id)
                                      : [...correctIds, option.id]
                                    updateQuestion(qIndex, { correct_option_ids: newIds })
                                  } else {
                                    updateQuestion(qIndex, { correct_option_id: question.correct_option_id === option.id ? undefined : option.id })
                                  }
                                }}
                                className="w-4 h-4 text-green-600"
                              />
                              <span className="text-green-700 text-xs">صحيح</span>
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={option.points}
                              onChange={(e) => updateOption(qIndex, oIndex, { points: Number(e.target.value) })}
                              placeholder="الدرجة"
                              className="w-16 px-2 py-2 border border-gray-200 rounded-lg text-center"
                            />
                          </div>
                          <button
                            onClick={() => removeOption(qIndex, oIndex)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )})}
                    <button
                      onClick={() => addOption(qIndex)}
                      className="w-full py-2 border-2 border-dashed border-gray-300 text-gray-500 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      إضافة خيار
                    </button>
                  </div>
                )}

                {/* Options for other choice questions */}
                {(question.type === 'single_choice' || question.type === 'multiple_choice' || question.type === 'ranking') && (
                  <div className="ms-2 sm:ms-11 space-y-3">
                    <p className="text-sm font-medium text-gray-700">الخيارات:</p>
                    {parseOptions(question.options).map((option: any, oIndex: number) => (
                      <div key={option.id} className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3">
                          <span className="text-gray-400">
                            {question.type === 'single_choice' ? '○' : question.type === 'ranking' ? '#' : '☑'}
                          </span>
                          <input
                            type="text"
                            value={option.text}
                            onChange={(e) => updateOption(qIndex, oIndex, { text: e.target.value })}
                            placeholder="نص الخيار..."
                            className="w-full sm:flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500"
                          />
                          <input
                            type="number"
                            min="0"
                            value={option.points}
                            onChange={(e) => updateOption(qIndex, oIndex, { points: Number(e.target.value) })}
                            placeholder="النقاط"
                            className="w-20 px-2 py-2 border border-gray-200 rounded-lg text-center"
                            title="النقاط"
                          />
                          <button
                            onClick={() => removeOption(qIndex, oIndex)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        {/* Sub-options for nested choices */}
                        {(question.type === 'single_choice' || question.type === 'multiple_choice') && (
                          <div className="mt-3 ms-2 sm:ms-6 space-y-2 overflow-x-hidden">
                            <button
                              onClick={() => addSubOption(qIndex, oIndex)}
                              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              إضافة خيارات فرعية
                            </button>
                            
                            {option.sub_options && (option.sub_options || []).length > 0 && (
                              <div className="bg-amber-50 rounded-lg p-2 space-y-2 border border-amber-200 overflow-x-auto">
                                <p className="text-xs text-amber-700 font-medium">خيارات فرعية:</p>
                                {parseOptions(option.sub_options).map((subOpt: any, sIndex: number) => (
                                  <div key={subOpt.id} className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-white rounded-lg p-2 min-w-min">
                                    <span className="text-gray-400 text-sm">↳</span>
                                    <input
                                      type="text"
                                      value={subOpt.text}
                                      onChange={(e) => updateSubOption(qIndex, oIndex, sIndex, { text: e.target.value })}
                                      placeholder="خيار فرعي..."
                                      className="w-full sm:flex-1 min-w-[120px] px-2 py-1 border border-gray-200 rounded text-sm"
                                    />
                                    <input
                                      type="number"
                                      min="0"
                                      value={subOpt.points}
                                      onChange={(e) => updateSubOption(qIndex, oIndex, sIndex, { points: Number(e.target.value) })}
                                      className="w-16 px-1 py-1 border border-gray-200 rounded text-sm text-center"
                                      title="النقاط"
                                    />
                                    <button
                                      onClick={() => removeSubOption(qIndex, oIndex, sIndex)}
                                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                                    >
                                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                    
                    <button
                      onClick={() => addOption(qIndex)}
                      className="w-full py-2 border-2 border-dashed border-gray-300 text-gray-500 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      إضافة خيار
                    </button>
                  </div>
                )}


                {question.type === 'scale' && (
                  <div className="ms-2 sm:ms-11 bg-blue-50 rounded-lg p-4 overflow-x-auto">
                    <p className="text-sm font-medium text-blue-700 mb-3">مقياس التقييم (1-5)</p>
                    <div className="flex justify-between items-center min-w-[200px]">
                      {parseOptions(question.options).map((opt: any) => (
                        <div key={opt.id} className="text-center">
                          <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mb-1">
                            {opt.text}
                          </div>
                          <input
                            type="number"
                            value={opt.points}
                            onChange={(e) => {
                              const idx = (question.options || []).findIndex((o: any) => o.id === opt.id)
                              updateOption(qIndex, idx, { points: Number(e.target.value) })
                            }}
                            className="w-12 px-1 py-1 border border-blue-200 rounded text-center text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {(formData.questions || []).length === 0 && (
              <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-gray-500 mb-4">لم تضف أي أسئلة بعد</p>
              </div>
            )}
            
            {/* Add Question Button and Dropdown Menu */}
            <div className="relative mt-8">
              <button
                onClick={() => setQuestionMenuOpen(!questionMenuOpen)}
                className="w-full py-4 border-2 border-dashed border-blue-300 text-blue-600 rounded-xl hover:bg-blue-50 hover:border-blue-400 font-bold transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                إضافة سؤال جديد
              </button>
              
              {questionMenuOpen && (
                <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 shadow-xl rounded-xl z-20 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 p-4">
                  {(Object.entries(QUESTION_TYPES) as [QuestionType, typeof QUESTION_TYPES['text']][]).map(([type, info]) => (
                    <button
                      key={type}
                      onClick={() => {
                        if (type === 'file_upload') return
                        addQuestion(type)
                        setQuestionMenuOpen(false)
                      }}
                      className={`flex flex-col items-center justify-center text-center p-3 rounded-lg transition-colors border ${type === 'file_upload' ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-200' : 'hover:bg-blue-50 border-transparent hover:border-blue-200'}`}
                      title={type === 'file_upload' ? 'قيد التطوير' : ''}
                    >
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 font-bold ${type === 'file_upload' ? 'bg-gray-200 text-gray-400' : 'bg-blue-100 text-blue-600'}`}>
                        {info.icon}
                      </span>
                      <span className="font-medium text-gray-800 text-sm mb-1">{info.label}</span>
                      <span className="text-xs text-gray-500">{type === 'file_upload' ? 'قيد التطوير' : info.description}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Examples Section */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200">
          <h3 className="text-lg font-bold text-amber-800 mb-4">💡 أمثلة عملية لأنواع الأسئلة</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Text Example */}
            <div className="bg-white rounded-xl p-4 border border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 bg-blue-600 text-white rounded flex items-center justify-center text-sm font-bold">T</span>
                <span className="font-medium text-gray-800">نص قصير</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">ما اسم المسجد الذي تصلي فيه؟</p>
              <div className="bg-gray-50 rounded p-2 text-xs text-gray-500">
                إجابة: مسجد النور
              </div>
            </div>

            {/* Textarea Example */}
            <div className="bg-white rounded-xl p-4 border border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 bg-blue-600 text-white rounded flex items-center justify-center text-sm font-bold">¶</span>
                <span className="font-medium text-gray-800">نص طويل</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">اكتب عن شعورك أثناء قراءة القرآن</p>
              <div className="bg-gray-50 rounded p-2 text-xs text-gray-500">
                إجابة: أشعر بالسكينة والطمأنينة...
              </div>
            </div>

            {/* Single Choice Example */}
            <div className="bg-white rounded-xl p-4 border border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 bg-blue-600 text-white rounded flex items-center justify-center text-sm font-bold">○</span>
                <span className="font-medium text-gray-800">اختيار واحد</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">في أي وقت تصلي الفجر؟</p>
              <div className="space-y-1 text-xs text-gray-500">
                <div>○ قبل الأذان (5 نقاط)</div>
                <div>○ مع الأذان (4 نقاط)</div>
                <div>○ بعد الأذان بـ15 دقيقة (3 نقاط)</div>
              </div>
            </div>

            {/* Multiple Choice Example */}
            <div className="bg-white rounded-xl p-4 border border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 bg-blue-600 text-white rounded flex items-center justify-center text-sm font-bold">☑</span>
                <span className="font-medium text-gray-800">اختيار متعدد</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">ما الأعمال الصالحة التي تقوم بها؟</p>
              <div className="space-y-1 text-xs text-gray-500">
                <div>☑ الصلاة في وقتها (2 نقاط)</div>
                <div>☑ قراءة القرآن (2 نقاط)</div>
                <div>☐ الصدقة (2 نقاط)</div>
                <div>☑ الذكر (1 نقطة)</div>
              </div>
            </div>

            {/* Scale Example */}
            <div className="bg-white rounded-xl p-4 border border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 bg-blue-600 text-white rounded flex items-center justify-center text-sm font-bold">⭐</span>
                <span className="font-medium text-gray-800">تقييم</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">قيم مستوى خشوعك في الصلاة</p>
              <div className="flex justify-between text-xs text-gray-500">
                <span>⭐☆☆☆☆ ضعيف</span>
                <span>⭐⭐⭐⭐⭐ ممتاز</span>
              </div>
            </div>

            {/* Ranking Example */}
            <div className="bg-white rounded-xl p-4 border border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 bg-blue-600 text-white rounded flex items-center justify-center text-sm font-bold">#</span>
                <span className="font-medium text-gray-800">ترتيب</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">رتب العبادات حسب أولويتك</p>
              <div className="space-y-1 text-xs text-gray-500">
                <div>1. الصلاة (5 نقاط)</div>
                <div>2. قراءة القرآن (4 نقاط)</div>
                <div>3. الذكر (3 نقاط)</div>
                <div>4. الصدقة (2 نقاط)</div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-amber-100 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>نصيحة:</strong> استخدم أنواع الأسئلة المختلفة لجعل النموذج أكثر تفاعلاً وشمولية.
              يمكنك دمج عدة أنواع في نموذج واحد لتغطية جوانب مختلفة من الموضوع.
            </p>
          </div>
        </div>
      </main>

      {/* Question Picker Modal */}
      {showQuestionPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowQuestionPicker(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-xl">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">استرداد سؤال من فورم سابقة</h3>
              <button onClick={() => setShowQuestionPicker(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[calc(80vh-60px)]">
              {existingForms.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">لا توجد فورمز سابقة في هذا المشروع</p>
                </div>
              ) : (
                existingForms.map(form => (
                  <div key={form.id} className="mb-4">
                    <h4 className="font-medium text-gray-800 mb-2">{form.name}</h4>
                    <div className="space-y-2">
                      {form.questions?.map((q: any) => (
                        <button
                          key={q.id}
                          onClick={() => importQuestion(q)}
                          className="w-full text-right p-3 bg-gray-50 hover:bg-blue-50 border border-gray-200 rounded-lg transition-colors"
                        >
                          <p className="font-medium text-gray-800">{q.text}</p>
                          <p className="text-sm text-gray-500">{QUESTION_TYPES[q.type as QuestionType]?.label}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CreateFormPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div></div>}>
      <CreateFormContent />
    </Suspense>
  )
}

