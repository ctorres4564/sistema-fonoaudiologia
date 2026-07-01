import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth'
import LoadingSpinner from '../components/common/LoadingSpinner'

function ProtectedRoute({ children }) {
  const { user, loadingAuth } = useAuth()

  if (loadingAuth) {
    return <LoadingSpinner text="Validando sessão..." />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute
