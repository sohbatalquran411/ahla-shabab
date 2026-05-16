import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import DashboardContent from './DashboardContent'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  if (profile.status === 'pending') {
    await supabase.auth.signOut()
    redirect('/login?pending=true')
  }

  if (profile.status === 'rejected') {
    await supabase.auth.signOut()
    redirect('/login?rejected=true')
  }

  // Get projects
  let projectsQuery = supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

  if (profile.role === 'supervisor') {
    const { data: supervisorProjectIds } = await supabase
      .from('project_supervisors')
      .select('project_id')
      .eq('user_id', profile.id)

    const supervisorIds = (supervisorProjectIds || []).map(s => s.project_id)
    projectsQuery = projectsQuery.or(`created_by.eq.${profile.id},id.in.(${supervisorIds.join(',') || 'none'})`)
  }

  const { data: projects } = await projectsQuery

  // Get stats for admins
  let stats = null
  if (profile.role === 'admin') {
    const [{ count: usersCount }, { count: projectsCount }, { count: pendingCount }] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('projects').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'pending')
    ])

    stats = {
      total_users: usersCount || 0,
      total_projects: projectsCount || 0,
      pending_approvals: pendingCount || 0
    }
  }

  return (
    <DashboardContent 
      profile={profile} 
      projects={projects || []} 
      stats={stats ?? undefined}
    />
  )
}
