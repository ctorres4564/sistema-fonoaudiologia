import { getConsentMessages } from '../../utils/aiPrivacy'

function AIConsentModal({ isOpen, onConfirm, onCancel, actionLabel }) {
  if (!isOpen) return null

  const messages = getConsentMessages()

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-noble-900 p-6 shadow-2xl transition-colors duration-200">
        <h3 className="text-lg font-bold text-noble-800 dark:text-noble-100 mb-2">
          {messages.title}
        </h3>

        <div className="space-y-3 mb-6">
          {messages.body.map((text, idx) => (
            <p key={idx} className="text-sm text-noble-700 dark:text-noble-300 leading-relaxed">
              {text}
            </p>
          ))}
        </div>

        {actionLabel && (
          <p className="text-xs font-semibold text-plum-600 dark:text-plum-400 bg-plum-50 dark:bg-plum-950/20 rounded-xl px-4 py-2 mb-6">
            Ação solicitada: {actionLabel}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-noble-300 dark:border-noble-700 px-5 py-2.5 text-sm font-semibold text-noble-700 dark:text-noble-300 hover:bg-noble-50 dark:hover:bg-noble-800 transition"
          >
            {messages.cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => onConfirm()}
            className="rounded-lg bg-plum-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-plum-700"
          >
            {messages.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AIConsentModal
