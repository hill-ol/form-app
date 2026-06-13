import { connection } from 'next/server'
import { PLACEHOLDER_DASHBOARD, DEFAULT_WEEK_TEMPLATE } from '@/lib/placeholder'
import {
    getRecentSessions,
    getLastSleep,
    getCurrentStreak,
    getWeeklyTemplate,
    getSessionsForMonth,
    getPreferences,
    getLastSessionByDayType,
    getTodayCheckin,
    getTodayStressFlag,
    getPeriodLogs,
} from '@/lib/db'
import TopNav from '@/components/layout/TopNav'
import BottomNav from '@/components/layout/BottomNav'
import MoodCheckIn from '@/components/dashboard/MoodCheckIn'
import AiCoachCard from '@/components/dashboard/AiCoachCard'
import TodayWorkout from '@/components/dashboard/TodayWorkout'
import QuoteBanner from '@/components/dashboard/QuoteBanner'
import StatsRow from '@/components/dashboard/StatsRow'
import WeekCalendar from '@/components/dashboard/WeekCalendar'
import RecentSessions from '@/components/dashboard/RecentSessions'
import DashboardGreeting from '@/components/dashboard/DashboardGreeting'
import CyclePhaseCard from '@/components/dashboard/CyclePhaseCard'
import { getProgressionSuggestions } from '@/lib/db'
import { getCyclePhaseFromLogs } from '@/lib/cycleUtils'
import { WorkoutSession, DayTemplate } from '@/types'
import PullToRefresh from '@/components/dashboard/PullToRefresh'

