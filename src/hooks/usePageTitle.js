import { useEffect } from 'react'

const SITE_NAME = 'Job Apply Tracker'

/**
 * Hook para definir o título dinâmico da aba do navegador
 * @param {string} pageTitle - O título da página atual (O que está sendo acessado)
 */
export const usePageTitle = (pageTitle) => {
  useEffect(() => {
    const title = `${pageTitle} - ${SITE_NAME}`
    document.title = title
    
    // Cleanup ao desmontar
    return () => {
      document.title = SITE_NAME
    }
  }, [pageTitle])
}
