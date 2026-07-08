function SkeletonTable({ rows = 5 }) {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-noble-200 bg-white shadow-card">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-noble-200 text-sm">
          <thead className="bg-noble-100">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-noble-700">Paciente</th>
              <th className="px-4 py-3 text-left font-semibold text-noble-700">Telefone</th>
              <th className="px-4 py-3 text-left font-semibold text-noble-700">Sessões</th>
              <th className="px-4 py-3 text-left font-semibold text-noble-700">Status</th>
              <th className="px-4 py-3 text-right font-semibold text-noble-700">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-noble-100">
            {Array.from({ length: rows }).map((_, idx) => (
              <tr key={idx}>
                <td className="px-4 py-4">
                  <div className="h-4 w-40 rounded bg-noble-200" />
                  <div className="mt-2 h-3 w-28 rounded bg-noble-200" />
                </td>
                <td className="px-4 py-4">
                  <div className="h-4 w-32 rounded bg-noble-200" />
                </td>
                <td className="px-4 py-4 space-y-2">
                  <div className="h-3.5 w-24 rounded bg-noble-200" />
                  <div className="h-3.5 w-20 rounded bg-noble-200" />
                  <div className="h-3.5 w-28 rounded bg-noble-200" />
                </td>
                <td className="px-4 py-4">
                  <div className="h-6 w-16 rounded-full bg-noble-200" />
                </td>
                <td className="px-4 py-4">
                  <div className="flex justify-end gap-2">
                    <div className="h-8 w-16 rounded-lg bg-noble-200" />
                    <div className="h-8 w-16 rounded-lg bg-noble-200" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default SkeletonTable
