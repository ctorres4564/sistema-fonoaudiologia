import { useEffect, useMemo, useState } from 'react'
import InputField from '../common/InputField'
import { calculateRemainingSessions } from '../../utils/patient'
import { formatPhone, validatePatientForm } from '../../utils/validators'

const initialValues = {
  name: '',
  address: '',
  phone: '',
  birthDate: '',
  guardian: '',
  notes: '',
  sessionsPerWeek: 1,
  totalSessions: 1,
  completedSessions: 0,
}

function PatientFormModal({ isOpen, onClose, onSubmit, loading, patient }) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (patient) {
      setValues({
        name: patient.name ?? '',
        address: patient.address ?? '',
        phone: patient.phone ?? '',
        birthDate: patient.birthDate ?? '',
        guardian: patient.guardian ?? '',
        notes: patient.notes ?? '',
        sessionsPerWeek: patient.sessionsPerWeek ?? 1,
        totalSessions: patient.totalSessions ?? 1,
        completedSessions: patient.completedSessions ?? 0,
      })
      setErrors({})
      return
    }

    setValues(initialValues)
    setErrors({})
  }, [patient, isOpen])

  const remainingSessions = useMemo(
    () => calculateRemainingSessions(values.totalSessions, values.completedSessions),
    [values.totalSessions, values.completedSessions],
  )

  const handleChange = (event) => {
    const { name, value } = event.target
    const nextValue = name === 'phone' ? formatPhone(value) : value

    setValues((prev) => ({ ...prev, [name]: nextValue }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const validationErrors = validatePatientForm(values)
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) return

    onSubmit(values)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[95vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white dark:bg-noble-900 p-6 shadow-2xl transition-colors duration-200">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xl font-bold text-noble-800 dark:text-noble-100">
            {patient ? 'Editar paciente' : 'Novo paciente'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-noble-300 dark:border-noble-700 px-3 py-1.5 text-sm text-noble-600 dark:text-noble-450 hover:bg-noble-50 dark:hover:bg-noble-800 transition"
          >
            Fechar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <InputField label="Nome completo" name="name" value={values.name} onChange={handleChange} error={errors.name} required />
          <InputField label="Telefone" name="phone" value={values.phone} onChange={handleChange} error={errors.phone} placeholder="(11) 99999-9999" required />
          <InputField label="Data de nascimento" type="date" name="birthDate" value={values.birthDate} onChange={handleChange} error={errors.birthDate} required />
          <InputField label="Responsável" name="guardian" value={values.guardian} onChange={handleChange} error={errors.guardian} required />
          <div className="md:col-span-2">
            <InputField label="Endereço" name="address" value={values.address} onChange={handleChange} error={errors.address} required />
          </div>
          <InputField label="Sessões por semana" type="number" min={1} name="sessionsPerWeek" value={values.sessionsPerWeek} onChange={handleChange} error={errors.sessionsPerWeek} required />
          <InputField label="Total contratado" type="number" min={1} name="totalSessions" value={values.totalSessions} onChange={handleChange} error={errors.totalSessions} required />
          <InputField label="Sessões realizadas" type="number" min={0} name="completedSessions" value={values.completedSessions} onChange={handleChange} error={errors.completedSessions} required />

          <div className="rounded-xl border border-gold-200 dark:border-gold-900/60 bg-gold-100/40 dark:bg-gold-950/10 p-4 transition-colors duration-200">
            <p className="text-xs uppercase tracking-wide text-gold-600 dark:text-gold-400">Sessões restantes</p>
            <p className="text-2xl font-bold text-gold-600 dark:text-gold-400">{remainingSessions}</p>
          </div>

          <div className="md:col-span-2">
            <InputField
              label="Observações"
              type="textarea"
              name="notes"
              value={values.notes}
              onChange={handleChange}
              placeholder="Observações clínicas e de evolução"
            />
          </div>

          <div className="md:col-span-2 flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-noble-300 dark:border-noble-700 px-5 py-2.5 text-sm font-semibold text-noble-700 dark:text-noble-300 hover:bg-noble-50 dark:hover:bg-noble-800 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-plum-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-plum-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Salvando...' : patient ? 'Salvar alterações' : 'Cadastrar paciente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PatientFormModal
