'use client'

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
      setError('ÙŠØ±Ø¬Ù‰ Ø¥Ø¯Ø®Ø§Ù„ Ø§Ù„Ø§Ø³Ù…')
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

      setSuccess('ØªÙ… ØªØ­Ø¯ÙŠØ« Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø¨Ù†Ø¬Ø§Ø­')
      
      // Refresh profile
      fetchProfile()
    } catch (err: any) {
      setError(err.message || 'Ø­Ø¯Ø« Ø®Ø·Ø£ Ø£Ø«Ù†Ø§Ø¡ ØªØ­Ø¯ÙŠØ« Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!passwordData.new_password) {
      setError('ÙŠØ±Ø¬Ù‰ Ø¥Ø¯Ø®Ø§Ù„ Ø§Ù„Ø¨Ø§Ø³ÙˆØ±Ø¯ Ø§Ù„Ø¬Ø¯ÙŠØ¯')
      return
    }

    if (passwordData.new_password.length < 6) {
      setError('Ø§Ù„Ø¨Ø§Ø³ÙˆØ±Ø¯ ÙŠØ¬Ø¨ Ø£Ù† ÙŠÙƒÙˆÙ† 6 Ø£Ø­Ø±Ù Ø¹Ù„Ù‰ Ø§Ù„Ø£Ù‚Ù„')
      return
    }

    if (passwordData.new_password !== passwordData.confirm_password) {
      setError('Ø§Ù„Ø¨Ø§Ø³ÙˆØ±Ø¯ Ø§Ù„Ø¬Ø¯ÙŠØ¯ ØºÙŠØ± Ù…ØªØ·Ø§Ø¨Ù‚')
      return
    }

    setSaving(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.new_password
      })

      if (updateError) throw updateError

      setSuccess('ØªÙ… ØªØºÙŠÙŠØ± Ø§Ù„Ø¨Ø§Ø³ÙˆØ±Ø¯ Ø¨Ù†Ø¬Ø§Ø­')
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' })
      setShowPasswordChange(false)
    } catch (err: any) {
      setError(err.message || 'Ø­Ø¯Ø« Ø®Ø·Ø£ Ø£Ø«Ù†Ø§Ø¡ ØªØºÙŠÙŠØ± Ø§Ù„Ø¨Ø§Ø³ÙˆØ±Ø¯')
    } finally {
      setSaving(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { class: string, label: string }> = {
      pending: { class: 'bg-amber-100 text-amber-700', label: 'Ù…Ø¹Ù„Ù‚' },
      approved: { class: 'bg-green-100 text-green-700', label: 'Ù…ÙˆØ§ÙÙ‚ Ø¹Ù„ÙŠÙ‡' },
      rejected: { class: 'bg-red-100 text-red-700', label: 'Ù…Ø±ÙÙˆØ¶' }
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
      admin: { class: 'bg-purple-100 text-purple-700', label: 'Ù…Ø¯ÙŠØ±' },
      supervisor: { class: 'bg-blue-100 text-blue-700', label: 'Ù…Ø´Ø±Ù' },
      volunteer: { class: 'bg-gray-100 text-gray-700', label: 'Ù…ØªØ·ÙˆØ¹' }
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
            Ø±Ø¬ÙˆØ¹
          </Link>
          <h1 className="text-lg font-bold text-blue-700">Ù…Ù„ÙÙŠ Ø§Ù„Ø´Ø®ØµÙŠ</h1>
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
              <p className="text-gray-500 text-sm">ØªØ§Ø±ÙŠØ® Ø§Ù„ØªØ³Ø¬ÙŠÙ„</p>
              <p className="font-bold text-gray-900">
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('ar-EG') : '-'}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-gray-500 text-sm">Ø§Ù„Ù†ÙˆØ¹</p>
              <p className="font-bold text-gray-900">
                {profile?.gender === 'male' ? 'Ø°ÙƒØ±' : profile?.gender === 'female' ? 'Ø£Ù†Ø«Ù‰' : '-'}
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
            ØªØ¹Ø¯ÙŠÙ„ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø´Ø®ØµÙŠØ©
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Ø§Ù„Ø§Ø³Ù… *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ø£Ø¯Ø®Ù„ Ø§Ø³Ù…Ùƒ Ø§Ù„ÙƒØ§Ù…Ù„"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ø±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ</label>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="01xxxxxxxxx"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ø§Ù„Ù†ÙˆØ¹</label>
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
                  ðŸ‘¨ Ø°ÙƒØ±
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
                  ðŸ‘© Ø£Ù†Ø«Ù‰
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
                  Ø¬Ø§Ø±ÙŠ Ø§Ù„Ø­ÙØ¸...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Ø­ÙØ¸ Ø§Ù„ØªØ¹Ø¯ÙŠÙ„Ø§Øª
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
              ØªØºÙŠÙŠØ± Ø§Ù„Ø¨Ø§Ø³ÙˆØ±Ø¯
            </span>
            <svg className={`w-5 h-5 text-gray-400 transition-transform ${showPasswordChange ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showPasswordChange && (
            <form onSubmit={handleChangePassword} className="mt-4 space-y-4 pt-4 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ø§Ù„Ø¨Ø§Ø³ÙˆØ±Ø¯ Ø§Ù„Ø¬Ø¯ÙŠØ¯ *</label>
                <input
                  type="password"
                  value={passwordData.new_password}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, new_password: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ø£Ø¯Ø®Ù„ Ø§Ù„Ø¨Ø§Ø³ÙˆØ±Ø¯ Ø§Ù„Ø¬Ø¯ÙŠØ¯"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ØªØ£ÙƒÙŠØ¯ Ø§Ù„Ø¨Ø§Ø³ÙˆØ±Ø¯ *</label>
                <input
                  type="password"
                  value={passwordData.confirm_password}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirm_password: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ø£Ø¹Ø¯ Ø¥Ø¯Ø®Ø§Ù„ Ø§Ù„Ø¨Ø§Ø³ÙˆØ±Ø¯"
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
                    Ø¬Ø§Ø±ÙŠ Ø§Ù„ØªØºÙŠÙŠØ±...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    ØªØºÙŠÙŠØ± Ø§Ù„Ø¨Ø§Ø³ÙˆØ±Ø¯
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
            Ù…Ø¹Ù„ÙˆÙ…Ø§Øª Ø§Ù„Ø­Ø³Ø§Ø¨
          </h3>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ</span>
              <span className="text-gray-800 font-medium">{profile?.email}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">Ø§Ù„Ø¯ÙˆØ±</span>
              <span className="font-medium">{profile?.role === 'admin' ? 'Ù…Ø¯ÙŠØ±' : profile?.role === 'supervisor' ? 'Ù…Ø´Ø±Ù' : 'Ù…ØªØ·ÙˆØ¹'}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">ØªØ§Ø±ÙŠØ® Ø§Ù„ØªØ³Ø¬ÙŠÙ„</span>
              <span className="text-gray-800">
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('ar-EG', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : '-'}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Ø¢Ø®Ø± ØªØ­Ø¯ÙŠØ«</span>
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
          <h3 className="text-lg font-bold text-gray-900 mb-4">Ø±ÙˆØ§Ø¨Ø· Ø³Ø±ÙŠØ¹Ø©</h3>
          <div className="space-y-3">
            <Link
              href="/dashboard"
              className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <span className="flex items-center gap-3">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Ù„ÙˆØ­Ø© Ø§Ù„ØªØ­ÙƒÙ…
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
                Ø§Ù„Ù…Ø´Ø§Ø±ÙŠØ¹
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
                  Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…ÙŠÙ†
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
                  Ø§Ù„Ù†ØªØ§Ø¦Ø¬ ÙˆØ§Ù„ØªÙ‚Ø§Ø±ÙŠØ±
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