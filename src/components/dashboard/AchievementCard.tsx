import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/format'
import { Shape, type ShapeName } from '@/components/ui/icons'
import type { Achievement } from '@/types'

const SHAPES: ShapeName[] = ['square', 'circle', 'triangle', 'bolt', 'diamond', 'ring']

/** Deterministic geometric shape for an achievement code (no hand-drawn art). */
export function shapeFor(code: string): ShapeName {
  let hash = 0
  for (let i = 0; i < code.length; i++) hash = (hash + code.charCodeAt(i)) % SHAPES.length
  return SHAPES[hash]
}

export function AchievementCard({ achievement }: { achievement: Achievement }) {
  const { unlocked, name, description, code, achievedAt } = achievement
  return (
    <div
      className={cn(
        'flex w-[158px] shrink-0 snap-start flex-col gap-2.5 rounded border border-mono-e5 p-3.5',
        unlocked ? 'bg-mono-w' : 'bg-mono-f5',
      )}
    >
      <div
        className={cn(
          'grid h-[34px] w-[34px] place-items-center rounded',
          unlocked
            ? 'bg-mono-0 text-white'
            : 'border-[1.5px] border-dashed border-mono-c bg-mono-w text-mono-c',
        )}
      >
        <Shape name={shapeFor(code)} />
      </div>
      <div>
        <div className={cn('text-[12.5px] font-semibold leading-tight', !unlocked && 'text-mono-9')}>
          {name}
        </div>
        <div className="mt-0.5 text-[11px] leading-snug text-mono-9">{description}</div>
      </div>
      <div
        className={cn(
          'mt-auto font-mono text-[9.5px] uppercase tracking-[0.06em]',
          unlocked ? 'text-mono-1' : 'text-mono-9',
        )}
      >
        {unlocked ? `✓ ${achievedAt ? formatDate(achievedAt) : 'Unlocked'}` : 'Locked'}
      </div>
    </div>
  )
}
