import { useEffect, useRef, useState } from 'react'
import Spline from '@splinetool/react-spline'

const API_URL = 'https://agent-prod.studio.lyzr.ai/v3/inference/chat/'
const API_KEY = 'sk-default-Yq5Cz1mhH2FcgDMbzAf2wvCbAR6mgHRF'

function ChatModal({ open, onClose }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi, I'm the AI co‑pilot for this portfolio. Ask me about projects, skills, or experience." },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)
  const endRef = useRef(null)

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async () => {
    const trimmed = input.trim()
    if (!trimmed || loading) return

    setMessages(prev => [...prev, { role: 'user', content: trimmed }])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
        },
        body: JSON.stringify({
          user_id: 'sumesh13055@gmail.com',
          agent_id: '6910378f13d93e643cb8270e',
          session_id: '6910378f13d93e643cb8270e-m5xk84ybetp',
          message: trimmed,
        }),
      })

      let text = ''
      try {
        const data = await res.json()
        text = data?.message || data?.reply || data?.content || data?.data || JSON.stringify(data)
      } catch (e) {
        text = await res.text()
      }

      setMessages(prev => [...prev, { role: 'assistant', content: text || 'Thanks! Ask me more.' }])
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'There was an issue reaching the AI service. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
    if (e.key === 'Escape') onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      <section role="dialog" aria-modal="true" aria-label="AI chat about this portfolio"
        className="relative w-full sm:w-[640px] max-w-[92vw] m-4 sm:m-0 rounded-2xl overflow-hidden neon-border shadow-[0_0_60px_rgba(0,255,255,0.12)]">
        <div className="glass-panel bg-gradient-to-b from-white/10 to-white/5 border border-white/10">
          <header className="px-5 sm:px-6 py-4 flex items-center gap-3 border-b border-white/10">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_12px_2px_rgba(34,211,238,0.7)]" />
            <h2 className="font-orbitron text-cyan-300 tracking-wider uppercase text-sm">AI Co‑pilot</h2>
            <button onClick={onClose} className="ml-auto px-3 py-1 text-cyan-200/80 hover:text-cyan-100 hover:scale-105 transition-transform" aria-label="Close chat">✕</button>
          </header>

          <div className="max-h-[55vh] sm:max-h-[60vh] overflow-y-auto p-5 sm:p-6 space-y-4 custom-scroll">
            {messages.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                <div className={(m.role === 'user'
                    ? 'bg-cyan-500/20 text-cyan-100 border-cyan-400/30 shadow-[0_0_20px_rgba(34,211,238,0.35)]'
                    : 'bg-white/10 text-white border-white/10') +
                    ' max-w-[85%] sm:max-w-[75%] px-4 py-3 rounded-xl text-sm leading-relaxed border'}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-cyan-200/80">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            )}
            <div ref={endRef} />
          </div>

          <footer className="p-4 sm:p-5 border-t border-white/10 bg-white/5">
            <div className="relative flex items-center gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Ask about projects, stack, or experience…"
                rows={1}
                className="flex-1 resize-none bg-black/40 text-cyan-50 placeholder-cyan-200/40 rounded-xl border border-white/10 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-400/50 shadow-inner shadow-black/30"
              />
              <button onClick={sendMessage} disabled={loading} className="relative group sci-btn px-5 py-3 rounded-xl font-semibold text-sm tracking-wide disabled:opacity-60 disabled:cursor-not-allowed">
                <span className="relative z-10">Send</span>
                <span className="btn-glow" />
              </button>
            </div>
          </footer>
        </div>
      </section>
    </div>
  )
}

function App() {
  const [chatOpen, setChatOpen] = useState(false)

  const handleAskAI = () => setChatOpen(true)

  const handleDownload = () => {
    // Try to download a resume file from public; fallback to generating one
    const link = document.createElement('a')
    link.href = '/resume.pdf'
    link.download = 'Resume.pdf'
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  return (
    <main className="relative min-h-screen text-white overflow-hidden bg-[#05070c]">
      <div className="absolute inset-0">
        <Spline scene="https://prod.spline.design/EF7JOSsHLk16Tlw9/scene.splinecode" style={{ width: '100%', height: '100%' }} />
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(59,130,246,0.25),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(168,85,247,0.22),transparent_35%),radial-gradient(circle_at_50%_90%,rgba(34,211,238,0.25),transparent_40%)]" />

      <div className="absolute inset-0 opacity-[0.08] bg-[linear-gradient(0deg,transparent_24%,rgba(255,255,255,0.6)_25%,rgba(255,255,255,0.6)_26%,transparent_27%,transparent_74%,rgba(255,255,255,0.6)_75%,rgba(255,255,255,0.6)_76%,transparent_77%),linear-gradient(90deg,transparent_24%,rgba(255,255,255,0.6)_25%,rgba(255,255,255,0.6)_26%,transparent_27%,transparent_74%,rgba(255,255,255,0.6)_75%,rgba(255,255,255,0.6)_76%,transparent_77%)] bg-[length:50px_50px]" />

      <section className="relative z-10 flex flex-col items-center justify-center text-center px-6 sm:px-10 pt-28 pb-24 sm:pt-36 sm:pb-32">
        <div className="glass-panel neon-border px-6 sm:px-10 py-8 sm:py-12 rounded-3xl border border-white/10 backdrop-blur-xl bg-white/5 shadow-[0_0_120px_rgba(34,197,245,0.15)]">
          <p className="font-space text-cyan-300/80 text-xs sm:text-sm tracking-[0.35em] uppercase mb-4 flex items-center justify-center gap-2">
            <span className="h-1 w-1 rounded-full bg-cyan-400 animate-ping" /> Building Futures in Code
          </p>

          <h1 className="font-orbitron text-3xl sm:text-5xl md:text-6xl leading-tight sm:leading-[1.1] tracking-tight drop-shadow-[0_0_30px_rgba(56,189,248,0.35)]">
            Futuristic Interfaces, Human‑Centered Design
          </h1>

          <p className="mt-4 sm:mt-5 max-w-2xl text-cyan-100/80 text-sm sm:text-base">
            I craft immersive, high‑performance experiences with motion, 3D and delightful details. Let the co‑pilot answer your questions—or grab my resume.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <button onClick={handleAskAI} className="relative group sci-btn px-7 py-4 rounded-2xl font-semibold tracking-wide">
              <span className="relative z-10">ask AI about me</span>
              <span className="btn-glow" />
            </button>
            <button onClick={handleDownload} className="relative group sci-btn-alt px-7 py-4 rounded-2xl font-semibold tracking-wide">
              <span className="relative z-10">download resume</span>
              <span className="btn-glow-alt" />
            </button>
          </div>

          <div className="mt-8 text-[0.8rem] text-cyan-200/60 font-mono animate-scanline">Press Enter to send in chat • Esc to close</div>
        </div>
      </section>

      <ChatModal open={chatOpen} onClose={() => setChatOpen(false)} />
    </main>
  )
}

export default App
