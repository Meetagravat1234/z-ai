'use client'

import * as React from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar, Legend, Area, AreaChart,
} from 'recharts'
import { Loader2, TrendingUp, Building2, MapPin, Briefcase, BarChart3, IndianRupee } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SalaryPoint {
  label: string
  count: number
  min: number
  max: number
  avg: number
}
interface SalaryData {
  totalJobsWithSalary: number
  median: number
  p25: number
  p75: number
  overallMin: number
  overallMax: number
  byRole: SalaryPoint[]
  byCompany: SalaryPoint[]
  byCity: SalaryPoint[]
  byExperience: SalaryPoint[]
  distribution: Array<{ label: string; count: number }>
}

export function SalaryDashboardView() {
  const [data, setData] = React.useState<SalaryData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [view, setView] = React.useState<'role' | 'company' | 'city' | 'experience'>('role')

  React.useEffect(() => {
    fetch('/api/analytics/salary')
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!data) return null

  const currentData =
    view === 'role' ? data.byRole :
    view === 'company' ? data.byCompany :
    view === 'city' ? data.byCity :
    data.byExperience

  // Format for recharts
  const chartData = currentData.map((d) => ({
    name: d.label.length > 15 ? d.label.slice(0, 13) + '...' : d.label,
    min: d.min,
    max: d.max,
    avg: d.avg,
    count: d.count,
  }))

  return (
    <div className="space-y-6 pb-8">
      <header>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-3">
          <BarChart3 className="w-3 h-3" />
          ANALYTICS
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">Salary Benchmark Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Real salary data aggregated from {data.totalJobsWithSalary} verified job listings across India.
        </p>
      </header>

      {/* Overall stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatBox icon={IndianRupee} label="Median salary" value={`₹${data.median} LPA`} color="text-emerald-600" />
        <StatBox icon={TrendingUp} label="25th percentile" value={`₹${data.p25} LPA`} color="text-amber-600" />
        <StatBox icon={TrendingUp} label="75th percentile" value={`₹${data.p75} LPA`} color="text-violet-600" />
        <StatBox icon={BarChart3} label="Salary range" value={`₹${data.overallMin} – ${data.overallMax}`} color="text-rose-600" />
      </div>

      {/* View switcher */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {([
          { id: 'role', label: 'By Role', icon: Briefcase },
          { id: 'company', label: 'By Company', icon: Building2 },
          { id: 'city', label: 'By City', icon: MapPin },
          { id: 'experience', label: 'By Experience', icon: TrendingUp },
        ] as const).map((v) => {
          const Icon = v.icon
          const active = view === v.id
          return (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors',
                active ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/70'
              )}
            >
              <Icon className="w-4 h-4" />
              {v.label}
            </button>
          )
        })}
      </div>

      {/* Main bar chart */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-lg font-bold mb-4">
          Salary range by {view} (avg, min, max in LPA)
        </h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0 0)" />
            <XAxis
              dataKey="name"
              angle={-35}
              textAnchor="end"
              height={70}
              tick={{ fontSize: 11, fill: 'oklch(0.55 0 0)' }}
            />
            <YAxis tick={{ fontSize: 11, fill: 'oklch(0.55 0 0)' }} label={{ value: 'LPA', angle: -90, position: 'insideLeft' }} />
            <Tooltip
              contentStyle={{ background: 'oklch(0.18 0.02 180)', border: 'none', borderRadius: 12, color: 'white' }}
              labelStyle={{ color: 'white', fontWeight: 700 }}
            />
            <Bar dataKey="min" fill="oklch(0.72 0.18 65)" name="Min (LPA)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="avg" fill="oklch(0.55 0.15 165)" name="Avg (LPA)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="max" fill="oklch(0.62 0.22 295)" name="Max (LPA)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </section>

      {/* Distribution + table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribution */}
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-lg font-bold mb-4">Salary distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.distribution}>
              <defs>
                <linearGradient id="colorSalary" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.55 0.15 165)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="oklch(0.55 0.15 165)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0 0)" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'oklch(0.55 0 0)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'oklch(0.55 0 0)' }} />
              <Tooltip
                contentStyle={{ background: 'oklch(0.18 0.02 180)', border: 'none', borderRadius: 12, color: 'white' }}
              />
              <Area type="monotone" dataKey="count" stroke="oklch(0.55 0.15 165)" strokeWidth={2} fill="url(#colorSalary)" name="Jobs" />
            </AreaChart>
          </ResponsiveContainer>
        </section>

        {/* Data table */}
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-lg font-bold mb-4">Top {view}s by avg salary</h2>
          <div className="space-y-2 max-h-[280px] overflow-y-auto">
            {currentData.map((d, i) => (
              <div
                key={d.label}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{d.label}</div>
                  <div className="text-xs text-muted-foreground">{d.count} job{d.count !== 1 && 's'}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-sm">₹{d.avg} LPA</div>
                  <div className="text-xs text-muted-foreground">₹{d.min}–{d.max}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function StatBox({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  color: string
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <Icon className={cn('w-5 h-5 mb-2', color)} />
      <div className="text-xl font-extrabold tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground font-medium">{label}</div>
    </div>
  )
}
