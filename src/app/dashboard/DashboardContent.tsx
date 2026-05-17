'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAppSettings } from '@/hooks/useAppSettings'
import type { User, Project } from '@/types'
import Header from '@/components/Header'

interface DashboardContentProps {
  profile: User
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

export default function DashboardContent({ profile, projects, stats }: DashboardContentProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const router = useRouter()
  const supabase = createClient()
  const { settings } = useAppSettings()

  useEffect(() => {
    const fetchUnread = async () => {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id)
        .eq('is_read', false)
      setUnreadCount(count || 0)
    }
    fetchUnread()
  }, [profile.id, supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const getIcon = (iconName: string) => {
    return Icons[iconName as keyof typeof Icons] || Icons.folder
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      <Header user={profile} settings={settings} onMenuClick={() => setSidebarOpen(true)} />

      {/* Unread notifications banner */}
      {unreadCount > 0 && (
        <Link
          href="/notifications"
          className="block bg-blue-600 text-white text-center py-2 px-4 text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          لديك {unreadCount} إشعار{unreadCount !== 1 ? 'ات' : ''} غير مقروء
        </Link>
      )}

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={`
        fixed inset-y-0 right-0 z-50 w-2/3 max-w-sm bg-white shadow-2xl transform transition-transform duration-300 lg:hidden
        ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="h-full flex flex-col bg-white">
          <div className="px-6 pt-8 pb-6 border-b border-gray-100 text-center relative">
            {/* Close Button */}
            <button 
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 left-4 p-2 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-blue-50 flex items-center justify-center border-2 border-blue-100 shadow-sm overflow-hidden">
              {settings.app_logo ? (
                <img src={settings.app_logo} alt="شعار" className="w-full h-full object-cover" />
              ) : (
                <img src="/icon.svg" alt="شعار" className="w-full h-full object-cover" />
              )}
            </div>
            <h1 className="text-gray-900 font-bold text-xl mb-1">{settings.app_name}</h1>
            <p className="text-gray-500 text-sm">{settings.app_description}</p>
            
          </div>

          <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-2">
            <Link href="/dashboard" onClick={() => setSidebarOpen(false)} className="flex items-center gap-4 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-2xl transition-all duration-200 active:scale-95">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
              </div>
              <span className="font-medium">الرئيسية</span>
            </Link>

            <Link href="/profile" onClick={() => setSidebarOpen(false)} className="flex items-center gap-4 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-2xl transition-all duration-200 active:scale-95">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 01 8 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </div>
              <span className="font-medium">الملف الشخصي</span>
            </Link>

            {/* Help Link */}
            <Link href={`/help/${profile.role}`} onClick={() => setSidebarOpen(false)} className="flex items-center gap-4 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-2xl transition-all duration-200 active:scale-95">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <span className="font-medium">دليل المستخدم</span>
            </Link>

            {profile.role === 'admin' && (
              <>
                <div className="h-px bg-gray-200 my-4"></div>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-3 px-3">الإدارة</p>
                <Link href="/admin" onClick={() => setSidebarOpen(false)} className="flex items-center gap-4 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-2xl transition-all duration-200 active:scale-95">
                  <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  </div>
                  <span className="font-medium">لوحة تحكم المدير</span>
                </Link>
              </>
            )}
          </nav>

          <div className="p-4 border-t border-gray-100">
            <button onClick={handleLogout} className="flex items-center justify-center gap-3 w-full px-4 py-3.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl transition-all duration-200 active:scale-95">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              <span className="font-medium">تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 lg:p-8 pt-6">
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
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
                <div className="p-4 lg:p-5 bg-gradient-to-b from-white to-gray-50/50">
                  <h3 
                    className="text-xl lg:text-2xl font-bold text-blue-800 text-center tracking-wide" 
                    style={{ fontFamily: 'var(--font-reem-kufi)' }}
                  >
                    {project.name}
                  </h3>
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
  )
}
