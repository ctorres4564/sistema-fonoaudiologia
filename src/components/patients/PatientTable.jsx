import { calculateRemainingSessions, getPatientStatus } from '../../utils/patient'

function PatientTable({ patients, onEdit, onDelete, onEvolution }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-noble-200 dark:border-noble-800 bg-white dark:bg-noble-900 shadow-card transition-colors duration-200">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-noble-200 dark:divide-noble-800 text-sm">
          <thead className="bg-noble-100 dark:bg-noble-800/60">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-noble-700 dark:text-noble-300">Paciente</th>
              <th className="px-4 py-3 text-left font-semibold text-noble-700 dark:text-noble-300">Telefone</th>
              <th className="px-4 py-3 text-left font-semibold text-noble-700 dark:text-noble-300">Sessões</th>
              <th className="px-4 py-3 text-left font-semibold text-noble-700 dark:text-noble-300">Status</th>
              <th className="px-4 py-3 text-right font-semibold text-noble-700 dark:text-noble-300">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-noble-100 dark:divide-noble-800">
            {patients.map((patient) => {
              const remaining = calculateRemainingSessions(patient.totalSessions, patient.completedSessions)
              const status = getPatientStatus(patient)

              return (
                <tr key={patient.id} className="hover:bg-plum-50/40 dark:hover:bg-plum-950/10">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-noble-800 dark:text-noble-100">{patient.name}</p>
                    <p className="text-xs text-noble-500 dark:text-noble-400">Responsável: {patient.guardian}</p>
                  </td>
                  <td className="px-4 py-3 text-noble-700 dark:text-noble-300">{patient.phone}</td>
                  <td className="px-4 py-3 text-noble-700 dark:text-noble-300">
                    <p>Total: {patient.totalSessions}</p>
                    <p>Realizadas: {patient.completedSessions}</p>
                    <p className="font-semibold text-plum-700 dark:text-plum-400">Restantes: {remaining}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        status === 'Ativo'
                          ? 'bg-emerald-100 dark:bg-emerald-950/40 bg-emerald-100 text-emerald-700 dark:text-emerald-400'
                          : 'bg-gold-100 dark:bg-gold-950/40 text-gold-700 dark:text-gold-400'
                      }`}
                    >
                      {status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onEvolution(patient)}
                        className="rounded-lg bg-plum-600 px-3 py-1.5 font-medium text-white hover:bg-plum-700 transition"
                      >
                        Evolução
                      </button>
                      <button
                        type="button"
                        onClick={() => onEdit(patient)}
                        className="rounded-lg border border-plum-300 dark:border-plum-700 px-3 py-1.5 font-medium text-plum-700 dark:text-plum-400 hover:bg-plum-50 dark:hover:bg-plum-950/20 transition"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(patient)}
                        className="rounded-lg border border-red-300 dark:border-red-900/60 px-3 py-1.5 font-medium text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition"
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default PatientTable
