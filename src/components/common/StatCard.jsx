function StatCard({ title, value, helper, accent = 'plum' }) {
  const accentClasses = {
    plum: 'from-plum-600 to-plum-700',
    gold: 'from-gold-400 to-gold-500',
    noble: 'from-noble-700 to-noble-800',
    emerald: 'from-emerald-500 to-emerald-600',
  }

  return (
    <article className="rounded-2xl border border-noble-100 bg-white p-5 shadow-card">
      <div className={`mb-4 h-1.5 w-16 rounded-full bg-gradient-to-r ${accentClasses[accent] || accentClasses.plum}`} />
      <h3 className="text-sm font-semibold uppercase tracking-wide text-noble-500">{title}</h3>
      <p className="mt-2 text-3xl font-bold text-noble-800">{value}</p>
      {helper && <p className="mt-2 text-xs text-noble-500">{helper}</p>}
    </article>
  )
}

export default StatCard
