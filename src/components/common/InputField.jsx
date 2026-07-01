function InputField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  placeholder,
  required = false,
  min,
  rows,
}) {
  const sharedClasses = `w-full rounded-xl border px-4 py-2.5 text-sm text-noble-800 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-plum-300 ${
    error ? 'border-red-400 bg-red-50' : 'border-noble-200 bg-white'
  }`

  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-noble-700">
        {label}
        {required && <span className="ml-1 text-gold-500">*</span>}
      </span>
      {type === 'textarea' ? (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={rows ?? 3}
          className={sharedClasses}
        />
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          min={min}
          className={sharedClasses}
        />
      )}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </label>
  )
}

export default InputField
