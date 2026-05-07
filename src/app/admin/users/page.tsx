'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { User, UserRole, AccountStatus, Gender } from '@/types'

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected'
type FilterRole = 'all' | UserRole
type FilterGender = 'all' | Gender

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [filterRole, setFilterRole] = useState<FilterRole>('all')
  const [filterGender, setFilterGender] = useState<FilterGender>('all')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [editingUser, setEditingUser] = useState(false)
  const [editFormData, setEditFormData] = useState({
    name: '',
    phone: '',
    gender: '' as Gender | ''
  })
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Get current user
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

      if (!profile || profile.role !== 'admin') {
        router.push('/dashboard')
        return
      }

      setCurrentUser(profile)

      // Fetch all users
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      const { data: usersData, error } = await query

      if (error) throw error
      setUsers(usersData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (
    userId: string, 
    action: 'approve' | 'reject' | 'role' | 'delete' | 'reset_password' | 'edit', 
    newRole?: UserRole, 
    updatedData?: Partial<User>
  ) => {
    setActionLoading(true)
    try {
      if (action === 'delete') {
        const confirmed = confirm('Ù‡Ù„ Ø£Ù†Øª Ù…ØªØ£ÙƒØ¯ Ù…Ù† Ø­Ø°Ù Ù‡Ø°Ø§ Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…ØŸ')
        if (!confirmed) {
          setActionLoading(false)
          return
        }
        
        // Delete from auth first
        const { error: authError } = await supabase.auth.admin.deleteUser(userId)
        if (authError) {
          console.error('Auth delete error:', authError)
          // Continue to delete profile even if auth delete fails
        }
        
        // Delete profile
        const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', userId)
        
        if (profileError) throw profileError
        
        // Refresh users list
        const { data: updatedUsers } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })
        
        setUsers(updatedUsers || [])
        setShowModal(false)
        setSelectedUser(null)
        setActionLoading(false)
        return
      }
      
      if (action === 'reset_password') {
        const { error: resetError } = await supabase.auth.admin.updateUserById(userId, {
          password: '123456'
        })
        
        if (resetError) throw resetError
        
        alert('ØªÙ… Ø¥Ø¹Ø§Ø¯Ø© ØªØ¹ÙŠÙŠÙ† Ø§Ù„Ø¨Ø§Ø³ÙˆØ±Ø¯ Ø¨Ù†Ø¬Ø§Ø­. Ø§Ù„Ø¨Ø§Ø³ÙˆØ±Ø¯ Ø§Ù„Ø¬Ø¯ÙŠØ¯: 123456')
        setActionLoading(false)
        return
      }

      const updateData: Partial<User> = {}

      if (action === 'approve') {
        updateData.status = 'approved'
      } else if (action === 'reject') {
        updateData.status = 'rejected'
      } else if (action === 'role' && newRole) {
        updateData.role = newRole
      } else if (action === 'edit' && updatedData) {
        Object.assign(updateData, updatedData)
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId)

      if (error) throw error

      // Refresh users list
      const { data: updatedUsers } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      setUsers(updatedUsers || [])
      setShowModal(false)
      setSelectedUser(null)
    } catch (error) {
      console.error('Error updating user:', error)
      alert('Ø­Ø¯Ø« Ø®Ø·Ø£ Ø£Ø«Ù†Ø§Ø¡ ØªØ­Ø¯ÙŠØ« Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…')
    } finally {
      setActionLoading(false)
    }
  }

  const filteredUsers = users.filter(user => {
    // Search filter
    const matchesSearch = 
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      (user.phone && user.phone.includes(search))

    // Status filter
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus

    // Role filter
    const matchesRole = filterRole === 'all' || user.role === filterRole

    // Gender filter
    const matchesGender = filterGender === 'all' || user.gender === filterGender

    return matchesSearch && matchesStatus && matchesRole && matchesGender
  })

  const getStatusBadge = (status: AccountStatus) => {
    const badges = {
      pending: 'bg-amber-100 text-amber-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700'
    }
    const labels = {
      pending: 'Ù…Ø¹Ù„Ù‚',
      approved: 'Ù…ÙˆØ§ÙÙ‚ Ø¹Ù„ÙŠÙ‡',
      rejected: 'Ù…Ø±ÙÙˆØ¶'
    }
    return (
      <span className={`px-3 py-1 text-xs rounded-full font-medium ${badges[status]}`}>
        {labels[status]}
      </span>
    )
  }

  const getRoleBadge = (role: UserRole) => {
    const badges = {
      admin: 'bg-purple-100 text-purple-700',
      supervisor: 'bg-blue-100 text-blue-700',
      volunteer: 'bg-gray-100 text-gray-700'
    }
    const labels = {
      admin: 'Ù…Ø¯ÙŠØ±',
      supervisor: 'Ù…Ø´Ø±Ù',
      volunteer: 'Ù…ØªØ·ÙˆØ¹'
    }
    return (
      <span className={`px-3 py-1 text-xs rounded-full font-medium ${badges[role]}`}>
        {labels[role]}
      </span>
    )
  }

  const getGenderBadge = (gender: Gender) => {
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${
        gender === 'male' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'
      }`}>
        {gender === 'male' ? 'Ø°ÙƒØ±' : 'Ø£Ù†Ø«Ù‰'}
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
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link 
              href="/dashboard" 
              className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Ø±Ø¬ÙˆØ¹
            </Link>
            <h1 className="text-lg font-bold text-blue-700">Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…ÙŠÙ†</h1>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                {filteredUsers.length} Ù…Ø³ØªØ®Ø¯Ù…
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm">Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…ÙŠÙ†</p>
            <p className="text-2xl font-bold text-gray-900">{users.length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm">Ø·Ù„Ø¨Ø§Øª Ù…Ø¹Ù„Ù‚Ø©</p>
            <p className="text-2xl font-bold text-amber-600">
              {users.filter(u => u.status === 'pending').length}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm">Ø§Ù„Ù…Ø´Ø±ÙÙˆÙ†</p>
            <p className="text-2xl font-bold text-blue-600">
              {users.filter(u => u.role === 'supervisor').length}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm">Ø§Ù„Ø§Ø¯Ø§Ø±Ø©</p>
            <p className="text-2xl font-bold text-purple-600">
              {users.filter(u => u.role === 'admin').length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Ø¨Ø­Ø« Ø¨Ø§Ù„Ø§Ø³Ù… Ø£Ùˆ Ø§Ù„Ø¨Ø±ÙŠØ¯..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-2 pr-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">ÙƒÙ„ Ø§Ù„Ø­Ø§Ù„Ø§Øª</option>
              <option value="pending">Ù…Ø¹Ù„Ù‚</option>
              <option value="approved">Ù…ÙˆØ§ÙÙ‚ Ø¹Ù„ÙŠÙ‡</option>
              <option value="rejected">Ù…Ø±ÙÙˆØ¶</option>
            </select>

            {/* Role Filter */}
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as FilterRole)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">ÙƒÙ„ Ø§Ù„Ø£Ø¯ÙˆØ§Ø±</option>
              <option value="admin">Ù…Ø¯ÙŠØ±</option>
              <option value="supervisor">Ù…Ø´Ø±Ù</option>
              <option value="volunteer">Ù…ØªØ·ÙˆØ¹</option>
            </select>

            {/* Gender Filter */}
            <select
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value as FilterGender)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">ÙƒÙ„ Ø§Ù„Ø£Ù†ÙˆØ§Ø¹</option>
              <option value="male">Ø°ÙƒÙˆØ±</option>
              <option value="female">Ø¥Ù†Ø§Ø«</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ø§Ù„Ù†ÙˆØ¹</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ø§Ù„Ø¯ÙˆØ±</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ø§Ù„Ø­Ø§Ù„Ø©</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ø§Ù„Ø¥Ø¬Ø±Ø§Ø¡Ø§Øª</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          {user.phone && (
                            <p className="text-sm text-gray-500">{user.phone}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{user.email}</td>
                    <td className="px-6 py-4">{getGenderBadge(user.gender)}</td>
                    <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                    <td className="px-6 py-4">{getStatusBadge(user.status)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {user.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleAction(user.id, 'approve')}
                              disabled={actionLoading}
                              className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                              Ù‚Ø¨ÙˆÙ„
                            </button>
                            <button
                              onClick={() => handleAction(user.id, 'reject')}
                              disabled={actionLoading}
                              className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                              Ø±ÙØ¶
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => {
                            setSelectedUser(user)
                            setShowModal(true)
                          }}
                          className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          Ø¥Ø¯Ø§Ø±Ø©
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <p className="text-gray-500">Ù„Ø§ ØªÙˆØ¬Ø¯ Ù…Ø³ØªØ®Ø¯Ù…ÙŠÙ†</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* User Action Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              setShowModal(false)
              setSelectedUser(null)
              setEditingUser(false)
}}
          />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editingUser ? 'ØªØ¹Ø¯ÙŠÙ„ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…' : 'Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…'}
            </h3>
            
            <div className="flex items-center gap-3 mb-6 p-4 bg-gray-50 rounded-xl">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-lg">
                {selectedUser.name.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-gray-900">{selectedUser.name}</p>
                <p className="text-sm text-gray-500">{selectedUser.email}</p>
              </div>
            </div>

            {/* Edit Form */}
            {editingUser ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ø§Ù„Ø§Ø³Ù…</label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ø±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ</label>
                  <input
                    type="text"
                    value={editFormData.phone || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="01xxxxxxxxx"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ø§Ù„Ù†ÙˆØ¹</label>
                  <select
                    value={editFormData.gender}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, gender: e.target.value as Gender }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Ø§Ø®ØªØ±...</option>
                    <option value="male">Ø°ÙƒØ±</option>
                    <option value="female">Ø£Ù†Ø«Ù‰</option>
                  </select>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      handleAction(selectedUser.id, 'edit', undefined, {
                        name: editFormData.name,
                        phone: editFormData.phone || undefined,
                        gender: editFormData.gender as Gender
                      })
                    }}
                    disabled={actionLoading}
                    className="flex-1 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {actionLoading ? 'Ø¬Ø§Ø±ÙŠ Ø§Ù„Ø­ÙØ¸...' : 'Ø­ÙØ¸ Ø§Ù„ØªØ¹Ø¯ÙŠÙ„Ø§Øª'}
                  </button>
                  <button
                    onClick={() => setEditingUser(false)}
                    className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200"
                  >
                    Ø¥Ù„ØºØ§Ø¡
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {/* Edit User Data */}
                  <button
                    onClick={() => {
                      setEditFormData({
                        name: selectedUser.name,
                        phone: selectedUser.phone || '',
                        gender: selectedUser.gender
                      })
                      setEditingUser(true)
                    }}
                    className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    ØªØ¹Ø¯ÙŠÙ„ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª
                  </button>

                  {/* Reset Password */}
                  <button
                    onClick={() => handleAction(selectedUser.id, 'reset_password')}
                    disabled={actionLoading}
                    className="w-full py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    Ø¥Ø¹Ø§Ø¯Ø© ØªØ¹ÙŠÙŠÙ† Ø§Ù„Ø¨Ø§Ø³ÙˆØ±Ø¯ (123456)
                  </button>

                  {/* Role Change */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ØªØºÙŠÙŠØ± Ø§Ù„Ø¯ÙˆØ±</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handleAction(selectedUser.id, 'role', 'volunteer')}
                        disabled={actionLoading || selectedUser.role === 'volunteer'}
                        className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                          selectedUser.role === 'volunteer'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        } disabled:opacity-50`}
                      >
                        Ù…ØªØ·ÙˆØ¹
                      </button>
                      <button
                        onClick={() => handleAction(selectedUser.id, 'role', 'supervisor')}
                        disabled={actionLoading || selectedUser.role === 'supervisor'}
                        className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                          selectedUser.role === 'supervisor'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        } disabled:opacity-50`}
                      >
                        Ù…Ø´Ø±Ù
                      </button>
                      <button
                        onClick={() => handleAction(selectedUser.id, 'role', 'admin')}
                        disabled={actionLoading || selectedUser.role === 'admin'}
                        className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                          selectedUser.role === 'admin'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        } disabled:opacity-50`}
                      >
                        Ù…Ø¯ÙŠØ±
                      </button>
                    </div>
                  </div>

                  {/* Status Change */}
                  {selectedUser.status !== 'pending' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">ØªØºÙŠÙŠØ± Ø§Ù„Ø­Ø§Ù„Ø©</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleAction(selectedUser.id, 'approve')}
                          disabled={actionLoading || selectedUser.status === 'approved'}
                          className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                            selectedUser.status === 'approved'
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          } disabled:opacity-50`}
                        >
                          ØªÙØ¹ÙŠÙ„
                        </button>
                        <button
                          onClick={() => handleAction(selectedUser.id, 'reject')}
                          disabled={actionLoading || selectedUser.status === 'rejected'}
                          className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                            selectedUser.status === 'rejected'
                              ? 'bg-red-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          } disabled:opacity-50`}
                        >
                          ØªØ¹Ø·ÙŠÙ„
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Delete User */}
                  <button
                    onClick={() => handleAction(selectedUser.id, 'delete')}
                    disabled={actionLoading || selectedUser.id === currentUser?.id}
                    className="w-full py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    title={selectedUser.id === currentUser?.id ? 'Ù„Ø§ ÙŠÙ…ÙƒÙ†Ùƒ Ø­Ø°Ù Ø­Ø³Ø§Ø¨Ùƒ Ø§Ù„Ø­Ø§Ù„ÙŠ' : 'Ø­Ø°Ù Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…'}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Ø­Ø°Ù Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…
                  </button>
                </div>

                <button
                  onClick={() => {
                    setShowModal(false)
                    setSelectedUser(null)
                  }}
                  className="w-full mt-6 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Ø¥ØºÙ„Ø§Ù‚
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}