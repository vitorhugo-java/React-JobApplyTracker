import React from 'react'
import { ExternalLink, Code2, BookOpen, Activity } from 'lucide-react'
import { usePageTitle } from '../../hooks/usePageTitle'

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080'
const swaggerUrl = `${apiUrl}/swagger-ui.html`
const apiDocsUrl = `${apiUrl}/v3/api-docs`
const actuatorUrl = `${apiUrl}/actuator/health`

const links = [
  {
    label: 'Swagger UI',
    description: 'Interactive API documentation and testing',
    url: swaggerUrl,
    icon: BookOpen,
  },
  {
    label: 'OpenAPI Spec (JSON)',
    description: 'Raw OpenAPI 3 specification',
    url: apiDocsUrl,
    icon: Code2,
  },
  {
    label: 'Actuator Health',
    description: 'Backend health check endpoint',
    url: actuatorUrl,
    icon: Activity,
  },
]

const Developer = () => {
  usePageTitle('Desenvolvedor')
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Developer Tools</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          API reference, documentation, and backend observability links.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
        {links.map(({ label, description, url, icon: Icon }) => (
          <a
            key={label}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
          >
            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{description}</p>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 truncate mt-0.5">{url}</p>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 shrink-0 transition-colors" />
          </a>
        ))}
      </div>

      <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
        <p className="text-xs text-amber-700 dark:text-amber-400">
          <strong>Note:</strong> These links connect to the backend at{' '}
          <code className="font-mono bg-amber-100 dark:bg-amber-900/40 px-1 rounded">{apiUrl}</code>.
          Make sure the backend is running before accessing these links.
        </p>
      </div>
    </div>
  )
}

export default Developer
