'use client'

import * as React from 'react'
import { useAuth } from '@/lib/auth-context'
import { OnboardingModal } from '@/components/onboarding-modal'

/**
 * GlobalOnboarding — listens to auth state and shows the OnboardingModal
 * automatically when a logged-in user hasn't completed onboarding yet.
 *
 * Mounted once in the root layout (via HomeShell + SiteShell).
 * Uses the auth context to detect:
 *   - User is logged in (not demo)
 *   - User has no onboardingCompletedAt
 *
 * Once the user completes the modal (clicks any CTA or "skip"), we call
 * auth.refresh() to update the context — modal disappears.
 */
export function GlobalOnboarding() {
  const { user, loading, isDemo, refresh } = useAuth()
  const [showOnboarding, setShowOnboarding] = React.useState(false)

  // Show modal when user logs in but hasn't completed onboarding
  React.useEffect(() => {
    if (!loading && user && !isDemo && !user.onboardingCompletedAt) {
      // Small delay so the page loads first
      const t = setTimeout(() => setShowOnboarding(true), 800)
      return () => clearTimeout(t)
    }
  }, [loading, user, isDemo])

  function handleClose() {
    setShowOnboarding(false)
    // Don't refresh — user closed without completing. Will show again next visit.
  }

  async function handleComplete() {
    setShowOnboarding(false)
    // Refresh auth context so onboardingCompletedAt is set — modal won't show again
    await refresh()
  }

  return (
    <OnboardingModal
      open={showOnboarding}
      onClose={handleClose}
      onComplete={handleComplete}
    />
  )
}
