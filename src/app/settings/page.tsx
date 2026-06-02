import TopNav from '@/components/layout/TopNav'
import BottomNav from '@/components/layout/BottomNav'
import WeeklyTemplateEditor from '@/components/settings/WeeklyTemplateEditor'
import ExerciseLibraryEditor from '@/components/settings/ExerciseLibraryEditor'
import TrainingPreferences from '@/components/settings/TrainingPreferences'
import DataSection from '@/components/settings/DataSection'

export default function SettingsPage() {
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
                <div className="mb-4">
                    <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--muted)' }}>
                        customize your
                    </p>
                    <p className="text-3xl font-black tracking-tight" style={{ color: 'var(--pink)' }}>
                        experience.
                    </p>
                </div>

                <WeeklyTemplateEditor />
                <TrainingPreferences />
                <ExerciseLibraryEditor />
                <DataSection />

                <div className="rounded-2xl px-4 py-3 text-center"
                     style={{ background: '#fff', border: '0.5px solid var(--border)' }}>
                    <p className="font-black" style={{ fontSize: '13px' }}>FORM.</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                        v0.1 · built by olivia
                    </p>
                </div>
            </main>

            <BottomNav />
        </div>
    )
}