import { useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import StatCard from '../components/common/StatCard'
import SkeletonCard from '../components/common/SkeletonCard'
import EmptyState from '../components/common/EmptyState'
import { getDashboardStats } from '../utils/patient'

function DashboardPage() {
  const { patients = [], loadingPatients, schedules = [], loadingSchedules } = useOutletContext()

  const stats = useMemo(() => getDashboardStats(patients), [patients])

  // Painel de Alertas Clínicos
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

  // Gráfico 1: Agrupamento de Atendimentos por Dia da Semana Corrente (Segunda a Sábado)
  const weeklyAnalytics = useMemo(() => {
    const daysData = [
      { key: 1, label: 'Seg', count: 0 },
      { key: 2, label: 'Ter', count: 0 },
      { key: 3, label: 'Qua', count: 0 },
      { key: 4, label: 'Qui', count: 0 },
      { key: 5, label: 'Sex', count: 0 },
      { key: 6, label: 'Sáb', count: 0 },
    ]

    const today = new Date()
    const dayOfWeek = today.getDay()
    
    // Obter a segunda-feira desta semana
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
    startOfWeek.setHours(0, 0, 0, 0)

    // Obter o sábado desta semana
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 5)
    endOfWeek.setHours(23, 59, 59, 999)

    schedules.forEach((sch) => {
      if (!sch.date) return
      // Criar data local a partir de YYYY-MM-DD
      const schDate = new Date(sch.date + 'T00:00:00')
      if (schDate >= startOfWeek && schDate <= endOfWeek) {
        const day = schDate.getDay() // 0 = Dom, 1 = Seg, ...
        if (day >= 1 && day <= 6) {
          daysData[day - 1].count++
        }
      }
    })

    return daysData
  }, [schedules])

  // Gráfico 2: Distribuição por Tipo de Atendimento
  const typeAnalytics = useMemo(() => {
    const counts = { Terapia: 0, Avaliação: 0, Retorno: 0 }
    
    schedules.forEach((sch) => {
      if (counts[sch.sessionType] !== undefined) {
        counts[sch.sessionType]++
      }
    })

    const total = counts.Terapia + counts.Avaliação + counts.Retorno
    return {
      counts,
      total,
      percentages: {
        Terapia: total > 0 ? Math.round((counts.Terapia / total) * 100) : 0,
        Avaliação: total > 0 ? Math.round((counts.Avaliação / total) * 100) : 0,
        Retorno: total > 0 ? Math.round((counts.Retorno / total) * 100) : 0,
      }
    }
  }, [schedules])

  // Valor máximo para a escala do gráfico de barras
  const maxWeeklyCount = useMemo(() => {
    const counts = weeklyAnalytics.map((d) => d.count)
    return Math.max(...counts, 1)
  }, [weeklyAnalytics])

  const isLoading = loadingPatients || loadingSchedules

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <h2 className="text-2xl font-bold text-noble-800 dark:text-noble-100">Dashboard</h2>
        <p className="text-sm text-noble-500 dark:text-noble-400">Visão geral dos indicadores do tratamento.</p>
      </div>

      {/* Painel de Alertas */}
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

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading ? (
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

      {/* Seção de Gráficos e Analytics */}
      {!isLoading && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Gráfico 1: Atendimentos da Semana (SVG) */}
          <div className="rounded-2xl border border-noble-200 dark:border-noble-800 bg-white dark:bg-noble-900 p-5 shadow-card transition-colors duration-200">
            <h3 className="text-base font-bold text-noble-800 dark:text-noble-100 mb-1">Consultas da Semana</h3>
            <p className="text-xs text-noble-500 dark:text-noble-400 mb-6">Atendimentos agendados por dia da semana corrente.</p>

            <div className="flex h-48 items-end justify-between px-2">
              {weeklyAnalytics.map((item) => {
                const percentage = (item.count / maxWeeklyCount) * 100
                return (
                  <div key={item.label} className="flex flex-1 flex-col items-center gap-2">
                    {/* Exibição da contagem acima da barra */}
                    <span className="text-xs font-bold text-noble-700 dark:text-noble-300">
                      {item.count}
                    </span>
                    {/* Barra Animada */}
                    <div className="w-8 sm:w-10 bg-neutral-100 dark:bg-noble-800 rounded-t-lg h-32 flex items-end overflow-hidden">
                      <div
                        style={{ height: `${percentage}%` }}
                        className="w-full bg-plum-600 dark:bg-plum-500 rounded-t-lg transition-all duration-500"
                      />
                    </div>
                    {/* Dia da semana */}
                    <span className="text-xs font-medium text-noble-500 dark:text-noble-400">
                      {item.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Gráfico 2: Distribuição por Tipo de Atendimento */}
          <div className="rounded-2xl border border-noble-200 dark:border-noble-800 bg-white dark:bg-noble-900 p-5 shadow-card transition-colors duration-200 flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-noble-800 dark:text-noble-100 mb-1">Distribuição de Consultas</h3>
              <p className="text-xs text-noble-500 dark:text-noble-400 mb-6">Proporção por categoria de atendimento domiciliar.</p>
            </div>

            {typeAnalytics.total === 0 ? (
              <div className="flex flex-1 items-center justify-center py-8 text-center text-xs text-noble-400">
                Nenhum agendamento cadastrado para gerar estatísticas.
              </div>
            ) : (
              <div className="space-y-4">
                {/* Terapia */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-plum-700 dark:text-plum-300">Terapia</span>
                    <span className="text-noble-600 dark:text-noble-400">
                      {typeAnalytics.counts.Terapia} ({typeAnalytics.percentages.Terapia}%)
                    </span>
                  </div>
                  <div className="h-3 w-full bg-neutral-100 dark:bg-noble-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${typeAnalytics.percentages.Terapia}%` }}
                      className="h-full bg-plum-600 dark:bg-plum-500 rounded-full transition-all duration-500"
                    />
                  </div>
                </div>

                {/* Avaliação */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-emerald-700 dark:text-emerald-300 font-bold">Avaliação</span>
                    <span className="text-noble-600 dark:text-noble-400">
                      {typeAnalytics.counts.Avaliação} ({typeAnalytics.percentages.Avaliação}%)
                    </span>
                  </div>
                  <div className="h-3 w-full bg-neutral-100 dark:bg-noble-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${typeAnalytics.percentages.Avaliação}%` }}
                      className="h-full bg-emerald-650 dark:bg-emerald-500 rounded-full transition-all duration-500"
                    />
                  </div>
                </div>

                {/* Retorno */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-gold-650 dark:text-gold-400 font-bold">Retorno</span>
                    <span className="text-noble-600 dark:text-noble-400">
                      {typeAnalytics.counts.Retorno} ({typeAnalytics.percentages.Retorno}%)
                    </span>
                  </div>
                  <div className="h-3 w-full bg-neutral-100 dark:bg-noble-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${typeAnalytics.percentages.Retorno}%` }}
                      className="h-full bg-gold-500 rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Estado Vazio */}
      {!isLoading && patients.length === 0 && (
        <EmptyState
          title="Nenhum paciente cadastrado"
          description="Comece cadastrando pacientes para visualizar os indicadores clínicos no dashboard."
        />
      )}
    </div>
  )
}

export default DashboardPage
