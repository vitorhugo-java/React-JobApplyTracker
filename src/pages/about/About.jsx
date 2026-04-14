import React from 'react'
import { GitBranch, ExternalLink, Mail, Sparkles } from 'lucide-react'

const profile = {
  name: 'Vitor Hugo Alves',
  role: 'Desenvolvedor',
  avatarUrl: 'https://github.com/vitorhugo-java.png',
  github: 'https://github.com/vitorhugo-java',
  linkedin: 'https://www.linkedin.com/in/hugo-java',
  email: 'hugoalves.java@gmail.com',
}

const About = () => {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
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
  )
}

export default About
