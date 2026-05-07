'use client'



import { useState, useEffect } from 'react'

import { createClient } from '@/utils/supabase/client'



interface AppSettings {

  app_logo: string

  app_name: string

  app_description: string

}



export function useAppSettings() {

  const [settings, setSettings] = useState<AppSettings>({

    app_logo: '',

    app_name: 'أحلى شباب',

    app_description: 'منصة متكاملة لإدارة المتطوعين والمشاريع'

  })

  const [loading, setLoading] = useState(true)

  const supabase = createClient()



  useEffect(() => {

    fetchSettings()

  }, [])



  const fetchSettings = async () => {

    try {

      const { data, error } = await supabase

        .from('app_settings')

        .select('key, value')



      if (error) {

        console.error('Error fetching settings:', error)

        return

      }



      const settingsObj: any = {

        app_logo: '',

        app_name: 'أحلى شباب',

        app_description: 'منصة متكاملة لإدارة المتطوعين والمشاريع'

      }



      data?.forEach(setting => {

        if (setting.value) {

          settingsObj[setting.key] = setting.value

        }

      })



      setSettings(settingsObj)

    } catch (error) {

      console.error('Error fetching settings:', error)

    } finally {

      setLoading(false)

    }

  }



  return { settings, loading, refetch: fetchSettings }

}

