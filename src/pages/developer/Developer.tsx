import { useState } from 'react'
import { Page, PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { getApplications } from '@/api/applications'
import type { Application } from '@/types'

function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function toCsv(apps: Application[]): string {
  const cols: (keyof Application)[] = [
    'vacancyName',
    'organization',
    'recruiterName',
    'status',
    'applicationDate',
    'nextStepDateTime',
  ]
  const escape = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const header = cols.join(',')
  const rows = apps.map((a) => cols.map((c) => escape(a[c])).join(','))
  return [header, ...rows].join('\n')
}

function Card({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 rounded border border-mono-e5">
      <div className="px-[18px] pb-3.5 pt-4">
        <div className="text-[14.5px] font-semibold">{title}</div>
        {sub && <div className="mt-0.5 text-[12.5px] text-mono-9">{sub}</div>}
      </div>
      <hr className="border-mono-e5" />
      <div className="p-[18px]">{children}</div>
    </div>
  )
}

export default function Developer() {
  const [busy, setBusy] = useState<string | null>(null)
  const apiBase = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:8080'

  const exportData = async (format: 'json' | 'csv') => {
    setBusy(format)
    try {
      const page = await getApplications({ size: 1000 })
      if (format === 'json') {
        download('applications.json', JSON.stringify(page.content, null, 2), 'application/json')
      } else {
        download('applications.csv', toCsv(page.content), 'text/csv')
      }
    } finally {
      setBusy(null)
    }
  }

  return (
    <Page>
      <PageHeader title="Developer Tools" sub="API access, data, and local environment" />
      <div className="max-w-settings">
        <Card title="API Access" sub="Base URL and docs for the tracker REST API">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12.5px] font-medium text-mono-2">API base URL</label>
            <div className="flex gap-2">
              <input className="field-input mono" value={apiBase} readOnly />
              <Button onClick={() => navigator.clipboard?.writeText(apiBase)}>Copy</Button>
            </div>
            <span className="font-mono text-[10.5px] text-mono-9">
              OpenAPI: {apiBase.replace(/\/api.*/, '')}/v3/api-docs
            </span>
          </div>
        </Card>

        <Card title="Data" sub="Export your application history">
          <div className="flex flex-wrap gap-2.5">
            <Button disabled={busy === 'json'} onClick={() => exportData('json')}>
              {busy === 'json' ? 'Exporting…' : 'Export JSON'}
            </Button>
            <Button disabled={busy === 'csv'} onClick={() => exportData('csv')}>
              {busy === 'csv' ? 'Exporting…' : 'Export CSV'}
            </Button>
          </div>
        </Card>

        <Card title="Environment">
          <div className="grid grid-cols-2 gap-3.5 font-mono text-[12px] text-mono-5">
            <div>
              Build <span className="text-mono-1">{import.meta.env.MODE}</span>
            </div>
            <div>
              Network{' '}
              <span className="text-mono-1">{navigator.onLine ? 'online' : 'offline'}</span>
            </div>
            <div>
              Client <span className="text-mono-1">v1.0.0</span>
            </div>
            <div>
              Renderer <span className="text-mono-1">React 19</span>
            </div>
          </div>
        </Card>
      </div>
    </Page>
  )
}
