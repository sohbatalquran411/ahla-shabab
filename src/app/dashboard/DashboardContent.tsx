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
      {/* Mobile App-like Header */}
      <header className="bg-gradient-to-l from-teal-500 to-teal-600 shadow-lg lg:hidden sticky top-0 z-30">
        <div className="flex items-center justify-between px-4 py-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-white hover:bg-white/20 rounded-xl transition-colors"
          >
            {Icons.menu}
          </button>
          <div className="text-center">
            <h1 className="text-lg font-bold text-white">أوراد أحلى شباب</h1>
            <p className="text-xs text-teal-100">منصة المشاريع الدعوية</p>
          </div>
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-sm font-bold text-white">
              {user.name.charAt(0)}
            </span>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Mobile App-like Sidebar */}
        <aside className={`
          fixed inset-y-0 right-0 z-50 w-full bg-white shadow-2xl transform transition-transform duration-300 lg:w-80 lg:translate-x-0 lg:static lg:shadow-none
          ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}
        `}>
          {/* Mobile Sidebar Header */}
          <div className="lg:hidden bg-gradient-to-br from-teal-500 via-teal-600 to-emerald-700 px-6 py-8 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-12 -translate-x-12"></div>
              <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-white rounded-full"></div>
            </div>
            
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
                  <span className="text-2xl font-bold text-white">
                    {user.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg">{user.name}</h2>
                  <p className="text-teal-100 text-sm">
                    {user.role === 'admin' ? 'مدير النظام' : user.role === 'supervisor' ? 'مشرف' : 'متطوع'}
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 text-white hover:bg-white/20 rounded-xl transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Desktop Sidebar Header */}
          <div className="hidden lg:block relative bg-gradient-to-br from-teal-500 via-teal-600 to-emerald-700 px-6 py-10 overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-12 -translate-x-12"></div>
              <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-white rounded-full"></div>
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
                  <span className="text-2xl font-bold text-white">
                    {user.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg">{user.name}</h2>
                  <p className="text-teal-100 text-sm">
                    {user.role === 'admin' ? 'مدير النظام' : user.role === 'supervisor' ? 'مشرف' : 'متطوع'}
                  </p>
                </div>
              </div>
              
              {/* Logo/Brand */}
              <div className="text-center">
                <h1 className="text-white font-bold text-xl mb-1">أوراد أحلى شباب</h1>
                <p className="text-teal-100 text-sm">منصة إدارة المشاريع الدعوية</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="px-4 py-6 space-y-1 pb-24 lg:pb-6">
            {/* Main Section */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">القائمة الرئيسية</h3>
              
              <Link
                href="/dashboard"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-4 px-4 py-4 bg-gradient-to-l from-teal-50 to-teal-100 text-teal-700 rounded-2xl font-medium mb-2 shadow-sm active:scale-95 transition-all"
              >
                <div className="w-12 h-12 bg-teal-500 rounded-xl flex items-center justify-center text-white shadow-lg">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <span className="font-semibold text-lg">الرئيسية</span>
              </Link>

              <Link
                href="/projects"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-4 px-4 py-4 text-gray-600 hover:bg-gray-50 rounded-2xl transition-all duration-200 group active:scale-95"
              >
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:shadow-xl transition-shadow">
                  {Icons.folder}
                </div>
                <span className="font-medium text-lg">المشاريع</span>
              </Link>

              <Link
                href="/profile"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-4 px-4 py-4 text-gray-600 hover:bg-gray-50 rounded-2xl transition-all duration-200 group active:scale-95"
              >
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:shadow-xl transition-shadow">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <span className="font-medium text-lg">الملف الشخصي</span>
              </Link>
            </div>

            {/* Management Section */}
            {(user.role === 'supervisor' || user.role === 'admin') && (
              <div className="mb-6">
                <div className="h-px bg-gray-200 mb-4"></div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">الإدارة</h3>
                
                <Link
                  href="/forms/create"
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-4 px-4 py-4 text-gray-600 hover:bg-gray-50 rounded-2xl transition-all duration-200 group active:scale-95"
                >
                  <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:shadow-xl transition-shadow">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <span className="font-medium text-lg">إنشاء فورم</span>
                </Link>

                {user.role === 'admin' && (
                  <>
                    <Link
                      href="/admin/users"
                      onClick={() => setSidebarOpen(false)}
                      className="flex items-center gap-4 px-4 py-4 text-gray-600 hover:bg-gray-50 rounded-2xl transition-all duration-200 group active:scale-95"
                    >
                      <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:shadow-xl transition-shadow">
                        {Icons.users}
                      </div>
                      <span className="font-medium text-lg">إدارة المستخدمين</span>
                    </Link>

                    <Link
                      href="/admin/results"
                      onClick={() => setSidebarOpen(false)}
                      className="flex items-center gap-4 px-4 py-4 text-gray-600 hover:bg-gray-50 rounded-2xl transition-all duration-200 group active:scale-95"
                    >
                      <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:shadow-xl transition-shadow">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <span className="font-medium text-lg">النتائج</span>
                    </Link>
                  </>
                )}
              </div>
            )}
          </nav>

          {/* Logout */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t lg:border-t-0">
            <div className="h-px bg-gray-200 mb-4 lg:block hidden"></div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-4 w-full px-4 py-4 text-red-600 hover:bg-red-50 rounded-2xl transition-all duration-200 group active:scale-95"
            >
              <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:shadow-xl transition-shadow">
                {Icons.logout}
              </div>
              <span className="font-medium text-lg">تسجيل الخروج</span>
            </button>
          </div>
        </aside>

        {/* Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8 pt-0 lg:pt-8">
          {/* Mobile spacing */}
          <div className="h-4 lg:hidden"></div>
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-teal-200 transition-all group active:scale-95"
              >
                <div
                  className="w-12 h-12 lg:w-16 lg:h-16 rounded-2xl flex items-center justify-center mb-3 lg:mb-4 group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: `${project.color}20`, color: project.color }}
                >
                  {getIcon(project.icon)}
                </div>
                <h3 className="text-base lg:text-lg font-bold text-gray-900 mb-2">{project.name}</h3>
                <p className="text-gray-600 text-sm line-clamp-2">
                  {project.description || 'لا يوجد وصف'}
                </p>
                <div className="mt-3 lg:mt-4 flex items-center gap-2">
                  <span className={`px-2 lg:px-3 py-1 text-xs rounded-full ${
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
              <div className="col-span-full text-center py-8 lg:py-12">
                <div className="w-16 h-16 lg:w-20 lg:h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 lg:w-10 lg:h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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