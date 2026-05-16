import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import FormFiller from './FormFiller'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function FormPage({ params }: PageProps) {
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

  const { data: form } = await supabase
    .from('forms')
    .select('*')
    .eq('id', id)
    .single()

  if (!form) {
    redirect('/dashboard')
  }

  const { data: questions } = await supabase
    .from('questions')
    .select('*')
    .eq('form_id', id)
    .order('order_index', { ascending: true })

  // Get ALL user responses for this form
  const { data: allResponses } = await supabase
    .from('form_responses')
    .select('*')
    .eq('form_id', id)
    .eq('user_id', user.id)
    .order('submitted_at', { ascending: false })

  // Get the latest response as existingResponse
  const existingResponse = allResponses && allResponses.length > 0 ? allResponses[0] : null

  // Get project info
  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', form.project_id)
    .single()

  return (
    <FormFiller
      form={form}
      questions={questions || []}
      existingResponse={existingResponse}
      allUserResponses={allResponses || []}
      project={project}
      userId={user.id}
    />
  )
}