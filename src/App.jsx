import { useEffect, useRef, useState } from 'react'
import Spline from '@splinetool/react-spline'

const API_URL = 'https://agent-prod.studio.lyzr.ai/v3/inference/chat/'
const API_KEY = 'sk-default-Yq5Cz1mhH2FcgDMbzAf2wvCbAR6mgHRF'

function safeExtractMessage(payload) {
  try {
    if (!payload || typeof payload === 'string') return payload || ''
    const tryPaths = [
      // common flat fields
      ['message'], ['reply'], ['content'], ['answer'], ['response'], ['output_text'], ['result'],
      // nested under data
      ['data','message'], ['data','reply'], ['data','content'], ['data','answer'], ['data','response'], ['data','output'], ['data','text'],
      // openai-like
      ['choices', 0, 'message', 'content'],
      // general output arrays
      ['output','text'], ['output',0,'content'], ['outputs',0,'content'], ['results',0,'content'],
    ]
    for (const path of tryPaths) {
      let cur = payload
      let ok = true
      for (const key of path) {
        if (cur && typeof cur === 'object' && key in cur) cur = cur[key]
        else { ok = false; break }
      }
      if (ok && (typeof cur === 'string' && cur.trim())) return cur
    }
    // If still nothing, last resort stringify
    return JSON.stringify(payload)
  } catch (e) {
    return ''
  }
}

async function parseAIResponse(res) {
  const ct = res.headers.get('content-type') || ''
  if (ct.includes('application/json')) {
    const json = await res.json().catch(async () => ({ raw: await res.text().catch(() => '') }))
    return safeExtractMessage(json)
  }
  // handle text/event-stream or plain text responses
  const text = await res.text().catch(() => '')
  if (!text) return ''
  // Try to pull last JSON object from possible SSE or multilines
  const lines = text.split(/\n|\r/).map(l => l.trim()).filter(Boolean)
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].replace(/^data:\s*/, '')
    try {
      const j = JSON.parse(line)
      const extracted = safeExtractMessage(j)
      if (extracted) return extracted
    } catch (_) { /* not json */ }
  }
  return text
}

