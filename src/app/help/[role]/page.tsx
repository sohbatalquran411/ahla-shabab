'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAppSettings } from '@/hooks/useAppSettings'
import Header from '@/components/Header'

// ====== ICONS ======
const icons = {
  dashboard: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  profile: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  projects: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
  forms: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  curriculum: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
  notifications: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
  users: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  analytics: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
  settings: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  results: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  help: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  star: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>,
  check: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  question: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  text: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M3 8h18M3 12h12M3 16h6" /></svg>,
  textarea: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h12" /></svg>,
  radio: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth={2} /><circle cx="12" cy="12" r="4" strokeWidth={2} /></svg>,
  checkbox: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 11l3 3L22 4" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></svg>,
  dropdown: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" /></svg>,
  scale: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>,
  ranking: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" /></svg>,
  matrix: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
  date: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  time: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  file: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>,
  lessons: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>,
  lock: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
  edit: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
  questions: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  copy: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>,
  archive: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>,
}

interface HelpContent {
  title: string
  subtitle: string
  gradient: string
  sections: HelpSection[]
}

interface HelpSection {
  id: string
  icon: React.ReactNode
  title: string
  description: string
  items: HelpItem[]
}

interface HelpItem {
  icon: React.ReactNode
  label: string
  detail: string
  subItems?: { label: string; detail: string; icon?: React.ReactNode }[]
}

