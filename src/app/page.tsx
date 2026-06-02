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

        <main className="max-w-2xl mx-auto px-4 pt-5 pb-24 md:pb-10 space-y-3">

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div>
              <p className="text-sm mb-0.5" style={{ color: 'var(--muted)' }}>good morning,</p>
              <p className="font-script text-4xl" style={{ color: 'var(--pink)' }}>olivia ✨</p>
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