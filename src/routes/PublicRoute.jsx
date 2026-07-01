import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth'
import LoadingSpinner from '../components/common/LoadingSpinner'

function PublicRoute({ children }) {
  const { user, loadingAuth } = useAuth()

  if (loadingAuth) {
    return <LoadingSpinner text="Carregando..." />
  }

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default PublicRoute
