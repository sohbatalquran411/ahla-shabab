'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { redirect } from 'next/navigation'
import DashboardContent from './DashboardContent'

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

  // Get stats
  const [{ count: usersCount }, { count: projectsCount }, { count: pendingCount }] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('projects').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'pending')
  ])

  const stats = {
    total_users: usersCount || 0,
    total_projects: projectsCount || 0,
    pending_approvals: pendingCount || 0
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      <DashboardContent 
        user={profile} 
        projects={[]} 
        stats={stats ?? undefined}
      />
    </div>
  )
}