const helpData: Record<string, HelpContent> = {
  volunteer: {
    title: 'دليل المتطوع',
    subtitle: 'كل ما تحتاج معرفته كمتطوع في المنصة — استعرض المشاريع، تعبئة النماذج، ومتابعة الدروس',
    gradient: 'from-emerald-500 via-emerald-600 to-teal-700',
    sections: [
      {
        id: 'dashboard',
        icon: icons.dashboard,
        title: 'لوحة التحكم الرئيسية',
        description: 'الصفحة الرئيسية التي تراها بعد تسجيل الدخول مباشرةً، تعرض جميع المشاريع المتاحة لك',
        items: [
          {
            icon: icons.projects,
            label: 'عرض المشاريع',
            detail: 'تظهر المشاريع على شكل بطاقات (Cards) مرتبة. كل بطاقة تعرض اسم المشروع، صورتة (أو أيقونة ملونة)، ويمكنك الضغط عليها للدخول إلى المشروع.',
            subItems: [
              { label: 'البطاقة', detail: 'تحتوي البطاقة على صورة المشروع في الأعلى (إن وجدت) أو أيقونة ملونة مع خلفية شفافة.' },
              { label: 'الضغط', detail: 'بالضغط على أي بطاقة يتم نقلك إلى صفحة المشروع لمشاهدة تفاصيله.' },
            ]
          },
          {
            icon: icons.notifications,
            label: 'الإشعارات',
            detail: 'في أعلى الصفحة يظهر شريط بعدد الإشعارات غير المقروءة. تضغط عليه لفتح صفحة الإشعارات ومعرفة كل جديد.',
            subItems: [
              { label: 'أنواع الإشعارات', detail: 'إشعارات التكليف بمشروع جديد، إشعارات عامة.' },
              { label: 'العلامات', detail: 'يظهر عداد بعدد الإشعارات غير المقروءة بجانب أيقونة الجرس.' },
            ]
          },
        ]
      },
      {
        id: 'profile',
        icon: icons.profile,
        title: 'الملف الشخصي',
        description: 'إدارة بياناتك الشخصية، تغيير كلمة المرور، والتحكم في إعدادات الإشعارات',
        items: [
          {
            icon: icons.text,
            label: 'تعديل البيانات الشخصية',
            detail: 'يمكنك تعديل اسمك، رقم هاتفك، ونوعك (ذكر/أنثى). التعديلات تُحفظ فوراً.',
          },
          {
            icon: icons.lock,
            label: 'تغيير كلمة المرور',
            detail: 'يمكنك تغيير كلمة المرور الخاصة بك بشرط إدخال كلمة المرور الحالية أولاً ثم الجديدة مرتين.',
          },
          {
            icon: icons.notifications,
            label: 'إعدادات الإشعارات',
            detail: 'يمكنك تفعيل أو تعطيل استلام إشعارات التكليف بالمشاريع الجديدة.',
          },
          {
            icon: icons.help,
            label: 'حذف الحساب',
            detail: 'يمكنك طلب حذف حسابك بالكامل. هذا الإجراء نهائي ولا يمكن التراجع عنه.',
          },
        ]
      },
      {
        id: 'projects',
        icon: icons.projects,
        title: 'المشاريع',
        description: 'تصفح المشاريع المتاحة، عرض التفاصيل، الدخول إلى النماذج والمناهج الدراسية',
        items: [
          {
            icon: icons.star,
            label: 'صفحة المشروع',
            detail: 'عند الدخول إلى مشروع، ترى اسم المشروع، صورته، وصفه، وعدد من التبويبات للتنقل بين الأقسام.',
            subItems: [
              { label: 'النماذج', detail: 'قائمة النماذج المتاحة في هذا المشروع. كل نموذج له بطاقة خاصة يمكن الضغط عليها للتسجيل.' },
              { label: 'المنهج الدراسي', detail: 'إذا كان المشروع يحتوي على منهج دراسي، يظهر تبويب خاص لعرض الدروس.' },
              { label: 'الملخص', detail: 'إحصائيات سريعة عن النماذج المكتملة وتقدمك في المنهج.' },
            ]
          },
        ]
      },
      {
        id: 'forms',
        icon: icons.forms,
        title: 'النماذج والتسجيل',
        description: 'شرح تفصيلي لكل أنواع الأسئلة في النماذج وكيفية التعامل معها',
        items: [
          {
            icon: icons.star,
            label: 'بطاقة النموذج',
            detail: 'كل نموذج يظهر كبطاقة بصورة (إن وجدت) أو أيقونة. الضغط على البطاقة يفتح النموذج مباشرة للتسجيل.',
            subItems: [
              { label: 'تسجيل متعدد', detail: 'إذا كان النموذج يسمح بالتسجيل المتعدد، الضغط على البطاقة يفتح النموذج مباشرة.' },
              { label: 'تسجيل مرة واحدة', detail: 'إذا سبق لك التسجيل، يظهر لك تنبيه "يوجد تسجيل سابق" ولا يمكنك التسجيل مرة أخرى.' },
              { label: 'عرض النتائج', detail: 'بعد التسجيل، يمكنك عرض نتائجك ونقاطك في النموذج.' },
            ]
          },
          {
            icon: icons.help,
            label: 'معلومات عامة',
            detail: 'بعض النماذج لها وقت محدد للتسليم (مؤقت)، أو تاريخ انتهاء صلاحية. قد تكون بعض الأسئلة إجبارية (مطلوب *) أو اختيارية.',
            subItems: [
              { label: 'مطلوب (*)', detail: 'الأسئلة التي عليها علامة * هي أسئلة إجبارية يجب الإجابة عليها.' },
              { label: 'الوقت المحدد', detail: 'إذا كان النموذج محدد بوقت، يظهر عداد تنازلي لانتهاء الوقت.' },
              { label: 'تاريخ الانتهاء', detail: 'النموذج قد ينتهي في تاريخ محدد، وبعده لا يمكنك التقديم.' },
            ]
          },
          {
            icon: icons.text,
            label: 'نص (Text)',
            detail: 'إجابة قصيرة — يستخدم للاسم، البريد الإلكتروني، أو أي إجابة لا تتجاوز سطراً واحداً. مثال: "ما اسمك؟" أو "ما هو رقم هاتفك؟"',
          },
          {
            icon: icons.textarea,
            label: 'نص طويل (Textarea)',
            detail: 'إجابة مفصلة — يستخدم للأسئلة التي تحتاج شرحاً أو وصفاً مطولاً. مثال: "صف تجربتك في التطوع" أو "ما رأيك في هذه المبادرة؟"',
          },
          {
            icon: icons.radio,
            label: 'اختيار واحد (Single Choice)',
            detail: 'تختار إجابة واحدة فقط من بين عدة خيارات. مثال: "الجنس: ذكر / أنثى" أو "هل سبق لك التطوع؟ نعم / لا".',
            subItems: [
              { label: 'العداد', detail: 'قد تحتوي بعض الخيارات على "عداد" (Counter)، يعني أن اختيارك لهذا الخيار يضيف قيمة معينة (مثلاً عدد ساعات التطوع).' },
              { label: 'النقاط', detail: 'لكل خيار نقاط معينة تضاف إلى درجتك الكلية إذا اخترته.' },
            ]
          },
          {
            icon: icons.checkbox,
            label: 'اختيار متعدد (Multiple Choice)',
            detail: 'تختار عدة إجابات من بين الخيارات المتاحة. مثال: "ما هي هواياتك؟" يمكنك اختيار أكثر من هواية.',
            subItems: [
              { label: 'النقاط', detail: 'لكل خيار نقاط منفصلة. تحصل على نقاط كل خيار تختاره.' },
            ]
          },
          {
            icon: icons.dropdown,
            label: 'قائمة منسدلة (Dropdown)',
            detail: 'قائمة منسدلة تختار منها إجابة واحدة أو متعددة — توفر مساحة وتنظيم أفضل للخيارات الكثيرة.',
            subItems: [
              { label: 'اختيار واحد', detail: 'تختار خياراً واحداً فقط من القائمة.' },
              { label: 'اختيار متعدد', detail: 'يمكنك اختيار أكثر من خيار من القائمة.' },
            ]
          },
          {
            icon: icons.scale,
            label: 'تقييم (Scale)',
            detail: 'مقياس تقييم من 1 إلى 10. يستخدم لتقييم شيء معين. مثال: "قيم أداء المحاضر من 1 إلى 10" أو "ما مدى رضاك عن الخدمة؟"',
          },
          {
            icon: icons.ranking,
            label: 'ترتيب (Ranking)',
            detail: 'ترتب العناصر حسب الأفضلية أو الأولوية. مثال: "رتب المواضيع التالية حسب اهتمامك" — تسحب العنصر وتضعه في المكان المناسب.',
          },
          {
            icon: icons.matrix,
            label: 'مصفوفة (Matrix)',
            detail: 'عدة أسئلة تشترك في نفس الخيارات. مثال: "قيم كل معلم من 1-5" — كل صف يمثل معلماً وكل عمود يمثل تقييماً.',
            subItems: [
              { label: 'الصفوف', detail: 'الأسئلة التي ستقيمها (كل سؤال في صف مستقل).' },
              { label: 'الأعمدة', detail: 'خيارات التقييم المشتركة لجميع الصفوف.' },
              { label: 'مطلوب لكل صف', detail: 'يمكن جعل بعض الصفوف إجبارية وبعضها اختياري.' },
            ]
          },
          {
            icon: icons.date,
            label: 'تاريخ (Date)',
            detail: 'اختيار تاريخ من تقويم. مثال: "تاريخ الميلاد" أو "تاريخ البدء في التطوع".',
          },
          {
            icon: icons.time,
            label: 'وقت (Time)',
            detail: 'اختيار وقت محدد. مثال: "وقت الحضور" أو "الموعد المناسب للاتصال".',
          },
          {
            icon: icons.file,
            label: 'رفع ملف (File Upload)',
            detail: 'إرفاق ملف أو صورة. مثال: "ارفع سيرتك الذاتية" أو "ارفع صورة الهوية".',
          },
        ]
      },
      {
        id: 'curriculum',
        icon: icons.curriculum,
        title: 'المنهج الدراسي',
        description: 'متابعة الدروس والمحتوى التعليمي داخل المشاريع',
        items: [
          {
            icon: icons.lessons,
            label: 'الدروس',
            detail: 'المشاريع التي تحتوي على منهج دراسي تمكنك من متابعة الدروس حسب الترتيب.',
            subItems: [
              { label: 'فيديو', detail: 'دروس فيديو عبر يوتيوب — تضغط على الرابط لمشاهدة الدرس.' },
              { label: 'صوت', detail: 'دروس صوتية — تستمع للصوت مباشرة من المنصة.' },
              { label: 'نص', detail: 'دروس نصية مع محرر نصوص متكامل للقراءة.' },
              { label: 'التسلسل', detail: 'إذا كان المنهج تسلسلياً، يجب إكمال كل درس قبل الانتقال للذي يليه.' },
            ]
          },
          {
            icon: icons.star,
            label: 'التقدم',
            detail: 'يتم تتبع تقدمك في المنهج تلقائياً. عند إكمال درس، يُوضع علامة "مكتمل" وتُحدّث نسبة التقدم.',
          },
          {
            icon: icons.text,
            label: 'التعليقات',
            detail: 'يمكنك إضافة تعليقات على الدروس (إذا كان التعليق مسموحاً) للتفاعل مع المدرب أو المتطوعين الآخرين.',
          },
        ]
      },
    ]
  },

  supervisor: {
    title: 'دليل المشرف',
    subtitle: 'كل مزايا المتطوع + صلاحيات إضافية: إدارة المشاريع، متابعة النماذج والردود، والإشراف على المناهج',
    gradient: 'from-blue-500 via-blue-600 to-indigo-700',
    sections: [
      {
        id: 'volunteer-features',
        icon: icons.star,
        title: 'مزايا المتطوع',
        description: 'جميع المزايا المتاحة للمتطوع متاحة لك أيضاً',
        items: [
          {
            icon: icons.check,
            label: 'جميع خصائص المتطوع',
            detail: 'يمكنك تصفح المشاريع، تعبئة النماذج، متابعة الدروس، وإدارة ملفك الشخصي — تماماً كالمتطوع.',
          },
        ]
      },
      {
        id: 'projects',
        icon: icons.projects,
        title: 'إدارة المشاريع',
        description: 'إنشاء وإدارة المشاريع التي تشرف عليها',
        items: [
          {
            icon: icons.star,
            label: 'إنشاء مشروع جديد',
            detail: 'يمكنك إنشاء مشروع جديد من صفحة "مشروع جديد". تختار الاسم، الوصف، الصورة، الأيقونة، اللون، الفئة المستهدفة (ذكور/إناث/الكل)، وتفعيل النماذج والمنهج الدراسي حسب الحاجة.',
            subItems: [
              { label: 'اسم المشروع', detail: 'عنوان المشروع الذي يظهر للجميع.' },
              { label: 'الوصف', detail: 'شرح مختصر لماهية المشروع وأهدافه.' },
              { label: 'الصورة', detail: 'صورة تمثل المشروع (تظهر أعلى البطاقة).' },
              { label: 'الأيقونة واللون', detail: 'تظهر كبديل للصورة إن لم توجد.' },
              { label: 'الفئة المستهدفة', detail: 'ذكور فقط، إناث فقط، أو الكل.' },
              { label: 'الوحدات', detail: 'يمكنك تفعيل "النماذج" و/أو "المنهج الدراسي" حسب احتياج المشروع.' },
            ]
          },
          {
            icon: icons.edit,
            label: 'تعديل المشروع',
            detail: 'يمكنك تعديل أي مشروع تشرف عليه — تغيير الاسم، الوصف، الصورة، الأيقونة، اللون، وغيرها من الإعدادات.',
          },
        ]
      },
      {
        id: 'forms',
        icon: icons.forms,
        title: 'النماذج والردود',
        description: 'إنشاء النماذج، متابعة الردود، وعرض النتائج والتحليلات',
        items: [
          {
            icon: icons.help,
            label: 'إنشاء النماذج',
            detail: 'يمكنك إنشاء نموذج جديد داخل أي مشروع تشرف عليه. تختار اسم النموذج، الوصف، الصورة، وإعدادات متقدمة مثل:',
            subItems: [
              { label: 'السماح بالتسجيل المتعدد', detail: 'إذا فعّلته، يمكن للمتطوعين التسجيل في النموذج أكثر من مرة.' },
              { label: 'الحد الزمني', detail: 'تحديد وقت محدد بالدقائق لإكمال النموذج.' },
              { label: 'تاريخ الانتهاء', detail: 'النموذج ينتهي في تاريخ محدد وبعده لا يقبل ردود.' },
              { label: 'السماح بحذف الردود', detail: 'إذا فعّلته، يمكن للمتطوعين حذف ردودهم.' },
              { label: 'ترتيب عشوائي للأسئلة', detail: 'عشوائية ترتيب الأسئلة لكل متطوع.' },
            ]
          },
          {
            icon: icons.results,
            label: 'عرض الردود والنتائج',
            detail: 'يمكنك عرض جميع ردود النموذج في صفحة "الردود". تتضمن:',
            subItems: [
              { label: 'جدول الردود', detail: 'جدول بجميع الردود مع أسماء المتطوعين وبريدهم الإلكتروني.' },
              { label: 'البحث والترتيب', detail: 'مربع بحث لتصفية الردود، وأسهم ترتيب تصاعدي/تنازلي على كل عمود.' },
              { label: 'التحليل بالرسوم البيانية', detail: 'زر "عرض التحليل" يعرض رسوماً بيانية (أشرطة CSS) لكل سؤال.' },

  admin: {
    title: 'دليل المدير',
    subtitle: 'التحكم الكامل في المنصة — إدارة المستخدمين، المشاريع، النماذج، الإعدادات، والإحصائيات',
    gradient: 'from-purple-500 via-purple-600 to-pink-700',
    sections: [
      {
        id: 'supervisor-features',
        icon: icons.star,
        title: 'مزايا المشرف',
        description: 'جميع مزايا المشرف (والمتطوع) متاحة لك مع صلاحيات إضافية',
        items: [
          {
            icon: icons.check,
            label: 'جميع خصائص المشرف والمتطوع',
            detail: 'يمكنك إنشاء وتعديل المشاريع، إنشاء النماذج، إدارة المناهج، متابعة الردود — بالإضافة إلى صلاحيات الإدارة الكاملة أدناه.',
          },
        ]
      },
      {
        id: 'users',
        icon: icons.users,
        title: 'إدارة المستخدمين',
        description: 'التحكم الكامل بجميع حسابات المستخدمين في المنصة',
        items: [
          {
            icon: icons.star,
            label: 'قائمة المستخدمين',
            detail: 'صفحة تعرض جميع المستخدمين المسجلين مع إحصائيات سريعة (إجمالي المستخدمين، طلبات معلقة، عدد المشرفين، عدد الإدارة).',
            subItems: [
              { label: 'بحث وتصفية', detail: 'بحث بالاسم أو البريد أو الهاتف، تصفية بالحالة (معلق/موافق عليه/مرفوض)، الدور (مدير/مشرف/متطوع)، والنوع (ذكر/أنثى).' },
            ]
          },
          {
            icon: icons.check,
            label: 'الموافقة على الطلبات',
            detail: 'طلبات التسجيل الجديدة تظهر بحالة "معلق". يمكنك الموافقة على الطلب أو رفضه مباشرةً من الجدول.',
          },
          {
            icon: icons.edit,
            label: 'تعديل بيانات المستخدم',
            detail: 'يمكنك تعديل أي مستخدم: تغيير الاسم، رقم الهاتف، والنوع (ذكر/أنثى).',
          },
          {
            icon: icons.projects,
            label: 'إدارة مشاريع المستخدم',
            detail: 'يمكنك تحديد المشاريع التي يمكن لكل مستخدم الوصول إليها. واجهة اختيار متعدد تعرض جميع المشاريع المتاحة مع إمكانية التحديد والإلغاء.',
            subItems: [
              { label: 'إشعارات تلقائية', detail: 'عند إضافة مستخدم لمشروع جديد، يصله إشعار تلقائي (إذا كانت الإشعارات مفعلة عنده).' },
            ]
          },
          {
            icon: icons.lock,
            label: 'إعادة تعيين كلمة المرور',
            detail: 'إعادة تعيين كلمة مرور أي مستخدم إلى 123456 — مفيد في حال نسيان كلمة المرور.',
          },
          {
            icon: icons.results,
            label: 'تغيير الدور',
            detail: 'يمكنك تغيير دور أي مستخدم بين: متطوع ← مشرف ← مدير.',
          },
          {
            icon: icons.help,
            label: 'تغيير الحالة',
            detail: 'تفعيل أو تعطيل أي مستخدم (موافق عليه/مرفوض) حتى بعد الموافقة الأولية.',
          },
          {
            icon: icons.text,
            label: 'حذف المستخدم',
            detail: 'حذف المستخدم بالكامل من النظام — من قاعدة البيانات ومن المصادقة. لا يمكن حذف حسابك الحالي.',
          },
        ]
      },
      {
        id: 'projects-admin',
        icon: icons.projects,
        title: 'إدارة المشاريع (المتقدمة)',
        description: 'التحكم الكامل بجميع المشاريع — أكثر من مجرد إنشاء وتعديل',
        items: [
          {
            icon: icons.star,
            label: 'قائمة المشاريع',
            detail: 'صفحة تعرض جميع المشاريع مع اسم المنشئ، الفئة المستهدفة، عدد النماذج المرتبطة، وتاريخ الإنشاء.',
          },
          {
            icon: icons.edit,
            label: 'تعديل',
            detail: 'تعديل أي مشروع بما في ذلك نقل ملكيته لمستخدم آخر (تحتاج البريد الإلكتروني للمستخدم الجديد).',
          },
          {
            icon: icons.copy,
            label: 'نسخ المشروع',
            detail: 'نسخ المشروع بالكامل بما في ذلك جميع النماذج، الأسئلة، المناهج، والدروس — مع إضافة "(نسخة)" للاسم.',
          },
          {
            icon: icons.archive,
            label: 'أرشفة / إلغاء الأرشفة',
            detail: 'إخفاء المشروع من الظهور للمتطوعين دون حذفه. يمكن إلغاء الأرشفة في أي وقت.',
          },
          {
            icon: icons.text,
            label: 'حذف المشروع',
            detail: 'حذف المشروع بالكامل مع جميع النماذج والمناهج والردود المرتبطة به.',
          },
        ]
      },
      {
        id: 'forms-admin',
        icon: icons.forms,
        title: 'إدارة النماذج',
        description: 'الإشراف الكامل على جميع النماذج في المنصة',
        items: [
          {
            icon: icons.forms,
            label: 'قائمة الفورمز',
            detail: 'صفحة تعرض جميع النماذج في المنصة (وليس فقط نموذج واحد). عرض، تعديل، حذف لأي نموذج.',
          },
          {
            icon: icons.results,
            label: 'الردود والتحليلات',
            detail: 'نفس مزايا المشرف في عرض الردود، لكن لجميع النماذج وليس فقط نماذج مشروعك.',
            subItems: [
              { label: 'عرض التسجيلات', detail: 'زر يظهر في صفحة تعديل النموذج فقط للمسؤولين (أدمن/مشرف)، يفتح صفحة الردود مباشرة.' },

            ]
          },
        ]
      },
      {
        id: 'curricula-admin',
        icon: icons.curriculum,
        title: 'إدارة المناهج والدروس',
        description: 'الإشراف على جميع المناهج الدراسية والدروس',
        items: [
          {
            icon: icons.star,
            label: 'جميع المناهج',
            detail: 'صفحة تعرض جميع المناهج في المنصة مع إمكانية التعديل والحذف لأي منهج.',
          },
          {
            icon: icons.lessons,
            label: 'جميع الدروس',
            detail: 'صفحة تعرض جميع الدروس مع إمكانية التعديل والحذف والصورة المصغرة ليوتيوب.',
          },
        ]
      },
      {
        id: 'analytics',
        icon: icons.analytics,
        title: 'الإحصائيات',
        description: 'مشاهدة إحصائيات شاملة عن أداء المنصة',
        items: [
          {
            icon: icons.star,
            label: 'بطاقات الإحصائيات',
            detail: 'الصفحة تعرض عدد: إجمالي المستخدمين، المستخدمين الموافق عليهم، الطلبات المعلقة، المشاريع، الفورمز، وإجمالي الردود.',
          },
          {
            icon: icons.results,
            label: 'تحليل النماذج',
            detail: 'في صفحة الردود، يمكنك النقر على "عرض التحليل" لرؤية رسوم بيانية لكل سؤال في النموذج مع توزيع الإجابات.',
            subItems: [
              { label: 'اختيار واحد', detail: 'شريط أفقي لكل خيار يوضح عدد و百分比 الإجابات.' },
              { label: 'اختيار متعدد', detail: 'شريط أفقي لكل خيار يوضح عدد و百分比 الإجابات.' },
              { label: 'تقييم', detail: 'شريط أفقي لكل درجة من 1-10.' },
              { label: 'مصفوفة', detail: 'جدول يوضح توزيع الإجابات لكل صف.' },
              { label: 'نص', detail: 'جميع الإجابات النصية معروضة في قائمة.' },
            ]
          },
        ]
      },
      {
        id: 'settings',
        icon: icons.settings,
        title: 'إعدادات التطبيق',
        description: 'تخصيص هوية المنصة والإعدادات العامة',
        items: [
          {
            icon: icons.star,
            label: 'الإعدادات العامة',
            detail: 'تخصيص المظهر العام للمنصة:',
            subItems: [
              { label: 'شعار التطبيق', detail: 'رفع صورة الشعار (مستطيلة 200×200 px) الذي يظهر في جميع صفحات المنصة.' },
              { label: 'اسم التطبيق', detail: 'تغيير اسم المنصة الذي يظهر في الهيدر والسايد منيو.' },
              { label: 'وصف التطبيق', detail: 'وصف مختصر يظهر تحت الاسم.' },
              { label: 'معاينة حية', detail: 'معاينة فورية للتغييرات قبل الحفظ.' },
            ]
          },
        ]
      },
      {
        id: 'results',
        icon: icons.results,
        title: 'الردود المتقدمة',
        description: 'عرض وتحليل جميع ردود النماذج في المنصة',
        items: [
          {
            icon: icons.star,
            label: 'صفحة الردود',
            detail: 'صفحة متكاملة لعرض جميع ردود النماذج مع:',
            subItems: [
              { label: 'البحث', detail: 'تصفية الردود حسب الاسم أو البريد الإلكتروني للمتطوع.' },
              { label: 'الترتيب', detail: 'أسهم ترتيب تصاعدي/تنازلي على جميع الأعمدة (الاسم، البريد، النتيجة، النسبة، التاريخ، وكل سؤال).' },
              { label: 'التحليل البياني', detail: 'زر يفتح نافذة تحليل لكل سؤال برسوم بيانية أفقية.' },
              { label: 'فتح تلقائي', detail: 'إذا فتحت الصفحة من رابط "عرض التسجيلات"، تتجه تلقائياً للنموذج المعني.' },
            ]
          },
        ]
      },
    ]
  }
}

interface ExpandedSection {
  [key: string]: boolean
}

interface RolePageProps {
  params: Promise<{ role: string }>
}

export default function HelpPage({ params }: RolePageProps) {
  const [role, setRole] = useState<string>('')
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [expandedSections, setExpandedSections] = useState<ExpandedSection>({})
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({})
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const router = useRouter()
  const supabase = createClient()
  const { settings } = useAppSettings()

  useEffect(() => {
    params.then(({ role: r }) => setRole(r))
  }, [params])

  useEffect(() => {
    if (role) fetchProfile()
  }, [role])

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profileData } = await supabase
        .from('profiles').select('*').eq('id', user.id).single()

      if (!profileData || profileData.status !== 'approved') {
        router.push('/login')
        return
      }

      setProfile(profileData)

      const roleOrder = ['volunteer', 'supervisor', 'admin']
      const userRoleIndex = roleOrder.indexOf(profileData.role)
      const targetRoleIndex = roleOrder.indexOf(role)

      if (targetRoleIndex > userRoleIndex) {
        router.push('/dashboard')
        return
      }
    } catch (e) {
      console.error(e)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const content = helpData[role]
  if (!content) {
    return (
      <div dir="rtl" className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">الصفحة غير موجودة</h2>
          <p className="text-gray-600">الدور المطلوب غير متاح</p>
          <Link href="/dashboard" className="mt-4 inline-block px-6 py-3 bg-blue-600 text-white rounded-xl">
            العودة للرئيسية
          </Link>
        </div>
      </div>
    )
  }

  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const toggleItem = (id: string) => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const filteredSections = content.sections.map(section => ({
    ...section,
    items: section.items.filter(item => {
      if (!searchQuery) return true
      const q = searchQuery.toLowerCase()
      return (
        item.label.toLowerCase().includes(q) ||
        item.detail.toLowerCase().includes(q) ||
        (item.subItems || []).some(si =>
          si.label.toLowerCase().includes(q) || si.detail.toLowerCase().includes(q)
        )
      )
    })
  })).filter(s => s.items.length > 0 || !searchQuery)

  const roleLabels: Record<string, string> = {
    volunteer: 'متطوع',
    supervisor: 'مشرف',
    admin: 'مدير'
  }

  const roleColors: Record<string, string> = {
    volunteer: 'emerald',
    supervisor: 'blue',
    admin: 'purple'
  }

  const roleKey = role as 'volunteer' | 'supervisor' | 'admin'

  const colorClasses: Record<string, { bg50: string; text600: string; text700: string; ring200: string; bg100: string; border100: string; border200: string; bg5030: string; from50: string }> = {
    volunteer: {
      bg50: 'bg-emerald-50', text600: 'text-emerald-600', text700: 'text-emerald-700',
      ring200: 'ring-2 ring-emerald-200', bg100: 'bg-emerald-100',
      border100: 'border-emerald-100', border200: 'border-emerald-200',
      bg5030: 'bg-emerald-50/30',
      from50: 'from-emerald-50',
    },
    supervisor: {
      bg50: 'bg-blue-50', text600: 'text-blue-600', text700: 'text-blue-700',
      ring200: 'ring-2 ring-blue-200', bg100: 'bg-blue-100',
      border100: 'border-blue-100', border200: 'border-blue-200',
      bg5030: 'bg-blue-50/30',
      from50: 'from-blue-50',
    },
    admin: {
      bg50: 'bg-purple-50', text600: 'text-purple-600', text700: 'text-purple-700',
      ring200: 'ring-2 ring-purple-200', bg100: 'bg-purple-100',
      border100: 'border-purple-100', border200: 'border-purple-200',
      bg5030: 'bg-purple-50/30',
      from50: 'from-purple-50',
    },
  }


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Header user={profile} settings={settings} onMenuClick={() => setSidebarOpen(true)} />

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <aside className={`fixed inset-y-0 right-0 z-50 w-2/3 max-w-sm bg-white shadow-2xl transform transition-transform duration-300 lg:hidden ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col p-6">
          <button onClick={() => setSidebarOpen(false)} className="self-start p-2 text-gray-400 hover:text-gray-600 mb-6">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <nav className="flex-1 space-y-3 overflow-y-auto">
            {content.sections.map(s => (
              <button
                key={s.id}
                onClick={() => { toggleSection(s.id); setSidebarOpen(false) }}
                className="flex items-center gap-3 w-full px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-2xl transition-all text-right"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClasses[roleKey].text600} ${colorClasses[roleKey].bg50}`}>
                  {s.icon}
                </div>
                <span className="font-medium">{s.title}</span>
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Hero Header */}
      <div className={`bg-gradient-to-l ${content.gradient} text-white`}>
        <div className="max-w-5xl mx-auto px-4 py-16 lg:py-20">
          <div className="flex items-start gap-4 mb-4">
            <button
              onClick={() => router.back()}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-xl backdrop-blur-sm transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <div className="flex items-center gap-5 mb-6">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl lg:text-4xl font-bold">{content.title}</h1>
                <span className={`px-3 py-1 text-sm bg-white/20 backdrop-blur-sm rounded-full font-medium`}>
                  {roleLabels[role] || role}
                </span>
              </div>
              <p className="text-lg text-white/80">{content.subtitle}</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-2xl">
            <svg className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="ابحث في الدليل..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-12 pl-4 py-3.5 bg-white/15 backdrop-blur-sm border border-white/20 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
            />
          </div>
        </div>

        {/* Wave SVG divider */}
        <svg className="w-full h-8 lg:h-12 text-gray-50" viewBox="0 0 1440 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 48V24C240 0 480 24 720 24C960 24 1200 0 1440 24V48H0Z" fill="currentColor"/>
        </svg>
      </div>

      {/* Quick Navigation */}
      <div className="max-w-5xl mx-auto px-4 -mt-4 relative z-10 mb-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 lg:p-6">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">تصفح الأقسام</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {content.sections.map((section) => (
              <button
                key={section.id}
                onClick={() => toggleSection(section.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-right transition-all duration-200 ${
                  expandedSections[section.id]
                    ? `bg-${roleColors[role]}-50 text-${roleColors[role]}-700 ring-2 ring-${roleColors[role]}-200`
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  expandedSections[section.id] ? `bg-${roleColors[role]}-100` : 'bg-gray-200'
                }`}>
                  {section.icon}
                </div>
                <span className="text-sm font-medium">{section.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sections Content */}
      <main className="max-w-5xl mx-auto px-4 pb-16 space-y-6">
        {filteredSections.map((section) => {
          const isExpanded = expandedSections[section.id]
          const sectionColor = roleColors[role]

          return (
            <div
              key={section.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md"
            >
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.id)}
                className={`w-full flex items-center justify-between p-6 text-right transition-all duration-200 ${
                  isExpanded ? 'bg-gradient-to-l to-white border-b border-gray-100 ' + colorClasses[roleKey].from50 : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    isExpanded ? colorClasses[roleKey].bg100 + ' ' + colorClasses[roleKey].text600 : 'bg-gray-100 text-gray-500'
                  } transition-all duration-200`}>
                    {section.icon}
                  </div>
                  <div className="text-right">
                    <h2 className={`text-xl font-bold transition-colors ${
                      isExpanded ? colorClasses[roleKey].text700 : 'text-gray-900'
                    }`}>
                      {section.title}
                    </h2>
                    <p className="text-sm text-gray-500 mt-0.5">{section.description}</p>
                  </div>
                </div>
                <svg
                  className={`w-6 h-6 text-gray-400 transition-transform duration-300 ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Section Content */}
              <div className={`transition-all duration-500 overflow-hidden ${
                isExpanded ? 'max-h-[20000px] opacity-100' : 'max-h-0 opacity-0'
              }`}>
                <div className="p-6 pt-2 space-y-4">
                  {section.items.map((item, idx) => {
                    const itemId = `${section.id}-${idx}`
                    const isItemExpanded = expandedItems[itemId]

                    return (
                      <div
                        key={itemId}
                        className={`rounded-xl border transition-all duration-200 ${
                          isItemExpanded
                            ? colorClasses[roleKey].border200 + ' ' + colorClasses[roleKey].bg5030
                            : 'border-gray-100 bg-gray-50/50 hover:bg-gray-50'
                        }`}
                      >
                        <button
                          onClick={() => toggleItem(itemId)}
                          className="w-full flex items-center justify-between p-4 text-right"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                              isItemExpanded ? colorClasses[roleKey].bg100 + ' ' + colorClasses[roleKey].text600 : 'bg-gray-100 text-gray-500'
                            }`}>
                              {item.icon}
                            </div>
                            <div className="min-w-0">
                              <h3 className={`font-bold transition-colors ${
                                isItemExpanded ? colorClasses[roleKey].text700 : 'text-gray-800'
                              }`}>
                                {item.label}
                              </h3>
                              <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{item.detail}</p>
                            </div>
                          </div>
                          <svg
                            className={`w-5 h-5 text-gray-400 transition-transform duration-300 shrink-0 ${
                              isItemExpanded ? 'rotate-180' : ''
                            }`}
                            fill="none" viewBox="0 0 24 24" stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        <div className={`transition-all duration-300 overflow-hidden ${
                          isItemExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'
                        }`}>
                          <div className="px-4 pb-4 pt-0 space-y-3">
                            <div className={`pr-[3.25rem] text-sm text-gray-600 leading-relaxed border-r-2 ${
                              isItemExpanded ? colorClasses[roleKey].border200 : 'border-transparent'
                            }`}>
                              {item.detail}
                            </div>

                            {item.subItems && item.subItems.length > 0 && (
                              <div className="pr-[3.25rem] space-y-2">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">التفاصيل:</p>
                                <div className="space-y-2">
                                  {item.subItems.map((sub, si) => (
                                    <div key={si} className={`bg-white rounded-xl p-4 border transition-all ${
                                      isItemExpanded ? colorClasses[roleKey].border100 : 'border-gray-50'
                                    }`}>
                                      <div className="flex items-start gap-3">
                                        <div className={`w-6 h-6 mt-0.5 rounded-lg flex items-center justify-center shrink-0 ${
                                          sub.icon ? colorClasses[roleKey].bg100 + ' ' + colorClasses[roleKey].text600 : 'bg-gray-100 text-gray-400'
                                        }`}>
                                          {sub.icon || icons.star}
                                        </div>
                                        <div>
                                          <p className="font-semibold text-gray-800 text-sm">{sub.label}</p>
                                          <p className="text-sm text-gray-500 mt-0.5">{sub.detail}</p>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {section.items.length === 0 && searchQuery && (
                    <div className="text-center py-8 text-gray-500">
                      لا توجد نتائج للبحث &quot;{searchQuery}&quot; في هذا القسم
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white">
        <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
              {settings?.app_logo ? (
                <img src={settings.app_logo} alt="" className="w-full h-full object-cover" />
              ) : (
                <img src="/icon.svg" alt="" className="w-full h-full object-cover" />
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-700">{settings?.app_name || 'أحلى شباب'}</p>
              <p className="text-xs text-gray-400">دليل المستخدم الشامل</p>
            </div>
          </div>
          <Link href="/dashboard" className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
            العودة إلى لوحة التحكم
          </Link>
        </div>
      </footer>
    </div>
  )
}
