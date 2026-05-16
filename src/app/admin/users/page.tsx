'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { User, UserRole, AccountStatus, Gender, Project, UserProject } from '@/types'

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

  // Projects modal state
  const [showProjectsModal, setShowProjectsModal] = useState(false)
  const [allProjects, setAllProjects] = useState<Project[]>([])
  const [userProjects, setUserProjects] = useState<string[]>([])
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const [projectsLoading, setProjectsLoading] = useState(false)
  
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
        const confirmed = confirm('هل أنت متأكد من حذف هذا المستخدم؟')
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
        
        alert('تم إعادة تعيين الباسورد بنجاح. الباسورد الجديد: 123456')
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
      alert('حدث خطأ أثناء تحديث المستخدم')
    } finally {
      setActionLoading(false)
    }
  }

  const openProjectsModal = async (user: User) => {
    setSelectedUser(user)
    setShowProjectsModal(true)
    setProjectsLoading(true)
    try {
      const [projectsResult, assignmentsResult] = await Promise.all([
        supabase
          .from('projects')
          .select('*')
          .eq('is_archived', false)
          .order('name'),
        supabase
          .from('user_projects')
          .select('project_id')
          .eq('user_id', user.id)
      ])

      if (projectsResult.error) throw projectsResult.error
      if (assignmentsResult.error) throw assignmentsResult.error

      setAllProjects(projectsResult.data || [])
      const assignedIds = (assignmentsResult.data || []).map(up => up.project_id)
      setUserProjects(assignedIds)
      setSelectedProjects([...assignedIds])
    } catch (error) {
      console.error('Error loading projects:', error)
      alert('حدث خطأ أثناء تحميل المشاريع')
    } finally {
      setProjectsLoading(false)
    }
  }

  const handleProjectToggle = (projectId: string) => {
    setSelectedProjects(prev =>
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    )
  }

  const handleSaveProjects = async () => {
    if (!selectedUser) return
    setProjectsLoading(true)
    try {
      const newlyAssigned = selectedProjects.filter(id => !userProjects.includes(id))

      // Delete all existing assignments for this user
      const { error: deleteError } = await supabase
        .from('user_projects')
        .delete()
        .eq('user_id', selectedUser.id)

      if (deleteError) throw deleteError

      // Insert selected assignments
      if (selectedProjects.length > 0) {
        const inserts = selectedProjects.map(projectId => ({
          user_id: selectedUser.id,
          project_id: projectId
        }))

        const { error: insertError } = await supabase
          .from('user_projects')
          .insert(inserts)

        if (insertError) throw insertError
      }

      // Create notifications for newly assigned projects (check preferences)
      if (newlyAssigned.length > 0) {
        // Check if user has disabled assignment notifications
        const { data: pref } = await supabase
          .from('notification_preferences')
          .select('enabled')
          .eq('user_id', selectedUser.id)
          .eq('notification_type', 'assignment')
          .maybeSingle()

        const shouldNotify = pref ? pref.enabled : true

        if (shouldNotify) {
          const projectNames = allProjects
            .filter(p => newlyAssigned.includes(p.id))
            .reduce((acc, p) => { acc[p.id] = p.name; return acc }, {} as Record<string, string>)

          const notifications = newlyAssigned.map(projectId => ({
            user_id: selectedUser.id,
            title: `تم إضافتك إلى مشروع ${projectNames[projectId] || ''}`,
            type: 'assignment',
            link: `/projects/${projectId}`
          }))

          const { error: notifError } = await supabase
            .from('notifications')
            .insert(notifications)

          if (notifError) console.error('Error creating notifications:', notifError)
        }
      }

      setUserProjects([...selectedProjects])
      setShowProjectsModal(false)
    } catch (error) {
      console.error('Error saving projects:', error)
      alert('حدث خطأ أثناء حفظ المشاريع')
    } finally {
      setProjectsLoading(false)
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
            <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
          >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              رجوع
            </button>
            <h1 className="text-lg font-bold text-blue-700">إدارة المستخدمين</h1>
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
              <option value="all">كل الحالات</option>
              <option value="pending">معلق</option>
              <option value="approved">موافق عليه</option>
              <option value="rejected">مرفوض</option>
            </select>

            {/* Role Filter */}
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as FilterRole)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              setEditingUser(false)
            }}
          />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editingUser ? 'تعديل بيانات المستخدم' : 'إدارة المستخدم'}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">الاسم</label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف</label>
                  <input
                    type="text"
                    value={editFormData.phone || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="01xxxxxxxxx"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">النوع</label>
                  <select
                    value={editFormData.gender}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, gender: e.target.value as Gender }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">اختر...</option>
                    <option value="male">ذكر</option>
                    <option value="female">أنثى</option>
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
                    {actionLoading ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                  </button>
                  <button
                    onClick={() => setEditingUser(false)}
                    className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200"
                  >
                    إلغاء
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
                    تعديل البيانات
                  </button>

                  {/* Manage Projects */}
                  <button
                    onClick={() => openProjectsModal(selectedUser)}
                    className="w-full py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    المشاريع
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
                    إعادة تعيين الباسورد (123456)
                  </button>

                  {/* Role Change */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">تغيير الدور</label>
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
                        متطوع
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
                        مشرف
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
                        مدير
                      </button>
                    </div>
                  </div>

                  {/* Status Change */}
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

                  {/* Delete User */}
                  <button
                    onClick={() => handleAction(selectedUser.id, 'delete')}
                    disabled={actionLoading || selectedUser.id === currentUser?.id}
                    className="w-full py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    title={selectedUser.id === currentUser?.id ? 'لا يمكنك حذف حسابك الحالي' : 'حذف المستخدم'}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    حذف المستخدم
                  </button>
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
              </>
            )}
          </div>
        </div>
      )}

      {/* Projects Sub-Modal */}
      {showProjectsModal && selectedUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              if (!projectsLoading) {
                setShowProjectsModal(false)
              }
            }}
          />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              إدارة مشاريع المستخدم
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {selectedUser.name} : اختر المشاريع التي يمكن لهذا المستخدم الوصول إليها
            </p>

            {projectsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-emerald-600 border-t-transparent"></div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 max-h-80 overflow-y-auto">
                  {allProjects.map(project => {
                    const isChecked = selectedProjects.includes(project.id)
                    return (
                      <label
                        key={project.id}
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          isChecked
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold shrink-0"
                          style={{ backgroundColor: project.color || '#10B981' }}
                        >
                          {project.icon ? (
                            <span className="text-lg">{project.icon}</span>
                          ) : (
                            <span className="text-sm">{project.name.charAt(0)}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{project.name}</p>
                          {project.description && (
                            <p className="text-sm text-gray-500 truncate">{project.description}</p>
                          )}
                        </div>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleProjectToggle(project.id)}
                          className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 shrink-0"
                        />
                      </label>
                    )
                  })}
                  {allProjects.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-500">
                      لا توجد مشاريع متاحة
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleSaveProjects}
                    disabled={projectsLoading}
                    className="flex-1 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {projectsLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        جاري الحفظ...
                      </>
                    ) : (
                      'حفظ'
                    )}
                  </button>
                  <button
                    onClick={() => setShowProjectsModal(false)}
                    disabled={projectsLoading}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    إلغاء
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
