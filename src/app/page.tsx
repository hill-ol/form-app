import { PLACEHOLDER_DASHBOARD } from '@/lib/placeholder'
import { getRecentSessions, getLastSleep, getCurrentStreak, getWeeklyTemplate } from '@/lib/db'
import TopNav from '@/components/layout/TopNav'
import BottomNav from '@/components/layout/BottomNav'
import MoodCheckIn from '@/components/dashboard/MoodCheckIn'
import AiCoachCard from '@/components/dashboard/AiCoachCard'
import TodayWorkout from '@/components/dashboard/TodayWorkout'
import QuoteBanner from '@/components/dashboard/QuoteBanner'
import StatsRow from '@/components/dashboard/StatsRow'
import WeekCalendar from '@/components/dashboard/WeekCalendar'
import RecentSessions from '@/components/dashboard/RecentSessions'
import DashboardGreeting from "@/components/dashboard/DashboardGreeting";

export default async function DashboardPage() {
    const [recentSessions, lastSleep, streak, template] = await Promise.all([
        getRecentSessions(10).catch(() => []),
        getLastSleep().catch(() => null),
        getCurrentStreak().catch(() => 0),
        getWeeklyTemplate().catch(() => []),
    ])

    const today = new Date()
    const todayTemplate = template.find(t => t.dayOfWeek === today.getDay())

    const data = {
        ...PLACEHOLDER_DASHBOARD,
        currentStreak: streak,
        lastSleep: lastSleep
            ? { date: lastSleep.date, hours: lastSleep.hours, quality: lastSleep.mood }
            : PLACEHOLDER_DASHBOARD.lastSleep,
        recentSessions: recentSessions.length > 0
            ? recentSessions.map((s: any) => ({
                id: s.id,
                date: s.date,
                type: s.workout_type,
                dayType: s.day_type,
                name: s.name,
                duration: s.duration_seconds ? Math.floor(s.duration_seconds / 60) : undefined,
            }))
            : PLACEHOLDER_DASHBOARD.recentSessions,
    }

    return (
        <div className="min-h-screen" style={{ backgroundColor: 'var(--cream)' }}>
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

            <main className="max-w-2xl mx-auto px-4 pt-3 md:pt-6 pb-24 md:pb-10 space-y-3">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
                    <DashboardGreeting />
                    <MoodCheckIn />
                </div>

                <AiCoachCard context={{
                    lastSleep: data.lastSleep
                        ? { hours: data.lastSleep.hours, mood: data.lastSleep.quality }
                        : undefined,
                    streak: data.currentStreak,
                    weeklyGoal: data.weeklyGoal,
                    weeklyCompleted: data.weeklyCompleted,
                    todayPlan: todayTemplate?.label,
                    recentSessions: data.recentSessions.map(s => ({
                        date: s.date,
                        name: s.name,
                        dayType: s.dayType,
                        duration: s.duration,
                    })),
                }} />
                <TodayWorkout workout={data.todayWorkout} />
                <QuoteBanner />
                <StatsRow data={data} />

                <div className="bg-white rounded-2xl p-4 space-y-4"
                     style={{ border: '0.5px solid var(--border)' }}>
                    <WeekCalendar sessions={data.weekSessions} />
                    <div style={{ borderTop: '0.5px solid var(--border)', paddingTop: '12px' }}>
                        <RecentSessions sessions={data.recentSessions} />
                    </div>
                </div>
            </main>

            <BottomNav />
        </div>
    )
}