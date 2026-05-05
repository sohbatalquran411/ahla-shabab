'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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
  const router = useRouter()
  const supabase = createClient()

  const calculateScore = () => {
    let score = 0
    let maxScore = 0

    questions.forEach((q) => {
      maxScore += q.points || 0
      const answer = answers[q.id]

      if (answer !== undefined) {
        if (q.type === 'single_choice' && q.options) {
          const option = q.options.find((opt: any) => opt.id === answer)
          if (option) score += option.points || 0
        } else if (q.type === 'multiple_choice' && q.options && Array.isArray(answer)) {
          answer.forEach((selectedId: string) => {
            const option = q.options.find((opt: any) => opt.id === selectedId)
            if (option) score += option.points || 0
          })
        } else if (q.type === 'scale') {
          score += parseFloat(answer) || 0
        } else if (q.type === 'text' || q.type === 'textarea') {
          // For text questions, full points if answered
          score += answer.trim() ? (q.points || 0) : 0
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
      if (q.required && !answers[q.id]) {
        setError(`يرجى الإجابة على السؤال: ${q.text}`)
        setSubmitting(false)
        return
      }
    }

    const { score, maxScore } = calculateScore()

    try {
      if (existingResponse) {
        // Update existing response
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
        // Create new response
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

  const renderQuestion = (question: Question) => {
    const currentAnswer = answers[question.id]

    switch (question.type) {
      case 'text':
        return (
          <input
            type="text"
            value={currentAnswer || ''}
            onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            placeholder="اكتب إجابتك هنا..."
          />
        )

      case 'textarea':
        return (
          <textarea
            value={currentAnswer || ''}
            onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent min-h-[120px]"
            placeholder="اكتب إجابتك هنا..."
          />
        )

      case 'single_choice':
        return (
          <div className="space-y-3">
            {question.options?.map((option: any, idx: number) => (
              <label
                key={option.id || idx}
                className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                  currentAnswer === option.id
                    ? 'border-teal-500 bg-teal-50'
                    : 'border-gray-200 hover:border-teal-300'
                }`}
              >
                <input
                  type="radio"
                  name={question.id}
                  value={option.id}
                  checked={currentAnswer === option.id}
                  onChange={() => setAnswers({ ...answers, [question.id]: option.id })}
                  className="w-5 h-5 text-teal-600"
                />
                <span className="flex-1">{option.text}</span>
                {option.points > 0 && (
                  <span className="text-sm text-teal-600">({option.points} نقطة)</span>
                )}
              </label>
            ))}
          </div>
        )

      case 'multiple_choice':
        return (
          <div className="space-y-3">
            {question.options?.map((option: any, idx: number) => {
              const selected = Array.isArray(currentAnswer) ? currentAnswer : []
              const isSelected = selected.includes(option.id)

              return (
                <label
                  key={option.id || idx}
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
                        newAnswers.push(option.id)
                      } else {
                        const idx = newAnswers.indexOf(option.id)
                        if (idx > -1) newAnswers.splice(idx, 1)
                      }
                      setAnswers({ ...answers, [question.id]: newAnswers })
                    }}
                    className="w-5 h-5 text-teal-600 rounded"
                  />
                  <span className="flex-1">{option.text}</span>
                  {option.points > 0 && (
                    <span className="text-sm text-teal-600">({option.points} نقطة)</span>
                  )}
                </label>
              )
            })}
          </div>
        )

      case 'scale':
        const maxScale = question.options?.[0]?.max || 5
        return (
          <div className="flex items-center justify-between gap-2">
            {Array.from({ length: maxScale }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setAnswers({ ...answers, [question.id]: num })}
                className={`w-12 h-12 rounded-xl font-bold transition-all ${
                  currentAnswer === num
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-teal-100'
                }`}
              >
                {num}
              </button>
            ))}
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

    return (
      <div dir="rtl" className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">تم الحفظ بنجاح ✓</h2>
          <p className="text-gray-600 mb-6">تم حفظ إجاباتك بنجاح</p>

          <div className="bg-gray-50 rounded-2xl p-6 mb-6">
            <p className="text-gray-600 mb-2">درجتك</p>
            <p className="text-4xl font-bold text-teal-600">{percentage}%</p>
            <p className="text-gray-500 text-sm mt-1">
              {score} من {maxScore} نقطة
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/dashboard"
              className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              لوحة التحكم
            </Link>
            <button
              onClick={() => {
                setSubmitted(false)
                setAnswers({})
              }}
              className="flex-1 py-3 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition-colors"
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
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
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Form Header */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{form.name}</h2>
          <p className="text-gray-600">{form.description || 'لا يوجد وصف'}</p>
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
            <div key={question.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
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
              {renderQuestion(question)}
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