'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Gender, NotificationType } from '@/types'

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showNotifPrefs, setShowNotifPrefs] = useState(false)
  const [notifPrefs, setNotifPrefs] = useState<{ assignment: boolean }>({ assignment: true })
  const [savingNotif, setSavingNotif] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    gender: '' as Gender | ''
  })

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })
  const [showPasswordChange, setShowPasswordChange] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
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

      if (!profileData) {
        router.push('/login')
        return
      }

      setProfile(profileData)
      setFormData({
        name: profileData.name || '',
        phone: profileData.phone || '',
        gender: profileData.gender || ''
      })

      // Fetch notification preferences
      const { data: prefs } = await supabase
        .from('notification_preferences')
        .select('notification_type, enabled')
        .eq('user_id', user.id)

      if (prefs) {
        const prefMap: { assignment: boolean } = { assignment: true }
        prefs.forEach(p => {
          if (p.notification_type === 'assignment') prefMap.assignment = p.enabled
        })
        setNotifPrefs(prefMap)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!formData.name.trim()) {
      setError('يرجن إدخال الاسم')
      return
    }

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not found')

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          name: formData.name.trim(),
          phone: formData.phone?.trim() || null,
          gender: formData.gender || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      setSuccess('تم تحديث البيانات بنجاح')
      
      // Refresh profile
      fetchProfile()
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تحديث البيانات')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!passwordData.new_password) {
      setError('يرجن إدخال الباسورد الجديد')
      return
    }

    if (passwordData.new_password.length < 6) {
      setError('الباسورد يجب أن يكون 6 أحرف على الأقل')
      return
    }

    if (passwordData.new_password !== passwordData.confirm_password) {
      setError('الباسورد الجديد غير متطابق')
      return
    }

    setSaving(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.new_password
      })

      if (updateError) throw updateError

      setSuccess('تم تغيير الباسورد بنجاح')
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' })
      setShowPasswordChange(false)
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تغيير الباسورد')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveNotifPrefs = async () => {
    setSavingNotif(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Upsert assignment preference
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          notification_type: 'assignment',
          enabled: notifPrefs.assignment
        }, { onConflict: 'user_id, notification_type' })

      if (error) throw error
    } catch (err) {
      console.error('Error saving notification preferences:', err)
    } finally {
      setSavingNotif(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { class: string, label: string }> = {
      pending: { class: 'bg-amber-100 text-amber-700', label: 'معلق' },
      approved: { class: 'bg-green-100 text-green-700', label: 'موافق عليه' },
      rejected: { class: 'bg-red-100 text-red-700', label: 'مرفوض' }
    }
    const badge = badges[status] || badges.pending
    return (
      <span className={`px-3 py-1 text-xs rounded-full font-medium ${badge.class}`}>
        {badge.label}
      </span>
    )
  }

  const getRoleBadge = (role: string) => {
    const badges: Record<string, { class: string, label: string }> = {
      admin: { class: 'bg-purple-100 text-purple-700', label: 'مدير' },
      supervisor: { class: 'bg-blue-100 text-blue-700', label: 'مشرف' },
      volunteer: { class: 'bg-gray-100 text-gray-700', label: 'متطوع' }
    }
    const badge = badges[role] || badges.volunteer
    return (
      <span className={`px-3 py-1 text-xs rounded-full font-medium ${badge.class}`}>
        {badge.label}
      </span>
    )
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
          <h1 className="text-lg font-bold text-blue-700">ملفي الشخصي</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Profile Info Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-3xl font-bold">
              {profile?.name?.charAt(0) || '?'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{profile?.name}</h2>
              <p className="text-gray-500">{profile?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                {getRoleBadge(profile?.role)}
                {getStatusBadge(profile?.status)}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-gray-500 text-sm">تاريخ التسجيل</p>
              <p className="font-bold text-gray-900">
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('ar-EG') : '-'}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-gray-500 text-sm">النوع</p>
              <p className="font-bold text-gray-900">
                {profile?.gender === 'male' ? 'ذكر' : profile?.gender === 'female' ? 'أنثى' : '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Edit Profile Form */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            تعديل البيانات الشخصية
          </h3>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-6">
              {success}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الاسم *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="أدخل اسمك الكامل"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">رقم الناتف</label>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="01xxxxxxxxx"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">النوع</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, gender: 'male' }))}
                  className={`px-4 py-3 rounded-xl font-medium transition-all border-2 ${
                    formData.gender === 'male'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  👨 ذكر
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, gender: 'female' }))}
                  className={`px-4 py-3 rounded-xl font-medium transition-all border-2 ${
                    formData.gender === 'female'
                      ? 'border-pink-600 bg-pink-50 text-pink-700'
                      : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  👩 أنثى
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
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
          </form>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <button
            onClick={() => setShowPasswordChange(!showPasswordChange)}
            className="w-full flex items-center justify-between py-3 hover:bg-gray-50 rounded-xl px-4 transition-colors"
          >
            <span className="flex items-center gap-2 font-medium text-gray-800">
              <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              تغيير الباسورد
            </span>
            <svg className={`w-5 h-5 text-gray-400 transition-transform ${showPasswordChange ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showPasswordChange && (
            <form onSubmit={handleChangePassword} className="mt-4 space-y-4 pt-4 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الباسورد الجديد *</label>
                <input
                  type="password"
                  value={passwordData.new_password}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, new_password: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="أدخل الباسوورد الجديد"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">تأكيد الباسورد *</label>
                <input
                  type="password"
                  value={passwordData.confirm_password}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirm_password: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="أعد إدخال الباسوورد"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 bg-amber-600 text-white rounded-xl font-medium hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    جاري التغيير...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    تغيير الباسورد
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Notification Preferences */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <button
            onClick={() => setShowNotifPrefs(!showNotifPrefs)}
            className="w-full flex items-center justify-between py-3 hover:bg-gray-50 rounded-xl px-4 transition-colors"
          >
            <span className="flex items-center gap-2 font-medium text-gray-800">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              إعدادات الإشعارات
            </span>
            <svg className={`w-5 h-5 text-gray-400 transition-transform ${showNotifPrefs ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showNotifPrefs && (
            <div className="mt-4 pt-4 border-t space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-medium text-gray-900">إشعارات إضافة المشاريع</p>
                  <p className="text-sm text-gray-500">عند إضافتك إلى مشروع جديد من الإدارة</p>
                </div>
                <button
                  type="button"
                  onClick={() => setNotifPrefs(prev => ({ ...prev, assignment: !prev.assignment }))}
                  className={`relative w-14 h-7 rounded-full transition-colors ${notifPrefs.assignment ? 'bg-blue-500' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${notifPrefs.assignment ? 'translate-x-7' : 'translate-x-0.5'}`} />
                </button>
              </div>
              <button
                type="button"
                onClick={handleSaveNotifPrefs}
                disabled={savingNotif}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {savingNotif ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    جاري الحفظ...
                  </>
                ) : (
                  'حفظ الإعدادات'
                )}
              </button>
            </div>
          )}
        </div>

        {/* Account Info (Read Only) */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            معلومات الحساب
          </h3>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">البريد الإلكتروني</span>
              <span className="text-gray-800 font-medium">{profile?.email}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">الدور</span>
              <span className="font-medium">{profile?.role === 'admin' ? 'مدير' : profile?.role === 'supervisor' ? 'مشرف' : 'متطوع'}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">تاريخ التسجيل</span>
              <span className="text-gray-800">
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('ar-EG', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : '-'}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">آخر تحديث</span>
              <span className="text-gray-800">
                {profile?.updated_at ? new Date(profile.updated_at).toLocaleDateString('ar-EG', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : '-'}
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
