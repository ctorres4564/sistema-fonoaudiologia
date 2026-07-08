import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import InputField from '../common/InputField'
import { createEvolution, removeEvolution, subscribeEvolutions, updatePatient } from '../../services/patientService'

const initialValues = {
  date: new Date().toISOString().split('T')[0],
  duration: 50,
  notes: '',
  incrementSession: true,
}

function EvolutionModal({ isOpen, onClose, patient }) {
  const [evolutions, setEvolutions] = useState([])
  const [loadingList, setLoadingList] = useState(true)
  const [formValues, setFormValues] = useState(initialValues)
  const [loadingSubmit, setLoadingSubmit] = useState(false)

  // Subescrever nas evoluções em tempo real quando o modal abrir para um paciente
  useEffect(() => {
    if (!isOpen || !patient) return

    setLoadingList(true)
    const unsubscribe = subscribeEvolutions(
      patient.id,
      (data) => {
        setEvolutions(data)
        setLoadingList(false)
      },
      (error) => {
        toast.error('Erro ao carregar histórico de evoluções.')
        console.error(error)
        setLoadingList(false)
      }
    )

    // Resetar formulário
    setFormValues({
      date: new Date().toISOString().split('T')[0],
      duration: 50,
      notes: '',
      incrementSession: true,
    })

    return () => unsubscribe()
  }, [isOpen, patient])

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    const val = type === 'checkbox' ? checked : value
    setFormValues((prev) => ({ ...prev, [name]: val }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!formValues.notes.trim()) {
      toast.error('Por favor, escreva as anotações clínicas da evolução.')
      return
    }

    try {
      setLoadingSubmit(true)

      // 1. Criar o registro de evolução
      await createEvolution(patient.id, {
        date: formValues.date,
        duration: Number(formValues.duration) || 50,
        notes: formValues.notes.trim(),
      })

      // 2. Incrementar a sessão do paciente se selecionado
      if (formValues.incrementSession) {
        const nextCompleted = (Number(patient.completedSessions) || 0) + 1
        const remaining = Math.max((Number(patient.totalSessions) || 0) - nextCompleted, 0)
        const status = remaining > 0 ? 'Ativo' : 'Finalizado'

        await updatePatient(patient.id, {
          completedSessions: nextCompleted,
          remainingSessions: remaining,
          status,
        })
      }

      toast.success('Evolução clínica registrada com sucesso!')

      // Limpar campo de anotações
      setFormValues((prev) => ({
        ...prev,
        notes: '',
      }))
    } catch (error) {
      toast.error('Erro ao registrar evolução.')
      console.error(error)
    } finally {
      setLoadingSubmit(false)
    }
  }

  const handleDelete = async (evolution) => {
    const confirmed = window.confirm('Deseja realmente remover esta evolução?')
    if (!confirmed) return

    try {
      await removeEvolution(patient.id, evolution.id)
      toast.success('Evolução removida.')
    } catch (error) {
      toast.error('Erro ao remover evolução.')
      console.error(error)
    }
  }

  if (!isOpen || !patient) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex h-[90vh] w-full max-w-4xl flex-col rounded-2xl bg-white dark:bg-noble-900 p-6 shadow-2xl transition-colors duration-200">
        {/* Cabeçalho */}
        <div className="mb-4 flex items-center justify-between border-b border-noble-100 dark:border-noble-800 pb-3">
          <div>
            <h3 className="text-xl font-bold text-noble-800 dark:text-noble-100">Evolução Clínica</h3>
            <p className="text-sm text-noble-500 dark:text-noble-400">Paciente: <strong className="text-noble-700 dark:text-noble-300">{patient.name}</strong></p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-noble-300 dark:border-noble-700 px-3 py-1.5 text-sm font-semibold text-noble-600 dark:text-noble-400 hover:bg-noble-50 dark:hover:bg-noble-800 transition"
          >
            Fechar
          </button>
        </div>

        {/* Corpo com Grid de Duas Colunas */}
        <div className="grid flex-1 grid-cols-1 gap-6 overflow-hidden md:grid-cols-2">
          {/* Coluna Esquerda: Nova Evolução */}
          <div className="flex flex-col border-r border-noble-100 dark:border-noble-800 pr-0 md:pr-6 overflow-y-auto">
            <h4 className="mb-4 text-base font-bold text-noble-800 dark:text-noble-100">Registrar Sessão</h4>
            <form onSubmit={handleSubmit} className="space-y-4">
              <InputField
                label="Data da Sessão"
                type="date"
                name="date"
                value={formValues.date}
                onChange={handleChange}
                required
              />
              <InputField
                label="Duração (minutos)"
                type="number"
                name="duration"
                value={formValues.duration}
                onChange={handleChange}
                required
              />
              <InputField
                label="Anotações Clínicas"
                type="textarea"
                name="notes"
                value={formValues.notes}
                onChange={handleChange}
                placeholder="Descreva as atividades, progresso e comportamento do paciente durante a sessão..."
                required
              />

              <div className="flex items-center gap-2 rounded-xl bg-plum-50/50 dark:bg-plum-950/20 p-3.5 border border-plum-100 dark:border-plum-900/60">
                <input
                  type="checkbox"
                  id="incrementSession"
                  name="incrementSession"
                  checked={formValues.incrementSession}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-noble-300 dark:border-noble-700 text-plum-600 focus:ring-plum-500"
                />
                <label htmlFor="incrementSession" className="text-xs font-semibold text-plum-900 dark:text-plum-300 cursor-pointer">
                  Incrementar automaticamente +1 sessão realizada no cadastro do paciente.
                </label>
              </div>

              <button
                type="submit"
                disabled={loadingSubmit}
                className="w-full rounded-xl bg-plum-600 py-3 text-sm font-semibold text-white transition hover:bg-plum-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingSubmit ? 'Registrando...' : 'Registrar Evolução'}
              </button>
            </form>
          </div>

          {/* Coluna Direita: Histórico */}
          <div className="flex flex-col overflow-y-auto">
            <h4 className="mb-4 text-base font-bold text-noble-800 dark:text-noble-100">Histórico de Atendimentos</h4>
            {loadingList ? (
              <div className="flex flex-1 items-center justify-center py-10">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-plum-200 border-t-plum-600" />
              </div>
            ) : evolutions.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
                <p className="text-sm font-medium text-noble-500 dark:text-noble-400">Nenhuma evolução registrada para este paciente.</p>
                <p className="text-xs text-noble-400 dark:text-noble-500 mt-1">Utilize o formulário ao lado para registrar o primeiro atendimento.</p>
              </div>
            ) : (
              <div className="space-y-4 pr-1">
                {evolutions.map((evol) => {
                  // Formatando data para exibição pt-BR
                  const [year, month, day] = evol.date.split('-')
                  const formattedDate = `${day}/${month}/${year}`

                  return (
                    <div
                      key={evol.id}
                      className="rounded-xl border border-noble-200 dark:border-noble-800 bg-white dark:bg-noble-950 p-4 shadow-sm relative group hover:border-noble-300 dark:hover:border-noble-700 transition-all duration-200"
                    >
                      <button
                        type="button"
                        onClick={() => handleDelete(evol)}
                        className="absolute right-3 top-3 text-xs text-red-500 opacity-0 group-hover:opacity-100 transition hover:underline"
                      >
                        Excluir
                      </button>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="rounded bg-noble-100 dark:bg-noble-800 px-2 py-0.5 text-xs font-semibold text-noble-600 dark:text-noble-300">
                          {formattedDate}
                        </span>
                        <span className="text-xs text-noble-500 dark:text-noble-400">
                          {evol.duration} min
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap text-sm text-noble-700 dark:text-noble-300 leading-relaxed font-sans">{evol.notes}</p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default EvolutionModal
