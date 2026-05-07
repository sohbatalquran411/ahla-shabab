?'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Gender } from '@/types'

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  
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
      setError('�Sرج�? إدخا�" ا�"اس�.')
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

      setSuccess('ت�. تحد�Sث ا�"ب�Sا�?ات ب�?جاح')
      
      // Refresh profile
      fetchProfile()
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أث�?اء تحد�Sث ا�"ب�Sا�?ات')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!passwordData.new_password) {
      setError('�Sرج�? إدخا�" ا�"باس�^رد ا�"جد�Sد')
      return
    }

    if (passwordData.new_password.length < 6) {
      setError('ا�"باس�^رد �Sجب أ�? �S�f�^�? 6 أحرف ع�"�? ا�"أ�,�"')
      return
    }

    if (passwordData.new_password !== passwordData.confirm_password) {
      setError('ا�"باس�^رد ا�"جد�Sد غ�Sر �.تطاب�,')
      return
    }

    setSaving(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.new_password
      })

      if (updateError) throw updateError

      setSuccess('ت�. تغ�S�Sر ا�"باس�^رد ب�?جاح')
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' })
      setShowPasswordChange(false)
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أث�?اء تغ�S�Sر ا�"باس�^رد')
    } finally {
      setSaving(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { class: string, label: string }> = {
      pending: { class: 'bg-amber-100 text-amber-700', label: '�.ع�"�,' },
      approved: { class: 'bg-green-100 text-green-700', label: '�.�^اف�, ع�"�S�?' },
      rejected: { class: 'bg-red-100 text-red-700', label: '�.رف�^ض' }
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
      admin: { class: 'bg-purple-100 text-purple-700', label: '�.د�Sر' },
      supervisor: { class: 'bg-blue-100 text-blue-700', label: '�.شرف' },
      volunteer: { class: 'bg-gray-100 text-gray-700', label: '�.تط�^ع' }
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
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            رج�^ع
          </Link>
          <h1 className="text-lg font-bold text-blue-700">�.�"ف�S ا�"شخص�S</h1>
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
              <p className="text-gray-500 text-sm">تار�Sخ ا�"تسج�S�"</p>
              <p className="font-bold text-gray-900">
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('ar-EG') : '-'}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-gray-500 text-sm">ا�"�?�^ع</p>
              <p className="font-bold text-gray-900">
                {profile?.gender === 'male' ? 'ذ�fر' : profile?.gender === 'female' ? 'أ�?ث�?' : '-'}
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
            تعد�S�" ا�"ب�Sا�?ات ا�"شخص�Sة
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
              <label className="block text-sm font-medium text-gray-700 mb-2">ا�"اس�. *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="أدخ�" اس�.�f ا�"�fا�.�""
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ر�,�. ا�"�?اتف</label>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="01xxxxxxxxx"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ا�"�?�^ع</label>
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
                  �Y'� ذ�fر
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
                  �Y'� أ�?ث�?
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
                  جار�S ا�"حفظ...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  حفظ ا�"تعد�S�"ات
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
              تغ�S�Sر ا�"باس�^رد
            </span>
            <svg className={`w-5 h-5 text-gray-400 transition-transform ${showPasswordChange ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showPasswordChange && (
            <form onSubmit={handleChangePassword} className="mt-4 space-y-4 pt-4 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ا�"باس�^رد ا�"جد�Sد *</label>
                <input
                  type="password"
                  value={passwordData.new_password}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, new_password: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="أدخ�" ا�"باس�^رد ا�"جد�Sد"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">تأ�f�Sد ا�"باس�^رد *</label>
                <input
                  type="password"
                  value={passwordData.confirm_password}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirm_password: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="أعد إدخا�" ا�"باس�^رد"
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
                    جار�S ا�"تغ�S�Sر...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    تغ�S�Sر ا�"باس�^رد
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Account Info (Read Only) */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            �.ع�"�^�.ات ا�"حساب
          </h3>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">ا�"بر�Sد ا�"إ�"�fتر�^�?�S</span>
              <span className="text-gray-800 font-medium">{profile?.email}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">ا�"د�^ر</span>
              <span className="font-medium">{profile?.role === 'admin' ? '�.د�Sر' : profile?.role === 'supervisor' ? '�.شرف' : '�.تط�^ع'}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">تار�Sخ ا�"تسج�S�"</span>
              <span className="text-gray-800">
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('ar-EG', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : '-'}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">آخر تحد�Sث</span>
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

        {/* Quick Links */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">ر�^ابط سر�Sعة</h3>
          <div className="space-y-3">
            <Link
              href="/dashboard"
              className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <span className="flex items-center gap-3">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                �"�^حة ا�"تح�f�.
              </span>
              <svg className="w-5 h-5 text-gray-400 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            <Link
              href="/projects"
              className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <span className="flex items-center gap-3">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                ا�"�.شار�Sع
              </span>
              <svg className="w-5 h-5 text-gray-400 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            {profile?.role === 'admin' && (
              <Link
                href="/admin/users"
                className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <span className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  إدارة ا�"�.ستخد�.�S�?
                </span>
                <svg className="w-5 h-5 text-gray-400 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            )}

            {profile?.role === 'admin' && (
              <Link
                href="/admin/results"
                className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <span className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  ا�"�?تائج �^ا�"ت�,ار�Sر
                </span>
                <svg className="w-5 h-5 text-gray-400 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

