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

  const handleAction = async (userId: string, action: 'approve' | 'reject' | 'role', newRole?: UserRole) => {
    setActionLoading(true)
    try {
      const updateData: Partial<User> = {}

      if (action === 'approve') {
        updateData.status = 'approved'
      } else if (action === 'reject') {
        updateData.status = 'rejected'
      } else if (action === 'role' && newRole) {
        updateData.role = newRole
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
      alert('حدث خطأ أثناء تحديث المستخدم')
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
      pending: 'معلق',
      approved: 'موافق عليه',
      rejected: 'مرفوض'
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
      admin: 'مدير',
      supervisor: 'مشرف',
      volunteer: 'متطوع'
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
        {gender === 'male' ? 'ذكر' : 'أنثى'}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-600 border-t-transparent"></div>
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
              className="flex items-center gap-2 text-gray-600 hover:text-teal-600 transition-colors"
>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              رجوع
            </Link>
            <h1 className="text-lg font-bold text-teal-700">إدارة المستخدمين</h1>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                {filteredUsers.length} مستخدم
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm">إجمالي المستخدمين</p>
            <p className="text-2xl font-bold text-gray-900">{users.length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm">طلبات معلقة</p>
            <p className="text-2xl font-bold text-amber-600">
              {users.filter(u => u.status === 'pending').length}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm">المشرفون</p>
            <p className="text-2xl font-bold text-blue-600">
              {users.filter(u => u.role === 'supervisor').length}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm">الادارة</p>
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
                placeholder="بحث بالاسم أو البريد..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-2 pr-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
              <svg className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="all">كل الحالات</option>
              <option value="pending">معلق</option>
              <option value="approved">موافق عليه</option>
              <option value="rejected">مرفوض</option>
            </select>

            {/* Role Filter */}
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as FilterRole)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="all">كل الأدوار</option>
              <option value="admin">مدير</option>
              <option value="supervisor">مشرف</option>
              <option value="volunteer">متطوع</option>
            </select>

            {/* Gender Filter */}
            <select
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value as FilterGender)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="all">كل الأنواع</option>
              <option value="male">ذكور</option>
              <option value="female">إناث</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المستخدم</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">البريد الإلكتروني</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">النوع</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الدور</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-bold">
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
                              قبول
                            </button>
                            <button
                              onClick={() => handleAction(user.id, 'reject')}
                              disabled={actionLoading}
                              className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                              رفض
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
                          إدارة
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
                      <p className="text-gray-500">لا توجد مستخدمين</p>
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
}}
          />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">إدارة المستخدم</h3>
            
            <div className="flex items-center gap-3 mb-6 p-4 bg-gray-50 rounded-xl">
              <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-bold text-lg">
                {selectedUser.name.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-gray-900">{selectedUser.name}</p>
                <p className="text-sm text-gray-500">{selectedUser.email}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">تغيير الدور</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleAction(selectedUser.id, 'role', 'volunteer')}
                    disabled={actionLoading || selectedUser.role === 'volunteer'}
                    className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                      selectedUser.role === 'volunteer'
                        ? 'bg-teal-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } disabled:opacity-50`}
                  >
                    متطوع
                  </button>
                  <button
                    onClick={() => handleAction(selectedUser.id, 'role', 'supervisor')}
                    disabled={actionLoading || selectedUser.role === 'supervisor'}
                    className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                      selectedUser.role === 'supervisor'
                        ? 'bg-teal-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } disabled:opacity-50`}
                  >
                    مشرف
                  </button>
                  <button
                    onClick={() => handleAction(selectedUser.id, 'role', 'admin')}
                    disabled={actionLoading || selectedUser.role === 'admin'}
                    className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                      selectedUser.role === 'admin'
                        ? 'bg-teal-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } disabled:opacity-50`}
                  >
                    مدير
                  </button>
                </div>
              </div>

              {selectedUser.status !== 'pending' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">تغيير الحالة</label>
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
                      تفعيل
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
                      تعطيل
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                setShowModal(false)
                setSelectedUser(null)
              }}
              className="w-full mt-6 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
    </div>
  )
}