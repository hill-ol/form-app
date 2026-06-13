import { parseLocalDate } from './dateUtils'

export type CyclePhase = 'menstrual' | 'follicular' | 'ovulatory' | 'luteal'

export function getCyclePhase(periodStart: string, cycleLength = 28): CyclePhase {
    const start = parseLocalDate(periodStart)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const elapsed = Math.round((today.getTime() - start.getTime()) / 864e5)
    const day = (elapsed % cycleLength) + 1
    if (day <= 5) return 'menstrual'
    if (day <= Math.round(cycleLength * 0.46)) return 'follicular'
    if (day <= Math.round(cycleLength * 0.57)) return 'ovulatory'
    return 'luteal'
}

export const PHASE_META: Record<CyclePhase, { label: string; emoji: string; color: string; tip: string }> = {
    menstrual:  { label: 'Menstrual',  emoji: '🌙', color: '#A78BFA', tip: 'Go easy — rest and light movement are perfect today.' },
    follicular: { label: 'Follicular', emoji: '⚡', color: '#E8417A', tip: 'Energy is rising. Great time for strength PRs.' },
    ovulatory:  { label: 'Ovulatory',  emoji: '🔥', color: '#F97316', tip: 'Peak power. Push hard today.' },
    luteal:     { label: 'Luteal',     emoji: '🍂', color: '#84CC16', tip: 'Endurance over intensity. Prioritize recovery.' },
}
