'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'



export default function AdminProjectsPage() {

  const [projects, setProjects] = useState<any[]>([])

  const [loading, setLoading] = useState(true)

  const [profile, setProfile] = useState<any>(null)

  const router = useRouter()

  const supabase = createClient()



  useEffect(() => {

    checkAuth()

  }, [])



  const checkAuth = async () => {

    try {

      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {

        router.push('/login')

        return

      }



      const { data: profileData } = await supabase

        .from('profiles')

        .select('*')

        .eq('id', user.id)

        .single()



      if (!profileData || profileData.role !== 'admin') {

        router.push('/dashboard')

        return

      }



      setProfile(profileData)

      await fetchProjects()

    } catch (error) {

      console.error('Error checking auth:', error)

      router.push('/login')

    }

  }



  const fetchProjects = async () => {

    try {

      const { data, error } = await supabase

        .from('projects')

        .select(`

          *,

          profiles!projects_created_by_fkey(name),

          forms(count)

        `)

        .order('created_at', { ascending: false })



      if (error) throw error

      setProjects(data || [])

    } catch (error) {

      console.error('Error fetching projects:', error)

    } finally {

      setLoading(false)

    }

  }



  const deleteProject = async (projectId: string) => {

    if (!confirm('هل أنت متأكد من حذف هذا المشروع؟ سيتم حذف جميع الفورمز المرتبطة به.')) {

      return

    }



    try {

      const { error } = await supabase

        .from('projects')

        .delete()

        .eq('id', projectId)



      if (error) throw error

      

      setProjects(prev => prev.filter(p => p.id !== projectId))

      alert('تم حذف المشروع بنجاح')

    } catch (error: any) {

      alert('حدث خطأ أثناء حذف المشروع: ' + error.message)

    }

  }



  const cloneProject = async (projectId: string) => {

    try {

      const { data: project, error: projectError } = await supabase

        .from('projects')

        .select('*')

        .eq('id', projectId)

        .single()



      if (projectError) throw projectError

      if (!project) throw new Error('المشروع غير موجود')



      const { data: newProject, error: insertError } = await supabase

        .from('projects')

        .insert({

          name: project.name + ' (نسخة)',

          description: project.description,

          icon: project.icon,

          color: project.color,

          target_gender: project.target_gender,

          image_url: project.image_url,

          modules: project.modules,

          visibility: project.visibility,

          original_project_id: projectId,

          created_by: profile.id

        })

        .select()

        .single()



      if (insertError) throw insertError



      const { data: curricula } = await supabase

        .from('curricula')

        .select('*')

        .eq('project_id', projectId)



      if (curricula && curricula.length > 0) {

        for (const curriculum of curricula) {

          const { data: newCurriculum, error: curError } = await supabase

            .from('curricula')

            .insert({

              project_id: newProject.id,

              title: curriculum.title,

              description: curriculum.description,

              is_sequential: curriculum.is_sequential,

              created_by: profile.id

            })

            .select()

            .single()



          if (curError) throw curError



          const { data: lessons } = await supabase

            .from('lessons')

            .select('*')

            .eq('curriculum_id', curriculum.id)

            .order('order_index')



          if (lessons && lessons.length > 0) {

            const lessonsToInsert = lessons.map(lesson => ({

              curriculum_id: newCurriculum.id,

              title: lesson.title,

              description: lesson.description,

              type: lesson.type,

              youtube_url: lesson.youtube_url,

              audio_url: lesson.audio_url,

              content: lesson.content,

              allow_comments: lesson.allow_comments,

              order_index: lesson.order_index,

              created_by: profile.id

            }))



            const { error: lessonsError } = await supabase

              .from('lessons')

              .insert(lessonsToInsert)



            if (lessonsError) throw lessonsError

          }

        }

      }



      const { data: forms } = await supabase

        .from('forms')

        .select('*')

        .eq('project_id', projectId)



      if (forms && forms.length > 0) {

        for (const form of forms) {

          const { data: newForm, error: formError } = await supabase

            .from('forms')

            .insert({

              project_id: newProject.id,

              name: form.name,

              description: form.description,

              target_gender: form.target_gender,

              is_active: form.is_active,

              time_limit: form.time_limit,

              expires_at: form.expires_at,

              allow_delete_responses: form.allow_delete_responses,

              randomize_questions: form.randomize_questions,

              allow_multiple: form.allow_multiple,

              image_url: form.image_url,

              created_by: profile.id

            })

            .select()

            .single()



          if (formError) throw formError



          const { data: questions } = await supabase

            .from('questions')

            .select('*')

            .eq('form_id', form.id)

            .order('order_index')



          if (questions && questions.length > 0) {

            const questionsToInsert = questions.map(q => ({

              form_id: newForm.id,

              text: q.text,

              type: q.type,

              required: q.required,

              points: q.points,

              order_index: q.order_index,

              options: q.options

            }))



            const { error: questionsError } = await supabase

              .from('questions')

              .insert(questionsToInsert)



            if (questionsError) throw questionsError

          }

        }

      }



      await fetchProjects()

      alert('تم نسخ المشروع بنجاح')

    } catch (error: any) {

      alert('حدث خطأ أثناء نسخ المشروع: ' + error.message)

    }

  }



  const transferProject = async (projectId: string) => {

    const email = prompt('أدخل البريد الإلكتروني للمالك الجديد:')

    if (!email) return



    try {

      const { data: user, error: userError } = await supabase

        .from('profiles')

        .select('id')

        .eq('email', email)

        .maybeSingle()



      if (userError) throw userError

      if (!user) {

        alert('لم يتم العثور على مستخدم بهذا البريد الإلكتروني')

        return

      }



      const { error: updateError } = await supabase

        .from('projects')

        .update({ created_by: user.id })

        .eq('id', projectId)



      if (updateError) throw updateError

      await fetchProjects()

      alert('تم نقل ملكية المشروع بنجاح')

    } catch (error: any) {

      alert('حدث خطأ أثناء نقل الملكية: ' + error.message)

    }

  }



  const toggleArchive = async (projectId: string, currentState: boolean) => {

    try {

      const { error } = await supabase

        .from('projects')

        .update({ is_archived: !currentState })

        .eq('id', projectId)



      if (error) throw error

      await fetchProjects()

      alert(currentState ? 'تم إلغاء أرشفة المشروع بنجاح' : 'تم أرشفة المشروع بنجاح')

    } catch (error: any) {

      alert('حدث خطأ: ' + error.message)

    }

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

        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">

          <button

            onClick={() => router.back()}

            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"

          >

            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">

              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />

            </svg>

            رجوع للإدارة

          </button>

          <h1 className="text-xl font-bold text-blue-700">إدارة المشاريع</h1>

          <Link

            href="/projects/create"

            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"

          >

            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">

              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />

            </svg>

            مشروع جديد

          </Link>

        </div>

      </header>



      <main className="max-w-7xl mx-auto px-4 py-8">

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">

          <div className="p-6 border-b border-gray-100">

            <h2 className="text-xl font-bold text-gray-900">جميع المشاريع ({projects.length})</h2>

          </div>

          

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="bg-gray-50">

                <tr>

                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المشروع</th>

                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المنشئ</th>

                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الفئة المستهدفة</th>

                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">عدد الفورمز</th>

                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تاريخ الإنشاء</th>

                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>

                </tr>

              </thead>

              <tbody className="bg-white divide-y divide-gray-200">

                {projects.map((project) => (

                  <tr

                    key={project.id}

                    className="hover:bg-gray-50 cursor-pointer"

                    onClick={() => router.push(`/projects/${project.id}`)}

                  >

                    <td className="px-6 py-4 whitespace-nowrap">

                      <div className="flex items-center gap-3">

                        {project.image_url ? (

                          <div className="w-10 h-10 rounded-lg overflow-hidden">

                            <img src={project.image_url} alt={project.name} loading="lazy" className="w-full h-full object-cover" />

                          </div>

                        ) : (

                          <div

                            className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"

                            style={{ backgroundColor: `${project.color}20`, color: project.color }}

                          >

                            {project.icon === 'mosque' ? '🕌' : project.icon === 'sun' ? '☀️' : project.icon === 'quran' ? '📖' : project.icon === 'book' ? '📚' : project.icon === 'star' ? '⭐' : project.icon === 'heart' ? '❤️' : project.icon === 'hand' ? '🤲' : '🌙'}

                          </div>

                        )}

                        <div>

                          <div className="text-sm font-medium text-gray-900">{project.name}</div>

                          <div className="text-sm text-gray-500">{project.description?.substring(0, 50)}...</div>

                        </div>

                      </div>

                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">

                      {project.profiles?.name || 'غير محدد'}

                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">

                      <span className={`px-2 py-1 text-xs rounded-full ${
                        project.target_gender === 'male' ? 'bg-blue-100 text-blue-700' :
                        project.target_gender === 'female' ? 'bg-pink-100 text-pink-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>

                        {project.target_gender === 'male' ? 'ذكور' : project.target_gender === 'female' ? 'إناث' : 'الكل'}

                      </span>

                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">

                      {project.forms?.[0]?.count || 0}

                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">

                      {new Date(project.created_at).toLocaleDateString('ar-EG')}

                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">

                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>

                        <Link

                          href={`/projects/${project.id}/edit?id=${project.id}`}

                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"

                          title="تعديل"

                        >

                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>

                        </Link>

                        <button

                          onClick={() => cloneProject(project.id)}

                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"

                          title="نسخ"

                        >

                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>

                        </button>

                        <button

                          onClick={() => transferProject(project.id)}

                          className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"

                          title="نقل ملكية"

                        >

                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>

                        </button>

                        <button

                          onClick={() => toggleArchive(project.id, project.is_archived)}

                          className={`p-2 rounded-lg transition-colors ${project.is_archived ? 'text-blue-600 hover:bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}

                          title={project.is_archived ? 'إلغاء الأرشفة' : 'أرشفة'}

                        >

                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>

                        </button>

                        <button

                          onClick={() => deleteProject(project.id)}

                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"

                          title="حذف"

                        >

                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>

                        </button>

                      </div>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </div>

      </main>

    </div>

  )

}