function ChatModal({ open, onClose }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi, I'm the AI co‑pilot. Ask about Sumesh’s projects, skills, education, or experience." },
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

      if (!res.ok) {
        const errText = await res.text().catch(() => '')
        throw new Error(`AI service error ${res.status}: ${errText || res.statusText}`)
      }

      const text = await parseAIResponse(res)
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

          <div className="max-h:[60vh] sm:max-h-[65vh] overflow-y-auto p-5 sm:p-6 space-y-4 custom-scroll">
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

  const handleDownload = async () => {
    try {
      const head = await fetch('/resume.pdf', { method: 'HEAD' })
      if (head.ok) {
        const link = document.createElement('a')
        link.href = '/resume.pdf'
        link.download = 'Sumesh_Singh_Kotiwale_Resume.pdf'
        document.body.appendChild(link)
        link.click()
        link.remove()
        return
      }
    } catch (_) { /* fallthrough to generate */ }

    // Fallback: generate a clean text resume from provided details
    const resumeText = `Sumesh Singh Kotiwale\nHyderabad, Telangana, India | sumesh13055@gmail.com | +91 7288081868\n\nCareer Statement\nSeeking an opportunity to apply my strong programming and problem-solving abilities to real-world challenges. Aspire to contribute to projects that power digital transformation for clients in alignment with an AI-First vision, and to develop specialized skills in high-impact technology domains.\n\nEducation\n- M.C.A., Chaitanya Bharathi Institute of Technology, Hyderabad (2024–2026)\n  Semester I CGPA: 8.67/10 | Semester II CGPA: 8.37/10\n- B.C.A., University College of Science, Osmania University Saifabad, Hyderabad (2021–2024)\n  CGPA: 8.54/10\n- 12th, Tapasya Junior College, Hyderabad (2021) – 92.80% (TSBIE)\n- 10th, ST. Joseph’s High School, Hyderabad (2019) – CGPA 9/10 (BSET)\n\nProjects\n- TruePulse (Jun 2025)\n  AI-powered tool to assess credibility, tone, and topics of news articles/snippets. Paste text or links to get a summary and trust score.\n  Tech: React, Flask, Python, Tailwind CSS, Sentiment Analysis, Machine Learning | Team: 2\n- Lab Attendance System (Nov–Dec 2024)\n  Modern desktop app for managing student lab attendance. Features real-time tracking, validation, Excel export, and themed UI.\n  Tech: Python, customtkinter, pandas, Excel integration | Team: 1\n\nKey Expertise\n- Languages: Python, Java, C++\n- Frontend: HTML, CSS, JavaScript\n- Other: Generative AI, Graphic Designing\n\nCertifications & Achievements\n- Python Foundation – Infosys\n- GfG 160 (22-week) – GeeksForGeeks\n- Hackathons: HackPrix Season 2, HackHazard’25, COSC-CBIT\n- Pointers – Code Studio\n- Class representative (2 years)\n\nWorkshops\n- Cybersecurity Unlocked – CBIT (Nov 2024) | Topics: Cyber Attacks, SQL Injection, CSRF | Duration: 3 days\n`.
      trim()

    const blob = new Blob([resumeText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'Sumesh_Singh_Kotiwale_Resume.txt'
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="relative min-h-screen text-white overflow-hidden bg-[#05070c]">
      <div className="absolute inset-0">
        <Spline scene="https://prod.spline.design/EF7JOSsHLk16Tlw9/scene.splinecode" style={{ width: '100%', height: '100%' }} />
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(59,130,246,0.25),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(168,85,247,0.22),transparent_35%),radial-gradient(circle_at_50%_90%,rgba(34,211,238,0.25),transparent_40%)]" />

      <div className="absolute inset-0 opacity-[0.08] bg-[linear-gradient(0deg,transparent_24%,rgba(255,255,255,0.6)_25%,rgba(255,255,255,0.6)_26%,transparent_27%,transparent_74%,rgba(255,255,255,0.6)_75%,rgba(255,255,255,0.6)_76%,transparent_77%),linear-gradient(90deg,transparent_24%,rgba(255,255,255,0.6)_25%,rgba(255,255,255,0.6)_26%,transparent_27%,transparent_74%,rgba(255,255,255,0.6)_75%,rgba(255,255,255,0.6)_76%,transparent_77%)] bg-[length:50px_50px]" />

      <section className="relative z-10 flex flex-col items-center justify-center text-center px-6 sm:px-10 pt-28 pb-16 sm:pt-36 sm:pb-20">
        <div className="glass-panel neon-border px-6 sm:px-10 py-8 sm:py-12 rounded-3xl border border-white/10 backdrop-blur-xl bg-white/5 shadow-[0_0_120px_rgba(34,197,245,0.15)] max-w-4xl">
          <p className="font-space text-cyan-300/80 text-xs sm:text-sm tracking-[0.35em] uppercase mb-4 flex items-center justify-center gap-2">
            <span className="h-1 w-1 rounded-full bg-cyan-400 animate-ping" /> Hyderabad, Telangana, India
          </p>

          <h1 className="font-orbitron text-3xl sm:text-5xl md:text-6xl leading-tight sm:leading-[1.1] tracking-tight drop-shadow-[0_0_30px_rgba(56,189,248,0.35)]">
            Sumesh Singh Kotiwale
          </h1>

          <p className="mt-4 sm:mt-5 max-w-2xl mx-auto text-cyan-100/80 text-sm sm:text-base">
            Seeking an opportunity to apply strong programming and problem‑solving abilities to real‑world challenges. Passionate about AI‑first products and impactful technology.
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

          <div className="mt-6 text-[0.8rem] text-cyan-200/70 font-mono">sumesh13055@gmail.com • +91 7288081868</div>
          <div className="mt-2 text-[0.8rem] text-cyan-200/60 font-mono animate-scanline">Press Enter to send in chat • Esc to close</div>
        </div>
      </section>

      <section className="relative z-10 px-6 sm:px-10 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
          <div className="glass-panel neon-border rounded-3xl p-6 border border-white/10">
            <h3 className="font-orbitron text-xl text-cyan-300 mb-3">Education</h3>
            <ul className="space-y-3 text-cyan-100/85 text-sm">
              <li>
                <div className="font-semibold">M.C.A. — Chaitanya Bharathi Institute of Technology (2024–2026)</div>
                <div className="text-cyan-200/70">Semester I: 8.67/10 • Semester II: 8.37/10</div>
              </li>
              <li>
                <div className="font-semibold">B.C.A. — University College of Science, OU Saifabad (2021–2024)</div>
                <div className="text-cyan-200/70">CGPA: 8.54/10</div>
              </li>
              <li>
                <div className="font-semibold">12th — Tapasya Junior College (2021)</div>
                <div className="text-cyan-200/70">TSBIE: 92.80%</div>
              </li>
              <li>
                <div className="font-semibold">10th — ST. Joseph’s High School (2019)</div>
                <div className="text-cyan-200/70">BSET: CGPA 9/10</div>
              </li>
            </ul>
          </div>

          <div className="glass-panel neon-border rounded-3xl p-6 border border-white/10">
            <h3 className="font-orbitron text-xl text-cyan-300 mb-3">Key Expertise</h3>
            <ul className="grid grid-cols-2 gap-2 text-sm text-cyan-100/85">
              <li>Python</li>
              <li>Java</li>
              <li>C++</li>
              <li>HTML</li>
              <li>CSS</li>
              <li>JavaScript</li>
              <li>Generative AI</li>
              <li>Graphic Designing</li>
            </ul>
          </div>

          <div className="glass-panel neon-border rounded-3xl p-6 border border-white/10 md:col-span-2">
            <h3 className="font-orbitron text-xl text-cyan-300 mb-3">Projects</h3>
            <div className="space-y-5 text-sm text-cyan-100/85">
              <div>
                <div className="font-semibold">TruePulse — AI‑powered news credibility tool <span className="text-cyan-200/70">(Jun 2025)</span></div>
                <div>Assesses credibility, tone, and key topics from article text or links; provides summary and trust score.</div>
                <div className="text-cyan-200/70">React, Flask, Python, Tailwind CSS, Sentiment Analysis, Machine Learning • Team: 2</div>
              </div>
              <div>
                <div className="font-semibold">Lab Attendance System — Desktop app <span className="text-cyan-200/70">(Nov–Dec 2024)</span></div>
                <div>Real‑time attendance tracking, data validation, Excel export, modern themed UI. AI‑assisted development for ideation and optimization.</div>
                <div className="text-cyan-200/70">Python, customtkinter, pandas, Excel integration • Team: 1</div>
              </div>
            </div>
          </div>

          <div className="glass-panel neon-border rounded-3xl p-6 border border-white/10">
            <h3 className="font-orbitron text-xl text-cyan-300 mb-3">Certifications & Achievements</h3>
            <ul className="list-disc ml-5 space-y-2 text-sm text-cyan-100/85">
              <li>Python Foundation — Infosys</li>
              <li>GfG 160 — 22‑week problem solving, GeeksForGeeks</li>
              <li>Hackathons: HackPrix S2, HackHazard’25, COSC‑CBIT</li>
              <li>Pointers — Code Studio</li>
              <li>Class representative for two years (UG)</li>
            </ul>
          </div>

          <div className="glass-panel neon-border rounded-3xl p-6 border border-white/10">
            <h3 className="font-orbitron text-xl text-cyan-300 mb-3">Workshops</h3>
            <div className="text-sm text-cyan-100/85">
              Cybersecurity Unlocked — CBIT (Nov 2024): Cyber attacks, SQL‑injections, CSRF • Duration: 3 days
            </div>
          </div>
        </div>
      </section>

      <ChatModal open={chatOpen} onClose={() => setChatOpen(false)} />
    </main>
  )
}

export default App
