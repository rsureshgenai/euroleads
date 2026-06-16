'use client'

import { useState } from 'react'
import { X, Plus } from 'lucide-react'

export default function TagInput({
  label,
  items,
  onChange,
  placeholder,
}: {
  label: string
  items: string[]
  onChange: (items: string[]) => void
  placeholder: string
}) {
  const [value, setValue] = useState('')

  function addItem() {
    const trimmed = value.trim()
    if (trimmed && !items.includes(trimmed)) {
      onChange([...items, trimmed])
    }
    setValue('')
  }

  function removeItem(item: string) {
    onChange(items.filter((i) => i !== item))
  }

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-ink-700">{label}</label>
      <div className="mb-2 flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className="flex items-center gap-1.5 rounded-md bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700"
          >
            {item}
            <button onClick={() => removeItem(item)} className="text-brand-400 hover:text-brand-700">
              <X size={12} />
            </button>
          </span>
        ))}
        {items.length === 0 && <span className="text-xs text-ink-400">None added yet</span>}
      </div>
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addItem()
            }
          }}
          placeholder={placeholder}
          className="input-base"
        />
        <button onClick={addItem} type="button" className="btn-secondary px-3">
          <Plus size={16} />
        </button>
      </div>
    </div>
  )
}
