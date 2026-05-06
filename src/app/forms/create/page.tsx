'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import type { QuestionType, QuestionOption } from '@/types'

// Question type definitions
const QUESTION_TYPES = {
  text: { label: 'نص', icon: 'T', description: 'إجابة نصية قصيرة' },
  textarea: { label: 'نص طويل', icon: '¶', description: 'إجابة نصية متعددة الأسطر' },
  single_choice: { label: 'اختيار واحد', icon: '○', description: 'اختيار إجابة واحدة' },
  multiple_choice: { label: 'اختيار متعدد', icon: '☑', description: 'اختيار عدة إجابات' },
  scale: { label: 'تقييم', icon: '★', description: 'تقييم من 1 إلى 5' },
  ranking: { label: 'ترتيب', icon: '#', description: 'ترتيب العناصر' },
  matrix: { label: 'مصفوفة', icon: '▦', description: 'أسئلة متعددة مع خيارات مشتركة' }
} as const

interface Question {
  id: string
  text: string
  type: QuestionType
  required: boolean
  points: number
  options: QuestionOption[]
  sub_options?: QuestionOption[] // For nested options like prayer times
}

interface FormData {
  name: string
  description: string
  target_gender: 'male' | 'female' | 'both'
  allow_multiple: boolean
  questions: Question[]
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
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    target_gender: 'both',
    allow_multiple: false,
    questions: []
  })

  const router = useRouter()
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
    }

    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }))
  }

  const updateQuestion = (index: number, updates: Partial<Question>) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === index ? { ...q, ...updates } : q
      )
    }))
  }

  const removeQuestion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
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
      options: formData.questions[questionIndex].options.filter((_, i) => i !== optionIndex)
    })
  }

  const updateOption = (questionIndex: number, optionIndex: number, updates: Partial<QuestionOption>) => {
    updateQuestion(questionIndex, {
      options: formData.questions[questionIndex].options.map((opt, i) =>
        i === optionIndex ? { ...opt, ...updates } : opt
      )
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
      sub_options: (option.sub_options || []).filter((_, i) => i !== subOptionIndex)
    }

    updateQuestion(questionIndex, { options: updatedOptions })
  }

  const updateSubOption = (questionIndex: number, optionIndex: number, subOptionIndex: number, updates: Partial<QuestionOption>) => {
    const question = formData.questions[questionIndex]
    const option = question.options[optionIndex]
    
    const updatedOptions = [...question.options]
    updatedOptions[optionIndex] = {
      ...option,
      sub_options: (option.sub_options || []).map((sub, i) =>
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
      options: question.options || [],
      sub_options: question.sub_options || []
    }

    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }))
    setShowQuestionPicker(false)
  }

  const saveForm = async () => {
    if (!formData.name.trim()) {
      alert('يرجى إدخال اسم الفورم')
      return
    }

    if (formData.questions.length === 0) {
      alert('يرجى إضافة سؤال واحد على الأقل')
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
          created_by: profile.id,
          is_active: true
        })
        .select()
        .single()

      if (formError) throw formError

      // Create questions
      const questionsToInsert = formData.questions.map((q, index) => ({
        form_id: form.id,
        text: q.text,
        type: q.type,
        required: q.required,
        points: q.points,
        order_index: index,
        options: JSON.stringify(q.options.map(opt => ({
          ...opt,
          sub_options: opt.sub_options?.map(sub => sub)
        })))
      }))

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
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href={`/projects/${projectId}`}
            className="flex items-center gap-2 text-gray-600 hover:text-teal-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            رجوع
          </Link>
          <h1 className="text-lg font-bold text-teal-700">إنشاء فورم جديد</h1>
          <button
            onClick={saveForm}
            disabled={saving}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center gap-2"
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
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">اسم الفورم *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="مثال: تقييم أداء الصلاة"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الوصف</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="وصف مختصر للفورم..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الفئة المستهدفة</label>
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
                  className="w-5 h-5 mt-1 text-teal-600 rounded focus:ring-teal-500"
                />
                <div>
                  <span className="font-medium text-gray-800 block">السماح بالتسجيل المتعدد</span>
                  <span className="text-sm text-gray-600">تفعيل هذا الخيار يسمح للمستخدم بإعادة ملء الفورم عدة مرات يوميًا</span>
                </div>
              </label>
            </div>

            <div className="bg-teal-50 rounded-xl p-4">
              <p className="text-teal-800 font-medium mb-2">المشروع: {projectName}</p>
              <p className="text-teal-600 text-sm">جميع الأسئلة ستُضاف لهذا المشروع</p>
            </div>
          </div>
        </div>

        {/* Questions Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              الأسئلة ({formData.questions.length})
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

          {/* Question Types Guide */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {(Object.entries(QUESTION_TYPES) as [QuestionType, typeof QUESTION_TYPES['text']][]).map(([type, info]) => (
              <button
                key={type}
                onClick={() => addQuestion(type)}
                className="p-4 bg-gray-50 hover:bg-teal-50 border border-gray-200 hover:border-teal-300 rounded-xl transition-all group text-right"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-8 h-8 bg-teal-600 text-white rounded-lg flex items-center justify-center font-bold">
                    {info.icon}
                  </span>
                  <span className="font-medium text-gray-800 group-hover:text-teal-700">{info.label}</span>
                </div>
                <p className="text-xs text-gray-500">{info.description}</p>
              </button>
            ))}
          </div>

          {/* Questions List */}
          <div className="space-y-4">
            {formData.questions.map((question, qIndex) => (
              <div key={question.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex items-start gap-3 mb-4">
                  <span className="w-8 h-8 bg-teal-100 text-teal-700 rounded-lg flex items-center justify-center font-bold text-sm">
                    {qIndex + 1}
                  </span>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={question.text}
                      onChange={(e) => updateQuestion(qIndex, { text: e.target.value })}
                      placeholder="اكتب السؤال هنا..."
                      className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
                      disabled={qIndex === formData.questions.length - 1}
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
                <div className="flex flex-wrap gap-4 mb-4 mr-11">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={question.required}
                      onChange={(e) => updateQuestion(qIndex, { required: e.target.checked })}
                      className="w-4 h-4 text-teal-600 rounded"
                    />
                    <span className="text-sm text-gray-700">مطلوب</span>
                  </label>
                  
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

                  <span className="px-3 py-1 bg-teal-100 text-teal-700 text-sm rounded-full">
                    {QUESTION_TYPES[question.type]?.label}
                  </span>
                </div>

                {/* Options for choice questions */}
                {(question.type === 'single_choice' || question.type === 'multiple_choice') && (
                  <div className="mr-11 space-y-3">
                    <p className="text-sm font-medium text-gray-700">الخيارات:</p>
                    {question.options.map((option, oIndex) => (
                      <div key={option.id} className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="flex items-center gap-3">
                          <span className="text-gray-400">{question.type === 'single_choice' ? '○' : '☐'}</span>
                          <input
                            type="text"
                            value={option.text}
                            onChange={(e) => updateOption(qIndex, oIndex, { text: e.target.value })}
                            placeholder="نص الخيار..."
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-teal-500"
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

                        {/* Sub-options for nested choices (like prayer times) */}
                        <div className="mt-3 mr-6 space-y-2">
                          <button
                            onClick={() => addSubOption(qIndex, oIndex)}
                            className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            إضافة خيارات فرعية
                          </button>
                          
                          {option.sub_options && option.sub_options.length > 0 && (
                            <div className="bg-amber-50 rounded-lg p-2 space-y-2 border border-amber-200">
                              <p className="text-xs text-amber-700 font-medium">خيارات فرعية:</p>
                              {option.sub_options.map((subOpt, sIndex) => (
                                <div key={subOpt.id} className="flex items-center gap-2 bg-white rounded-lg p-2">
                                  <span className="text-gray-400 text-sm">→</span>
                                  <input
                                    type="text"
                                    value={subOpt.text}
                                    onChange={(e) => updateSubOption(qIndex, oIndex, sIndex, { text: e.target.value })}
                                    placeholder="خيار فرعي..."
                                    className="flex-1 px-2 py-1 border border-gray-200 rounded text-sm"
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
                      </div>
                    ))}
                    
                    <button
                      onClick={() => addOption(qIndex)}
                      className="w-full py-2 border-2 border-dashed border-gray-300 text-gray-500 rounded-lg hover:border-teal-400 hover:text-teal-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      إضافة خيار
                    </button>
                  </div>
                )}

                {/* Scale Options */}
                {question.type === 'scale' && (
                  <div className="mr-11 bg-blue-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-blue-700 mb-3">مقياس التقييم (1-5)</p>
                    <div className="flex justify-between items-center">
                      {question.options.map((opt) => (
                        <div key={opt.id} className="text-center">
                          <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mb-1">
                            {opt.text}
                          </div>
                          <input
                            type="number"
                            value={opt.points}
                            onChange={(e) => {
                              const idx = question.options.findIndex(o => o.id === opt.id)
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

            {formData.questions.length === 0 && (
              <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-gray-500 mb-4">لم تضف أي أسئلة بعد</p>
                <p className="text-gray-400 text-sm">اختر نوع السؤال من الأعلى للبدء</p>
              </div>
            )}
          </div>
        </div>

        {/* Example: Prayer Question */}
        <div className="bg-amber-50 rounded-2xl p-6 border border-amber-200">
          <h3 className="text-lg font-bold text-amber-800 mb-3">💡 مثال: سؤال الصلاة</h3>
          <div className="bg-white rounded-xl p-4 space-y-3">
            <p className="font-medium text-gray-800">في أي وقت تصلي الفجر؟</p>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between items-center">
                <span>○ قبل الأذان</span>
                <span className="text-teal-600 font-medium">5 نقاط</span>
              </div>
              <div className="flex justify-between items-center">
                <span>○ مع الإمام</span>
                <span className="text-teal-600 font-medium">4 نقاط</span>
              </div>
              <div className="flex justify-between items-center">
                <span>○ بعد الأذان بـ 15 دقيقة</span>
                <span className="text-teal-600 font-medium">3 نقاط</span>
              </div>
              <div className="flex justify-between items-center">
                <span>○ بعد الأذان بـ 30+ دقيقة</span>
                <span className="text-teal-600 font-medium">1 نقطة</span>
              </div>
            </div>
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
                          className="w-full text-right p-3 bg-gray-50 hover:bg-teal-50 border border-gray-200 rounded-lg transition-colors"
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
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-600 border-t-transparent"></div></div>}>
      <CreateFormContent />
    </Suspense>
  )
}