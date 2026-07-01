import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import toast from 'react-hot-toast'
import AppLayout from '../components/layout/AppLayout'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { useAuth } from '../contexts/useAuth'
import { subscribePatients } from '../services/patientService'

function PrivateAreaPage() {
  const { user } = useAuth()
  const [patients, setPatients] = useState([])
  const [loadingPatients, setLoadingPatients] = useState(true)

  useEffect(() => {
    if (!user?.uid) return undefined

    const unsubscribe = subscribePatients(
      user.uid,
      (data) => {
        setPatients(data)
        setLoadingPatients(false)
      },
      (error) => {
        console.error(error)
        toast.error('Erro ao carregar pacientes.')
        setLoadingPatients(false)
      },
    )

    return () => unsubscribe()
  }, [user?.uid])

  if (loadingPatients) {
    return <LoadingSpinner text="Carregando dados dos pacientes..." />
  }

  return (
    <AppLayout>
      <Outlet context={{ patients }} />
    </AppLayout>
  )
}

export default PrivateAreaPage
