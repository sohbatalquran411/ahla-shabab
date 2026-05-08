'use client'

import { useState, useCallback, useRef } from 'react'

const FIXED_DHIKR = [
  { id: 'subhanallah', text: 'سُبْحَانَ اللَّهِ', target: 33 },
  { id: 'alhamdulillah', text: 'الْحَمْدُ لِلَّهِ', target: 33 },
  { id: 'allahu_akbar', text: 'اللَّهُ أَكْبَرُ', target: 33 },
  { id: 'la_ilaha_illallah', text: 'لَا إِلَٰهَ إِلَّا اللَّهُ', target: 100 },
  { id: 'subhanallah_wabihamdihi', text: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ', target: 100 },
  { id: 'subhanallah_alazim', text: 'سُبْحَانَ اللَّهِ الْعَظِيمِ', target: 33 },
  { id: 'astaghfirullah', text: 'أَسْتَغْفِرُ اللَّهَ', target: 100 },
]

interface CustomDhikr {
  id: string
  text: string
  target: number
}

export default function TasbihPage() {
  const [activeDhikr, setActiveDhikr] = useState(FIXED_DHIKR[0])
  const [count, setCount] = useState(0)
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([])
  const [beadAnim, setBeadAnim] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showDhikrPicker, setShowDhikrPicker] = useState(false)
  const [customTarget, setCustomTarget] = useState<number | null>(null)
  const [customDhikrs, setCustomDhikrs] = useState<CustomDhikr[]>([])
  const [showAddDhikr, setShowAddDhikr] = useState(false)
  const [newDhikrText, setNewDhikrText] = useState('')
  const [newDhikrTarget, setNewDhikrTarget] = useState(33)

  const rippleId = useRef(0)
  const target = customTarget || activeDhikr.target

  const percentage = Math.min((count / target) * 100, 100)
  const circumference = 2 * Math.PI * 140
  const svgViewSize = 300
  const svgRadius = 140

  const handleCount = useCallback((clientX?: number, clientY?: number) => {
    setCount(prev => {
      const next = prev + 1
      if (next >= target) {
        setTimeout(() => {
          setCount(0)
          setBeadAnim(true)
          setTimeout(() => setBeadAnim(false), 600)
        }, 300)
        return target
      }
      return next
    })

    setBeadAnim(true)
    setTimeout(() => setBeadAnim(false), 200)

    if (clientX !== undefined && clientY !== undefined) {
      const id = ++rippleId.current
      setRipples(prev => [...prev, { id, x: clientX, y: clientY }])
      setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 600)
    }

    if (navigator.vibrate) navigator.vibrate(10)
  }, [target])

  const handleCounterClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    handleCount(e.clientX - rect.left, e.clientY - rect.top)
  }

  const pickDhikr = (dhikr: typeof FIXED_DHIKR[0] | CustomDhikr) => {
    setActiveDhikr(dhikr)
    setCustomTarget(null)
    setCount(0)
    setShowDhikrPicker(false)
  }

  const addCustomDhikr = () => {
    if (!newDhikrText.trim()) return
    const newDhikr: CustomDhikr = {
      id: `custom_${Date.now()}`,
      text: newDhikrText.trim(),
      target: newDhikrTarget,
    }
    setCustomDhikrs(prev => [...prev, newDhikr])
    setNewDhikrText('')
    setNewDhikrTarget(33)
    setShowAddDhikr(false)
  }

  const removeCustomDhikr = (id: string) => {
    setCustomDhikrs(prev => prev.filter(d => d.id !== id))
    if (activeDhikr.id === id) {
      setActiveDhikr(FIXED_DHIKR[0])
      setCustomTarget(null)
    }
  }

  const handleReset = () => {
    setCount(0)
    setShowResetConfirm(false)
  }

  // Long-press reset via touch
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handlePointerDown = () => {
    longPressTimer.current = setTimeout(() => setShowResetConfirm(true), 600)
  }
  const handlePointerUp = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#1a1a4e] to-[#24243e] flex flex-col items-center py-4 px-4 overflow-hidden select-none relative" dir="rtl">
      {/* Background effects */}
      <div className="absolute top-20 -left-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-40 -right-16 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl" />

      {/* Header */}
      <div className="relative z-10 text-center mb-2">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 backdrop-blur-md rounded-full border border-white/10 mb-1">
          <svg className="w-3 h-3 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <span className="text-white/50 text-[10px] font-medium">السٌّبْحَةُ الإلِكْتُرُونِيَّةُ</span>
        </div>
        <h1 className="text-xl font-bold text-white/80 tracking-wide px-2 leading-snug">
          {activeDhikr.text}
        </h1>
      </div>

      {/* Main Counter - maximized */}
      <div className="relative z-10 flex-1 flex items-center justify-center w-full min-h-0 py-2">
        <div
          onClick={handleCounterClick}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className="relative cursor-pointer group"
        >
          <div className={`absolute inset-0 rounded-full transition-all duration-500 ${beadAnim ? 'bg-emerald-400/20 scale-110' : 'bg-emerald-400/5 scale-100'}`} style={{ filter: 'blur(60px)' }} />
          <div className="relative w-[75vw] h-[75vw] max-w-[460px] max-h-[460px] sm:max-w-[500px] sm:max-h-[500px] rounded-full bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center transition-transform duration-150 active:scale-95">
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox={`0 0 ${svgViewSize} ${svgViewSize}`}>
              <circle cx={svgViewSize / 2} cy={svgViewSize / 2} r={svgRadius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
              <circle cx={svgViewSize / 2} cy={svgViewSize / 2} r={svgRadius} fill="none" stroke="url(#progressGradient)" strokeWidth="10" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference - (percentage / 100) * circumference} className="transition-all duration-500 ease-out" />
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="#14b8a6" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-[12%] rounded-full bg-gradient-to-br from-emerald-400/10 to-cyan-400/5" />
            <div className="relative flex flex-col items-center">
              <span className="text-[clamp(3rem,15vw,7rem)] font-bold text-white tabular-nums tracking-wider transition-all duration-200 leading-none">{count}</span>
              <span className="text-white/25 text-sm sm:text-base mt-2">/ {target}</span>
            </div>
            {ripples.map(r => (
              <span key={r.id} className="absolute w-24 h-24 rounded-full bg-white/20 animate-ping" style={{ left: r.x - 48, top: r.y - 48, animationDuration: '0.6s' }} />
            ))}
          </div>
          <div className={`absolute -inset-3 sm:-inset-4 rounded-full border-2 border-dashed border-white/5 transition-all duration-500 ${beadAnim ? 'opacity-100 rotate-180 scale-105' : 'opacity-0 rotate-0 scale-95'}`} />
        </div>
      </div>

      {/* Completed overlay */}
      {count >= target && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="text-center animate-bounce">
            <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/30">
              <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-white text-xl font-bold mb-2">أحسنت! 🎉</p>
            <p className="text-white/60 text-sm mb-6">أتممت {target} تسبيحة</p>
            <button onClick={() => setCount(0)} className="px-8 py-3 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-2xl font-medium hover:bg-white/20 transition-all">ابدأ من جديد</button>
          </div>
        </div>
      )}

      {/* Reset confirmation (inline, not blocking) */}
      {showResetConfirm && (
        <div className="relative z-20 mb-2">
          <div className="flex items-center gap-3 bg-red-500/10 backdrop-blur-md border border-red-500/20 rounded-2xl px-4 py-2">
            <span className="text-red-400 text-sm">إعادة الضبط؟</span>
            <button onClick={handleReset} className="px-4 py-1.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600">نعم</button>
            <button onClick={() => setShowResetConfirm(false)} className="px-4 py-1.5 bg-white/10 text-white/70 rounded-xl text-sm hover:bg-white/20">إلغاء</button>
          </div>
        </div>
      )}

      {/* Bottom controls - hidden behind a floating menu button */}
      <div className="relative z-10 flex items-center justify-center gap-4 pb-2">
        <button
          onClick={() => setShowMenu(true)}
          className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/15 transition-all active:scale-90"
          title="القائمة"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
      </div>

      {/* Bottom Sheet Menu */}
      {showMenu && (
        <div className="absolute inset-x-0 bottom-0 z-50" onClick={() => setShowMenu(false)}>
          <div className="absolute inset-0 -top-40 bg-black/40" />
          <div className="relative bg-gradient-to-t from-[#1a1a4e] to-[#24243e]/95 backdrop-blur-2xl border-t border-white/10 rounded-t-3xl p-5 pb-10 space-y-3 max-h-[70vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-white font-bold text-lg">القائمة</h3>
              <button onClick={() => setShowMenu(false)} className="text-white/40 hover:text-white/70 p-1">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* 1. Fixed Dhikr */}
            <button onClick={() => { setShowDhikrPicker(true); setShowMenu(false) }} className="w-full flex items-center justify-between px-4 py-3.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl hover:bg-white/10 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                </div>
                <div className="text-right">
                  <p className="text-white font-medium text-sm">أذكار ثابتة</p>
                  <p className="text-white/40 text-xs">{activeDhikr.text}</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>

            {/* 2. Custom target */}
            <div className="flex items-center gap-3 px-4 py-3.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl">
              <div className="w-10 h-10 bg-cyan-500/20 rounded-xl flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm">هدف خاص</p>
                <input
                  type="number"
                  min="1"
                  max="99999"
                  value={customTarget ?? ''}
                  onChange={(e) => {
                    const v = e.target.value
                    setCustomTarget(v ? parseInt(v) || 1 : null)
                    setCount(0)
                  }}
                  placeholder="عدد التسبيحات..."
                  className="w-full mt-1 bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-white/30 focus:outline-none focus:border-cyan-400/50"
                />
              </div>
              {customTarget && (
                <button onClick={() => { setCustomTarget(null); setCount(0) }} className="shrink-0 p-2 text-white/30 hover:text-white/60 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>

            {/* 3. Custom dhikrs */}
            <div className="px-4 py-3.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl">
              <button onClick={() => setShowAddDhikr(true)} className="w-full flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-medium text-sm">أذكار خاصة</p>
                    <p className="text-white/40 text-xs">{customDhikrs.length ? `${customDhikrs.length} ذكر` : 'أضف ذكراً خاصاً بك'}</p>
                  </div>
                </div>
                <svg className="w-5 h-5 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              </button>
              {customDhikrs.length > 0 && (
                <div className="mt-3 space-y-2">
                  {customDhikrs.map(d => (
                    <div key={d.id} className="flex items-center justify-between bg-white/5 rounded-xl px-3 py-2.5 border border-white/5">
                      <button onClick={() => { pickDhikr(d); setShowMenu(false) }} className="flex items-center gap-2 flex-1 text-right">
                        <span className={`w-2 h-2 rounded-full ${activeDhikr.id === d.id ? 'bg-emerald-400' : 'bg-white/20'}`} />
                        <span className="text-white/80 text-sm">{d.text}</span>
                        <span className="text-white/30 text-xs">({d.target})</span>
                      </button>
                      <button onClick={() => removeCustomDhikr(d.id)} className="p-1 text-red-400/50 hover:text-red-400 transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dhikr Picker Overlay */}
      {showDhikrPicker && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center pb-12" onClick={() => setShowDhikrPicker(false)}>
          <div className="w-full max-w-md mx-4 bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-5" onClick={e => e.stopPropagation()}>
            <h3 className="text-white font-bold text-lg text-center mb-4">اختر ذكراً</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {FIXED_DHIKR.map(d => (
                <button key={d.id} onClick={() => pickDhikr(d)} className={`w-full text-right px-4 py-3 rounded-2xl transition-all flex items-center justify-between ${activeDhikr.id === d.id ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-white/5 border border-transparent hover:bg-white/10'}`}>
                  <span className="text-white font-medium">{d.text}</span>
                  <span className="text-white/40 text-xs">{d.target}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setShowDhikrPicker(false)} className="w-full mt-4 py-3 bg-white/10 text-white/70 rounded-2xl text-sm font-medium hover:bg-white/20 transition-colors">إلغاء</button>
          </div>
        </div>
      )}

      {/* Add Custom Dhikr Overlay */}
      {showAddDhikr && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center pb-12" onClick={() => setShowAddDhikr(false)}>
          <div className="w-full max-w-md mx-4 bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-5" onClick={e => e.stopPropagation()}>
            <h3 className="text-white font-bold text-lg text-center mb-4">إضافة ذكر جديد</h3>
            <div className="space-y-4">
              <div>
                <label className="text-white/60 text-xs block mb-1">نص الذكر</label>
                <input type="text" value={newDhikrText} onChange={e => setNewDhikrText(e.target.value)} placeholder="مثال: سبحان الله العظيم" className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-emerald-400/50" />
              </div>
              <div>
                <label className="text-white/60 text-xs block mb-1">الهدف (عدد التسبيحات)</label>
                <input type="number" min="1" value={newDhikrTarget} onChange={e => setNewDhikrTarget(parseInt(e.target.value) || 1)} className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-400/50" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowAddDhikr(false)} className="flex-1 py-3 bg-white/10 text-white/70 rounded-2xl text-sm font-medium hover:bg-white/20 transition-colors">إلغاء</button>
                <button onClick={addCustomDhikr} disabled={!newDhikrText.trim()} className="flex-1 py-3 bg-gradient-to-l from-emerald-500 to-teal-600 text-white rounded-2xl text-sm font-medium hover:opacity-90 transition-all disabled:opacity-40">إضافة</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom spacer for safe area */}
      <div className="h-6 shrink-0" />
    </div>
  )
}
