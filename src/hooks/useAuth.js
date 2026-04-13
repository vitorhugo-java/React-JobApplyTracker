import useAuthStore from '../store/authStore'

const useAuth = () => {
  const user = useAuthStore((s) => s.user)
  const accessToken = useAuthStore((s) => s.accessToken)
  const isAuthenticated = !!accessToken
  const isLoading = useAuthStore((s) => s.isLoading)
  const setTokens = useAuthStore((s) => s.setTokens)
  const setUser = useAuthStore((s) => s.setUser)
  const logout = useAuthStore((s) => s.logout)

  return { user, accessToken, isAuthenticated, isLoading, setTokens, setUser, logout }
}

export default useAuth
