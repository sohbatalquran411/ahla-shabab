import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ProjectPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()

  if (!project) {
    redirect('/dashboard')
  }

  const { data: forms } = await supabase
    .from('forms')
    .select('*')
    .eq('project_id', id)
    .eq('is_active', true)

  const { data: responses } = await supabase
    .from('form_responses')
    .select('*')
    .eq('user_id', user.id)

  const completedFormIds = responses?.map(r => r.form_id) || []

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-gray-600 hover:text-teal-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            رجوع
          </Link>
          <h1 className="text-lg font-bold text-teal-700">{project.name}</h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Project Info */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
          <div className="flex items-start gap-4">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl"
              style={{ backgroundColor: project.color }}
            >
              {project.icon === 'mosque' && '🕌'}
              {project.icon === 'sun' && '☀️'}
              {project.icon === 'quran' && '📖'}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{project.name}</h2>
              <p className="text-gray-600">{project.description}</p>
              <div className="mt-3 flex items-center gap-2">
                <span className={`px-3 py-1 text-sm rounded-full ${
                  project.target_gender === 'male' 
                    ? 'bg-blue-100 text-blue-700' 
                    : project.target_gender === 'female'
                      ? 'bg-pink-100 text-pink-700'
                      : 'bg-purple-100 text-purple-700'
                }`}>
                  {project.target_gender === 'male' ? 'ذكور فقط' : project.target_gender === 'female' ? 'إناث فقط' : 'الجميع'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Forms */}
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">الفورمز المتاحة</h3>
          {(profile.role === 'supervisor' || profile.role === 'admin') && (
            <Link
              href={`/forms/create?project_id=${id}`}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              إنشاء فورم جديدة
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {forms?.map((form) => {
            const isCompleted = completedFormIds.includes(form.id)
            
            return (
              <Link
                key={form.id}
                href={`/forms/${form.id}`}
                className={`bg-white rounded-2xl p-6 shadow-sm border transition-all hover:shadow-lg hover:border-teal-200 ${
                  isCompleted ? 'border-green-200' : 'border-gray-100'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center text-teal-600">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  {isCompleted && (
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                      مكتمل ✓
                    </span>
                  )}
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">{form.name}</h4>
                <p className="text-gray-600 text-sm line-clamp-2">
                  {form.description || 'لا يوجد وصف'}
                </p>
                <div className="mt-4">
                  <span className="text-teal-600 font-medium text-sm">
                    {isCompleted ? 'عرض النتيجة' : 'ابدأ الآن'} ←
                  </span>
                </div>
              </Link>
            )
          })}

          {(!forms || forms.length === 0) && (
            <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-gray-100">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-500">لا توجد فورمز في هذا المشروع حالياً</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}