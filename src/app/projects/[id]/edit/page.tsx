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
  const [origin, setOrigin] = useState('')
  const [is_archived, setIsArchived] = useState(false)
  const [supervisors, setSupervisors] = useState<any[]>([])
  const [bans, setBans] = useState<any[]>([])
  const [allProfiles, setAllProfiles] = useState<any[]>([])
  const [projectUsers, setProjectUsers] = useState<any[]>([])
  const [searchSupervisorQuery, setSearchSupervisorQuery] = useState('')
  const [searchBanQuery, setSearchBanQuery] = useState('')

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  const [mediaType, setMediaType] = useState<'image' | 'icon'>('icon')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    target_gender: 'both',
    visibility: 'public' as 'public' | 'private',
    icon: 'mosque',
    color: '#10B981',
    image_url: '',
    modules: { forms: true, curriculum: false },
    is_archived: false
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

      const [projectResult, formsResult, curriculaResult, supervisorsResult, bansResult, profilesResult, projectUsersResult] = await Promise.all([
        supabase.from('projects').select('*').eq('id', projId).single(),
        supabase.from('forms').select('*').eq('project_id', projId).order('created_at', { ascending: false }),
        supabase.from('curricula').select('*').eq('project_id', projId).order('created_at', { ascending: false }),
        supabase.from('project_supervisors').select('*, profile:profiles!user_id(*)').eq('project_id', projId).order('created_at', { ascending: false }),
        supabase.from('project_bans').select('*, profile:profiles!user_id(*)').eq('project_id', projId).order('created_at', { ascending: false }),
        supabase.from('profiles').select('*').order('name'),
        supabase.from('user_projects').select('*, profile:profiles!user_id(*)').eq('project_id', projId).order('created_at', { ascending: false })
      ])

      const projectData = projectResult.data

      if (!projectData) {
        router.push('/projects')
        return
      }

      setProject(projectData)
      setForms(formsResult.data || [])
      setCurricula(curriculaResult.data || [])
      setSupervisors(supervisorsResult.data || [])
      setBans(bansResult.data || [])
      setAllProfiles(profilesResult.data || [])
      setProjectUsers(projectUsersResult.data || [])
      setMediaType(projectData.image_url ? 'image' : 'icon')
      setFormData({
        name: projectData.name || '',
        description: projectData.description || '',
        target_gender: projectData.target_gender || 'both',
        visibility: projectData.visibility || 'public',
        icon: projectData.icon || 'mosque',
        color: projectData.color || '#10B981',
        image_url: projectData.image_url || '',
        modules: projectData.modules || { forms: true, curriculum: false },
        is_archived: projectData.is_archived || false
      })
      setIsArchived(projectData.is_archived || false)
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
          visibility: formData.visibility,
          icon: formData.icon,
          color: formData.color,
          image_url: formData.image_url,
          modules: formData.modules,
          is_archived: formData.is_archived,
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

  const handleToggleArchive = async () => {
    const newValue = !is_archived
    setIsArchived(newValue)
    setFormData(prev => ({ ...prev, is_archived: newValue }))
  }

  const handleToggleSupervisor = async (userId: string, isCurrentlySupervisor: boolean) => {
    try {
      if (isCurrentlySupervisor) {
        const sup = supervisors.find(s => s.user_id === userId)
        if (sup) {
          await supabase.from('project_supervisors').delete().eq('id', sup.id)
          setSupervisors(prev => prev.filter(s => s.id !== sup.id))
        }
      } else {
        // If banned, unban first
        const ban = bans.find(b => b.user_id === userId)
        if (ban) {
          await supabase.from('project_bans').delete().eq('id', ban.id)
          setBans(prev => prev.filter(b => b.id !== ban.id))
        }

        const { error } = await supabase
          .from('project_supervisors')
          .insert({ project_id: projectId, user_id: userId, created_by: profile?.id })

        if (error) {
          if (error.code === '23505') {
            setError('هذا المستخدم مشرف بالفعل')
          } else throw error
          return
        }
        const p = allProfiles.find(p => p.id === userId) || projectUsers.find((pu: any) => pu.profile?.id === userId)?.profile
        setSupervisors(prev => [{ id: 's_' + Date.now(), user_id: userId, profile: p || { name: '', email: '' } }, ...prev])
      }
      setError('')
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تعديل المشرف')
    }
  }

  const handleToggleBan = async (userId: string, isCurrentlyBanned: boolean) => {
    try {
      if (isCurrentlyBanned) {
        const ban = bans.find(b => b.user_id === userId)
        if (ban) {
          await supabase.from('project_bans').delete().eq('id', ban.id)
          setBans(prev => prev.filter(b => b.id !== ban.id))
        }
      } else {
        // If supervisor, remove from supervisors first
        const sup = supervisors.find(s => s.user_id === userId)
        if (sup) {
          await supabase.from('project_supervisors').delete().eq('id', sup.id)
          setSupervisors(prev => prev.filter(s => s.id !== sup.id))
        }

        const { error } = await supabase
          .from('project_bans')
          .insert({ project_id: projectId, user_id: userId, created_by: profile?.id })

        if (error) {
          if (error.code === '23505') {
            setError('هذا المستخدم محظور بالفعل')
          } else throw error
          return
        }
        const p = allProfiles.find(p => p.id === userId) || projectUsers.find((pu: any) => pu.profile?.id === userId)?.profile
        setBans(prev => [{ id: 'b_' + Date.now(), user_id: userId, profile: p || { name: '', email: '' } }, ...prev])
      }
      setError('')
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'حدث خطأ أثناء تعديل الحظر')
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
                  <h4 className="font-bold text-gray-900">المحتوى التعليمي</h4>
                  <Link
                    href={`/admin/curricula/create?project_id=${project.id}`}
                    className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-1.5 text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    إضافة محتوى
                  </Link>
                </div>
                {curricula.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-4">لا يوجد محتوى في هذا المشروع بعد</p>
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

            {/* Visibility Toggle */}
            <div className="pt-4 border-t space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-gray-900">إظهار المشروع</h4>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, visibility: 'public' }))}
                    className={`p-4 rounded-xl font-medium transition-all border-2 ${
                      formData.visibility === 'public'
                        ? 'border-green-600 bg-green-50 text-green-700'
                        : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-2xl mb-1 block">🌍</span>
                    عام (الكل يراه)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, visibility: 'private' }))}
                    className={`p-4 rounded-xl font-medium transition-all border-2 ${
                      formData.visibility === 'private'
                        ? 'border-purple-600 bg-purple-50 text-purple-700'
                        : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-2xl mb-1 block">🔒</span>
                    خاص (باستخدام روابط الدعوة)
                  </button>
                </div>
              </div>
            </div>

            {formData.visibility === 'private' && (
              <div className="pt-4 border-t space-y-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-gray-900">مشاركة المشروع</h4>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">انسخ الرابط لإرساله للآخرين للانضمام للمشروع</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={origin ? `${origin}/projects/${projectId}` : ''}
                      className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm dir-ltr text-left"
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const url = `${window.location.origin}/projects/${projectId}`
                        navigator.clipboard.writeText(url).then(() => alert('تم نسخ رابط المشروع')).catch(() => {
                          const input = document.createElement('input')
                          input.value = url
                          document.body.appendChild(input)
                          input.select()
                          document.execCommand('copy')
                          document.body.removeChild(input)
                          alert('تم نسخ رابط المشروع')
                        })
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm whitespace-nowrap flex items-center gap-1.5"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                      نسخ الرابط
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Admin: Archive Toggle */}
            {profile?.role === 'admin' && (
              <div className="pt-4 border-t space-y-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-gray-900">أرشفة المشروع</h4>
                      <p className="text-sm text-gray-500 mt-1">إذا كانت مفعّلة، يختفي المشروع من الجميع</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleToggleArchive}
                      className={`relative w-14 h-7 rounded-full transition-colors ${formData.is_archived ? 'bg-amber-500' : 'bg-gray-300'}`}
                    >
                      <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${formData.is_archived ? 'translate-x-7' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Supervisors Management */}
            <div className="pt-4 border-t space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-gray-900">المشرفون</h4>
                  <span className="text-xs text-gray-500">{supervisors.length} مشرف</span>
                </div>
                {(() => {
                  const supervisorIds = new Set(supervisors.map(s => s.user_id))
                  const banIds = new Set(bans.map(b => b.user_id))
                  const allUsers = (profile?.role === 'admin' ? allProfiles : projectUsers.map((pu: any) => pu.profile).filter(Boolean))
                  const available = allUsers.filter((p: any) => !banIds.has(p.id))
                  const filtered = searchSupervisorQuery
                    ? available.filter((p: any) =>
                        p.name.toLowerCase().includes(searchSupervisorQuery.toLowerCase()) ||
                        p.email.toLowerCase().includes(searchSupervisorQuery.toLowerCase())
                      )
                    : []
                  return (
                    <div className="space-y-3">
                      <div className="relative">
                        <input
                          type="text"
                          value={searchSupervisorQuery}
                          onChange={(e) => setSearchSupervisorQuery(e.target.value)}
                          placeholder="ابحث بالاسم أو البريد..."
                          className="w-full px-4 py-2 pr-10 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      {searchSupervisorQuery && filtered.length > 0 && (
                        <div className="space-y-1 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-white">
                          {filtered.map((p: any) => (
                            <div key={p.id} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm bg-gray-100 text-gray-600">
                                  {(p.name || p.email)?.[0] || '?'}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{p.name || 'غير معروف'}</p>
                                  <p className="text-xs text-gray-500">{p.email}</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  handleToggleSupervisor(p.id, supervisorIds.has(p.id))
                                  setSearchSupervisorQuery('')
                                }}
                                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                                  supervisorIds.has(p.id)
                                    ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                                }`}
                              >
                                {supervisorIds.has(p.id) ? 'إزالة' : 'إضافة'}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      {searchSupervisorQuery && filtered.length === 0 && (
                        <p className="text-gray-400 text-sm text-center py-2">لا يوجد مستخدمون</p>
                      )}
                      {supervisors.length > 0 && (
                        <div className="space-y-1 max-h-60 overflow-y-auto border-t pt-2">
                          <p className="text-xs text-gray-500 mb-1">المشرفون الحاليون:</p>
                          {supervisors.map((s: any) => {
                            const p = allUsers.find((u: any) => u.id === s.user_id)
                            if (!p) return null
                            return (
                              <div key={s.user_id} className="flex items-center justify-between bg-blue-50 rounded-lg px-3 py-2 border border-blue-200">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm bg-blue-100 text-blue-600">
                                    {(p.name || p.email)?.[0] || '?'}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">{p.name || 'غير معروف'}</p>
                                    <p className="text-xs text-gray-500">{p.email}</p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleToggleSupervisor(s.user_id, true)
                                    setSearchSupervisorQuery('')
                                  }}
                                  className="px-3 py-1 text-sm rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                >
                                  إزالة
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>
            </div>

            {/* Bans Management */}
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-gray-900">الحظر</h4>
                  <span className="text-xs text-gray-500">{bans.length} محظور</span>
                </div>
                {(() => {
                  const supervisorIds = new Set(supervisors.map(s => s.user_id))
                  const banIds = new Set(bans.map(b => b.user_id))
                  const allUsers = (profile?.role === 'admin' ? allProfiles : projectUsers.map((pu: any) => pu.profile).filter(Boolean))
                  const filtered = searchBanQuery
                    ? allUsers.filter((p: any) =>
                        p.name.toLowerCase().includes(searchBanQuery.toLowerCase()) ||
                        p.email.toLowerCase().includes(searchBanQuery.toLowerCase())
                      )
                    : []
                  return (
                    <div className="space-y-3">
                      <div className="relative">
                        <input
                          type="text"
                          value={searchBanQuery}
                          onChange={(e) => setSearchBanQuery(e.target.value)}
                          placeholder="ابحث بالاسم أو البريد..."
                          className="w-full px-4 py-2 pr-10 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      {searchBanQuery && filtered.length > 0 && (
                        <div className="space-y-1 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-white">
                          {filtered.map((p: any) => (
                            <div key={p.id} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm bg-gray-100 text-gray-600">
                                  {(p.name || p.email)?.[0] || '?'}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{p.name || 'غير معروف'}</p>
                                  <p className="text-xs text-gray-500">{p.email}</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  handleToggleBan(p.id, banIds.has(p.id))
                                  setSearchBanQuery('')
                                }}
                                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                                  banIds.has(p.id)
                                    ? 'bg-green-50 text-green-600 hover:bg-green-100'
                                    : 'bg-red-50 text-red-600 hover:bg-red-100'
                                }`}
                              >
                                {banIds.has(p.id) ? 'إلغاء الحظر' : 'حظر'}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      {searchBanQuery && filtered.length === 0 && (
                        <p className="text-gray-400 text-sm text-center py-2">لا يوجد مستخدمون</p>
                      )}
                      {bans.length > 0 && (
                        <div className="space-y-1 max-h-60 overflow-y-auto border-t pt-2">
                          <p className="text-xs text-gray-500 mb-1">المحظورون حالياً:</p>
                          {bans.map((b: any) => {
                            const p = allUsers.find((u: any) => u.id === b.user_id)
                            if (!p) return null
                            return (
                              <div key={b.user_id} className="flex items-center justify-between bg-red-50 rounded-lg px-3 py-2 border border-red-200">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm bg-red-100 text-red-600">
                                    {(p.name || p.email)?.[0] || '?'}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">{p.name || 'غير معروف'}</p>
                                    <p className="text-xs text-gray-500">{p.email}</p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleToggleBan(b.user_id, true)
                                    setSearchBanQuery('')
                                  }}
                                  className="px-3 py-1 text-sm rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                                >
                                  إلغاء الحظر
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })()}
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