export default async function DashboardPage() {
    await connection() // opt out of prerender cache — always fetch fresh data per request
    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth()

    const [recentSessions, lastSleep, streak, template, monthSessions, prefs, progressionSuggestions, todayEnergyLevel, todayStressed, periodLogs] =
        await Promise.all([
            getRecentSessions(10).catch(() => []),
            getLastSleep().catch(() => null),
            getCurrentStreak().catch(() => 0),
            getWeeklyTemplate().catch(() => DEFAULT_WEEK_TEMPLATE),
            getSessionsForMonth(year, month).catch(() => []),
            getPreferences().catch(() => null),
            getProgressionSuggestions().catch(() => ({})),
            getTodayCheckin().catch(() => null),
            getTodayStressFlag().catch(() => false),
            getPeriodLogs().catch(() => [] as string[]),
        ])

    const weeklyGoal = prefs?.weekly_goal ?? 5
    const activeTemplate = template.length > 0 ? template : DEFAULT_WEEK_TEMPLATE
    const todayTemplate = activeTemplate.find(
        (t: DayTemplate) => t.dayOfWeek === today.getDay()
    )

    const lastSameDaySession = todayTemplate?.dayType
        ? await getLastSessionByDayType(todayTemplate.dayType).catch(() => null)
        : null

    const mappedRecent: WorkoutSession[] = recentSessions.map((s: any) => ({
        id: s.id,
        date: s.date.split('T')[0],
        type: s.workout_type,
        dayType: s.day_type,
        name: s.name,
        duration: s.duration_seconds
            ? Math.floor(s.duration_seconds / 60)
            : undefined,
    }))

    // Monday-first to match WeekCalendar's DAYS = ['M','T','W','T','F','S','S']
    const startOfWeek = new Date(today)
    const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay() // treat Sunday as 7
    startOfWeek.setDate(today.getDate() - (dayOfWeek - 1))
    startOfWeek.setHours(0, 0, 0, 0)

    const weekSessions: (WorkoutSession | null)[] = Array.from({ length: 7 }, (_, i) => {
        const dayDate = new Date(startOfWeek)
        dayDate.setDate(startOfWeek.getDate() + i)
        const isoDate = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, '0')}-${String(dayDate.getDate()).padStart(2, '0')}`
        const found = (monthSessions as any[]).find(
            (s: any) => s.date.split('T')[0] === isoDate
        )
        if (!found) return null
        return {
            id: found.id,
            date: found.date.split('T')[0],
            type: found.workout_type,
            dayType: found.day_type,
            name: found.name,
            duration: found.duration_seconds
                ? Math.floor(found.duration_seconds / 60)
                : undefined,
        }
    })

    const weeklyCompleted = weekSessions.filter(Boolean).length

    // Index 0=Mon … 6=Sun in weekSessions; today's index is (dayOfWeek - 1)
    const todaySessionEntry = weekSessions[dayOfWeek - 1]
    const completedToday = !!todaySessionEntry

    const buildTodayExercises = () => {
        const dayType = todayTemplate?.dayType ?? 'push'

        if (dayType === 'yoga') {
            return [{
                exerciseId: 'yoga-flow',
                exerciseName: 'Yoga Flow',
                sets: 1,
                reps: 0,
                weight: '60',
                progressReady: false,
                exerciseType: 'yoga' as any,
            }]
        }

        if (dayType === 'cardio') {
            return [{
                exerciseId: 'cardio-session',
                exerciseName: 'Cardio Session',
                sets: 1,
                reps: 0,
                weight: '— min',
                progressReady: false,
            }]
        }

        if (dayType === 'rest') {
            return [{
                exerciseId: 'rest-day',
                exerciseName: 'Rest & Recovery',
                sets: 0,
                reps: 0,
                weight: '—',
                progressReady: false,
            }]
        }

        if (!lastSameDaySession) return []

        const exLogs = (lastSameDaySession as any).exercise_logs ?? []
        if (exLogs.length === 0) return []

        return exLogs.map((ex: any) => {
            const sets = (ex.set_logs ?? []).filter((s: any) => s.completed)
            const topSet = sets.sort((a: any, b: any) =>
                (b.weight_lbs ?? 0) - (a.weight_lbs ?? 0)
            )[0]
            const suggestedWeight = (progressionSuggestions as Record<string, number>)[ex.exercise_id]
            return {
                exerciseId: ex.exercise_id,
                exerciseName: ex.exercise_name,
                sets: sets.length || 3,
                reps: topSet?.reps ?? 10,
                weight: topSet?.weight_lbs
                    ? `${topSet.weight_lbs} lbs`
                    : 'BW',
                progressReady: !!suggestedWeight,
                suggestedWeight: suggestedWeight ? `${suggestedWeight} lbs` : undefined,
            }
        })
    }

    const todayWorkout = {
        ...PLACEHOLDER_DASHBOARD.todayWorkout,
        dayType: (todayTemplate?.dayType ?? 'push') as any,
        name: todayTemplate?.label ?? PLACEHOLDER_DASHBOARD.todayWorkout.name,
        type: todayTemplate
            ? (todayTemplate.dayType === 'cardio' ? 'cardio'
                : todayTemplate.dayType === 'yoga' ? 'yoga'
                    : 'strength') as any
            : PLACEHOLDER_DASHBOARD.todayWorkout.type,
        exercises: buildTodayExercises(),
    }

    const data = {
        ...PLACEHOLDER_DASHBOARD,
        todayWorkout,
        currentStreak: streak,
        weeklyGoal,
        weeklyCompleted,
        lastSleep: lastSleep
            ? { date: lastSleep.date, hours: lastSleep.hours, quality: lastSleep.mood }
            : PLACEHOLDER_DASHBOARD.lastSleep,
        recentSessions: mappedRecent,
        weekSessions,
    }

    const estimatedDuration = (() => {
        if (!lastSameDaySession) return '45–60 min'
        const mins = (lastSameDaySession as any).duration_seconds
            ? Math.floor((lastSameDaySession as any).duration_seconds / 60)
            : null
        if (!mins) return '45–60 min'
        const rounded = Math.round(mins / 5) * 5
        return `~${rounded} min`
    })()

    return (
        <div className="min-h-screen" style={{ backgroundColor: 'var(--cream)' }}>
            <PullToRefresh />
            <TopNav />

            <div className="md:hidden flex items-center justify-between px-4 pt-5 pb-2">
                <p className="text-xl font-black tracking-tight">
                    FORM <span style={{ color: 'var(--pink)' }}>.</span>
                </p>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                     style={{ background: 'var(--pink-light)', color: 'var(--pink)' }}>
                    O
                </div>
            </div>

            <main className="max-w-2xl mx-auto px-4 pt-3 md:pt-6 pb-24 md:pb-10 space-y-3 stagger-children">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
                    <DashboardGreeting />
                    <MoodCheckIn />
                </div>

                <CyclePhaseCard periodLogs={periodLogs} />

                <AiCoachCard context={{
                    lastSleep: lastSleep
                        ? { hours: lastSleep.hours, mood: lastSleep.mood }
                        : undefined,
                    streak,
                    weeklyGoal,
                    weeklyCompleted,
                    todayPlan: todayTemplate?.label,
                    currentMood: todayEnergyLevel ?? undefined,
                    recentSessions: mappedRecent.slice(0, 3).map(s => ({
                        date: s.date,
                        name: s.name,
                        dayType: s.dayType,
                        duration: s.duration,
                    })),
                    cyclePhase: getCyclePhaseFromLogs(periodLogs)?.phase,
                    isStressed: todayStressed || undefined,
                }} />

                <TodayWorkout workout={data.todayWorkout} estimatedDuration={estimatedDuration} completedToday={completedToday} completedSession={todaySessionEntry} />                <QuoteBanner />
                <StatsRow data={data} />

                <div className="bg-white rounded-2xl p-4 space-y-4"
                     style={{ border: '0.5px solid var(--border)' }}>
                    <WeekCalendar sessions={weekSessions} />
                    <div style={{ borderTop: '0.5px solid var(--border)', paddingTop: '12px' }}>
                        <RecentSessions sessions={data.recentSessions} />
                    </div>
                </div>
            </main>

            <BottomNav />
        </div>
    )
}