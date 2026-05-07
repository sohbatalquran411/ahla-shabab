'use client'



import { useState, useEffect, Suspense } from 'react'

import { createClient } from '@/utils/supabase/client'

import { useRouter, useParams } from 'next/navigation'

import Link from 'next/link'

import type { QuestionType, QuestionOption } from '@/types'



// Question type definitions with detailed explanations

const QUESTION_TYPES = {

  text: { 

    label: 'نص', 

    icon: 'T', 

    description: 'إجابة نصية قصيرة',

    explanation: 'سؤال يتطلب إجابة نصية قصيرة مثل الاسم أو كلمة واحدة. مثال: "ما اسمك؟" أو "اكتب دعاء قصير"'

  },

  textarea: { 

    label: 'نص طويل', 

    icon: '¶', 

    description: 'إجابة نصية متعددة الأسطر',

    explanation: 'سؤال يتطلب إجابة مفصلة أو فقرة كاملة. مثال: "اكتب عن تجربتك في الحج" أو "صف شعورك أثناء الصلاة"'

  },

  single_choice: { 

    label: 'اختيار واحد', 

    icon: '○', 

    description: 'اختيار إجابة واحدة',

    explanation: 'سؤال يحتوي على عدة خيارات ويمكن اختيار واحد فقط. مثال: "في أي وقت تصلي الفجر؟" مع خيارات: قبل الأذان، مع الأذان، بعد الأذان'

  },

  multiple_choice: { 

    label: 'اختيار متعدد', 

    icon: '☑', 

    description: 'اختيار عدة إجابات',

    explanation: 'سؤال يحتوي على عدة خيارات ويمكن اختيار أكثر من واحد. مثال: "ما الأعمال الصالحة التي تقوم بها؟" مع خيارات: الصلاة، الصيام، الصدقة، قراءة القرآن'

  },

  scale: { 

    label: 'تقييم', 

    icon: '★', 

    description: 'تقييم من 1 إلى 5',

    explanation: 'سؤال تقييم بمقياس من 1 إلى 5 نجوم أو نقاط. مثال: "قيم مستوى انتظامك في الصلاة" من 1 (ضعيف) إلى 5 (ممتاز)'

  },

  ranking: { 

    label: 'ترتيب', 

    icon: '#', 

    description: 'ترتيب العناصر',

    explanation: 'سؤال يطلب ترتيب عدة عناصر حسب الأولوية أو الأهمية. مثال: "رتب العبادات التالية حسب أولويتك: الصلاة، الصيام، الحج، الزكاة، الشهادة"'

  },

  matrix: { 

    label: 'مصفوفة', 

    icon: '▦', 

    description: 'أسئلة متعددة مع خيارات مشتركة',

    explanation: 'عدة أسئلة فرعية تشترك في نفس خيارات الإجابة. مثال: تقييم الصلوات الخمس (الفجر، الظهر، العصر، المغرب، العشاء) من حيث: الانتظام، الخشوع، الوقت'

  }

} as const



interface Question {

  id: string

  text: string

  type: QuestionType

  required: boolean

  points: number

  options: QuestionOption[]

  sub_options?: QuestionOption[]

  order_index?: number

}



interface FormData {

  id: string

  name: string

  description: string

  target_gender: 'male' | 'female' | 'both'

  allow_multiple: boolean

  questions: Question[]

  project_id: string

  is_active: boolean

}



