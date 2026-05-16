'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { User } from '@/types'
import NotificationsPopover from './NotificationsPopover'

interface HeaderProps {
  user: User
  settings: any
  onMenuClick?: () => void
  showMenuButton?: boolean
}

const Icons = {
  menu: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}

export default function Header({ user, settings, onMenuClick, showMenuButton = true }: HeaderProps) {
  const router = useRouter()
  const supabase = createClient()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleMenuClick = () => {
    if (onMenuClick) {
      onMenuClick()
    } else {
      setMobileMenuOpen(!mobileMenuOpen)
    }
  }

  return (
    <>
      <header className="bg-white shadow-sm sticky top-0 z-30 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between lg:flex-row-reverse">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            {showMenuButton && (
              <button
                onClick={handleMenuClick}
                className="lg:hidden p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
              >
                {Icons.menu}
              </button>
            )}
            
            {/* Logo & Title */}
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center overflow-hidden border-2 border-blue-100 shadow-sm">
                {settings?.app_logo ? (
                  <img src={settings.app_logo} alt="شعار" className="w-full h-full object-cover" />
                ) : (
                  <img src="/icon.svg" alt="شعار" className="w-full h-full object-cover" />
                )}
              </div>
              <h1 className="text-lg font-bold text-blue-700 block">{settings?.app_name || 'أحلى شباب'}</h1>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-2">
            <Link href="/dashboard" className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-xl font-medium transition-colors">
              الرئيسية
            </Link>
            <Link href="/profile" className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-xl font-medium transition-colors">
              الملف الشخصي
            </Link>
            {user?.role === 'admin' && (
              <Link href="/admin" className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-xl font-medium transition-colors">
                لوحة تحكم المدير
              </Link>
            )}
            <NotificationsPopover />
            <div className="w-px h-6 bg-gray-200 mx-2"></div>
            <button onClick={handleLogout} className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl font-medium transition-colors">
              تسجيل الخروج
            </button>
          </nav>
        </div>
      </header>

      {/* Mobile Navigation Dropdown (used when no sidebar is provided) */}
      {!onMenuClick && mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-gray-100 px-4 py-2 flex flex-col gap-2">
          <Link href="/dashboard" className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-xl font-medium">الرئيسية</Link>
          <Link href="/profile" className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-xl font-medium">الملف الشخصي</Link>
          {user?.role === 'admin' && (
            <Link href="/admin" className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-xl font-medium">لوحة تحكم المدير</Link>
          )}
          <button onClick={handleLogout} className="text-right px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl font-medium">تسجيل الخروج</button>
        </div>
      )}
    </>
  )
}
