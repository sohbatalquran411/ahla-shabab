'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { User, Project } from '@/types'

interface DashboardContentProps {
  user: User
  projects: Project[]
  stats?: {
    total_users: number
    total_projects: number
    pending_approvals: number
  }
}

// Icon components
const Icons = {
  mosque: (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  ),
  sun: (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  quran: (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  users: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  folder: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  ),
  clock: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  logout: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
  menu: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  plus: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  )
}

export default function DashboardContent({ user, projects, stats }: DashboardContentProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const getIcon = (iconName: string) => {
    return Icons[iconName as keyof typeof Icons] || Icons.folder
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="bg-white shadow-sm lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            {Icons.menu}
          </button>
          <h1 className="text-lg font-bold text-teal-700">أوراد أحلى شباب</h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          fixed inset-y-0 right-0 z-50 w-72 bg-white shadow-xl transform transition-transform duration-300 lg:translate-x-0 lg:static lg:shadow-none
          ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}
        `}>
          {/* Sidebar Header */}
          <div className="bg-gradient-to-l from-teal-600 to-teal-700 px-6 py-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {user.name.charAt(0)}
                </span>
              </div>
              <div>
                <h2 className="text-white font-semibold">{user.name}</h2>
                <p className="text-teal-200 text-sm">
                  {user.role === 'admin' ? 'مدير' : user.role === 'supervisor' ? 'مشرف' : 'متطوع'}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="mt-6 px-4 space-y-2">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-4 py-3 bg-teal-50 text-teal-700 rounded-xl font-medium"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              الرئيسية
            </Link>

            <Link
              href="/projects"
              className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              {Icons.folder}
              المشاريع
            </Link>

            <Link
              href="/profile"
              className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              الملف الشخصي
            </Link>

            {(user.role === 'supervisor' || user.role === 'admin') && (
              <Link
                href="/forms/create"
                className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                إنشاء فورم
              </Link>
            )}

            {user.role === 'admin' && (
              <Link
                href="/admin/users"
                className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                {Icons.users}
                إدارة المستخدمين
              </Link>
            )}
          </nav>

          {/* Logout */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            >
              {Icons.logout}
              تسجيل الخروج
            </button>
          </div>
        </aside>

        {/* Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              مرحباً، {user.name}
            </h1>
            <p className="text-gray-600 mt-1">
              {user.role === 'admin' 
                ? 'لوحة تحكم المدير' 
                : user.role === 'supervisor' 
                  ? 'لوحة تحكم المشرف' 
                  : 'مرحباً بك في منصتك'}
            </p>
          </div>

          {/* Stats (Admin only) */}
          {stats && user.role === 'admin' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                    {Icons.users}
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">إجمالي المستخدمين</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total_users}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
                    {Icons.folder}
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">إجمالي المشاريع</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total_projects}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
                    {Icons.clock}
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">طلبات معلقة</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.pending_approvals}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Projects Grid */}
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">المشاريع</h2>
            {(user.role === 'supervisor' || user.role === 'admin') && (
              <Link
                href="/projects/create"
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors"
              >
                {Icons.plus}
                مشروع جديد
              </Link>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link
key={project.id}
                href={`/projects/${project.id}`}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-teal-200 transition-all group"
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: `${project.color}20`, color: project.color }}
                >
                  {getIcon(project.icon)}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{project.name}</h3>
                <p className="text-gray-600 text-sm line-clamp-2">
                  {project.description || 'لا يوجد وصف'}
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <span className={`px-3 py-1 text-xs rounded-full ${
                    project.target_gender === 'male' 
                      ? 'bg-blue-100 text-blue-700' 
                      : project.target_gender === 'female'
                        ? 'bg-pink-100 text-pink-700'
                        : 'bg-purple-100 text-purple-700'
                  }`}>
                    {project.target_gender === 'male' ? 'ذكور' : project.target_gender === 'female' ? 'إناث' : 'الكل'}
                  </span>
                </div>
              </Link>
            ))}

            {projects.length === 0 && (
              <div className="col-span-full text-center py-12">
                <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <p className="text-gray-500">لا توجد مشاريع حالياً</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}