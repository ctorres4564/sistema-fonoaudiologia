import { useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import StatCard from '../components/common/StatCard'
import SkeletonCard from '../components/common/SkeletonCard'
import EmptyState from '../components/common/EmptyState'
import { getDashboardStats } from '../utils/patient'

function DashboardPage() {
  const { patients = [], loadingPatients } = useOutletContext()

  const stats = useMemo(() => getDashboardStats(patients), [patients])

  const alerts = useMemo(() => {
    if (loadingPatients) return []

    const list = []
    const today = new Date()
    const currentMonth = String(today.getMonth() + 1).padStart(2, '0')
    const currentDay = String(today.getDate()).padStart(2, '0')
    const todayMMDD = `${currentMonth}-${currentDay}`

    patients.forEach((patient) => {
      // 1. Alerta de Aniversariante
      if (patient.birthDate) {
        // birthDate formato YYYY-MM-DD
        const parts = patient.birthDate.split('-')
        if (parts.length === 3) {
          const birthMMDD = `${parts[1]}-${parts[2]}`
          if (birthMMDD === todayMMDD) {
            list.push({
              id: `birth-${patient.id}`,
              type: 'birthday',
              message: `🎉 Hoje é aniversário de ${patient.name}! Que tal enviar os parabéns?`,
            })
          }
        }
      }

      // 2. Alerta de limite de sessões
      const completed = Number(patient.sessionsCompleted || 0)
      const total = Number(patient.totalSessions || 0)
      if (patient.status === 'Ativo' && total > 0 && completed >= total) {
        list.push({
          id: `limit-${patient.id}`,
          type: 'sessions_limit',
          message: `⚠️ ${patient.name} atingiu o limite estimado de sessões (${completed}/${total}). Avalie a necessidade de renovação do atendimento domiciliar.`,
        })
      }
    })

    return list
  }, [patients, loadingPatients])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-noble-800 dark:text-noble-100">Dashboard</h2>
        <p className="text-sm text-noble-500 dark:text-noble-400">Visão geral dos indicadores do tratamento.</p>
      </div>

      {alerts.length > 0 && (
        <div className="rounded-2xl border border-gold-300 dark:border-gold-800 bg-gold-50 dark:bg-gold-950/15 p-4 space-y-2 transition-colors duration-200">
          <h4 className="text-xs font-bold text-gold-600 dark:text-gold-400 uppercase tracking-wider">Alertas Clínicos</h4>
          <div className="space-y-1.5">
            {alerts.map((alert) => (
              <p key={alert.id} className="text-sm text-noble-800 dark:text-noble-200 font-medium">
                {alert.message}
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loadingPatients ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <StatCard title="Total de pacientes" value={stats.totalPatients} accent="plum" />
            <StatCard title="Sessões da semana" value={stats.sessionsThisWeek} accent="gold" />
            <StatCard title="Pacientes ativos" value={stats.activePatients} accent="emerald" />
            <StatCard title="Tratamentos finalizados" value={stats.finishedPatients} accent="noble" />
          </>
        )}
      </div>

      {!loadingPatients && patients.length === 0 && (
        <EmptyState
          title="Nenhum paciente cadastrado"
          description="Comece cadastrando pacientes para visualizar os indicadores clínicos no dashboard."
        />
      )}
    </div>
  )
}

export default DashboardPage
