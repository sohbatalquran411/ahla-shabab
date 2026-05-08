'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const DHIKR_LIST = [
  { id: 'subhanallah', text: 'سُبْحَانَ اللَّهِ', target: 33 },
  { id: 'alhamdulillah', text: 'الْحَمْدُ لِلَّهِ', target: 33 },
  { id: 'allahu_akbar', text: 'اللَّهُ أَكْبَرُ', target: 33 },
  { id: 'la_ilaha_illallah', text: 'لَا إِلَٰهَ إِلَّا اللَّهُ', target: 100 },
  { id: 'subhanallah_wabihamdihi', text: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ', target: 100 },
  { id: 'subhanallah_alazim', text: 'سُبْحَانَ اللَّهِ الْعَظِيمِ', target: 33 },
  { id: 'astaghfirullah', text: 'أَسْتَغْفِرُ اللَّهَ', target: 100 },
]

export default function TasbihPage() {
  const router = useRouter()
  const [activeDhikr, setActiveDhikr] = useState(DHIKR_LIST[0])
  const [count, setCount] = useState(0)
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([])
  const [beadAnim, setBeadAnim] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const rippleId = useRef(0)
  const counterRef = useRef<HTMLDivElement>(null)

  const percentage = Math.min((count / activeDhikr.target) * 100, 100)
  const circumference = 2 * Math.PI * 60

  const handleCount = useCallback((clientX?: number, clientY?: number) => {
    setCount(prev => {
      const next = prev + 1
      if (next >= activeDhikr.target) {
        setTimeout(() => {
          setCount(0)
          setBeadAnim(true)
          setTimeout(() => setBeadAnim(false), 600)
        }, 300)
        return activeDhikr.target
      }
      return next
    })

    setBeadAnim(true)
    setTimeout(() => setBeadAnim(false), 200)

    if (clientX !== undefined && clientY !== undefined) {
      const id = ++rippleId.current
      setRipples(prev => [...prev, { id, x: clientX, y: clientY }])
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== id))
      }, 600)
    }

    if (navigator.vibrate) navigator.vibrate(10)
  }, [activeDhikr.target])

  const handleCounterClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    handleCount(e.clientX - rect.left, e.clientY - rect.top)
  }

  const switchDhikr = (dhikr: typeof DHIKR_LIST[0]) => {
    setActiveDhikr(dhikr)
    setCount(0)
  }

  const handleReset = () => {
    setCount(0)
    setShowResetConfirm(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#1a1a4e] to-[#24243e] flex flex-col items-center justify-between py-10 px-4 overflow-hidden select-none relative">
      {/* Background decorative circles */}
      <div className="absolute top-20 -left-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-40 -right-16 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl" />

      {/* Header */}
      <div className="relative z-10 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-md rounded-full border border-white/10 mb-4">
          <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <span className="text-white/60 text-xs font-medium">السٌّبْحَةُ الإلِكْتُرُونِيَّةُ</span>
        </div>
        <h1 className="text-3xl font-bold text-white/90 tracking-wide">
          {activeDhikr.text}
        </h1>
        <p className="text-white/40 text-sm mt-2 font-arabic">
          الهدف: {activeDhikr.target}
        </p>
      </div>

      {/* Main Counter */}
      <div
        ref={counterRef}
        onClick={handleCounterClick}
        className="relative z-10 cursor-pointer group"
      >
        {/* Outer glow */}
        <div className={`absolute inset-0 rounded-full transition-all duration-500 ${beadAnim ? 'bg-emerald-400/20 scale-110' : 'bg-emerald-400/5 scale-100'}`} style={{ filter: 'blur(40px)' }} />

        {/* Glass container */}
        <div className="relative w-72 h-72 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center transition-transform duration-150 active:scale-95">
          {/* Progress Ring */}
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 140 140">
            <circle
              cx="70" cy="70" r="60"
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="6"
            />
            <circle
              cx="70" cy="70" r="60"
              fill="none"
              stroke="url(#progressGradient)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - (percentage / 100) * circumference}
              className="transition-all duration-500 ease-out"
            />
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#14b8a6" />
              </linearGradient>
            </defs>
          </svg>

          {/* Inner glow ring */}
          <div className="absolute inset-6 rounded-full bg-gradient-to-br from-emerald-400/10 to-cyan-400/5" />

          {/* Count Display */}
          <div className="relative flex flex-col items-center">
            <span className="text-7xl font-bold text-white tabular-nums tracking-wider transition-all duration-200">
              {count}
            </span>
            <span className="text-white/30 text-sm mt-1">/ {activeDhikr.target}</span>
          </div>

          {/* Ripple effects */}
          {ripples.map(r => (
            <span
              key={r.id}
              className="absolute w-16 h-16 rounded-full bg-white/20 animate-ping"
              style={{ left: r.x - 32, top: r.y - 32, animationDuration: '0.6s' }}
            />
          ))}
        </div>

        {/* Bead ring decoration */}
        <div className={`absolute -inset-4 rounded-full border-2 border-dashed border-white/5 transition-all duration-500 ${beadAnim ? 'opacity-100 rotate-180 scale-105' : 'opacity-0 rotate-0 scale-95'}`} />
      </div>

      {/* Completed celebration */}
      {count >= activeDhikr.target && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="text-center animate-bounce">
            <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/30">
              <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-white text-xl font-bold mb-2">أحسنت! 🎉</p>
            <p className="text-white/60 text-sm mb-6">أتممت {activeDhikr.target} تسبيحة</p>
            <button
              onClick={() => setCount(0)}
              className="px-8 py-3 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-2xl font-medium hover:bg-white/20 transition-all"
            >
              ابدأ من جديد
            </button>
          </div>
        </div>
      )}

      {/* Dhikr Selector */}
      <div className="relative z-10 w-full max-w-md">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide justify-center flex-wrap">
          {DHIKR_LIST.map(d => (
            <button
              key={d.id}
              onClick={() => switchDhikr(d)}
              className={`px-5 py-2.5 rounded-2xl text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                activeDhikr.id === d.id
                  ? 'bg-gradient-to-l from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20 scale-105'
                  : 'bg-white/5 backdrop-blur-md text-white/60 border border-white/10 hover:bg-white/10 hover:text-white/80'
              }`}
            >
              {d.text}
            </button>
          ))}
        </div>

        {/* Reset button */}
        <div className="flex justify-center mt-4">
          {showResetConfirm ? (
            <div className="flex items-center gap-3 bg-red-500/10 backdrop-blur-md border border-red-500/20 rounded-2xl px-4 py-2">
              <span className="text-red-400 text-sm">إعادة الضبط؟</span>
              <button onClick={handleReset} className="px-4 py-1.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-colors">
                نعم
              </button>
              <button onClick={() => setShowResetConfirm(false)} className="px-4 py-1.5 bg-white/10 text-white/70 rounded-xl text-sm hover:bg-white/20 transition-colors">
                إلغاء
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/5 backdrop-blur-md border border-white/10 text-white/50 rounded-2xl text-sm hover:bg-white/10 hover:text-white/70 transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              إعادة الضبط
            </button>
          )}
        </div>
      </div>

      {/* Bottom spacer for nav bar */}
      <div className="h-24" />
    </div>
  )
}
