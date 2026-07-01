function LoadingSpinner({ text = 'Carregando...' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-10 text-plum-700">
      <div className="h-6 w-6 animate-spin rounded-full border-4 border-plum-200 border-t-plum-600" />
      <span className="font-medium">{text}</span>
    </div>
  )
}

export default LoadingSpinner
