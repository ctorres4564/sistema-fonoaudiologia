import { useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import StatCard from '../components/common/StatCard'
import EmptyState from '../components/common/EmptyState'
import { getDashboardStats } from '../utils/patient'

function DashboardPage() {
  const { patients } = useOutletContext()

  const stats = useMemo(() => getDashboardStats(patients), [patients])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-noble-800">Dashboard</h2>
        <p className="text-sm text-noble-500">Visão geral dos indicadores do tratamento.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total de pacientes" value={stats.totalPatients} accent="plum" />
        <StatCard title="Sessões da semana" value={stats.sessionsThisWeek} accent="gold" />
        <StatCard title="Pacientes ativos" value={stats.activePatients} accent="emerald" />
        <StatCard title="Tratamentos finalizados" value={stats.finishedPatients} accent="noble" />
      </div>

      {patients.length === 0 && (
        <EmptyState
          title="Nenhum paciente cadastrado"
          description="Comece cadastrando pacientes para visualizar os indicadores clínicos no dashboard."
        />
      )}
    </div>
  )
}

export default DashboardPage
