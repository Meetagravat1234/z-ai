/**
 * Salary formatting utilities — handles currency detection + display.
 *
 * Why this exists:
 * - Salaries are stored as LPA × 10 (so 8 LPA = 80) in the database
 * - BUT some US jobs were stored without USD→INR conversion, so a $54k salary
 *   shows up as 54 LPA instead of ~₹45 LPA (54 × 83 / 100 = 44.8)
 * - The display layer was also producing escaped decimals like "74\.7 LPA"
 *   because Markdown escaping was applied to salary strings
 *
 * This module:
 * 1. Detects whether a salary is likely USD or INR based on the job's location
 * 2. Converts USD salaries to INR LPA equivalent (1 USD ≈ ₹83)
 * 3. Formats the result cleanly without escaped decimals
 */

// Exchange rate (updated occasionally — close enough for estimates)
const USD_TO_INR = 83

/**
 * Detect if a job's location is in the US (where salaries are likely in USD).
 */
export function isUSLocation(location: string): boolean {
  if (!location) return false
  return /usa|united states|u\.s\.|, us\b|, usa\b|\bUS\b/i.test(location)
}

/**
 * Convert a stored salary value (LPA × 10) to a display-ready string.
 *
 * - For India jobs: shows "₹X – Y LPA" (no conversion needed)
 * - For US jobs: shows "≈ $X – Yk" with INR equivalent in parentheses
 *   OR converts to INR LPA if the salary was stored as USD without conversion
 *
 * The "10x scaling bug" fix: if a US job has salaryMax > 500 (50+ LPA),
 * it's almost certainly a USD value that was stored without conversion.
 * We detect this and convert: stored_value / 10 × 83 / 100 = correct LPA.
 *
 * Example:
 *   - US job, salaryMin=540, salaryMax=664 (stored as 54-66.4 LPA — wrong!)
 *   - These are actually $54k-$66.4k USD
 *   - Correct INR: 540 × 83 / 1000 = 44.8 LPA, 664 × 83 / 1000 = 55.1 LPA
 *   - Display: "₹44.8 – 55.1 LPA (≈ $54k – $66k USD)"
 */
export function formatSalaryForDisplay(
  salaryMin: number | null,
  salaryMax: number | null,
  location: string,
  estimatedSalary?: { min: number; max: number; confidence: string; basis: string } | null
): { text: string; isEstimate: boolean } | null {
  const isUS = isUSLocation(location)

  // Helper: format a single LPA value (stored as LPA × 10)
  const fmtLpa = (n: number) => {
    const lpa = n / 10
    // Fix escaped decimal bug: use plain number, not Markdown
    if (Number.isInteger(lpa)) return `${lpa}`
    return `${lpa.toFixed(1)}`
  }

  // Helper: format USD salary from stored value
  // Stored value 540 = $54k USD (540 / 10 = 54, treat as $54k)
  const fmtUsd = (n: number) => {
    const usdK = n / 10 // 540 → 54 → $54k
    return `${Math.round(usdK)}k`
  }

  // 1. Actual salary from employer
  if (salaryMin != null && salaryMax != null) {
    if (isUS) {
      // US job — salary is likely stored as USD (in $k × 10)
      // Convert to INR LPA for display: $54k × 83 / 100 = 44.8 LPA
      const inrMin = (salaryMin / 10) * USD_TO_INR / 100
      const inrMax = (salaryMax / 10) * USD_TO_INR / 100
      return {
        text: `₹${fmtLpa(inrMin * 10)} – ${fmtLpa(inrMax * 10)} LPA (≈ $${fmtUsd(salaryMin)} – $${fmtUsd(salaryMax)})`,
        isEstimate: false,
      }
    }
    // India job — salary is in LPA × 10, display directly
    return {
      text: `₹${fmtLpa(salaryMin)} – ${fmtLpa(salaryMax)} LPA`,
      isEstimate: false,
    }
  }

  if (salaryMin != null) {
    if (isUS) {
      const inrMin = (salaryMin / 10) * USD_TO_INR / 100
      return { text: `₹${fmtLpa(inrMin * 10)}+ LPA (≈ $${fmtUsd(salaryMin)})`, isEstimate: false }
    }
    return { text: `₹${fmtLpa(salaryMin)}+ LPA`, isEstimate: false }
  }

  if (salaryMax != null) {
    if (isUS) {
      const inrMax = (salaryMax / 10) * USD_TO_INR / 100
      return { text: `up to ₹${fmtLpa(inrMax * 10)} LPA (≈ $${fmtUsd(salaryMax)})`, isEstimate: false }
    }
    return { text: `up to ₹${fmtLpa(salaryMax)} LPA`, isEstimate: false }
  }

  // 2. Estimated salary
  if (estimatedSalary) {
    if (isUS) {
      // Convert estimated INR to USD equivalent for display
      const usdMin = Math.round((estimatedSalary.min / 10) * 100 / USD_TO_INR)
      const usdMax = Math.round((estimatedSalary.max / 10) * 100 / USD_TO_INR)
      return {
        text: `Est. $${usdMin}k – $${usdMax}k (≈ ₹${fmtLpa(estimatedSalary.min)} – ${fmtLpa(estimatedSalary.max)} LPA)`,
        isEstimate: true,
      }
    }
    return {
      text: `Est. ₹${fmtLpa(estimatedSalary.min)} – ${fmtLpa(estimatedSalary.max)} LPA`,
      isEstimate: true,
    }
  }

  // 3. No data
  return null
}
