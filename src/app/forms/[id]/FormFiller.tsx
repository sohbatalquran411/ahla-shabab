'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface QuestionOption {
  id: string
  text: string
  points: number
  sub_options?: QuestionOption[]
}

interface Question {
  id: string
  text: string
  type: string
  required: boolean
  points: number
  options: any
  order_index: number
}

interface Form {
  id: string
  name: string
  description: string
  project_id: string
}

interface Project {
  id: string
  name: string
  color: string
}

interface FormFillerProps {
  form: Form
  questions: Question[]
  existingResponse: any
  project: Project | null
  userId: string
}

export default function FormFiller({ form, questions, existingResponse, project, userId }: FormFillerProps) {
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(!!existingResponse)
  const [error, setError] = useState('')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [showRetryConfirm, setShowRetryConfirm] = useState(false)
  const [deletingResponse, setDeletingResponse] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Parse options if they're stringified JSON
  const parseOptions = (options: any) => {
    if (!options) return []
    if (typeof options === 'string') {
      try {
        return JSON.parse(options)
      } catch {
        return options
      }
    }
    return options
  }

  // Delete old response to allow re-submission
  const deleteOldResponse = async () => {
    if (!existingResponse?.id) return false
    
    setDeletingResponse(true)
    try {
      const { error } = await supabase
        .from('form_responses')
        .delete()
        .eq('id', existingResponse.id)
      
      if (error) throw error
      return true
    } catch (err) {
      console.error('Error deleting response:', err)
      return false
    } finally {
      setDeletingResponse(false)
    }
  }

  // Handle retry with confirmation
  const handleRetry = async () => {
    if (existingResponse?.id) {
      // Delete old response first
      const deleted = await deleteOldResponse()
      if (!deleted) {
        setError('فشل في حذف الإجابة السابقة')
        return
      }
    }
    setSubmitted(false)
    setAnswers({})
    setShowRetryConfirm(false)
  }

  const calculateScore = () => {
    let score = 0
    let maxScore = 0

    questions.forEach((q) => {
      maxScore += q.points || 0
      const answer = answers[q.id]
      const options = parseOptions(q.options)

      if (answer !== undefined && answer !== null && answer !== '') {
        if (q.type === 'single_choice' && options.length > 0) {
          // Check if answer is for a sub-option
          const answerParts = (typeof answer === 'string' ? answer : '').split('_sub_')
          const mainOptionId = answerParts[0]
          const subOptionId = answerParts[1]
          
          const mainOption = options.find((opt: any) => opt.id === mainOptionId)
          if (mainOption) {
            if (subOptionId && mainOption.sub_options) {
              const subOption = mainOption.sub_options.find((sub: any) => sub.id === subOptionId)
              if (subOption) {
                score += subOption.points || 0
              }
            } else {
              score += mainOption.points || 0
            }
          }
        } else if (q.type === 'multiple_choice' && options.length > 0 && Array.isArray(answer)) {
          answer.forEach((selectedId: string) => {
            // Handle sub-options
            const answerParts = selectedId.split('_sub_')
            const mainOptionId = answerParts[0]
            const subOptionId = answerParts[1]
            
            const mainOption = options.find((opt: any) => opt.id === mainOptionId)
            if (mainOption) {
              if (subOptionId && mainOption.sub_options) {
                const subOption = mainOption.sub_options.find((sub: any) => sub.id === subOptionId)
                if (subOption) {
                  score += subOption.points || 0
                }
              } else {
                score += mainOption.points || 0
              }
            }
          })
        } else if (q.type === 'scale') {
          score += parseFloat(String(answer)) || 0
        } else if (q.type === 'text' || q.type === 'textarea') {
          score += String(answer).trim() ? (q.points || 0) : 0
        }
      }
    })

    return { score, maxScore }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')

    // Validate required questions
    for (const q of questions) {
      if (q.required) {
        const answer = answers[q.id]
        if (answer === undefined || answer === null || answer === '' || 
            (Array.isArray(answer) && answer.length === 0)) {
          setError(`يرجى الإجابة على السؤال: ${q.text}`)
          setSubmitting(false)
          return
        }
      }
    }

    const { score, maxScore } = calculateScore()

    try {
      if (existingResponse) {
        const { error: updateError } = await supabase
          .from('form_responses')
          .update({
            score,
            max_score: maxScore,
            answers: answers,
            submitted_at: new Date().toISOString()
          })
          .eq('id', existingResponse.id)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase
          .from('form_responses')
          .insert({
            form_id: form.id,
            user_id: userId,
            score,
            max_score: maxScore,
            answers
          })

        if (insertError) throw insertError
      }

      setSubmitted(true)
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء حفظ الإجابات')
    } finally {
      setSubmitting(false)
    }
  }

  const renderSubOptions = (mainOption: any, question: Question, mainOptionSelected: boolean) => {
    if (!mainOption.sub_options || mainOption.sub_options.length === 0) return null

    return (
      <div className="mr-8 mt-3 space-y-2">
        {mainOption.sub_options.map((subOpt: any, sIdx: number) => {
          const subOptionId = `${mainOption.id}_sub_${subOpt.id}`
          const subSelected = answers[question.id] === subOptionId || 
            (Array.isArray(answers[question.id]) && answers[question.id].includes(subOptionId))
          
          return (
            <div key={subOpt.id || sIdx}>
              <label
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  subSelected
                    ? 'border-teal-500 bg-teal-50'
                    : mainOptionSelected
                      ? 'border-amber-200 bg-amber-50 hover:border-amber-400'
                      : 'border-gray-200 bg-gray-50 opacity-50'
                }`}
              >
                <input
                  type={question.type === 'multiple_choice' ? 'checkbox' : 'radio'}
                  name={`${question.id}_${mainOption.id}`}
                  value={subOpt.id}
                  checked={subSelected}
                  onChange={() => {
                    if (question.type === 'multiple_choice') {
                      const current = Array.isArray(answers[question.id]) ? [...answers[question.id]] : []
                      if (subSelected) {
                        setAnswers({ ...answers, [question.id]: current.filter((id: string) => id !== subOptionId) })
                      } else {
                        setAnswers({ ...answers, [question.id]: [...current, subOptionId] })
                      }
                    } else {
                      setAnswers({ ...answers, [question.id]: subOptionId })
                    }
                  }}
                  disabled={!mainOptionSelected && question.type === 'single_choice'}
                  className={`w-4 h-4 ${question.type === 'multiple_choice' ? 'text-teal-600' : 'text-teal-600'}`}
                />
                <span className="flex-1 text-sm">{subOpt.text}</span>
                {subOpt.points > 0 && (
                  <span className="text-xs text-teal-600">({subOpt.points} نقطة)</span>
                )}
              </label>
            </div>
          )
        })}
      </div>
    )
  }

  const renderQuestion = (question: Question, index: number) => {
    const currentAnswer = answers[question.id]
    const options = parseOptions(question.options)
    const isCurrent = index === currentQuestionIndex

    switch (question.type) {
      case 'text':
        return (
          <input
            type="text"
            value={currentAnswer || ''}
            onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            placeholder="اكتب إجابتك هنا..."
            onFocus={() => setCurrentQuestionIndex(index)}
          />
        )

      case 'textarea':
        return (
          <textarea
            value={currentAnswer || ''}
            onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent min-h-[120px]"
            placeholder="اكتب إجابتك هنا..."
            onFocus={() => setCurrentQuestionIndex(index)}
          />
        )

      case 'single_choice':
        return (
          <div className="space-y-3">
            {options.map((option: any, idx: number) => {
              const optionId = option.id || `opt_${idx}`
              const isSelected = currentAnswer === optionId
              
              return (
                <div key={optionId}>
                  <label
                    className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-gray-200 hover:border-teal-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name={question.id}
                      value={optionId}
checked={isSelected}
                      onChange={() => {
                        setAnswers({ ...answers, [question.id]: optionId })
                        setCurrentQuestionIndex(index)
                      }}
                      className="w-5 h-5 text-teal-600"
                    />
                    <span className="flex-1 font-medium">{option.text}</span>
                    {option.points > 0 && (
                      <span className="text-sm text-teal-600">({option.points} نقطة)</span>
                    )}
                  </label>
                  
                  {/* Sub-options */}
                  {renderSubOptions(option, question, isSelected)}
                </div>
              )
            })}
          </div>
        )

      case 'multiple_choice':
        return (
          <div className="space-y-3">
            {options.map((option: any, idx: number) => {
              const optionId = option.id || `opt_${idx}`
              const selected = Array.isArray(currentAnswer) ? currentAnswer : []
              const isSelected = selected.includes(optionId)
              
              return (
                <div key={optionId}>
                  <label
                    className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-gray-200 hover:border-teal-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        const newAnswers = Array.isArray(currentAnswer) ? [...currentAnswer] : []
                        if (e.target.checked) {
                          newAnswers.push(optionId)
                        } else {
                          const idx = newAnswers.indexOf(optionId)
                          if (idx > -1) newAnswers.splice(idx, 1)
                        }
                        setAnswers({ ...answers, [question.id]: newAnswers })
                        setCurrentQuestionIndex(index)
                      }}
                      className="w-5 h-5 text-teal-600 rounded"
                    />
                    <span className="flex-1 font-medium">{option.text}</span>
                    {option.points > 0 && (
                      <span className="text-sm text-teal-600">({option.points} نقطة)</span>
                    )}
                  </label>
                  
                  {/* Sub-options */}
                  {renderSubOptions(option, question, isSelected)}
                </div>
              )
            })}
          </div>
        )

      case 'scale':
        const maxScale = options.length > 0 ? options.length : 5
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              {Array.from({ length: maxScale }, (_, i) => i + 1).map((num) => {
                const scaleOption = options.find((o: any) => o.text === String(num))
                const points = scaleOption?.points || num
                
                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      setAnswers({ ...answers, [question.id]: points })
                      setCurrentQuestionIndex(index)
                    }}
                    className={`w-12 h-12 rounded-xl font-bold transition-all ${
                      currentAnswer === points
                        ? 'bg-teal-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-teal-100'
                    }`}
                  >
                    {num}
                  </button>
                )
              })}
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>ضعيف</span>
              <span>ممتاز</span>
            </div>
          </div>
        )

      case 'ranking':
        return (
          <div className="space-y-2 text-sm text-gray-500">
            <p>ترتيب العناصر (ستتمكن من السحب لإعادة الترتيب)</p>
            <div className="bg-gray-50 rounded-xl p-4">
              {options.map((option: any, idx: number) => (
                <div key={option.id || idx} className="flex items-center gap-3 p-2 bg-white rounded-lg mb-2">
                  <span className="w-6 h-6 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center text-xs">
                    {idx + 1}
                  </span>
                  <span className="flex-1">{option.text}</span>
                </div>
              ))}
            </div>
          </div>
        )

      case 'matrix':
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">أسئلة متعددة:</p>
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              {options.map((option: any, idx: number) => (
                <div key={option.id || idx} className="flex items-center gap-3">
                  <span className="flex-1 text-sm">{option.text}</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        type="button"
                        className={`w-8 h-8 rounded text-sm ${
                          currentAnswer?.[option.id] === num
                            ? 'bg-teal-600 text-white'
                            : 'bg-white text-gray-600 border'
                        }`}
                        onClick={() => {
                          setAnswers({
                            ...answers,
                            [question.id]: {
                              ...currentAnswer,
                              [option.id]: num
                            }
                          })
                          setCurrentQuestionIndex(index)
                        }}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      default:
        return (
          <input
            type="text"
            value={currentAnswer || ''}
            onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl"
          />
        )
    }
  }

  if (submitted) {
    const { score, maxScore } = calculateScore()
    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0

    let resultMessage = ''
    if (percentage >= 90) resultMessage = 'ممتاز! أداء رائع'
    else if (percentage >= 70) resultMessage = 'جيد جداً'
    else if (percentage >= 50) resultMessage = 'جيد'
    else resultMessage = 'يحتاج تحسين'

    return (
      <div dir="rtl" className="min-h-screen bg-gradient-to-br from-teal-600 to-teal-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">تم الحفظ بنجاح!</h2>
          <p className="text-gray-600 mb-6">{resultMessage}</p>

          <div className={`rounded-2xl p-6 mb-6 ${
            percentage >= 70 ? 'bg-green-50' : percentage >= 50 ? 'bg-amber-50' : 'bg-red-50'
          }`}>
            <p className="text-gray-600 mb-2">درجتك</p>
            <p className={`text-5xl font-bold ${
              percentage >= 70 ? 'text-green-600' : percentage >= 50 ? 'text-amber-600' : 'text-red-600'
            }`}>
              {percentage}%
            </p>
            <p className="text-gray-500 text-sm mt-2">
              {score} من {maxScore} نقطة
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href={project ? `/projects/${project.id}` : '/dashboard'}
              className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              العودة للمشروع
            </Link>
            <button
              onClick={() => setShowRetryConfirm(true)}
              className="flex-1 py-3 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition-colors"
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Confirmation Modal for retry
  if (showRetryConfirm) {
    return (
      <div dir="rtl" className="min-h-screen bg-gradient-to-br from-teal-600 to-teal-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">تأكيد إعادة المحاولة</h2>
            <p className="text-gray-600">
              هل أنت متأكد من حذف إجابتك السابقة وإعادة المحاولة؟
            </p>
            <p className="text-red-500 text-sm mt-2">
              سيتم حذف درجتك السابقة ولا يمكن استرجاعها
            </p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => setShowRetryConfirm(false)}
              className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              disabled={deletingResponse}
            >
              إلغاء
            </button>
            <button
              onClick={handleRetry}
              className="flex-1 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              disabled={deletingResponse}
            >
              {deletingResponse ? 'جاري الحذف...' : 'نعم، احذف وأعد المحاولة'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href={project ? `/projects/${project.id}` : '/dashboard'}
            className="flex items-center gap-2 text-gray-600 hover:text-teal-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            رجوع
          </Link>
          <h1 className="text-lg font-bold text-teal-700">{form.name}</h1>
          <span className="text-sm text-gray-500">
            {questions.length} سؤال
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="h-1 bg-gray-100">
          <div 
            className="h-full bg-teal-500 transition-all"
            style={{ 
              width: `${(Object.keys(answers).length / questions.length) * 100}%` 
            }}
          />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Form Header */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{form.name}</h2>
          <p className="text-gray-600">{form.description || 'أجب على الأسئلة التالية'}</p>
          {project && (
            <div className="mt-4 flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: project.color }}
              />
              <span className="text-gray-600 text-sm">{project.name}</span>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        {/* Questions */}
        <div className="space-y-6">
          {questions.map((question, index) => (
            <div 
              key={question.id} 
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
            >
              <div className="flex items-start gap-3 mb-4">
                <span className="w-8 h-8 bg-teal-100 text-teal-700 rounded-lg flex items-center justify-center font-bold text-sm">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {question.text}
                    {question.required && <span className="text-red-500 mr-1">*</span>}
                  </h3>
                  {question.points > 0 && (
                    <p className="text-teal-600 text-sm mt-1">
                      {question.points} نقطة
                    </p>
                  )}
                </div>
              </div>
              {renderQuestion(question, index)}
            </div>
          ))}
        </div>

        {/* Submit Button */}
        {questions.length > 0 && (
          <div className="mt-8">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-4 bg-gradient-to-l from-teal-600 to-teal-700 text-white font-semibold rounded-xl hover:from-teal-700 hover:to-teal-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-teal-500/30"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  جاري الحفظ...
                </span>
              ) : (
                'حفظ الإجابات'
              )}
            </button>
          </div>
        )}

        {questions.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
            <p className="text-gray-500">لا توجد أسئلة في هذا الفورم حالياً</p>
          </div>
        )}
      </main>
    </div>
  )
}