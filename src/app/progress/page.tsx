'use client'

import { useEffect, useState } from 'react'
import TopNav from '@/components/layout/TopNav'
import AiRecapCard from '@/components/progress/AiRecapCard'
import StatsBar from '@/components/progress/StatsBar'
import WorkoutFrequencyChart from '@/components/progress/WorkoutFrequencyChart'
import ExerciseProgressChart from '@/components/progress/ExerciseProgressChart'
import SleepChart from '@/components/progress/SleepChart'
import SleepVsPerformance from '@/components/progress/SleepVsPerformance'
import MoodVsPerformance from '@/components/progress/MoodVsPerformance'
import PersonalRecords from '@/components/progress/PersonalRecords'
import { loadProgressData, ProgressData } from '@/lib/progressData'

export default function ProgressPage() {
    const [data, setData] = useState<ProgressData | null>(null)
    const [loading, setLoading] = useState(true)
    const [selectedExercise, setSelectedExercise] = useState<string | null>(null)

    useEffect(() => {
        loadProgressData()
            .then(setData)
            .catch(() => setData(null))
            .finally(() => setLoading(false))
    }, [])

    function handleSelectExercise(name: string) {
        setSelectedExercise(name)
        document.getElementById('exercise-chart')?.scrollIntoView({
            behavior: 'smooth', block: 'start'
        })
    }

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

            <main className="max-w-2xl mx-auto px-4 pt-2 pb-24 md:pb-10 space-y-3 stagger-children">
                <div className="mb-3">
                    <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--muted)' }}>
                        good work,
                    </p>
                    <p className="text-3xl font-black tracking-tight" style={{ color: 'var(--pink)' }}>
                        olivia.
                    </p>
                </div>

                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5, 6, 7].map(i => (
                            <div key={i} className="h-24 rounded-2xl animate-pulse"
                                 style={{ background: '#f5f0e8' }} />
                        ))}
                    </div>
                ) : (
                    <>
                        <AiRecapCard
                            workoutsThisWeek={data?.stats.workoutsThisWeek ?? 0}
                            weeklyGoal={data?.stats.weeklyGoal ?? 5}
                            avgSleep={data?.stats.avgSleep ?? 0}
                            streak={data?.stats.streak ?? 0}
                        />

                        <StatsBar
                            workoutsThisMonth={data?.stats.workoutsThisMonth ?? 0}
                            avgSleep={data?.stats.avgSleep ?? 0}
                            streak={data?.stats.streak ?? 0}
                        />

                        <WorkoutFrequencyChart
                            weeklyData={data?.weeklyWorkouts ?? []}
                            monthlyData={data?.monthlyWorkouts ?? []}
                        />

                        <div id="exercise-chart">
                            <ExerciseProgressChart
                                exerciseHistory={data?.exerciseHistory ?? {}}
                                initialExercise={selectedExercise ?? undefined}
                            />
                        </div>

                        <SleepChart sleepData={data?.sleepData ?? []} />
                        <SleepVsPerformance scatterData={data?.scatterData ?? []} />
                        <MoodVsPerformance moodData={data?.moodData ?? []} moodScatterData={data?.moodScatterData ?? []} />

                        <PersonalRecords
                            records={data?.personalRecords ?? []}
                            onSelectExercise={handleSelectExercise}
                        />
                    </>
                )}
            </main>
        </div>
    )
}