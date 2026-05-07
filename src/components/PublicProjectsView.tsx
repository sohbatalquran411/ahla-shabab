'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'

interface Project {
  id: string
  name: string
  description: string
  target_gender: 'male' | 'female' | 'both'
  icon: string
  color: string
  image_url?: string
}

interface PublicProjectsViewProps {
  projects: Project[]
}

const ICON_OPTIONS = {
  mosque: '🕌',
  sun: '☀️',
  quran: '📖',
  book: '📚',
  star: '⭐',
  heart: '💖',
  hand: '🤝',
  moon: '🌙'
}

export default function PublicProjectsView({ projects: initialProjects }: PublicProjectsViewProps) {
  const [projects, setProjects] = useState(initialProjects)
  const [settings, setSettings] = useState({
    app_logo: '',
    app_name: 'أحلى شباب',
    app_description: 'منصة متكاملة لإدارة المتطوعين والمشاريع'
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const { data } = await supabase
        .from('app_settings')
        .select('key, value')

      if (data) {
        const settingsObj: any = { ...settings }
        data.forEach(setting => {
          if (setting.value) {
            settingsObj[setting.key] = setting.value
          }
        })
        setSettings(settingsObj)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const getIcon = (iconName: string) => {
    return ICON_OPTIONS[iconName as keyof typeof ICON_OPTIONS] || ICON_OPTIONS.mosque
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-4">
              {settings.app_logo ? (
                <div className="w-12 h-12 rounded-xl overflow-hidden">
                  <img 
                    src={settings.app_logo} 
                    alt="شعار التطبيق" 
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-900">{settings.app_name}</h1>
                <p className="text-sm text-gray-600">{settings.app_description}</p>
              </div>
            </div>

            {/* Login Button */}
            <div className="flex items-center gap-3">
              <Link
                href="/register"
                className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                إنشاء حساب
              </Link>
              <Link
                href="/login"
                className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-lg shadow-blue-500/30"
              >
                تسجيل الدخول
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            منصة إدارة المتطوعين والمشاريع
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            منصة متكاملة لتنظيم وإدارة المبادرات الشبابية وتسهيل عملية التطوع والمشاركة
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/register"
              className="px-8 py-4 bg-gradient-to-l from-blue-600 to-blue-700 text-white rounded-2xl hover:from-blue-700 hover:to-blue-800 transition-all font-semibold shadow-lg shadow-blue-500/30 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              انضم إلينا كمتطوع
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 bg-white text-blue-700 rounded-2xl hover:bg-gray-50 transition-colors font-semibold border-2 border-blue-200"
            >
              لدي حساب بالفعل
            </Link>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section className="py-16 px-4 bg-white/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">المشاريع المتاحة</h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
             تعرف على قائمة المشاريع والبرامج المتاحة للتطوع والمشاركة الفعالة
            </p>
          </div>

          {projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                <div
                  key={project.id}
                  className="relative rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg hover:border-blue-200 transition-all group bg-white"
                >
                  {project.image_url ? (
                    <div className="w-full h-44 bg-gray-50 flex items-center justify-center p-2 overflow-hidden">
                      <img 
                        src={project.image_url} 
                        alt={project.name} 
                        loading="lazy"
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div
                      className="w-full h-44 flex items-center justify-center text-5xl group-hover:scale-110 transition-transform duration-300"
                      style={{ backgroundColor: `${project.color}15`, color: project.color }}
                    >
                      {getIcon(project.icon)}
                    </div>
                  )}
                  
                  <div className="p-5 bg-gradient-to-b from-white to-gray-50/50">
                    <h4 
                      className="text-xl lg:text-2xl font-bold text-blue-800 mb-1.5 text-center tracking-wide"
                      style={{ fontFamily: 'var(--font-reem-kufi)' }}
                    >
                      {project.name}
                    </h4>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-gray-700 mb-2">لا توجد مشاريع متاحة حالياً</h4>
              <p className="text-gray-500">سيتم إضافة مشاريع جديدة قريباً</p>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">مميزات المنصة</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">إدارة المشاريع</h4>
              <p className="text-gray-600">سهولة في متابعة وتسجيل المتطوعين في المشاريع</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">بيانات تفصيلية</h4>
              <p className="text-gray-600">لوحة تحكم توفر إحصائيات متكاملة لتتبع أداء النظام</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">استمارات مخصصة</h4>
              <p className="text-gray-600">إنشاء استمارات متقدمة لجمع بيانات المشاريع بسهولة</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-4 mb-6">
            {settings.app_logo ? (
              <div className="w-12 h-12 rounded-xl overflow-hidden">
                <img 
                  src={settings.app_logo} 
                  alt="شعار التطبيق" 
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            )}
            <h3 className="text-xl font-bold">{settings.app_name}</h3>
          </div>
          <p className="text-gray-400 mb-6">{settings.app_description}</p>
          <p className="text-gray-500 text-sm">© 2026 {settings.app_name}. جميع الحقوق محفوظة</p>
        </div>
      </footer>
    </div>
  )
}
