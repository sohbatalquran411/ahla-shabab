'use client'

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
        throw new Error('ÙŠØ¬Ø¨ Ø§Ø®ØªÙŠØ§Ø± ØµÙˆØ±Ø©')
      }

      const file = event.target.files[0]
      
      // Ø§Ù„ØªØ­Ù‚Ù‚ Ù…Ù† Ù†ÙˆØ¹ Ø§Ù„Ù…Ù„Ù
      if (!file.type.startsWith('image/')) {
        throw new Error('ÙŠØ¬Ø¨ Ø§Ø®ØªÙŠØ§Ø± Ù…Ù„Ù ØµÙˆØ±Ø©')
      }

      // Ø§Ù„ØªØ­Ù‚Ù‚ Ù…Ù† Ø­Ø¬Ù… Ø§Ù„Ù…Ù„Ù (Ø£Ù‚Ù„ Ù…Ù† 5 Ù…ÙŠØ¬Ø§)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Ø­Ø¬Ù… Ø§Ù„ØµÙˆØ±Ø© ÙŠØ¬Ø¨ Ø£Ù† ÙŠÙƒÙˆÙ† Ø£Ù‚Ù„ Ù…Ù† 5 Ù…ÙŠØ¬Ø§Ø¨Ø§ÙŠØª')
      }

      // Ø¥Ù†Ø´Ø§Ø¡ Ø§Ø³Ù… ÙØ±ÙŠØ¯ Ù„Ù„Ù…Ù„Ù
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
      const filePath = `projects/${fileName}`

      // Ø±ÙØ¹ Ø§Ù„ØµÙˆØ±Ø©
      const { error: uploadError } = await supabase.storage
        .from('project-images')
        .upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      // Ø§Ù„Ø­ØµÙˆÙ„ Ø¹Ù„Ù‰ Ø±Ø§Ø¨Ø· Ø§Ù„ØµÙˆØ±Ø©
      const { data } = supabase.storage
        .from('project-images')
        .getPublicUrl(filePath)

      const imageUrl = data.publicUrl
      setPreview(imageUrl)
      onImageUploaded(imageUrl)

    } catch (error: any) {
      alert(error.message || 'Ø­Ø¯Ø« Ø®Ø·Ø£ Ø£Ø«Ù†Ø§Ø¡ Ø±ÙØ¹ Ø§Ù„ØµÙˆØ±Ø©')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        ØµÙˆØ±Ø© Ø§Ù„Ù…Ø´Ø±ÙˆØ¹
      </label>
      
      <div className="flex items-center gap-4">
        {/* Ù…Ø¹Ø§ÙŠÙ†Ø© Ø§Ù„ØµÙˆØ±Ø© */}
        {preview && (
          <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-gray-200">
            <img 
              src={preview} 
              alt="Ù…Ø¹Ø§ÙŠÙ†Ø© Ø§Ù„ØµÙˆØ±Ø©" 
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Ø²Ø± Ø±ÙØ¹ Ø§Ù„ØµÙˆØ±Ø© */}
        <label className="cursor-pointer">
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
            {uploading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Ø¬Ø§Ø±ÙŠ Ø§Ù„Ø±ÙØ¹...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {preview ? 'ØªØºÙŠÙŠØ± Ø§Ù„ØµÙˆØ±Ø©' : 'Ø§Ø®ØªÙŠØ§Ø± ØµÙˆØ±Ø©'}
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
        Ø§Ù„Ø­Ø¯ Ø§Ù„Ø£Ù‚ØµÙ‰: 5 Ù…ÙŠØ¬Ø§Ø¨Ø§ÙŠØª â€¢ Ø§Ù„Ø£Ù†ÙˆØ§Ø¹ Ø§Ù„Ù…Ø¯Ø¹ÙˆÙ…Ø©: JPG, PNG, GIF
      </p>
    </div>
  )
}