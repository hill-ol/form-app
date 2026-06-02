import { PLACEHOLDER_DASHBOARD } from '@/lib/placeholder'
import TopNav from '@/components/layout/TopNav'
import BottomNav from '@/components/layout/BottomNav'
import MoodCheckIn from '@/components/dashboard/MoodCheckIn'
import AiCoachCard from '@/components/dashboard/AiCoachCard'
import TodayWorkout from '@/components/dashboard/TodayWorkout'
import QuoteBanner from '@/components/dashboard/QuoteBanner'
import StatsRow from '@/components/dashboard/StatsRow'
import WeekCalendar from '@/components/dashboard/WeekCalendar'
import RecentSessions from '@/components/dashboard/RecentSessions'

export default function DashboardPage() {
    const data = PLACEHOLDER_DASHBOARD

    return (
        <div className="min-h-screen" style={{ backgroundColor: 'var(--cream)' }}>

            <TopNav />

            <div className="md:hidden flex items-center justify-between px-4 pt-5 pb-2">
                <p className="text-xl font-black tracking-tight">
                    FORM <span style={{ color: 'var(--pink)' }}>.</span>
                </p>
                <div className="flex items-center gap-2">
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>
                        {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                         style={{ background: 'var(--pink-light)', color: 'var(--pink)' }}>
                        O
                    </div>
                </div>
            </div>

            <main className="max-w-2xl mx-auto px-4 pt-3 md:pt-6 pb-24 md:pb-10 space-y-3">

                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
                    <div>
                        <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--muted)' }}>
                            good morning,
                        </p>
                        <p className="text-3xl font-black tracking-tight" style={{ color: 'var(--pink)' }}>
                            olivia.
                        </p>
                    </div>
                    <MoodCheckIn />
                </div>

                <AiCoachCard />
                <TodayWorkout workout={data.todayWorkout} />
                <QuoteBanner />
                <StatsRow data={data} />

                <div className="bg-white rounded-2xl p-4 space-y-4" style={{ border: '0.5px solid var(--border)' }}>
                    <WeekCalendar sessions={data.weekSessions} />
                    <div style={{ borderTop: '0.5px solid var(--border)', paddingTop: '12px' }}>
                        <RecentSessions sessions={data.recentSessions} />
                    </div>
                </div>

            </main>

            <BottomNav active="home" />
        </div>
    )
}