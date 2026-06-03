'use client'



import { useState, useEffect } from 'react'

import { createClient } from '@/utils/supabase/client'

import { useRouter } from 'next/navigation'

import Link from 'next/link'

import ImageUpload from '@/components/ImageUpload'



export default function AdminSettingsPage() {

  const [settings, setSettings] = useState({

    app_logo: '',

    app_name: 'أحلى شباب',

    app_description: 'منصة إدارة المشاريع الدعوية'

  })

  const [loading, setLoading] = useState(true)

  const [saving, setSaving] = useState(false)

  const [error, setError] = useState('')

  const [success, setSuccess] = useState('')

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

      await fetchSettings()

    } catch (error) {

      console.error('Error checking auth:', error)

      router.push('/login')

    }

  }



  const fetchSettings = async () => {

    try {

      const { data, error } = await supabase

        .from('app_settings')

        .select('key, value')



      if (error) throw error



      const settingsObj: any = {}

      data?.forEach((setting: any) => {

        settingsObj[setting.key] = setting.value || ''

      })



      setSettings(prev => ({ ...prev, ...settingsObj }))

    } catch (error) {

      console.error('Error fetching settings:', error)

    } finally {

      setLoading(false)

    }

  }



  const updateSetting = async (key: string, value: string) => {

    try {

      const { error } = await supabase

        .from('app_settings')

        .update({ 

          value, 

          updated_at: new Date().toISOString(),

          updated_by: profile.id 

        })

        .eq('key', key)



      if (error) throw error

    } catch (error) {

      console.error(`Error updating ${key}:`, error)

      throw error

    }

  }



  const handleSave = async () => {

    setError('')

    setSuccess('')

    setSaving(true)



    try {

      // Update all settings

      await Promise.all([

        updateSetting('app_logo', settings.app_logo),

        updateSetting('app_name', settings.app_name),

        updateSetting('app_description', settings.app_description)

      ])



      setSuccess('تم حفظ الإعدادات بنجاح!')

      

      // Clear success message after 3 seconds

      setTimeout(() => setSuccess(''), 3000)

    } catch (error: any) {

      setError(error.message || 'حدث خطأ أثناء حفظ الإعدادات')

    } finally {

      setSaving(false)

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

        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">

          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
          >

            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">

              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />

            </svg>

            رجوع للداشبورد

          </button>

          <h1 className="text-lg font-bold text-blue-700">إعدادات التطبيق</h1>

          <div className="w-10" />

        </div>

      </header>



      <main className="max-w-4xl mx-auto px-4 py-8">

        {/* Admin Notice */}

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">

          <div className="flex items-center gap-3">

            <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">

              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />

            </svg>

            <div>

              <h3 className="font-medium text-amber-800">صلاحيات المدير</h3>

              <p className="text-sm text-amber-700">نذن الصفحة متاحة للمديرين فقط. التغييرات ستؤثر على التطبيق بالكامل.</p>

            </div>

          </div>

        </div>



        {/* Messages */}

        {error && (

          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">

            {error}

          </div>

        )}



        {success && (

          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-6">

            {success}

          </div>

        )}



        {/* Settings Form */}

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">

          <h2 className="text-xl font-bold text-gray-900 mb-6">الإعدادات العامة</h2>

          

          <div className="space-y-6">

            {/* App Logo */}

            <div>

              <label className="block text-sm font-medium text-gray-700 mb-3">شعار التطبيق</label>

              <ImageUpload

                onImageUploaded={(url) => setSettings(prev => ({ ...prev, app_logo: url }))}

                currentImage={settings.app_logo}

              />

              <p className="text-xs text-gray-500 mt-2">

                سيظنر نذا الشعار في جميع صفحات التطبيق. الحجم المُوصن بن: 200x200 بكسل

              </p>

            </div>



            {/* App Name */}

            <div>

              <label className="block text-sm font-medium text-gray-700 mb-2">اسم التطبيق</label>

              <input

                type="text"

                value={settings.app_name}

                onChange={(e) => setSettings(prev => ({ ...prev, app_name: e.target.value }))}

                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"

                placeholder="اسم التطبيق"

              />

            </div>



            {/* App Description */}

            <div>

              <label className="block text-sm font-medium text-gray-700 mb-2">وصف التطبيق</label>

              <textarea

                value={settings.app_description}

                onChange={(e) => setSettings(prev => ({ ...prev, app_description: e.target.value }))}

                rows={3}

                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"

                placeholder="وصف مختصر للتطبيق"

              />

            </div>



            {/* Preview */}

            <div className="bg-gray-50 rounded-xl p-6">

              <h3 className="text-sm font-medium text-gray-700 mb-4">معاينة</h3>

              <div className="bg-gradient-to-l from-blue-500 to-blue-600 rounded-xl p-6 text-center">

                {settings.app_logo ? (

                  <div className="w-24 h-24 mx-auto mb-4 rounded-2xl overflow-hidden bg-white shadow-lg p-2">

                    <img 

                      src={settings.app_logo} 

                      alt="شعار التطبيق"

                      className="w-full h-full object-contain"

                    />

                  </div>

                ) : (

                  <div className="w-20 h-20 mx-auto mb-4 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">

                    <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">

                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />

                    </svg>

                  </div>

                )}

                <h1 className="text-white font-bold text-xl mb-1">{settings.app_name}</h1>

                <p className="text-blue-100 text-sm">{settings.app_description}</p>

              </div>

            </div>



            {/* Save Button */}

            <div className="flex gap-4 pt-4 border-t">

              <button

                onClick={handleSave}

                disabled={saving}

                className="flex-1 py-4 bg-gradient-to-l from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"

              >

                {saving ? (

                  <>

                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">

                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />

                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />

                    </svg>

                    جاري الحفظ...

                  </>

                ) : (

                  <>

                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">

                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />

                    </svg>

                    حفظ الإعدادات

                  </>

                )}

              </button>

            </div>

          </div>

        </div>





      </main>

    </div>

  )

}

