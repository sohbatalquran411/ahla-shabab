'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single()

      if (!profile || profile.role !== 'admin') { router.push('/dashboard'); return }

      const [
        { count: totalUsers },
        { count: approvedUsers },
        { count: pendingUsers },
        { count: totalProjects },
        { count: totalForms },
        { count: totalResponses },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('projects').select('*', { count: 'exact', head: true }),
        supabase.from('forms').select('*', { count: 'exact', head: true }),
        supabase.from('form_responses').select('*', { count: 'exact', head: true }),
      ])

      setStats({ totalUsers, approvedUsers, pendingUsers, totalProjects, totalForms, totalResponses })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent" />
    </div>
  )

  const cards = [
    { label: 'Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…ÙŠÙ†', value: stats?.totalUsers, color: 'bg-blue-500' },
    { label: 'Ù…Ø³ØªØ®Ø¯Ù…ÙŠÙ† Ù…ÙˆØ§ÙÙ‚ Ø¹Ù„ÙŠÙ‡Ù…', value: stats?.approvedUsers, color: 'bg-green-500' },
    { label: 'Ø·Ù„Ø¨Ø§Øª Ù…Ø¹Ù„Ù‚Ø©', value: stats?.pendingUsers, color: 'bg-amber-500' },
    { label: 'Ø§Ù„Ù…Ø´Ø§Ø±ÙŠØ¹', value: stats?.totalProjects, color: 'bg-blue-500' },
    { label: 'Ø§Ù„ÙÙˆØ±Ù…Ø²', value: stats?.totalForms, color: 'bg-purple-500' },
    { label: 'Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ø±Ø¯ÙˆØ¯', value: stats?.totalResponses, color: 'bg-indigo-500' },
  ]

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Ø±Ø¬ÙˆØ¹
          </Link>
          <h1 className="text-lg font-bold text-blue-700">Ø§Ù„Ø¥Ø­ØµØ§Ø¦ÙŠØ§Øª Ø§Ù„Ù…ØªÙ‚Ø¯Ù…Ø©</h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map(card => (
            <div key={card.label} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 ${card.color} rounded-xl flex items-center justify-center`}>
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">{card.label}</p>
                  <p className="text-3xl font-bold text-gray-900">{card.value ?? 0}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
