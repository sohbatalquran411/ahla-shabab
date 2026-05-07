?import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import PublicProjectsView from '@/components/PublicProjectsView'

export default async function HomePage() {
  const supabase = await createClient()

  // Check if user is already logged in
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    // If logged in, redirect to dashboard
    redirect('/dashboard')
  }

  // Get public projects
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

  return <PublicProjectsView projects={projects || []} />
}
