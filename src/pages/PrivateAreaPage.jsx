import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import toast from 'react-hot-toast'
import AppLayout from '../components/layout/AppLayout'
import { useAuth } from '../contexts/useAuth'
import { subscribePatients } from '../services/patientService'
import { subscribeSchedules } from '../services/scheduleService'

function PrivateAreaPage() {
  const { user } = useAuth()
  const [patients, setPatients] = useState([])
  const [loadingPatients, setLoadingPatients] = useState(true)
  const [schedules, setSchedules] = useState([])
  const [loadingSchedules, setLoadingSchedules] = useState(true)

  useEffect(() => {
    if (!user?.uid) return undefined

    const unsubscribePatients = subscribePatients(
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

    const unsubscribeSchedules = subscribeSchedules(
      user.uid,
      (data) => {
        setSchedules(data)
        setLoadingSchedules(false)
      },
      (error) => {
        console.error(error)
        toast.error('Erro ao carregar agendamentos.')
        setLoadingSchedules(false)
      },
    )

    return () => {
      unsubscribePatients()
      unsubscribeSchedules()
    }
  }, [user?.uid])

  return (
    <AppLayout>
      <Outlet context={{ patients, loadingPatients, schedules, loadingSchedules }} />
    </AppLayout>
  )
}

export default PrivateAreaPage
