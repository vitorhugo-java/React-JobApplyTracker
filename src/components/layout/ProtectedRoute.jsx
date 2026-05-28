import { Navigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'

const ProtectedRoute = ({ children }) => {
  const accessToken = useAuthStore((s) => s.accessToken)

  return accessToken ? children : <Navigate to="/login" replace />
}

export default ProtectedRoute
