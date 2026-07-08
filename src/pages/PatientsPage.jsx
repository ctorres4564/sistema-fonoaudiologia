import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import toast from 'react-hot-toast'
import EmptyState from '../components/common/EmptyState'
import SkeletonTable from '../components/common/SkeletonTable'
import PatientFormModal from '../components/patients/PatientFormModal'
import PatientTable from '../components/patients/PatientTable'
import EvolutionModal from '../components/patients/EvolutionModal'
import { useAuth } from '../contexts/useAuth'
import { createPatient, removePatient, updatePatient } from '../services/patientService'
import { normalizePatientPayload } from '../utils/patient'
import { onlyDigits } from '../utils/validators'

function PatientsPage() {
  const { user, userProfile } = useAuth()
  const { patients = [], loadingPatients } = useOutletContext()
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [loadingForm, setLoadingForm] = useState(false)

  // Estados para o modal de evoluções
  const [isEvolutionOpen, setIsEvolutionOpen] = useState(false)
  const [evolutionPatient, setEvolutionPatient] = useState(null)

  const filteredPatients = useMemo(() => {
    const term = search.toLowerCase().trim()
    const termDigits = onlyDigits(search)

    return patients.filter((patient) => {
      const byName = patient.name?.toLowerCase().includes(term)
      const byPhone = onlyDigits(patient.phone || '').includes(termDigits)
      return byName || (termDigits && byPhone)
    })
  }, [patients, search])

  const openCreateModal = () => {
    setSelectedPatient(null)
    setIsModalOpen(true)
  }

  const openEditModal = (patient) => {
    setSelectedPatient(patient)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedPatient(null)
  }

  const openEvolutionModal = (patient) => {
    setEvolutionPatient(patient)
    setIsEvolutionOpen(true)
  }

  const closeEvolutionModal = () => {
    setIsEvolutionOpen(false)
    setEvolutionPatient(null)
  }

  const handleSavePatient = async (values) => {
    try {
      setLoadingForm(true)
      const payload = normalizePatientPayload(values, user.uid)

      if (selectedPatient) {
        await updatePatient(selectedPatient.id, payload)
        toast.success('Paciente atualizado com sucesso!')
      } else {
        if (userProfile?.plan !== 'premium' && patients.length >= 5) {
          toast.error('Limite do plano de demonstração atingido! Você pode cadastrar até 5 pacientes. Entre em contato para ativar o plano comercial ilimitado.', { duration: 6000 })
          setLoadingForm(false)
          return
        }
        await createPatient(payload)
        toast.success('Paciente cadastrado com sucesso!')
      }

      closeModal()
    } catch (error) {
      toast.error('Ocorreu um erro ao salvar o paciente.')
      console.error(error)
    } finally {
      setLoadingForm(false)
    }
  }

  const handleDeletePatient = async (patient) => {
    const confirmed = window.confirm(`Deseja realmente excluir ${patient.name}?`)
    if (!confirmed) return

    try {
      await removePatient(patient.id)
      toast.success('Paciente removido com sucesso.')
    } catch (error) {
      toast.error('Não foi possível remover o paciente.')
      console.error(error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-noble-200 dark:border-noble-800 bg-white dark:bg-noble-900 p-5 shadow-card md:flex-row md:items-center md:justify-between transition-colors duration-200">
        <div>
          <h2 className="text-2xl font-bold text-noble-800 dark:text-noble-100">Pacientes</h2>
          <p className="text-sm text-noble-500 dark:text-noble-400">Cadastro completo, controle de sessões e evolução clínica.</p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="rounded-xl bg-plum-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-plum-700"
        >
          + Novo paciente
        </button>
      </div>

      <div className="rounded-2xl border border-noble-200 dark:border-noble-800 bg-white dark:bg-noble-900 p-4 shadow-card transition-colors duration-200">
        <label className="text-xs uppercase tracking-wide text-noble-500 dark:text-noble-400">Pesquisar por nome ou telefone</label>
        <input
          type="text"
          placeholder="Ex.: Maria ou (11) 99999-9999"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="mt-2 w-full rounded-xl border border-noble-200 dark:border-noble-700 bg-white dark:bg-noble-800 text-noble-800 dark:text-noble-100 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-plum-300 transition-colors duration-200"
        />
      </div>

      {loadingPatients ? (
        <SkeletonTable />
      ) : filteredPatients.length > 0 ? (
        <PatientTable
          patients={filteredPatients}
          onEdit={openEditModal}
          onDelete={handleDeletePatient}
          onEvolution={openEvolutionModal}
        />
      ) : (
        <EmptyState
          title={patients.length === 0 ? 'Nenhum paciente cadastrado' : 'Nenhum resultado encontrado'}
          description={
            patients.length === 0
              ? 'Cadastre o primeiro paciente para iniciar o controle de tratamento.'
              : 'Ajuste os termos da busca para encontrar seus pacientes.'
          }
        />
      )}

      <PatientFormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={handleSavePatient}
        loading={loadingForm}
        patient={selectedPatient}
      />

      <EvolutionModal
        isOpen={isEvolutionOpen}
        onClose={closeEvolutionModal}
        patient={evolutionPatient}
      />
    </div>
  )
}

export default PatientsPage
