?'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'

interface ImageUploadProps {
  onImageUploaded: (url: string) => void
  currentImage?: string
  className?: string
}

export default function ImageUpload({ onImageUploaded, currentImage, className = '' }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentImage || null)
  const supabase = createClient()

  const uploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('�Sجب اخت�Sار ص�^رة')
      }

      const file = event.target.files[0]
      
      // ا�"تح�,�, �.�? �?�^ع ا�"�.�"ف
      if (!file.type.startsWith('image/')) {
        throw new Error('�Sجب اخت�Sار �.�"ف ص�^رة')
      }

      // ا�"تح�,�, �.�? حج�. ا�"�.�"ف (أ�,�" �.�? 5 �.�Sجا)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('حج�. ا�"ص�^رة �Sجب أ�? �S�f�^�? أ�,�" �.�? 5 �.�Sجابا�Sت')
      }

      // إ�?شاء اس�. فر�Sد �"�"�.�"ف
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
      const filePath = `projects/${fileName}`

      // رفع ا�"ص�^رة
      const { error: uploadError } = await supabase.storage
        .from('project-images')
        .upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      // ا�"حص�^�" ع�"�? رابط ا�"ص�^رة
      const { data } = supabase.storage
        .from('project-images')
        .getPublicUrl(filePath)

      const imageUrl = data.publicUrl
      setPreview(imageUrl)
      onImageUploaded(imageUrl)

    } catch (error: any) {
      alert(error.message || 'حدث خطأ أث�?اء رفع ا�"ص�^رة')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        ص�^رة ا�"�.شر�^ع
      </label>
      
      <div className="flex items-center gap-4">
        {/* �.عا�S�?ة ا�"ص�^رة */}
        {preview && (
          <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-gray-200">
            <img 
              src={preview} 
              alt="�.عا�S�?ة ا�"ص�^رة" 
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* زر رفع ا�"ص�^رة */}
        <label className="cursor-pointer">
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
            {uploading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                جار�S ا�"رفع...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {preview ? 'تغ�S�Sر ا�"ص�^رة' : 'اخت�Sار ص�^رة'}
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
        ا�"حد ا�"أ�,ص�?: 5 �.�Sجابا�Sت �?� ا�"أ�?�^اع ا�"�.دع�^�.ة: JPG, PNG, GIF
      </p>
    </div>
  )
}
