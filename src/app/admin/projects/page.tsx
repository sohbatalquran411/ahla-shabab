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
    if (!confirm('Ù‡Ù„ Ø£Ù†Øª Ù…ØªØ£ÙƒØ¯ Ù…Ù† Ø­Ø°Ù Ù‡Ø°Ø§ Ø§Ù„Ù…Ø´Ø±ÙˆØ¹ØŸ Ø³ÙŠØªÙ… Ø­Ø°Ù Ø¬Ù…ÙŠØ¹ Ø§Ù„ÙÙˆØ±Ù…Ø² Ø§Ù„Ù…Ø±ØªØ¨Ø·Ø© Ø¨Ù‡.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)

      if (error) throw error
      
      setProjects(prev => prev.filter(p => p.id !== projectId))
      alert('ØªÙ… Ø­Ø°Ù Ø§Ù„Ù…Ø´Ø±ÙˆØ¹ Ø¨Ù†Ø¬Ø§Ø­')
    } catch (error: any) {
      alert('Ø­Ø¯Ø« Ø®Ø·Ø£ Ø£Ø«Ù†Ø§Ø¡ Ø­Ø°Ù Ø§Ù„Ù…Ø´Ø±ÙˆØ¹: ' + error.message)
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
          <Link
            href="/admin"
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Ø±Ø¬ÙˆØ¹ Ù„Ù„Ø¥Ø¯Ø§Ø±Ø©
          </Link>
          <h1 className="text-xl font-bold text-blue-700">Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ù…Ø´Ø§Ø±ÙŠØ¹</h1>
          <Link
            href="/projects/create"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Ù…Ø´Ø±ÙˆØ¹ Ø¬Ø¯ÙŠØ¯
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Ø¬Ù…ÙŠØ¹ Ø§Ù„Ù…Ø´Ø§Ø±ÙŠØ¹ ({projects.length})</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ø§Ù„Ù…Ø´Ø±ÙˆØ¹</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ø§Ù„Ù…Ù†Ø´Ø¦</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ø§Ù„ÙØ¦Ø© Ø§Ù„Ù…Ø³ØªÙ‡Ø¯ÙØ©</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ø¹Ø¯Ø¯ Ø§Ù„ÙÙˆØ±Ù…Ø²</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">ØªØ§Ø±ÙŠØ® Ø§Ù„Ø¥Ù†Ø´Ø§Ø¡</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ø§Ù„Ø¥Ø¬Ø±Ø§Ø¡Ø§Øª</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {projects.map((project) => (
                  <tr key={project.id} className="hover:bg-gray-50">
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
                            ðŸ•Œ
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">{project.name}</div>
                          <div className="text-sm text-gray-500">{project.description?.substring(0, 50)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {project.profiles?.name || 'ØºÙŠØ± Ù…Ø­Ø¯Ø¯'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        project.target_gender === 'male' ? 'bg-blue-100 text-blue-700' :
                        project.target_gender === 'female' ? 'bg-pink-100 text-pink-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {project.target_gender === 'male' ? 'Ø°ÙƒÙˆØ±' : project.target_gender === 'female' ? 'Ø¥Ù†Ø§Ø«' : 'Ø§Ù„ÙƒÙ„'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {project.forms?.[0]?.count || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(project.created_at).toLocaleDateString('ar-EG')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/projects/${project.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Ø¹Ø±Ø¶
                        </Link>
                        <Link
                          href={`/projects/${project.id}/edit?id=${project.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          ØªØ¹Ø¯ÙŠÙ„
                        </Link>
                        <button
                          onClick={() => deleteProject(project.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Ø­Ø°Ù
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