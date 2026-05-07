'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    gender: '' as '' | 'male' | 'female',
    role: 'volunteer' as 'volunteer' | 'supervisor'
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  const validateStep1 = () => {
    if (!formData.name.trim()) {
      setError('�Sرج�? إدخا�" ا�"اس�. ا�"�fا�.�"')
      return false
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('�Sرج�? إدخا�" بر�Sد إ�"�fتر�^�?�S صح�Sح')
      return false
    }
    if (!formData.phone.trim() || formData.phone.length < 10) {
      setError('�Sرج�? إدخا�" ر�,�. �?اتف صح�Sح')
      return false
    }
    if (!formData.gender) {
      setError('�Sرج�? اخت�Sار ا�"�?�^ع')
      return false
    }
    return true
  }

  const validateStep2 = () => {
    if (formData.password.length < 6) {
      setError('�f�"�.ة ا�"�.ر�^ر �Sجب أ�? ت�f�^�? 6 أحرف ع�"�? ا�"أ�,�"')
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      setError('�f�"�.تا ا�"�.ر�^ر غ�Sر �.تطاب�,ت�S�?')
      return false
    }
    return true
  }

  const handleNextStep = () => {
    setError('')
    if (step === 1 && validateStep1()) {
      setStep(2)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validateStep2()) return

    setLoading(true)

    try {
      // Check if email already exists in auth
      const { data: existingAuth } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      }).catch(() => ({ data: null }))

      if (existingAuth?.user) {
        setError('�?ذا ا�"بر�Sد ا�"إ�"�fتر�^�?�S �.سج�" �.سب�,ا�<. حا�^�" تسج�S�" ا�"دخ�^�".')
        setLoading(false)
        return
      }

      // Sign up new user
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            gender: formData.gender,
            role: formData.role
          }
        }
      })

      if (signUpError) throw signUpError

      if (data.user) {
        // Update profile with full data (trigger handles basic profile creation)
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            name: formData.name,
            phone: formData.phone,
            gender: formData.gender,
            role: formData.role,
            status: formData.role === 'volunteer' ? 'approved' : 'pending'
          })
          .eq('id', data.user.id)

        if (profileError) console.error('Profile update error:', profileError)

        // Sign in immediately for volunteers
        if (formData.role === 'volunteer') {
          await supabase.auth.signInWithPassword({
            email: formData.email,
            password: formData.password
          })
          router.push('/dashboard')
        } else {
          router.push('/login?pending=true')
        }
      }
    } catch (error: any) {
      console.error('Registration error:', error)
      setError(error.message || 'حدث خطأ أث�?اء ا�"تسج�S�"')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      {/* Decorative Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl" />
      </div>

      {/* Register Card */}
      <div className="relative w-full max-w-lg">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-l from-blue-600 to-blue-700 px-8 py-8 text-center">
            <h1 className="text-2xl font-bold text-white mb-1">إ�?شاء حساب جد�Sد</h1>
            <p className="text-blue-100 text-sm">ا�?ض�. إ�"�S�?ا ف�S أح�"�? شباب</p>
            
            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-4 mt-4">
              <div className={`flex items-center gap-2 ${step >= 1 ? 'text-white' : 'text-blue-300'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step >= 1 ? 'bg-white text-blue-700' : 'bg-blue-500 text-white'
                }`}>
                  {step > 1 ? '�o"' : '1'}
                </div>
                <span className="text-sm hidden sm:block">ا�"�.ع�"�^�.ات</span>
              </div>
              <div className="w-12 h-0.5 bg-blue-300" />
              <div className={`flex items-center gap-2 ${step >= 2 ? 'text-white' : 'text-blue-300'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step >= 2 ? 'bg-white text-blue-700' : 'bg-blue-500 text-white'
                }`}>
                  2
                </div>
                <span className="text-sm hidden sm:block">ا�"أ�.ا�?</span>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* Step 1: Personal Info */}
            {step === 1 && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">ا�"اس�. ا�"�fا�.�" *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="�.ح�.د أح�.د"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">ا�"بر�Sد ا�"إ�"�fتر�^�?�S *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="example@email.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-smfont-medium text-gray-700">ر�,�. ا�"�?اتف *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="01xxxxxxxxx"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">ا�"�?�^ع *</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, gender: 'male' }))}
                        className={`py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                          formData.gender === 'male'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        ذ�fر
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, gender: 'female' }))}
                        className={`py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                          formData.gender === 'female'
                            ? 'bg-pink-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        أ�?ث�?
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">�?�^ع ا�"حساب</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, role: 'volunteer' }))}
                        className={`py-3 rounded-xl font-medium transition-all ${
                          formData.role === 'volunteer'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        �.تط�^ع
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, role: 'supervisor' }))}
                        className={`py-3 rounded-xl font-medium transition-all ${
                          formData.role === 'supervisor'
                            ? 'bg-amber-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        �.شرف
                      </button>
                    </div>
                  </div>
                </div>

                {formData.role === 'supervisor' && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
                    <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>�.�"احظة: حساب ا�"�.شرف �Sحتاج �.�^اف�,ة �.�? ا�"إدارة �,ب�" ا�"تفع�S�"</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full py-4 bg-gradient-to-l from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/30"
                >
                  ا�"تا�"�S: إعداد �f�"�.ة ا�"�.ر�^ر
                </button>
              </div>
            )}

            {/* Step 2: Password */}
            {step === 2 && (
              <div className="space-y-5">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  تعد�S�" ا�"�.ع�"�^�.ات
                </button>

                <div className="bg-gray-50 rounded-xl p-4 text-sm">
                  <p className="text-gray-600">
                    <strong>ا�"بر�Sد:</strong> {formData.email}
                  </p>
                  <p className="text-gray-600">
                    <strong>ا�"اس�.:</strong> {formData.name}
                  </p>
                  <p className="text-gray-600">
                    <strong>ا�"�?�^ع:</strong> {formData.gender === 'male' ? 'ذ�fر' : 'أ�?ث�?'}
                  </p>
                  <p className="text-gray-600">
                    <strong>ا�"د�^ر:</strong> {formData.role === 'volunteer' ? '�.تط�^ع' : '�.شرف'}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">�f�"�.ة ا�"�.ر�^ر *</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="6 أحرف ع�"�? ا�"أ�,�""
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">تأ�f�Sد �f�"�.ة ا�"�.ر�^ر *</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="أعد إدخا�" �f�"�.ة ا�"�.ر�^ر"
                    required
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-4 bg-gradient-to-l from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 shadow-lg shadow-blue-500/30"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        جار�S ا�"تسج�S�"...
                      </span>
                    ) : (
                      'إ�?شاء ا�"حساب'
                    )}
                  </button>
                </div>
              </div>
            )}

            <div className="text-center pt-2 border-t">
              <p className="text-gray-600 text-sm">
                �"د�S�f حساب با�"فع�"�Y{' '}
                <Link href="/login" className="text-blue-600 font-semibold hover:text-blue-700">
                  سج�" دخ�^�"�f
                </Link>
              </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-blue-100 text-xs mt-6">
          © 2026 أح�"�? شباب. ج�.�Sع ا�"ح�,�^�, �.حف�^ظة
        </p>
      </div>
    </div>
  )
}

