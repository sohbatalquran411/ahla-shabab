import { MetadataRoute } from 'next'
import { createClient } from '@/utils/supabase/server'

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  let appLogo = '/icon.svg'
  let appName = 'أوراد أحلى شباب'

  try {
    const supabase = await createClient()
    const { data } = await supabase.from('app_settings').select('key, value')
    if (data) {
      const logoSetting = data.find(s => s.key === 'app_logo')
      const nameSetting = data.find(s => s.key === 'app_name')
      if (logoSetting?.value) appLogo = logoSetting.value
      if (nameSetting?.value) appName = nameSetting.value
    }
  } catch (e) {
    console.error('Error fetching manifest data:', e)
  }

  return {
    name: appName,
    short_name: 'أوراد',
    description: 'منصة أوراد أحلى شباب للتقييم والمتابعة',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0d9488',
    orientation: 'portrait-primary',
    dir: 'rtl',
    lang: 'ar',
    icons: [
      {
        src: appLogo,
        sizes: '192x192',
        purpose: 'maskable',
      },
    ],
  }
}
