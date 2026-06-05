import { useMemo, useState, useRef, useCallback } from 'react'
import { Page, PageHeader, SectionLabel } from '@/components/ui/PageHeader'
import { Segmented } from '@/components/ui/Segmented'
import { CenteredSpinner, ErrorNote } from '@/components/ui/feedback'
import { MetricCard, type Metric } from '@/components/dashboard/MetricCard'
import { AchievementCard } from '@/components/dashboard/AchievementCard'
import { ListPanel } from '@/components/dashboard/ListPanel'
import { useAsync } from '@/hooks/useAsync'
import { getDashboardSummary, updateInterviewCount } from '@/api/dashboard'
import { getApplications, getOverdue } from '@/api/applications'
import { useGamificationStore } from '@/store/gamificationStore'
import { TO_SEND_LATER_STATUS, type Application, type DashboardSummary } from '@/types'

type Variant = 'standard' | 'gamified'

function buildMetrics(summary: DashboardSummary, streakDays: number): Metric[] {
  const total = summary.totalApplications || 0
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0)
  return [
    { label: 'Total Applications', value: total, foot: 'applications tracked', spark: 100 },
    {
      label: 'Waiting Responses',
      value: summary.waitingResponses,
      foot: 'awaiting reply',
      spark: pct(summary.waitingResponses),
    },
    {
      label: 'Interviews',
      value: summary.interviewCount,
      foot: `${summary.interviewsScheduled} scheduled`,
      spark: pct(summary.interviewCount),
    },
    {
      label: 'To Send Later',
      value: summary.toSendLater,
      foot: 'drafts queued',
      spark: pct(summary.toSendLater),
    },
    {
      label: 'Rejection Rate',
      value: `${pct(summary.rejectedCount)}%`,
      foot: `${summary.rejectedCount} rejected`,
      spark: pct(summary.rejectedCount),
    },
    {
      label: 'Avg / Week',
      value: summary.averageWeeklyApplications.toFixed(1),
      foot: 'applications sent',
      spark: Math.min(100, summary.averageWeeklyApplications * 10),
    },
    { label: 'Streak', value: streakDays, foot: 'days active', spark: Math.min(100, streakDays * 9) },
  ]
}

function EditableInterviewCount({
  value,
  foot,
  spark,
  onSave,
}: {
  value: number
  foot: string
  spark: number
  onSave: (n: number) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [input, setInput] = useState('')
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const startEdit = () => {
    setInput(String(value))
    setEditing(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  const cancel = () => setEditing(false)

  const save = async () => {
    const n = parseInt(input, 10)
    if (isNaN(n) || n < 0) return
    setSaving(true)
    try {
      await onSave(n)
    } finally {
      setSaving(false)
      setEditing(false)
    }
  }

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') save()
    if (e.key === 'Escape') cancel()
  }

  return (
    <div className="flex min-w-0 flex-col gap-2 rounded border border-mono-e5 bg-mono-w p-3.5 hover:bg-surface-subtle">
      <div className="flex items-center justify-between">
        <div className="truncate font-mono text-[10px] uppercase tracking-[0.05em] text-mono-9">Interviews</div>
        {!editing && (
          <button
            onClick={startEdit}
            className="font-mono text-[10px] text-mono-9 underline hover:text-mono-0"
          >
            edit
          </button>
        )}
      </div>
      {editing ? (
        <div className="flex items-center gap-1.5">
          <input
            ref={inputRef}
            type="number"
            min={0}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            disabled={saving}
            className="w-16 rounded border border-mono-e5 bg-mono-w px-1.5 py-0.5 font-mono text-[20px] font-semibold leading-none tracking-[-0.02em] focus:outline-none focus:ring-1 focus:ring-mono-0"
          />
          <button onClick={save} disabled={saving} className="font-mono text-[10px] text-mono-0 underline hover:opacity-70">
            {saving ? '…' : 'save'}
          </button>
          <button onClick={cancel} className="font-mono text-[10px] text-mono-9 underline hover:opacity-70">
            cancel
          </button>
        </div>
      ) : (
        <div className="font-mono text-[26px] font-semibold leading-none tracking-[-0.02em]">{value}</div>
      )}
      <div className="mt-0.5 h-[3px] overflow-hidden rounded-full bg-mono-e5">
        <div className="h-full bg-mono-1" style={{ width: `${Math.min(100, Math.max(0, spark))}%` }} />
      </div>
      <div className="flex items-center gap-1.5 text-[11.5px] text-mono-5">{foot}</div>
    </div>
  )
}

export default function Dashboard() {
  const [variant, setVariant] = useState<Variant>('standard')
  const [interviewCountOverride, setInterviewCountOverride] = useState<number | null>(null)
  const profile = useGamificationStore((s) => s.profile)
  const achievements = useGamificationStore((s) => s.achievements)

  const { data, loading, error } = useAsync(
    async () => {
      const [summary, overdue, toSend] = await Promise.all([
        getDashboardSummary(),
        getOverdue().catch(() => [] as Application[]),
        getApplications({ status: TO_SEND_LATER_STATUS, size: 8 })
          .then((p) => p.content)
          .catch(() => [] as Application[]),
      ])
      return { summary, overdue, toSend }
    },
    [],
    'Could not load your dashboard.',
  )

  const handleInterviewCountSave = useCallback(async (n: number) => {
    await updateInterviewCount(n)
    setInterviewCountOverride(n)
  }, [])

  const effectiveInterviewCount =
    interviewCountOverride !== null ? interviewCountOverride : (data?.summary.interviewCount ?? 0)

  const metrics = useMemo(
    () => (data ? buildMetrics({ ...data.summary, interviewCount: effectiveInterviewCount }, profile?.streakDays ?? 0) : []),
    [data, profile?.streakDays, effectiveInterviewCount],
  )

  const unlockedCount = achievements.filter((a) => a.unlocked).length
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <Page>
      <PageHeader
        title="Dashboard"
        sub={`${today} · your job hunt at a glance`}
        actions={
          <Segmented<Variant>
            aria-label="Dashboard variant"
            options={[
              { value: 'standard', label: 'Standard' },
              { value: 'gamified', label: 'Gamified' },
            ]}
            value={variant}
            onChange={setVariant}
          />
        }
      />

      {loading && <CenteredSpinner label="Loading dashboard…" />}
      {error && !loading && <ErrorNote message={error} />}

      {data && !loading && (
        <>
          {variant === 'gamified' && profile && (
            <div className="mb-[22px] flex items-center gap-6 rounded border border-mono-e5 px-[22px] py-5">
              <div className="flex shrink-0 flex-col gap-1">
                <div className="eyebrow">Current rank</div>
                <div className="text-[30px] font-bold tracking-[-0.02em]">Level {profile.level}</div>
                <div className="font-mono text-[12px] text-mono-5">{profile.rankTitle}</div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex justify-between font-mono text-[11px] text-mono-9">
                  <span>{profile.currentXp.toLocaleString()} XP</span>
                  <span>{profile.nextLevelXp.toLocaleString()} XP → Level {profile.level + 1}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-mono-e5">
                  <div
                    className="h-full rounded-full bg-mono-0"
                    style={{ width: `${profile.progressPercentage}%` }}
                  />
                </div>
                <div className="mt-3.5 flex gap-5">
                  <HeroStat value={profile.streakDays} label="Day streak" />
                  <HeroStat value={profile.currentLevelXp} label="Level XP" />
                  <HeroStat value={`${unlockedCount}/${achievements.length || 0}`} label="Achievements" />
                  <HeroStat value={`#${profile.level}`} label="Rank tier" />
                </div>
              </div>
            </div>
          )}

          <div
            className={
              variant === 'standard'
                ? 'grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7'
                : 'grid grid-cols-2 gap-3 sm:grid-cols-4'
            }
          >
            {(variant === 'standard' ? metrics : metrics.slice(0, 4)).map((m) =>
              m.label === 'Interviews' ? (
                <EditableInterviewCount
                  key="Interviews"
                  value={effectiveInterviewCount}
                  foot={`${data!.summary.interviewsScheduled} scheduled`}
                  spark={data!.summary.totalApplications > 0 ? Math.round((effectiveInterviewCount / data!.summary.totalApplications) * 100) : 0}
                  onSave={handleInterviewCountSave}
                />
              ) : (
                <MetricCard key={m.label} {...m} />
              )
            )}
          </div>

          <SectionLabel
            title="Achievements"
            more={achievements.length > 0 ? `${unlockedCount} of ${achievements.length} unlocked →` : undefined}
          />
          {achievements.length === 0 ? (
            <div className="rounded border border-mono-e5 px-4 py-6 text-center font-mono text-[11px] text-mono-9">
              No achievements yet — start applying to earn your first badge.
            </div>
          ) : (
            <div className="flex snap-x snap-proximity gap-3 overflow-x-auto px-px pb-3 pt-1">
              {achievements.map((a) => (
                <AchievementCard key={a.code} achievement={a} />
              ))}
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <ListPanel
              title="To Send Later"
              items={data.toSend}
              viewAllTo="/applications"
              emptyLabel="nothing queued"
            />
            <ListPanel
              title="Overdue Follow-ups"
              items={data.overdue}
              showDue
              viewAllTo="/applications"
              emptyLabel="all caught up"
            />
          </div>
        </>
      )}
    </Page>
  )
}

function HeroStat({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div>
      <div className="font-mono text-[18px] font-semibold">{value}</div>
      <div className="eyebrow">{label}</div>
    </div>
  )
}
