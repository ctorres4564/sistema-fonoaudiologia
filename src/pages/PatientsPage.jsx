import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import toast from 'react-hot-toast'
import EmptyState from '../components/common/EmptyState'
import PatientFormModal from '../components/patients/PatientFormModal'
import PatientTable from '../components/patients/PatientTable'
import { useAuth } from '../contexts/useAuth'
import { createPatient, removePatient, updatePatient } from '../services/patientService'
import { normalizePatientPayload } from '../utils/patient'
import { onlyDigits } from '../utils/validators'

function PatientsPage() {
  const { user } = useAuth()
  const { patients } = useOutletContext()
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [loadingForm, setLoadingForm] = useState(false)

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

  const handleSavePatient = async (values) => {
    try {
      setLoadingForm(true)
      const payload = normalizePatientPayload(values, user.uid)

      if (selectedPatient) {
        await updatePatient(selectedPatient.id, payload)
        toast.success('Paciente atualizado com sucesso!')
      } else {
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
      <div className="flex flex-col gap-4 rounded-2xl border border-noble-200 bg-white p-5 shadow-card md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-noble-800">Pacientes</h2>
          <p className="text-sm text-noble-500">Cadastro completo, controle de sessões e evolução clínica.</p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="rounded-xl bg-plum-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-plum-700"
        >
          + Novo paciente
        </button>
      </div>

      <div className="rounded-2xl border border-noble-200 bg-white p-4 shadow-card">
        <label className="text-xs uppercase tracking-wide text-noble-500">Pesquisar por nome ou telefone</label>
        <input
          type="text"
          placeholder="Ex.: Maria ou (11) 99999-9999"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="mt-2 w-full rounded-xl border border-noble-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-plum-300"
        />
      </div>

      {filteredPatients.length > 0 ? (
        <PatientTable patients={filteredPatients} onEdit={openEditModal} onDelete={handleDeletePatient} />
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
    </div>
  )
}

export default PatientsPage
