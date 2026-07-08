function EmptyState({ title, description }) {
  return (
    <div className="rounded-2xl border border-dashed border-plum-300 dark:border-plum-900/60 bg-plum-50 dark:bg-plum-950/15 p-8 text-center transition-colors duration-200">
      <h3 className="text-lg font-semibold text-plum-700 dark:text-plum-300">{title}</h3>
      <p className="mt-2 text-sm text-plum-600 dark:text-plum-400">{description}</p>
    </div>
  )
}

export default EmptyState
