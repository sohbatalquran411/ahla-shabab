'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAppSettings } from '@/hooks/useAppSettings'
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
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 01 8 0z" />
    </svg>
  ),
  quran: (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  users: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 01 8 0z" />
    </svg>
  ),
  folder: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  ),
  clock: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 01 18 0z" />
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
  const { settings } = useAppSettings()

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
      <header className="bg-white shadow-sm lg:hidden sticky top-0 z-30 border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
          >
            {Icons.menu}
          </button>
          <div className="text-center">
            <h1 className="text-base font-bold text-gray-900">{settings.app_name}</h1>
          </div>
          <div className="w-9 h-9 bg-blue-50 rounded-full flex items-center justify-center overflow-hidden border-2 border-blue-100">
            {settings.app_logo ? (
              <img src={settings.app_logo} alt="شعار" className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-blue-700">
                {user.name.charAt(0)}
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar - Clean White Design */}
        <aside className={`
          fixed inset-y-0 right-0 z-50 w-full bg-white shadow-2xl transform transition-transform duration-300 lg:w-80 lg:translate-x-0 lg:static lg:shadow-none lg:border-l lg:border-gray-100
          ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}
        `}>
          {/* Sidebar Content */}
          <div className="h-full flex flex-col bg-white">
            
            {/* Header Section */}
            <div className="px-6 pt-8 pb-6 border-b border-gray-100 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-blue-50 flex items-center justify-center border-2 border-blue-100 shadow-sm overflow-hidden">
                {settings.app_logo ? (
                  <img src={settings.app_logo} alt="شعار" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-blue-700">
                    {user.name.charAt(0)}
                  </span>
                )}
              </div>
              <h1 className="text-gray-900 font-bold text-xl mb-1">{settings.app_name}</h1>
              <p className="text-gray-500 text-sm">{settings.app_description}</p>
              
              {/* User Info */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-gray-700 font-medium">{user.name}</p>
                <p className="text-gray-400 text-xs mt-0.5">
                  {user.role === 'admin' ? 'مدير النظام' : user.role === 'supervisor' ? 'مشرف' : 'متطوع'}
                </p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 overflow-y-auto">
              <Link
                href="/dashboard"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-4 px-4 py-3 bg-blue-50 text-blue-700 rounded-2xl font-medium mb-2 transition-all active:scale-95"
              >
                <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white shadow-sm">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <span className="font-medium">الرئيسية</span>
              </Link>

              <Link
                href="/profile"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-4 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-2xl transition-all duration-200 active:scale-95"
              >
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 01 8 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <span className="font-medium">الملف الشخصي</span>
              </Link>

              {/* Admin Section */}
              {user.role === 'admin' && (
                <>
                    <div className="h-px bg-gray-200 my-4"></div>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-3 px-3">الإدارة</p>
                    <Link
                        href="/admin"
                        onClick={() => setSidebarOpen(false)}
                        className="flex items-center gap-4 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-2xl transition-all duration-200 active:scale-95"
                    >
                        <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                        <span className="font-medium">لوحة تحكم المدير</span>
                    </Link>
                </>
              )}
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-gray-100">
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-3 w-full px-4 py-3.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl transition-all duration-200 active:scale-95"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="font-medium">تسجيل الخروج</span>
              </button>
            </div>
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
          
          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                prefetch={true}
                className="block bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg hover:border-blue-200 transition-all group active:scale-95"
              >
                {project.image_url ? (
                  <div className="w-full h-36 lg:h-44 overflow-hidden">
                    <img 
                      src={project.image_url} 
                      alt={project.name} 
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div
                    className="w-full h-36 lg:h-44 flex items-center justify-center text-4xl lg:text-5xl group-hover:scale-110 transition-transform duration-300"
                    style={{ backgroundColor: `${project.color}15`, color: project.color }}
                  >
                    {getIcon(project.icon)}
                  </div>
                )}
                <div className="p-4 lg:p-5">
                  <h3 className="text-base lg:text-lg font-bold text-gray-900 text-center">{project.name}</h3>
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