function EditFormContent() {

  const [formData, setFormData] = useState<FormData | null>(null)

  const [profile, setProfile] = useState<any>(null)

  const [loading, setLoading] = useState(true)

  const [saving, setSaving] = useState(false)

  const [projectName, setProjectName] = useState<string>('')

  

  const router = useRouter()

  const params = useParams()

  const formId = params.id as string

  const supabase = createClient()



  useEffect(() => {

    fetchData()

  }, [formId])



  const fetchData = async () => {

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



      if (!profileData || profileData.role !== 'admin') {

        router.push('/dashboard')

        return

      }



      setProfile(profileData)

      // Fetch form data

      const { data: form, error: formError } = await supabase

        .from('forms')

        .select('*')

        .eq('id', formId)

        .single()



      if (formError || !form) {

        router.push('/dashboard')

        return

      }



      // Fetch project name

      const { data: project } = await supabase

        .from('projects')

        .select('name')

        .eq('id', form.project_id)

        .single()



      setProjectName(project?.name || '')



      // Fetch questions

      const { data: questions } = await supabase

        .from('questions')

        .select('*')

        .eq('form_id', formId)

        .order('order_index')



      const formattedQuestions: Question[] = (questions || []).map(q => ({

        id: q.id,

        text: q.text,

        type: q.type,

        required: q.required || false,

        points: q.points || 0,

        options: q.options ? JSON.parse(q.options) : [],

        order_index: q.order_index

      }))



      setFormData({

        id: form.id,

        name: form.name,

        description: form.description || '',

        target_gender: form.target_gender || 'both',

        allow_multiple: form.allow_multiple || false,

        questions: formattedQuestions,

        project_id: form.project_id,

        is_active: form.is_active

      })



    } catch (error) {

      console.error('Error fetching data:', error)

      router.push('/dashboard')

    } finally {

      setLoading(false)

    }

  }



  const addQuestion = (type: QuestionType) => {

    if (!formData) return



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



    setFormData(prev => prev ? ({

      ...prev,

      questions: [...prev.questions, newQuestion]

    }) : null)

  }



  const updateQuestion = (index: number, updates: Partial<Question>) => {

    if (!formData) return



    setFormData(prev => prev ? ({

      ...prev,

      questions: prev.questions.map((q, i) => 

        i === index ? { ...q, ...updates } : q

      )

    }) : null)

  }



  const removeQuestion = (index: number) => {

    if (!formData) return



    setFormData(prev => prev ? ({

      ...prev,

      questions: prev.questions.filter((_, i) => i !== index)

    }) : null)

  }



  const addOption = (questionIndex: number) => {

    if (!formData) return



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

    if (!formData) return



    updateQuestion(questionIndex, {

      options: formData.questions[questionIndex].options.filter((_, i) => i !== optionIndex)

    })

  }



  const updateOption = (questionIndex: number, optionIndex: number, updates: Partial<QuestionOption>) => {

    if (!formData) return



    updateQuestion(questionIndex, {

      options: formData.questions[questionIndex].options.map((opt, i) =>

        i === optionIndex ? { ...opt, ...updates } : opt

      )

    })

  }



  const saveForm = async () => {

    if (!formData || !formData.name.trim()) {

      alert('يرجى إدخال اسم الفورم')

      return

    }



    if (formData.questions.length === 0) {

      alert('يرجى إضافة سؤال واحد على الأقل')

      return

    }



    setSaving(true)

    try {

      // Update form

      const { error: formError } = await supabase

        .from('forms')

        .update({

          name: formData.name,

          description: formData.description,

          target_gender: formData.target_gender,

          allow_multiple: formData.allow_multiple,

          is_active: formData.is_active

        })

        .eq('id', formData.id)



      if (formError) throw formError



      // Delete existing questions

      const { error: deleteError } = await supabase

        .from('questions')

        .delete()

        .eq('form_id', formData.id)



      if (deleteError) throw deleteError



      // Insert updated questions

      const questionsToInsert = formData.questions.map((q, index) => ({

        form_id: formData.id,

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



      alert('تم حفظ التعديلات بنجاح')

      router.push(`/projects/${formData.project_id}`)

    } catch (error) {

      console.error('Error saving form:', error)

      alert('حدث خطأ أثناء حفظ التعديلات')

    } finally {

      setSaving(false)

    }

  }



  const moveQuestion = (index: number, direction: 'up' | 'down') => {

    if (!formData) return



    const newQuestions = [...formData.questions]

    const targetIndex = direction === 'up' ? index - 1 : index + 1

    

    if (targetIndex < 0 || targetIndex >= newQuestions.length) return

    

    ;[newQuestions[index], newQuestions[targetIndex]] = [newQuestions[targetIndex], newQuestions[index]]

    

    setFormData(prev => prev ? ({ ...prev, questions: newQuestions }) : null)

  }



  if (loading) {

    return (

      <div className="min-h-screen bg-gray-50 flex items-center justify-center">

        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>

      </div>

    )

  }



  if (!formData) {

    return (

      <div className="min-h-screen bg-gray-50 flex items-center justify-center">

        <div className="text-center">

          <p className="text-gray-500">لم يتم العثور على النموذج</p>

          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-700 mt-2 inline-block"
          >

            العودة للوحة التحكم

          </Link>

        </div>

      </div>

    )

  }



  return (

    <div dir="rtl" className="min-h-screen bg-gray-50">

      {/* Header */}

      <header className="bg-white shadow-sm sticky top-0 z-10">

        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">

          <Link

            href={`/projects/${formData.project_id}`}

            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"

          >

            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">

              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />

            </svg>

            رجوع

          </button>

          <h1 className="text-lg font-bold text-blue-700">تعديل النموذج</h1>

          <div className="flex gap-2">

            <button

              onClick={() => setFormData(prev => prev ? ({ ...prev, is_active: !prev.is_active }) : null)}

              className={`px-4 py-2 rounded-lg transition-colors ${

                formData.is_active 

                  ? 'bg-green-100 text-green-700 hover:bg-green-200' 

                  : 'bg-red-100 text-red-700 hover:bg-red-200'

              }`}

            >

              {formData.is_active ? 'مفعل' : 'معطل'}

            </button>

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

                  حفظ التعديلات

                </>

              )}

            </button>

          </div>

        </div>

      </header>



      <main className="max-w-4xl mx-auto px-4 py-6">

        {/* Form Basic Info */}

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">

          <h2 className="text-xl font-bold text-gray-900 mb-6">معلومات النموذج</h2>

          

          <div className="space-y-4">

            <div>

              <label className="block text-sm font-medium text-gray-700 mb-2">اسم النموذج *</label>

              <input

                type="text"

                value={formData.name}

                onChange={(e) => setFormData(prev => prev ? ({ ...prev, name: e.target.value }) : null)}

                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"

                placeholder="مثال: تقييم أداء الصلاة"

              />

            </div>



            <div>

              <label className="block text-sm font-medium text-gray-700 mb-2">الوصف</label>

              <textarea

                value={formData.description}

                onChange={(e) => setFormData(prev => prev ? ({ ...prev, description: e.target.value }) : null)}

                rows={2}

                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"

                placeholder="وصف مختصر للنموذج..."

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

                    onClick={() => setFormData(prev => prev ? ({ ...prev, target_gender: option.value as any }) : null)}

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

                  onChange={(e) => setFormData(prev => prev ? ({ ...prev, allow_multiple: e.target.checked }) : null)}

                  className="w-5 h-5 mt-1 text-blue-600 rounded focus:ring-blue-500"

                />

                <div>

                  <span className="font-medium text-gray-800 block">السماح بالتسجيل المتعدد</span>

                  <span className="text-sm text-gray-600">تفعيل هذا الخيار يسمح للمستخدم بإعادة ملء النموذج عدة مرات يوميًا</span>

                </div>

              </label>

            </div>



            <div className="bg-blue-50 rounded-xl p-4">

              <p className="text-blue-800 font-medium mb-2">المشروع: {projectName}</p>

              <p className="text-blue-600 text-sm">جميع الأسئلة ستُضاف لهذا المشروع</p>

            </div>

          </div>

        </div>

        {/* Questions Section */}

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">

          <div className="flex items-center justify-between mb-6">

            <h2 className="text-xl font-bold text-gray-900">

              الأسئلة ({formData.questions.length})

            </h2>

          </div>



          {/* Question Types Guide */}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">

            {(Object.entries(QUESTION_TYPES) as [QuestionType, typeof QUESTION_TYPES['text']][]).map(([type, info]) => (

              <div key={type} className="relative group">

                <button

                  onClick={() => addQuestion(type)}

                  className="w-full p-4 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-xl transition-all group text-right"

                >

                  <div className="flex items-center gap-3 mb-2">

                    <span className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold">

                      {info.icon}

                    </span>

                    <span className="font-medium text-gray-800 group-hover:text-blue-700">{info.label}</span>

                  </div>

                  <p className="text-xs text-gray-500">{info.description}</p>

                </button>

                

                {/* Tooltip */}

                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 w-64 text-center">

                  <div className="font-medium mb-1">{info.label}</div>

                  <div className="text-xs text-gray-300">{info.explanation}</div>

                  {/* Arrow */}

                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>

                </div>

              </div>

            ))}

          </div>



          {/* Questions List */}

          <div className="space-y-4">

            {formData.questions.map((question, qIndex) => (

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

                      className="w-4 h-4 text-blue-600 rounded"

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



                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">

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

                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500"

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

      </main>

    </div>

  )

}



export default function EditFormPage() {

  return (

    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div></div>}>

      <EditFormContent />

    </Suspense>

  )

}