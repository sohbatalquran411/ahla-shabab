?'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ImageUpload from '@/components/ImageUpload'

const ICON_OPTIONS = [
  { value: 'mosque', label: '�.سجد', icon: '�Y.O' },
  { value: 'sun', label: 'ش�.س', icon: '�~?️' },
  { value: 'quran', label: '�,رآ�?', icon: '�Y"-' },
  { value: 'book', label: '�fتاب', icon: '�Y"s' },
  { value: 'star', label: '�?ج�.ة', icon: '⭐' },
  { value: 'heart', label: '�,�"ب', icon: '❤️' },
  { value: 'hand', label: '�Sد', icon: '�Y��' },
  { value: 'moon', label: '�,�.ر', icon: '�YOT' }
]

const COLOR_OPTIONS = [
  '#10B981', // green
  '#3B82F6', // blue
  '#8B5CF6', // purple
  '#F59E0B', // amber
  '#EF4444', // red
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#84CC16'  // lime
]

export default function CreateProjectPage() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    target_gender: 'both',
    icon: 'mosque',
    color: '#10B981',
    image_url: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.name.trim()) {
      setError('�Sرج�? إدخا�" اس�. ا�"�.شر�^ع')
      return
    }

    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!profile || (profile.role !== 'supervisor' && profile.role !== 'admin')) {
        router.push('/dashboard')
        return
      }

      const { error: insertError } = await supabase
        .from('projects')
        .insert({
          name: formData.name,
          description: formData.description,
          target_gender: formData.target_gender,
          icon: formData.icon,
          color: formData.color,
          image_url: formData.image_url,
          created_by: user.id
        })

      if (insertError) throw insertError

      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أث�?اء إ�?شاء ا�"�.شر�^ع')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            رج�^ع
          </Link>
          <h1 className="text-lg font-bold text-blue-700">إ�?شاء �.شر�^ع جد�Sد</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Upload */}
            <ImageUpload
              onImageUploaded={(url) => setFormData(prev => ({ ...prev, image_url: url }))}
              currentImage={formData.image_url}
            />

            {/* Project Name */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">اس�. ا�"�.شر�^ع *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="�.ثا�": ا�"�.درسة ا�"إ�S�.ا�?�Sة"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">ا�"�^صف</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="�^صف �.ختصر �"�"�.شر�^ع..."
              />
            </div>

            {/* Target Gender */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">ا�"فئة ا�"�.ست�?دفة</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'both', label: 'ا�"�f�"', icon: '�Y'�', color: 'purple' },
                  { value: 'male', label: 'ذ�f�^ر ف�,ط', icon: '�Y'�', color: 'blue' },
                  { value: 'female', label: 'إ�?اث ف�,ط', icon: '�Y'�', color: 'pink' }
                ].map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, target_gender: option.value }))}
                    className={`p-4 rounded-xl font-medium transition-all border-2 ${
                      formData.target_gender === option.value
                        ? option.color === 'purple' ? 'border-purple-600 bg-purple-50 text-purple-700' :
                          option.color === 'blue' ? 'border-blue-600 bg-blue-50 text-blue-700' :
                          'border-pink-600 bg-pink-50 text-pink-700'
                        : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-2xl mb-1 block">{option.icon}</span>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Icon Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">ا�"أ�S�,�^�?ة</label>
              <div className="grid grid-cols-4 gap-3">
                {ICON_OPTIONS.map(icon => (
                  <button
                    key={icon.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, icon: icon.value }))}
                    className={`p-4 rounded-xl transition-all border-2 ${
                      formData.icon === icon.value
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-3xl">{icon.icon}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Color Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">ا�"�"�^�?</label>
              <div className="grid grid-cols-8 gap-3">
                {COLOR_OPTIONS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, color }))}
                    className={`w-12 h-12 rounded-xl transition-all ${
                      formData.color === color
                        ? 'ring-4 ring-offset-2 ring-gray-400 scale-110'
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">�.عا�S�?ة</label>
              <div className="bg-white rounded-xl overflow-hidden border border-gray-200">
                {formData.image_url ? (
                  <div className="w-full h-44 overflow-hidden">
                    <img 
                      src={formData.image_url} 
                      alt="???? ???????" 
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div
                    className="w-full h-44 flex items-center justify-center text-5xl"
                    style={{ backgroundColor: `${formData.color}15` }}
                  >
                    {ICON_OPTIONS.find(i => i.value === formData.icon)?.icon || '�Y.O'}
                  </div>
                )}
                <div className="p-5">
                  <h3 className="text-lg font-bold text-gray-900">
                    {formData.name || 'اس�. ا�"�.شر�^ع'}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {formData.description || '�^صف ا�"�.شر�^ع'}
                  </p>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-4 pt-4 border-t">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-4 bg-gradient-to-l from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    جار�S ا�"إ�?شاء...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    إ�?شاء ا�"�.شر�^ع
                  </>
                )}
              </button>
              <Link
                href="/dashboard"
                className="px-6 py-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                إ�"غاء
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}

