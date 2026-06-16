import { STAGES, type Stage } from '@/types'
import { stageBarColor } from '@/lib/utils'

export default function PipelineStrip({ counts }: { counts: Record<Stage, number> }) {
  const total = STAGES.reduce((sum, s) => sum + (counts[s] ?? 0), 0)

  return (
    <div className="card">
      <h3 className="mb-4 text-sm font-medium text-ink-700">Pipeline overview</h3>

      {total === 0 ? (
        <p className="text-sm text-ink-400">No leads yet.</p>
      ) : (
        <>
          <div className="flex h-3 w-full overflow-hidden rounded-md bg-ink-100">
            {STAGES.map((stage) => {
              const count = counts[stage] ?? 0
              if (count === 0) return null
              const pct = (count / total) * 100
              return (
                <div
                  key={stage}
                  className={`h-full border-r border-white last:border-r-0 ${stageBarColor(stage)}`}
                  style={{ width: `${pct}%` }}
                  title={`${stage}: ${count}`}
                />
              )
            })}
          </div>

          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
            {STAGES.map((stage) => (
              <div key={stage} className="flex items-center gap-1.5 text-xs">
                <span className={`h-2 w-2 rounded-sm ${stageBarColor(stage)}`} />
                <span className="font-medium text-ink-700">{stage}</span>
                <span className="text-ink-400">{counts[stage] ?? 0}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
