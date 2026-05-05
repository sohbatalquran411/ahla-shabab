import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function CreateFormPage({ params }: PageProps) {
  const { id: projectId } = await params
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

  if (!profile || (profile.role !== 'supervisor' && profile.role !== 'admin')) {
    redirect('/dashboard')
  }

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single()

  if (!project) {
    redirect('/dashboard')
  }

  // Get existing questions from other forms (for reuse)
  const { data: existingQuestions } = await supabase
    .from('questions')
    .select('*')
    .limit(10)

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href={`/projects/${projectId}`}
            className="flex items-center gap-2 text-gray-600 hover:text-teal-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            رجوع
          </Link>
          <h1 className="text-lg font-bold text-teal-700">إنشاء فورم جديد</h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <FormCreator 
          projectId={projectId} 
          projectName={project.name}
          existingQuestions={existingQuestions || []}
        />
      </main>
    </div>
  )
}

interface Question {
  id: string
  text: string
  type: string
  options: any
}

interface FormCreatorProps {
  projectId: string
  projectName: string
  existingQuestions: Question[]
}

function FormCreator({ projectId, projectName, existingQuestions }: FormCreatorProps) {
  // This is a simple client component approach
  // In a full implementation, you'd use React state
  
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h2 className="text-xl font-bold text-gray-900 mb-6">إنشاء فورم جديد لمشروع: {projectName}</h2>
      
      {/* Simple Form Creation UI */}
      <form action="#" method="POST" className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">اسم الفورم</label>
          <input
            type="text"
            name="name"
            required
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            placeholder="مثال: تقييم أوراد الصباح"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">الوصف</label>
          <textarea
            name="description"
            rows={3}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            placeholder="وصف مختصر للفورم..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">الفئة المستهدفة</label>
          <select
            name="target_gender"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          >
            <option value="both">الكل (ذكور وإناث)</option>
            <option value="male">ذكور فقط</option>
            <option value="female">إناث فقط</option>
          </select>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">الأسئلة</h3>
          
          {/* Question types guide */}
          <div className="bg-teal-50 rounded-xl p-4 mb-6">
            <p className="text-teal-800 font-medium mb-2">أنواع الأسئلة المتاحة:</p>
            <ul className="text-teal-700 text-sm space-y-1">
              <li>• <strong>نص:</strong> إجابة نصية قصيرة</li>
              <li>• <strong>نص طويل:</strong> إجابة نصية متعددة الأسطر</li>
              <li>• <strong>اختيار واحد:</strong> اختيار إجابة واحدة من عدة خيارات</li>
              <li>• <strong>اختيار متعدد:</strong> اختيار أكثر من إجابة</li>
              <li>• <strong>تقييم:</strong> تقييم من 1 إلى 5</li>
              <li>• <strong>تصنيف:</strong> ترتيب العناصر</li>
              <li>• <strong>مصفوفة:</strong> أسئلة متعددة مع نفس الخيارات</li>
            </ul>
          </div>

          {/* Example for Prayer Rating */}
          <div className="bg-amber-50 rounded-xl p-4 mb-6 border border-amber-200">
            <p className="text-amber-800 font-medium mb-2">💡 مثال: سؤال الصلاة</p>
            <div className="bg-white rounded-lg p-4 space-y-3">
              <div className="font-medium text-gray-800">في أي وقت تصلي الفجر؟</div>
              <div className="text-sm text-gray-600">
                ○ قبل الأذان | ○ مع الإمام | ○ بعد الأذان بـ 15 دقيقة | ○ بعد الأذان بـ 30+ دقيقة
              </div>
              <div className="text-xs text-teal-600">النقاط: 5 للاختيار الأول، 4 للثاني، 3 للثالث، 1 للرابع</div>
            </div>
          </div>

          <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
            <p className="text-gray-500 mb-2">إضافة الأسئلة يتم من لوحة التحكم المتقدمة</p>
            <p className="text-gray-400 text-sm">سيتم تفعيل هذه الميزة قريباً</p>
          </div>
        </div>

        <div className="flex gap-4 pt-4 border-t">
          <button
            type="submit"
            className="flex-1 py-4 bg-gradient-to-l from-teal-600 to-teal-700 text-white font-semibold rounded-xl hover:from-teal-700 hover:to-teal-800 transition-all shadow-lg shadow-teal-500/30"
          >
            إنشاء الفورم
          </button>
          <Link
            href={`/projects/${projectId}`}
            className="px-6 py-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
          >
            إلغاء
          </Link>
        </div>
      </form>

      {/* Existing Questions for Reference */}
      {existingQuestions.length > 0 && (
        <div className="mt-8 pt-6 border-t">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">أسئلة من فورمز سابقة (للمرجع)</h3>
          <div className="space-y-3">
            {existingQuestions.slice(0, 5).map((q) => (
              <div key={q.id} className="bg-gray-50 rounded-lg p-3">
                <p className="font-medium text-gray-800">{q.text}</p>
                <p className="text-xs text-gray-500 mt-1">النوع: {q.type}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}