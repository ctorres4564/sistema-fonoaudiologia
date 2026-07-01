function EmptyState({ title, description }) {
  return (
    <div className="rounded-2xl border border-dashed border-plum-300 bg-plum-50 p-8 text-center">
      <h3 className="text-lg font-semibold text-plum-700">{title}</h3>
      <p className="mt-2 text-sm text-plum-600">{description}</p>
    </div>
  )
}

export default EmptyState
