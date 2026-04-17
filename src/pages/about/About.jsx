import React, { useEffect } from 'react'
import { GitBranch, ExternalLink, Mail, Sparkles, Zap, ArrowLeft } from 'lucide-react'
import { usePageTitle } from '../../hooks/usePageTitle'
import mermaid from 'mermaid'
import { useLocation, useNavigate } from 'react-router-dom'

mermaid.initialize({ startOnLoad: true, theme: 'default' })

const profile = {
  name: 'Vitor Hugo Alves',
  role: 'Desenvolvedor',
  avatarUrl: 'https://github.com/vitorhugo-java.png',
  github: 'https://github.com/vitorhugo-java',
  linkedin: 'https://www.linkedin.com/in/hugo-java',
  email: 'hugoalves.java@gmail.com',
}

const roadmapDiagram = `graph TD
    A["🎯 Roadmap 2026"] --> B["Phase 1: Core Improvements"]
    A --> C["Phase 2: Integrations"]
    A --> D["Phase 3: Mobile & Advanced"]
    
    B --> B1["📅 Apply for Later<br/>Reminder System & Queue"]
    B --> B2["🏢 Company Field<br/>Rename vacancy_opened_by<br/>Make optional"]
    B --> B3["✉️ Email Configuration<br/>Password Reset<br/>Reminder Notifications"]
    B --> B4["🔵 TypeScript Migration<br/>Full codebase conversion"]
    
    C --> C1["📆 Google Calendar Sync<br/>Sync job applications<br/>with GCalendar"]
    C --> C2["🔗 TickTick Integration<br/>Sync with TickTick tasks"]
    
    D --> D1["📱 Flutter App<br/>Quick add opportunities<br/>Mobile experience"]
    D --> D2["⚡ Windows Quick Add<br/>Like TickTick integration<br/>Fast entry tool"]
    
    style A fill:#6366f1,stroke:#4f46e5,color:#fff
    style B fill:#3b82f6,stroke:#2563eb,color:#fff
    style C fill:#8b5cf6,stroke:#7c3aed,color:#fff
    style D fill:#ec4899,stroke:#db2777,color:#fff
    style B1 fill:#60a5fa,stroke:#3b82f6,color:#fff
    style B2 fill:#60a5fa,stroke:#3b82f6,color:#fff
    style B3 fill:#60a5fa,stroke:#3b82f6,color:#fff
    style B4 fill:#60a5fa,stroke:#3b82f6,color:#fff
    style C1 fill:#a78bfa,stroke:#8b5cf6,color:#fff
    style C2 fill:#a78bfa,stroke:#8b5cf6,color:#fff
    style D1 fill:#f472b6,stroke:#ec4899,color:#fff
    style D2 fill:#f472b6,stroke:#ec4899,color:#fff`

const About = () => {
  usePageTitle('Sobre')
  const location = useLocation()
  const navigate = useNavigate()
  const showBack = location?.state?.from === 'login'

  useEffect(() => {
    mermaid.run()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {showBack && (
          <>
            <button
              onClick={() => navigate(-1)}
              aria-label="Voltar"
              className="hidden sm:flex items-center justify-center fixed top-4 left-4 z-50 p-3 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => navigate(-1)}
              aria-label="Voltar"
              className="flex sm:hidden items-center justify-center fixed bottom-4 right-4 z-50 p-4 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </>
        )}
      <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <img
            src={profile.avatarUrl}
            alt={`Foto de ${profile.name}`}
            className="w-24 h-24 rounded-2xl object-cover border-2 border-indigo-200 dark:border-indigo-700 shadow-sm"
            loading="lazy"
          />

          <div className="min-w-0">
            <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide uppercase text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-4 h-4" />
              Sobre Mim
            </p>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{profile.name}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{profile.role}</p>
          </div>
        </div>
      </section>

      <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 sm:p-8 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Por que essa aplicação surgiu?</h2>
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          O Job Apply Tracker nasceu da necessidade de organizar de forma simples e visual todo o processo de
          candidatura a vagas. A ideia foi centralizar oportunidades, status, lembretes e evolução das aplicações em
          um único lugar, facilitando a rotina de quem está em busca de novas posições na área de tecnologia.
        </p>
      </section>

      <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            Roadmap 2026
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Funcionalidades planejadas e melhorias para o Job Apply Tracker
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 overflow-x-auto">
          <div className="mermaid">{roadmapDiagram}</div>
        </div>
      </section>

      <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Meus contatos</h2>

        <div className="grid sm:grid-cols-3 gap-3">
          <a
            href={profile.github}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gray-900 text-white hover:bg-black transition-colors"
          >
            <GitBranch className="w-4 h-4" />
            GitHub
          </a>

          <a
            href={profile.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            LinkedIn
          </a>

          <a
            href={`mailto:${profile.email}`}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
          >
            <Mail className="w-4 h-4" />
            E-mail
          </a>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">{profile.email}</p>
      </section>
      </div>
    </div>
  )
}

export default About
