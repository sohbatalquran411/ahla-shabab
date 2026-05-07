'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { redirect } from 'next/navigation'
import DashboardContent from '../dashboard/DashboardContent'

export default async function AdminPage() {
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

  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard')
  }

  // Redirect to projects as the default admin view
  redirect('/admin/projects')
}
