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
  allow_multiple: boolean
  time_limit?: number | null
  expires_at?: string | null
  allow_delete_responses?: boolean
  randomize_questions?: boolean
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
  allUserResponses: any[]
  project: Project | null
  userId: string
}

export default function FormFiller({ form, questions, existingResponse, allUserResponses, project, userId }: FormFillerProps) {
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(!!existingResponse && !form.allow_multiple)
  const [error, setError] = useState('')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [showRetryConfirm, setShowRetryConfirm] = useState(false)
  const [deletingResponse, setDeletingResponse] = useState(false)
  const [dropdownSearch, setDropdownSearch] = useState<Record<string, string>>({})
  const [dropdownOpen, setDropdownOpen] = useState<Record<string, boolean>>({})
  const router = useRouter()
  const supabase = createClient()

  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [displayQuestions, setDisplayQuestions] = useState<Question[]>([]);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    // Check expiration
    if (form.expires_at) {
      if (new Date() > new Date(form.expires_at)) {
        setIsExpired(true);
        return;
      }
    }

    // Set Timer
    if (form.time_limit && !submitted) {
      setTimeLeft(form.time_limit * 60);
    }

    // Set Questions (randomized or normal)
    if (form.randomize_questions) {
      const shuffled = [...questions].sort(() => 0.5 - Math.random());
      setDisplayQuestions(shuffled);
    } else {
      setDisplayQuestions(questions);
    }
  }, [form, questions]);

  useEffect(() => {
    if (timeLeft === null || submitted || isExpired) return;
    
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, submitted, isExpired]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };


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

  const getQuestionMaxScore = (q: Question): number => {
    const opts = parseOptions(q.options)

    switch (q.type) {
      case 'text':
      case 'textarea':
        return q.points || 0
      case 'single_choice':
        return Math.max(0, ...(Array.isArray(opts) ? opts : []).map((o: any) => o.points || 0))
      case 'multiple_choice':
        return (Array.isArray(opts) ? opts : []).reduce((sum: number, o: any) => sum + (o.points || 0), 0)
      case 'dropdown':
        if (opts.dropdown_type === 'multiple') {
          return ((opts.correct_option_ids || []) as string[]).reduce((sum: number, id: string) => {
            const opt = (opts.options || []).find((o: any) => o.id === id)
            return sum + (opt?.points || 0)
          }, 0)
        }
        if (opts.correct_option_ids?.length) {
          const opt = (opts.options || []).find((o: any) => o.id === opts.correct_option_ids[0])
          return opt?.points || 0
        }
        return Math.max(0, ...(Array.isArray(opts) ? opts : []).map((o: any) => o.points || 0))
      case 'scale':
        return Math.max(5, ...(Array.isArray(opts) ? opts : []).map((o: any) => o.points || 0))
      case 'ranking':
        return (Array.isArray(opts) ? opts : []).reduce((sum: number, o: any) => sum + (o.points || 0), 0)
      case 'matrix': {
        const md = parseMatrixData(q)
        if (md) {
          const colSum = (md.matrix_columns || []).reduce((s: number, c: any) => s + (c.points || 0), 0)
          return colSum * (md.matrix_rows || []).length
        }
        return 0
      }
      default:
        return 0
    }
  }

  const parseMatrixData = (q: any) => {
    const options = parseOptions(q.options)
    if (options.matrix_rows && options.matrix_columns) return options
    if (options.length > 0 && options[0].sub_options) {
      return {
        matrix_rows: options.map((r: any) => ({ id: r.id, text: r.text, required: false })),
        matrix_columns: options[0].sub_options
      }
    }
    return null
  }

  const calculateScore = () => {
    let score = 0
    let maxScore = 0

    displayQuestions.forEach((q) => {
      const answer = answers[q.id]
      const options = parseOptions(q.options)

      if (q.type === 'matrix') {
        const matrixData = parseMatrixData(q)
        if (matrixData) {
          maxScore += (matrixData.matrix_columns || []).reduce((sum: number, col: any) => sum + (col.points || 0), 0) * (matrixData.matrix_rows || []).length
          const rowAnswers = answer || {}
          Object.values(rowAnswers).forEach((val: any) => {
            if (Array.isArray(val)) {
              val.forEach((colId: string) => {
                const col = (matrixData.matrix_columns || []).find((c: any) => c.id === colId)
                if (col) score += col.points || 0
              })
            } else if (val) {
              const col = (matrixData.matrix_columns || []).find((c: any) => c.id === val)
              if (col) score += col.points || 0
            }
          })
        }
        return
      }

      maxScore += q.points || 0

      if (answer === undefined || answer === null || answer === '') return

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
        
        } else if (q.type === 'dropdown' && options.dropdown_type === 'multiple' && Array.isArray(answer)) {
          const dropOpts = options.options || []
          answer.forEach((id: string) => {
            const opt = dropOpts.find((o: any) => o.id === id)
            if (opt && (options.correct_option_ids || []).includes(id)) {
              score += opt.points || 0
            }
          })
        } else if (q.type === 'scale') {
          score += parseFloat(String(answer)) || 0
        } else if (q.type === 'text' || q.type === 'textarea') {
          score += String(answer).trim() ? (q.points || 0) : 0
        }
      })

    return { score, maxScore }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')

    // Validate required questions
    for (const q of displayQuestions) {
      if (q.type === 'matrix') {
        const matrixData = parseMatrixData(q)
        if (matrixData) {
          const rows = matrixData.matrix_rows || []
          const rowAnswers = answers[q.id] || {}
          for (const row of rows) {
            if (row.required) {
              const rowVal = rowAnswers[row.id]
              if (!rowVal || (Array.isArray(rowVal) && rowVal.length === 0)) {
                setError(`يرجى الإجابة على الصف "${row.text}" في السؤال: ${q.text}`)
                setSubmitting(false)
                return
              }
            }
          }
        }
      } else if (q.required) {
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
      // If allow_multiple is false and there's existing response, update it
      // Otherwise always insert a new response
      if (!form.allow_multiple && existingResponse) {
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
        // Insert new response (for allow_multiple=true or no existing response)
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
        {(Array.isArray(mainOption.sub_options) ? mainOption.sub_options : []).map((subOpt: any, sIdx: number) => {
          const subOptionId = `${mainOption.id}_sub_${subOpt.id}`
          const subSelected = answers[question.id] === subOptionId || 
            (Array.isArray(answers[question.id]) && answers[question.id].includes(subOptionId))
          
          return (
            <div key={subOpt.id || sIdx}>
              <label
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  subSelected
                    ? 'border-blue-500 bg-blue-50'
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
                  className={`w-4 h-4 ${question.type === 'multiple_choice' ? 'text-blue-600' : 'text-blue-600'}`}
                />
                <span className="flex-1 text-sm">{subOpt.text}</span>
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

    switch (question.type) {
      case 'text':
        return (
          <input
            type="text"
            value={currentAnswer || ''}
            onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="اكتب إجابتك هنا..."
            onFocus={() => setCurrentQuestionIndex(index)}
          />
        )

      case 'textarea':
        return (
          <textarea
            value={currentAnswer || ''}
            onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[120px]"
            placeholder="اكتب إجابتك هنا..."
            onFocus={() => setCurrentQuestionIndex(index)}
          />
        )

      case 'single_choice':
        return (
          <div className="space-y-3">
            {(Array.isArray(options) ? options : []).map((option: any, idx: number) => {
              const optionId = option.id || `opt_${idx}`
              const isSelected = currentAnswer === optionId
              
              return (
                <div key={optionId}>
                  <label
                    className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
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
                      className="w-5 h-5 text-blue-600"
                    />
                    <span className="flex-1 font-medium">{option.text}</span>
                    
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
            {(Array.isArray(options) ? options : []).map((option: any, idx: number) => {
              const optionId = option.id || `opt_${idx}`
              const selected = Array.isArray(currentAnswer) ? currentAnswer : []
              const isSelected = selected.includes(optionId)
              
              return (
                <div key={optionId}>
                  <label
                    className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
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
                      className="w-5 h-5 text-blue-600 rounded"
                    />
                    <span className="flex-1 font-medium">{option.text}</span>
                    
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
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-blue-100'
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
        const rankingItems = Array.isArray(currentAnswer) && currentAnswer.length === options.length
          ? currentAnswer
          : (Array.isArray(options) ? options : []).map((o: any) => o.id)
        
        return (
          <div className="space-y-2 text-sm text-gray-500">
            <p>ترتيب العناصر (استخدم الأسهم لإعادة الترتيب)</p>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              {rankingItems.map((optId: string, idx: number) => {
                const option = options.find((o: any) => o.id === optId)
                if (!option) return null
                return (
                  <div key={optId} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
                    <span className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-bold">
                      {idx + 1}
                    </span>
                    <span className="flex-1 font-medium">{option.text}</span>
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (idx > 0) {
                            const newArr = [...rankingItems]
                            const temp = newArr[idx - 1]
                            newArr[idx - 1] = newArr[idx]
                            newArr[idx] = temp
                            setAnswers({ ...answers, [question.id]: newArr })
                          }
                        }}
                        disabled={idx === 0}
                        className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-gray-400"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (idx < rankingItems.length - 1) {
                            const newArr = [...rankingItems]
                            const temp = newArr[idx + 1]
                            newArr[idx + 1] = newArr[idx]
                            newArr[idx] = temp
                            setAnswers({ ...answers, [question.id]: newArr })
                          }
                        }}
                        disabled={idx === rankingItems.length - 1}
                        className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-gray-400"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )

      case 'matrix':
        const matrixData = parseMatrixData(question)
        const matrixRows = matrixData?.matrix_rows || []
        const matrixCols = matrixData?.matrix_columns || []
        
        if (matrixCols.length === 0) {
          return <p className="text-gray-500 text-sm">لم يتم تحديد الأعمدة بعد</p>
        }

        return (
          <div className="space-y-3 overflow-x-auto">
            <div className="bg-gray-50 rounded-xl p-4 min-w-[500px]">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr>
                    <th className="p-2 border-b border-gray-200"></th>
                    {matrixCols.map((col: any) => (
                      <th key={col.id} className="p-2 border-b border-gray-200 text-sm font-medium text-gray-600 text-center">
                        {col.text}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matrixRows.map((row: any, rIdx: number) => (
                    <tr key={row.id || rIdx} className="border-b border-gray-100 last:border-0 hover:bg-gray-100/50">
                      <td className="p-3 text-sm font-medium">{row.text}</td>
                      {matrixCols.map((col: any) => (
                        <td key={col.id} className="p-3 text-center">
                          <input
                            type="checkbox"
                            name={`${question.id}_${row.id}`}
                            checked={Array.isArray(currentAnswer?.[row.id]) ? currentAnswer[row.id].includes(col.id) : currentAnswer?.[row.id] === col.id}
                            onChange={(e) => {
                              const isChecked = e.target.checked;
                              let rowAns = currentAnswer?.[row.id] || [];
                              if (!Array.isArray(rowAns)) rowAns = [rowAns];
                              
                              if (isChecked) {
                                rowAns = [...rowAns, col.id];
                              } else {
                                rowAns = rowAns.filter((id: any) => id !== col.id);
                              }
                              
                              setAnswers({
                                ...answers,
                                [question.id]: {
                                  ...currentAnswer,
                                  [row.id]: rowAns
                                }
                              })
                            }}
                            className="w-4 h-4 text-blue-600"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )

      case 'dropdown': {
        const searchText = dropdownSearch[question.id] || ''
        const opts = options.options || options
        const isMulti = options.dropdown_type === 'multiple'
        const filteredOptions = (Array.isArray(opts) ? opts : []).filter(
          (opt: any) => !searchText || opt.text.toLowerCase().includes(searchText.toLowerCase())
        )

        if (isMulti) {
          const selected = Array.isArray(currentAnswer) ? currentAnswer : []
          return (
            <div className="space-y-3">
              <div className="relative">
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setDropdownSearch(prev => ({ ...prev, [question.id]: e.target.value }))}
                  placeholder="ابحث عن خيار..."
                  className="w-full pr-10 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-xl p-2">
                {filteredOptions.map((opt: any) => (
                  <label key={opt.id} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${selected.includes(opt.id) ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'}`}>
                    <input
                      type="checkbox"
                      checked={selected.includes(opt.id)}
                      onChange={(e) => {
                        const newVal = e.target.checked
                          ? [...selected, opt.id]
                          : selected.filter((id: string) => id !== opt.id)
                        setAnswers({ ...answers, [question.id]: newVal })
                      }}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="flex-1 text-sm">{opt.text}</span>
                  </label>
                ))}
                {filteredOptions.length === 0 && <p className="text-gray-400 text-sm text-center py-4">لا توجد نتائج</p>}
              </div>
            </div>
          )
        }

        const isOpen = dropdownOpen[question.id] || false

        const selectedOpt = opts.find((o: any) => o.id === currentAnswer)

        return (
          <div className="space-y-2 relative">
            <div className="relative">
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchText || (selectedOpt?.text || '')}
                onFocus={() => setDropdownOpen(prev => ({ ...prev, [question.id]: true }))}
                onBlur={() => setTimeout(() => setDropdownOpen(prev => ({ ...prev, [question.id]: false })), 200)}
                onChange={(e) => {
                  setDropdownSearch(prev => ({ ...prev, [question.id]: e.target.value }))
                  if (!isOpen) setDropdownOpen(prev => ({ ...prev, [question.id]: true }))
                }}
                placeholder="ابحث أو اختر..."
                className="w-full pr-10 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            {isOpen && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                {filteredOptions.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-4">لا توجد نتائج</p>
                ) : (
                  filteredOptions.map((opt: any) => (
                    <button
                      key={opt.id}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault()
                        setAnswers({ ...answers, [question.id]: opt.id })
                        setDropdownSearch(prev => ({ ...prev, [question.id]: '' }))
                        setDropdownOpen(prev => ({ ...prev, [question.id]: false }))
                      }}
                      className={`w-full text-right px-4 py-3 text-sm hover:bg-blue-50 transition-colors flex items-center gap-3 ${
                        currentAnswer === opt.id ? 'bg-blue-50 font-medium text-blue-700' : ''
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center border-gray-300">
                        {currentAnswer === opt.id && <span className="w-2 h-2 rounded-full bg-blue-600" />}
                      </span>
                      {opt.text}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )
      }

      case 'date':
        return (
          <input
            type="date"
            value={currentAnswer || ''}
            onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        )

      case 'time':
        return (
          <input
            type="time"
            value={currentAnswer || ''}
            onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        )

      case 'file_upload':
        return (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
            <svg className="w-12 h-12 mx-auto mb-3 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="text-amber-700 font-medium">هذه الميزة قيد التطوير</p>
            <p className="text-amber-600 text-sm mt-1">سيتم تفعيل رفع الملفات قريباً</p>
          </div>
        )

      default:
        return (
          <input
            type="text"
            value={currentAnswer || ''}
            onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
      <div dir="rtl" className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
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

          {/* Show submission count for multiple allowed forms */}
          {form.allow_multiple && allUserResponses && allUserResponses.length > 0 && (
            <div className="bg-blue-50 rounded-xl p-3 mb-6">
              <p className="text-blue-700 text-sm">
                هذا التسجيل رقم {allUserResponses.length} في هذا الفورم
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Link
              href={project ? `/projects/${project.id}` : '/dashboard'}
              className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              العودة للمشروع
            </Link>
            <button
              onClick={() => {
                if (form.allow_multiple) {
                  // Just reset without deleting for multiple allowed
                  setSubmitted(false)
                  setAnswers({})
                  setShowRetryConfirm(false)
                } else {
                  // Show confirm dialog for single submission
                  setShowRetryConfirm(true)
                }
              }}
              className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              {form.allow_multiple ? 'تسجيل جديد' : 'إعادة المحاولة'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Confirmation Modal for retry
  if (showRetryConfirm) {
    return (
      <div dir="rtl" className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
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
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            رجوع
          </button>
          <h1 className="text-lg font-bold text-blue-700">{form.name}</h1>
          <span className="flex items-center gap-3">
            {timeLeft !== null && !submitted && !isExpired && (
              <span className={`text-sm font-bold ${timeLeft < 60 ? 'text-red-600' : 'text-gray-600'}`}>
                ⏱ {formatTime(timeLeft)}
              </span>
            )}
            <span className="text-sm text-gray-500">
              {questions.length} سؤال
            </span>
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="h-1 bg-gray-100">
          <div 
            className="h-full bg-blue-500 transition-all"
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
          {displayQuestions.map((question, index) => (
            <div 
              key={question.id} 
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
            >
              <div className="flex items-start gap-3 mb-4">
                <span className="w-8 h-8 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center font-bold text-sm">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {question.text}
                    {question.required && <span className="text-red-500 mr-1">*</span>}
                  </h3>
                  {question.type !== 'file_upload' && (
                    <p className="text-blue-600 text-sm mt-1 font-medium">
                      {getQuestionMaxScore(question)} نقطة
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
              className="w-full py-4 bg-gradient-to-l from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30"
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