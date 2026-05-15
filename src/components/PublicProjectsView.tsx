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

const ICON_OPTIONS: Record<string, string> = {
  mosque: '🕌', sun: '☀️', quran: '📖', book: '📚',
  star: '⭐', heart: '💖', hand: '🤝', moon: '🌙'
}

const NAV_LINKS = [
  { id: 'hero', label: 'الرئيسية' },
  { id: 'about', label: 'عن المنصة' },
  { id: 'projects', label: 'المشاريع' },
  { id: 'features', label: 'المميزات' },
  { id: 'contact', label: 'تواصل معنا' },
]

export default function PublicProjectsView({ projects: initialProjects }: PublicProjectsViewProps) {
  const [projects] = useState(initialProjects)
  const [settings, setSettings] = useState({
    app_logo: '', app_name: 'أحلى شباب', app_description: 'منصة متكاملة لإدارة المتطوعين والمشاريع'
  })
  const [mobileOpen, setMobileOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => { fetchSettings() }, [])

  const fetchSettings = async () => {
    try {
      const { data } = await supabase.from('app_settings').select('key, value')
      if (data) {
        const obj: any = { ...settings }
        data.forEach(s => { if (s.value) obj[s.key] = s.value })
        setSettings(obj)
      }
    } catch (e) { console.error(e) }
  }

  const getIcon = (name: string) => ICON_OPTIONS[name] || ICON_OPTIONS.mosque

  const scrollTo = (id: string) => {
    setMobileOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div dir="rtl" className="min-h-screen bg-white font-sans">
      {/* ===== HEADER ===== */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100/80 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <img
              src="https://jeel.academy/wp-content/uploads/2024/03/Logo.svg"
              alt="شعار"
              className="h-9 w-auto"
            />
            <span className="font-bold text-lg text-gray-800">{settings.app_name}</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map(l => (
              <button key={l.id} onClick={() => scrollTo(l.id)}
                className="px-3.5 py-2 text-sm text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors font-medium"
              >{l.label}</button>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Link href="/login"
              className="hidden sm:inline-flex px-4 py-2 text-sm text-gray-700 hover:text-emerald-600 font-medium transition-colors"
            >تسجيل الدخول</Link>
            <Link href="/register"
              className="px-5 py-2 bg-gradient-to-l from-emerald-600 to-emerald-500 text-white text-sm rounded-xl hover:from-emerald-700 hover:to-emerald-600 transition-all shadow-lg shadow-emerald-500/25 font-medium"
            >إنشاء حساب</Link>
            <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-gray-100 bg-white px-4 py-3 flex flex-col gap-1">
            {NAV_LINKS.map(l => (
              <button key={l.id} onClick={() => scrollTo(l.id)}
                className="text-right px-3 py-2.5 text-gray-700 hover:bg-emerald-50 rounded-lg text-sm font-medium"
              >{l.label}</button>
            ))}
            <Link href="/login" className="text-right px-3 py-2.5 text-gray-700 hover:bg-emerald-50 rounded-lg text-sm font-medium">تسجيل الدخول</Link>
          </div>
        )}
      </header>

      {/* ===== HERO ===== */}
      <section id="hero" className="relative min-h-[85vh] flex items-center bg-gradient-to-b from-emerald-50 via-white to-white pt-20 overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-emerald-100/40 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-emerald-100/30 rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-4 w-full">
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
            {/* Text side */}
            <div className="flex-1 text-center lg:text-right">
              <div className="inline-block px-4 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-6">
                منصة شبابية متكاملة
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                منصة <span className="text-emerald-600">أحلى شباب</span>
                <br />
                لتنظيم المبادرات والتطوع
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed">
                منصة متكاملة لإدارة المشاريع الشبابية، تنظيم المتطوعين، 
                وتقديم المناهج التعليمية والاستمارات بكل سهولة
              </p>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
                <Link href="/register"
                  className="px-8 py-4 bg-gradient-to-l from-emerald-600 to-emerald-500 text-white rounded-2xl hover:from-emerald-700 hover:to-emerald-600 transition-all font-semibold shadow-xl shadow-emerald-500/30 flex items-center gap-2 text-lg"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                  انضم إلينا الآن
                </Link>
                <button onClick={() => scrollTo('projects')}
                  className="px-8 py-4 bg-white text-emerald-700 rounded-2xl hover:bg-emerald-50 transition-colors font-semibold border-2 border-emerald-200 flex items-center gap-2 text-lg"
                >
                  استعرض المشاريع
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                </button>
              </div>
            </div>

            {/* Illustration side */}
            <div className="flex-1 flex justify-center lg:justify-end">
              <div className="relative">
                <img
                  src="https://jeel.academy/wp-content/uploads/2024/03/Asset-01.png"
                  alt="أحلى شباب"
                  className="w-72 h-72 sm:w-80 sm:h-80 object-contain"
                />
                {/* Floating badge */}
                <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-lg px-5 py-3 border border-gray-100">
                  <p className="text-sm font-bold text-gray-800">{projects.length}+ مشروع</p>
                  <p className="text-xs text-gray-500">متاحة للتطوع</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
            <path d="M0 60V30C240 0 480 0 720 30C960 60 1200 60 1440 30V60H0Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* ===== ABOUT / MISSION ===== */}
      <section id="about" className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            {/* Image side */}
            <div className="flex-1">
              <div className="relative">
                <img
                  src="https://jeel.academy/wp-content/uploads/2024/03/أهدافنا.png"
                  alt="أهداف المنصة"
                  className="w-full max-w-sm mx-auto object-contain"
                />
                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-amber-100 rounded-2xl -z-10" />
              </div>
            </div>

            {/* Text side */}
            <div className="flex-1 text-center lg:text-right">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">عن المنصة</h2>
              <div className="w-20 h-1 bg-emerald-500 rounded-full mx-auto lg:mx-0 mb-8" />
              <p className="text-gray-600 text-lg leading-relaxed mb-6">
                {settings.app_description}
              </p>
              <ul className="space-y-4 text-right">
                {[
                  'تنظيم وإدارة المشاريع الشبابية بكل احترافية',
                  'متابعة المتطوعين وتسجيلهم في المشاريع',
                  'إنشاء استمارات ونماذج متقدمة لجمع البيانات',
                  'تقديم مناهج تعليمية ودروس تفاعلية',
                  'إحصائيات وتقارير دقيقة لأداء المشاريع',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 justify-end">
                    <span className="text-gray-700">{item}</span>
                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PROJECTS ===== */}
      <section id="projects" className="py-20 px-4 bg-emerald-50/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">المشاريع المتاحة</h2>
            <div className="w-20 h-1 bg-emerald-500 rounded-full mx-auto mt-3 mb-6" />
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              اختر المشروع الذي يناسبك وساهم في بناء الأثر
            </p>
          </div>

          {projects.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map(p => (
                <div key={p.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                >
                  {p.image_url ? (
                    <div className="w-full h-44 overflow-hidden bg-gray-50">
                      <img src={p.image_url} alt={p.name} loading="lazy"
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" />
                    </div>
                  ) : (
                    <div className="w-full h-44 flex items-center justify-center text-5xl transition-transform duration-300 group-hover:scale-110"
                      style={{ backgroundColor: `${p.color}15`, color: p.color }}>
                      {getIcon(p.icon)}
                    </div>
                  )}
                  <div className="p-5 text-center">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{p.name}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2">{p.description}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
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

      {/* ===== FEATURES ===== */}
      <section id="features" className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">مميزات المنصة</h2>
            <div className="w-20 h-1 bg-emerald-500 rounded-full mx-auto mt-3 mb-6" />
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              كل ما تحتاجه لإدارة مشاريعك الشبابية في مكان واحد
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {[
              { icon: '🚀', title: 'إدارة المشاريع', desc: 'إنشاء وتنظيم المشاريع الشبابية بسهولة ومتابعة المتطوعين' },
              { icon: '📋', title: 'استمارات مخصصة', desc: 'نماذج واستبيانات متطورة لجمع البيانات والمعلومات' },
              { icon: '📚', title: 'مناهج تعليمية', desc: 'دروس وفيديوهات تعليمية متكاملة مع تتبع التقدم' },
              { icon: '👥', title: 'إدارة المتطوعين', desc: 'تسجيل ومتابعة المتطوعين وإدارة أدوارهم بكفاءة' },
              { icon: '📊', title: 'إحصائيات دقيقة', desc: 'لوحة تحكم متكاملة تعرض إحصائيات المشاريع والمستخدمين' },
              { icon: '🔒', title: 'خصوصية وأمان', desc: 'صلاحيات مرنة للمستخدمين وإدارة المحتوى بشكل آمن' },
            ].map((f, i) => (
              <div key={i}
                className="bg-gradient-to-b from-emerald-50/50 to-white rounded-2xl p-6 border border-emerald-100/60 hover:shadow-lg hover:border-emerald-200 transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-2xl mb-4 shadow-lg shadow-emerald-200/50">
                  <span>{f.icon}</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA BANNER ===== */}
      <section className="py-16 px-4 bg-gradient-to-l from-emerald-700 via-emerald-600 to-emerald-500 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">انضم إلينا اليوم</h2>
          <p className="text-emerald-100 text-lg mb-8">
            كن جزءاً من مجتمعنا وتطوع في المشاريع التي تناسب مهاراتك واهتماماتك
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/register"
              className="px-8 py-4 bg-white text-emerald-700 rounded-2xl hover:bg-emerald-50 transition-all font-bold shadow-xl flex items-center gap-2"
            >
              إنشاء حساب جديد
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
            </Link>
            <Link href="/login"
              className="px-8 py-4 bg-emerald-800/40 text-white rounded-2xl hover:bg-emerald-800/60 transition-all font-semibold border border-white/20"
            >
              تسجيل الدخول
            </Link>
          </div>
        </div>
      </section>

      {/* ===== CONTACT ===== */}
      <section id="contact" className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">تواصل معنا</h2>
            <div className="w-20 h-1 bg-emerald-500 rounded-full mx-auto mt-3 mb-6" />
            <p className="text-gray-600 text-lg">لديك استفسار؟ نحن هنا لمساعدتك</p>
          </div>

          <form className="max-w-xl mx-auto mt-8 space-y-5" onSubmit={e => e.preventDefault()}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <input type="text" placeholder="الاسم" className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all" />
              <input type="email" placeholder="البريد الإلكتروني" className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all" />
            </div>
            <input type="tel" placeholder="رقم الهاتف" className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all" />
            <textarea rows={4} placeholder="رسالتك..." className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all" />
            <button type="submit"
              className="w-full py-4 bg-gradient-to-l from-emerald-600 to-emerald-500 text-white rounded-2xl hover:from-emerald-700 hover:to-emerald-600 transition-all font-bold shadow-lg shadow-emerald-500/25 text-lg"
            >
              إرسال
            </button>
          </form>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-gray-900 text-white pt-16 pb-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div className="text-center sm:text-right">
              <div className="flex items-center justify-center sm:justify-start gap-3 mb-4">
                <img
                  src="https://jeel.academy/wp-content/uploads/2024/03/Full-Logo-1.svg"
                  alt="شعار"
                  className="h-16 w-auto"
                />
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">{settings.app_description}</p>
            </div>

            {/* Links */}
            <div className="text-center sm:text-right">
              <h4 className="font-bold text-white mb-4">روابط سريعة</h4>
              <ul className="space-y-2.5">
                {NAV_LINKS.map(l => (
                  <li key={l.id}>
                    <button onClick={() => scrollTo(l.id)} className="text-gray-400 hover:text-emerald-400 text-sm transition-colors">{l.label}</button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Account */}
            <div className="text-center sm:text-right">
              <h4 className="font-bold text-white mb-4">الحساب</h4>
              <ul className="space-y-2.5">
                <li><Link href="/login" className="text-gray-400 hover:text-emerald-400 text-sm transition-colors">تسجيل الدخول</Link></li>
                <li><Link href="/register" className="text-gray-400 hover:text-emerald-400 text-sm transition-colors">إنشاء حساب</Link></li>
              </ul>
            </div>

            {/* Social */}
            <div className="text-center sm:text-right">
              <h4 className="font-bold text-white mb-4">تابعنا</h4>
              <div className="flex items-center justify-center sm:justify-start gap-3">
                {['facebook', 'telegram', 'whatsapp'].map(s => (
                  <div key={s}
                    className="w-10 h-10 rounded-xl bg-gray-800 hover:bg-emerald-600 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-500 text-sm">© 2026 {settings.app_name}. جميع الحقوق محفوظة</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
