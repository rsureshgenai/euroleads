'use client'

import { CheckCircle2, XCircle, X } from 'lucide-react'

export type EmailSendResult =
  | { status: 'success'; companyName: string; email: string }
  | { status: 'error'; companyName: string; message: string }

export default function EmailSentModal({
  result,
  onClose,
}: {
  result: EmailSendResult | null
  onClose: () => void
}) {
  if (!result) return null

  const isSuccess = result.status === 'success'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-lg border border-ink-200 bg-white p-6">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-md p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-600"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className="flex flex-col items-center text-center">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-md ${
              isSuccess ? 'bg-sage-50 text-sage-600' : 'bg-red-50 text-red-600'
            }`}
          >
            {isSuccess ? <CheckCircle2 size={26} /> : <XCircle size={26} />}
          </div>

          <h3 className="mt-4 text-base font-semibold text-ink-900">
            {isSuccess ? 'Email sent' : 'Email failed to send'}
          </h3>

          {isSuccess ? (
            <p className="mt-1 text-sm text-ink-500">
              {result.companyName} · {result.email}
            </p>
          ) : (
            <p className="mt-1 text-sm text-ink-500">
              {result.companyName} — {result.message}
            </p>
          )}

          <button onClick={onClose} className="btn-primary mt-5 w-full">
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
