'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import ImageUpload from '@/components/ImageUpload'

const ICON_OPTIONS = [
  { value: 'mosque', label: 'مسجد', icon: '🕌' },
  { value: 'sun', label: 'شمس', icon: '☀️' },
  { value: 'quran', label: 'قرآن', icon: '📖' },
  { value: 'book', label: 'كتاب', icon: '📚' },
  { value: 'star', label: 'نجمة', icon: '⭐' },
  { value: 'heart', label: 'قلب', icon: '❤️' },
  { value: 'hand', label: 'يد', icon: '🤲' },
  { value: 'moon', label: 'قمر', icon: '🌙' }
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

function EditProjectContent() {
  const [projectId, setProjectId] = useState<string>('')
  const [project, setProject] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [forms, setForms] = useState<any[]>([])
  const [curricula, setCurricula] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  
  const [mediaType, setMediaType] = useState<'image' | 'icon'>('icon')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    target_gender: 'both',
    icon: 'mosque',
    color: '#10B981',
    image_url: '',
    modules: { forms: true, curriculum: false }
  })

  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const project_id = searchParams.get('id')
    if (project_id) {
      setProjectId(project_id)
      fetchData(project_id)
    } else {
      router.push('/projects')
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

      const [projectResult, formsResult, curriculaResult] = await Promise.all([
        supabase.from('projects').select('*').eq('id', projId).single(),
        supabase.from('forms').select('*').eq('project_id', projId).order('created_at', { ascending: false }),
        supabase.from('curricula').select('*').eq('project_id', projId).order('created_at', { ascending: false })
      ])

      const projectData = projectResult.data

      if (!projectData) {
        router.push('/projects')
        return
      }

      setProject(projectData)
      setForms(formsResult.data || [])
      setCurricula(curriculaResult.data || [])
      setMediaType(projectData.image_url ? 'image' : 'icon')
      setFormData({
        name: projectData.name || '',
        description: projectData.description || '',
        target_gender: projectData.target_gender || 'both',
        icon: projectData.icon || 'mosque',
        color: projectData.color || '#10B981',
        image_url: projectData.image_url || '',
        modules: projectData.modules || { forms: true, curriculum: false }
      })
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.name.trim()) {
      setError('يرجى إدخال اسم المشروع')
      return
    }

    if (profile?.role !== 'admin' && profile?.role !== 'supervisor') {
      setError('ليس لديك صلاحية تعديل المشروع')
      return
    }

    setSaving(true)

    try {
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          name: formData.name,
          description: formData.description,
          target_gender: formData.target_gender,
          icon: formData.icon,
          color: formData.color,
          image_url: formData.image_url,
          modules: formData.modules,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId)

      if (updateError) throw updateError

      router.push(`/projects/${projectId}`)
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تحديث المشروع')
    } finally {
      setSaving(false)
    }
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
      <header className="bg-white shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            رجوع
          </button>
          <h1 className="text-lg font-bold text-blue-700">تعديل المشروع</h1>
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
            {/* Project Name */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">اسم المشروع *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="مثال: المدرسة الإيمانية"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">الوصف</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="وصف مختصر للمشروع..."
              />
            </div>

            {/* Target Gender */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">الفئة المستهدفة</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'both', label: 'الكل', icon: '👥', color: 'purple' },
                  { value: 'male', label: 'ذكور فقط', icon: '👨', color: 'blue' },
                  { value: 'female', label: 'إناث فقط', icon: '👩', color: 'pink' }
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

            {/* Media Type Toggle */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">صورة المشروع</label>
              <div className="flex gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => { setMediaType('image'); setFormData(prev => ({ ...prev, image_url: '' })) }}
                  className={`flex-1 p-3 rounded-xl font-medium transition-all border-2 ${
                    mediaType === 'image'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  صورة
                </button>
                <button
                  type="button"
                  onClick={() => { setMediaType('icon'); setFormData(prev => ({ ...prev, image_url: '' })) }}
                  className={`flex-1 p-3 rounded-xl font-medium transition-all border-2 ${
                    mediaType === 'icon'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  أيقونة ولون
                </button>
              </div>

              {mediaType === 'image' ? (
                <ImageUpload
                  onImageUploaded={(url) => setFormData(prev => ({ ...prev, image_url: url }))}
                  currentImage={formData.image_url}
                />
              ) : (
                <div className="space-y-4">
                  {/* Icon Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">اختر الأيقونة</label>
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">اختر اللون</label>
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
                </div>
              )}
            </div>

            {/* Preview */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">معاينة</label>
              <div className="bg-white rounded-xl overflow-hidden border border-gray-200">
                {formData.image_url ? (
                  <div className="w-full h-44 overflow-hidden">
                    <img
                      src={formData.image_url}
                      alt="صورة المشروع"
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div
                    className="w-full h-44 flex items-center justify-center text-5xl"
                    style={{ backgroundColor: `${formData.color}15` }}
                  >
                    {ICON_OPTIONS.find(i => i.value === formData.icon)?.icon || '🕌'}
                  </div>
                )}
                <div className="p-5">
                  <h3 className="text-lg font-bold text-gray-900">
                    {formData.name || 'اسم المشروع'}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {formData.description || 'وصف المشروع'}
                  </p>
                </div>
              </div>
            </div>

            {/* Admin: Forms Management */}
            <div className="pt-4 border-t space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-gray-900">النماذج</h4>
                  <Link
                    href={`/forms/create?project_id=${project.id}`}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5 text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    إضافة فورم
                  </Link>
                </div>
                {forms.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-4">لا توجد فورمز في هذا المشروع بعد</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="py-2 font-medium text-gray-600">الاسم</th>
                          <th className="py-2 font-medium text-gray-600">تاريخ الإنشاء</th>
                          <th className="py-2 font-medium text-gray-600 text-center">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {forms.map(form => (
                          <tr key={form.id} className="hover:bg-white/50">
                            <td className="py-2 text-gray-900">{form.name}</td>
                            <td className="py-2 text-gray-500">{new Date(form.created_at).toLocaleDateString('ar-EG')}</td>
                            <td className="py-2 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Link href={`/forms/${form.id}`} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="عرض">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                </Link>
                                <Link href={`/forms/${form.id}/edit`} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg" title="تعديل">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                </Link>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Admin: Curricula Management */}
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-gray-900">المناهج التعليمية</h4>
                  <Link
                    href={`/admin/curricula/create?project_id=${project.id}`}
                    className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-1.5 text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    إضافة منهج
                  </Link>
                </div>
                {curricula.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-4">لا توجد مناهج في هذا المشروع بعد</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="py-2 font-medium text-gray-600">العنوان</th>
                          <th className="py-2 font-medium text-gray-600">تاريخ الإنشاء</th>
                          <th className="py-2 font-medium text-gray-600 text-center">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {curricula.map(c => (
                          <tr key={c.id} className="hover:bg-white/50">
                            <td className="py-2 text-gray-900">{c.title}</td>
                            <td className="py-2 text-gray-500">{new Date(c.created_at).toLocaleDateString('ar-EG')}</td>
                            <td className="py-2 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Link href={`/projects/${project.id}/curriculum`} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg" title="عرض الدروس">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                </Link>
                                <Link href={`/admin/curricula/${c.id}/edit`} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg" title="تعديل">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                </Link>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-4 pt-4 border-t">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-4 bg-gradient-to-l from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    حفظ التعديلات
                  </>
                )}
              </button>
              <Link
                href={`/projects/${projectId}`}
                className="px-6 py-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                إلغاء
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}

export default function EditProjectPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div></div>}>
      <EditProjectContent />
    </Suspense>
  )
}