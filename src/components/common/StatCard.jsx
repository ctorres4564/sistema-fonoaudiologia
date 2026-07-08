function StatCard({ title, value, helper, accent = 'plum' }) {
  const accentClasses = {
    plum: 'from-plum-600 to-plum-700',
    gold: 'from-gold-400 to-gold-500',
    noble: 'from-noble-700 to-noble-800',
    emerald: 'from-emerald-500 to-emerald-600',
  }

  return (
    <article className="rounded-2xl border border-noble-100 dark:border-noble-800 bg-white dark:bg-noble-900 p-5 shadow-card transition-colors duration-200">
      <div className={`mb-4 h-1.5 w-16 rounded-full bg-gradient-to-r ${accentClasses[accent] || accentClasses.plum}`} />
      <h3 className="text-sm font-semibold uppercase tracking-wide text-noble-500 dark:text-noble-400">{title}</h3>
      <p className="mt-2 text-3xl font-bold text-noble-800 dark:text-noble-100">{value}</p>
      {helper && <p className="mt-2 text-xs text-noble-500 dark:text-noble-400">{helper}</p>}
    </article>
  )
}

export default StatCard
