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

  // Check if form is for this user's gender
  if (form.target_gender !== 'both' && form.target_gender !== profile.gender) {
    redirect('/dashboard')
  }

  const { data: questions } = await supabase
    .from('questions')
    .select('*')
    .eq('form_id', id)
    .order('order_index', { ascending: true })

  // Check if user already responded
  const { data: existingResponse } = await supabase
    .from('form_responses')
    .select('*')
    .eq('form_id', id)
    .eq('user_id', user.id)
    .single()

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
      project={project}
      userId={user.id}
    />
  )
}