'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'

interface ImageUploadProps {
  onImageUploaded: (url: string) => void
  currentImage?: string;
  className?: string;
}

export default function ImageUpload({ onImageUploaded, currentImage, className = '' }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentImage || null)
  const supabase = createClient()

  const uploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('يجب اختيار صورة')
      }

      const file = event.target.files[0]
      
      // التحقق من نوع الملف
      if (!file.type.startsWith('image/')) {
        throw new Error('يجب اختيار ملف صورة')
      }

      // التحقق من حجم الملف (أقل من 5 ميجا)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('حجم الصورة يجب أن يكون أقل من 5 ميجابايت')
      }

      // إنشاء اسم فريد للملف
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
      const filePath = `projects/${fileName}`

      // رفع الصورة
      const { error: uploadError } = await supabase.storage
        .from('project-images')
        .upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      // الحصول على رابط الصورة
      const { data } = supabase.storage
        .from('project-images')
        .getPublicUrl(filePath)

      const imageUrl = data.publicUrl
      setPreview(imageUrl)
      onImageUploaded(imageUrl)

    } catch (error: any) {
      alert(error.message || 'حدث خطأ أثناء رفع الصورة')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        صورة الفورم
      </label>
      
      <div className="flex items-center gap-4">
        {/* معاينة الصورة */}
        {preview && (
          <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-gray-200">
            <img 
              src={preview} 
              alt="معاينة الصورة" 
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* زر رفع الصورة */}
        <label className="cursor-pointer">
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
            {uploading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018 0V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                جارٍ الرفع...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 21a7.5 7.5 0 0115 0" />
                </svg>
                {preview ? 'تغيير الصورة' : 'اختيار صورة'}
              </>
            )}
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={uploadImage}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      <p className="text-xs text-gray-500">
        الحد الأقصى: 5 ميجابايت • الأنواع المدعومة: JPG, PNG, GIF
      </p>
    </div>
  )
}
