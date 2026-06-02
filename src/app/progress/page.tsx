import TopNav from '@/components/layout/TopNav'
import BottomNav from '@/components/layout/BottomNav'
import AiRecapCard from '@/components/progress/AiRecapCard'
import StatsBar from '@/components/progress/StatsBar'
import WorkoutFrequencyChart from '@/components/progress/WorkoutFrequencyChart'
import ExerciseProgressChart from '@/components/progress/ExerciseProgressChart'
import SleepChart from '@/components/progress/SleepChart'
import SleepVsPerformance from '@/components/progress/SleepVsPerformance'
import MoodVsPerformance from '@/components/progress/MoodVsPerformance'
import PersonalRecords from '@/components/progress/PersonalRecords'

export default function ProgressPage() {
    return (
        <div className="min-h-screen" style={{ backgroundColor: 'var(--cream)' }}>
            <TopNav />

            <div className="md:hidden flex items-center justify-between px-4 pt-5 pb-2">
                <p className="text-xl font-black tracking-tight">
                    FORM <span style={{ color: 'var(--pink)' }}>.</span>
                </p>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                     style={{ background: 'var(--pink-light)', color: 'var(--pink)' }}>O</div>
            </div>

            <main className="max-w-2xl mx-auto px-4 pt-2 pb-24 md:pb-10">
                <div className="mb-3">
                    <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--muted)' }}>
                        good work,
                    </p>
                    <p className="text-3xl font-black tracking-tight" style={{ color: 'var(--pink)' }}>
                        olivia.
                    </p>
                </div>

                <AiRecapCard />
                <StatsBar workoutsThisMonth={14} avgSleep={7.1} streak={6} />
                <WorkoutFrequencyChart />
                <ExerciseProgressChart />
                <SleepChart />
                <SleepVsPerformance />
                <MoodVsPerformance />
                <PersonalRecords />
            </main>

            <BottomNav />
        </div>
    )
}