'use client'

import { Building2, Target, Eye, Heart, Mail, MapPin, Sparkles, ShieldCheck } from 'lucide-react'
import { useNav } from '@/lib/nav-store'

export function AboutView() {
  const { go } = useNav()
  return (
    <div className="space-y-8 pb-8 max-w-3xl">
      <header>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-3">
          <Building2 className="w-3 h-3" />
          ABOUT
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">About Hirebase</h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Hirebase is a career intelligence platform: verified jobs from employer sources, company research, AI resume tools, and editorial guidance — not a generic repost board.
        </p>
      </header>

      <section>
        <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          The problem we solve
        </h2>
        <p className="text-foreground/90 leading-relaxed">
          Candidates today jump between company career sites, aggregator boards, LinkedIn posts, and WhatsApp hiring messages. Many listings are stale, duplicated, or posted by unverified consultancies. Meanwhile, students and freshers struggle to learn what employers actually expect beyond college syllabi and certificate courses.
        </p>
        <p className="text-foreground/90 leading-relaxed mt-3">
          Hirebase solves this by combining employer-sourced job discovery with company research and application tools — so people can find real openings, understand employers, and tailor a resume without guessing which boards to trust.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-violet-500" />
          What Hirebase does
        </h2>
        <p className="text-foreground/90 leading-relaxed">
          Hirebase helps candidates discover and understand employment opportunities — with organized job pages, company hiring signals, career articles, and AI tools (Resume Optimizer, Cover Letter Generator, Mock Interview, Salary Predictor). We focus on useful candidate context, not on pretending to be the employer.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          Where opportunities come from
        </h2>
        <p className="text-foreground/90 leading-relaxed">
          Opportunities are identified from official company career pages, public hiring announcements, recruiter or company posts, professional networking sources, and other legitimate public recruitment sources — including employer systems such as Workday, Greenhouse, Oracle, Lever, and SuccessFactors where publicly available.
        </p>
        <p className="text-foreground/90 leading-relaxed mt-3">
          We use technology-assisted job discovery followed by manual selection, review, enrichment, and publication. We do not automatically publish every discovered opportunity.
        </p>
      </section>

      <section className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
        <h2 className="font-bold mb-2 flex items-center gap-2">
          <Eye className="w-5 h-5 text-amber-600" />
          Relationship with employers
        </h2>
        <p className="text-sm text-foreground/90 leading-relaxed">
          Unless explicitly stated otherwise, Hirebase is not the employer for jobs listed on the platform and does not make hiring decisions on behalf of employers. Apply links send you to the employer's own application page. If a listing looks wrong or outdated, use Report a Job or Contact.
        </p>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border bg-card p-5">
          <Mail className="w-5 h-5 text-primary mb-2" />
          <h3 className="font-bold mb-1">Contact</h3>
          <p className="text-sm text-muted-foreground">contact@hirebase.in</p>
          <p className="text-sm text-muted-foreground">+91-87909-XXXXX</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <MapPin className="w-5 h-5 text-primary mb-2" />
          <h3 className="font-bold mb-1">Location</h3>
          <p className="text-sm text-muted-foreground">Bengaluru, Karnataka</p>
          <p className="text-sm text-muted-foreground">India</p>
        </div>
      </section>

      <section className="text-center">
        <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <Heart className="w-4 h-4 text-rose-500" />
          Built for Indian job seekers by the Hirebase team
        </div>
        <div className="mt-4">
          <button
            onClick={() => go('home')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90"
          >
            Explore jobs
          </button>
        </div>
      </section>
    </div>
  )
}
