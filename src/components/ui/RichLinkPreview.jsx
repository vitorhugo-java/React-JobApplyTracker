import React, { useEffect, useState } from 'react'
import { ExternalLink, AlertCircle, Loader } from 'lucide-react'
import { getLinkMetadata } from '../../api/applications'

const RichLinkPreview = ({ url }) => {
  const [metadata, setMetadata] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        setLoading(true)
        setError(false)
        const response = await getLinkMetadata(url)
        setMetadata(response.data)
      } catch (err) {
        console.error('Failed to fetch link metadata:', err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    if (url) {
      fetchMetadata()
    }
  }, [url])

  if (loading) {
    return (
      <div className="p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl flex items-center justify-center gap-2 min-h-[120px]">
        <Loader className="w-4 h-4 animate-spin text-indigo-600" />
        <span className="text-sm text-gray-600 dark:text-gray-400">Loading link preview...</span>
      </div>
    )
  }

  if (error || !metadata) {
    return (
      <div className="p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Vacancy Link</p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline truncate block"
            >
              {url}
            </a>
          </div>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
            aria-label="Open link"
          >
            <ExternalLink className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </a>
        </div>
      </div>
    )
  }

  const { title, description, image, domain } = metadata

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md dark:hover:shadow-lg transition-all"
    >
      <div className="flex gap-4">
        {/* Image Preview */}
        {image && (
          <div className="flex-shrink-0 w-32 h-32 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
            <img
              src={image}
              alt={title || 'Link preview'}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              loading="lazy"
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
          </div>
        )}

        {/* Content */}
        <div className={`flex-1 min-w-0 flex flex-col justify-between ${!image ? 'py-2' : ''}`}>
          <div>
            {domain && (
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 truncate">
                {domain}
              </p>
            )}
            {title && (
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1 mt-3 pt-2 border-t border-gray-100 dark:border-gray-700 text-indigo-600 dark:text-indigo-400 text-sm font-medium group-hover:gap-2 transition-all">
            <span>Visit Link</span>
            <ExternalLink className="w-3 h-3" />
          </div>
        </div>
      </div>
    </a>
  )
}

export default RichLinkPreview
