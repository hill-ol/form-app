import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
})

export interface CoachContext {
    recentSessions?: {
        date: string
        name: string
        dayType: string
        duration?: number
        mood?: number
        exercises?: { name: string; sets: number; reps: number; weight: string }[]
    }[]
    lastSleep?: { hours: number; mood: number }
    currentMood?: number
    streak?: number
    weeklyGoal?: number
    weeklyCompleted?: number
    todayPlan?: string
}

const SYSTEM_PROMPT = `You are an AI fitness coach inside a personal fitness tracking app called FORM. 
The user's name is Olivia. She is a college student who does a mix of strength training (push/pull/legs), cardio, yoga, and bodyweight workouts.

Your personality:
- Warm, encouraging, and direct — like a knowledgeable friend
- Keep responses SHORT — 1-3 sentences max unless asked for more
- Be specific and data-driven when you have the data
- Occasionally motivating but never cheesy or over the top
- Never use em-dashes
- Sound human, not like a bot

When giving weight progression advice, be specific: name the exercise and the exact weight to try.
When referencing sleep, be specific about hours.
Always make the insight feel personal and relevant to what Olivia actually did.`

export async function getDashboardInsight(ctx: CoachContext): Promise<string> {
    const prompt = buildDashboardPrompt(ctx)
    try {
        const message = await client.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 120,
            system: SYSTEM_PROMPT,
            messages: [{ role: 'user', content: prompt }],
        })
        return (message.content[0] as { text: string }).text
    } catch (e) {
        console.error('AI dashboard insight failed:', e)
        return getFallbackDashboardInsight(ctx)
    }
}

export async function getPreSessionInsight(ctx: CoachContext): Promise<string> {
    const prompt = buildPreSessionPrompt(ctx)
    try {
        const message = await client.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 120,
            system: SYSTEM_PROMPT,
            messages: [{ role: 'user', content: prompt }],
        })
        return (message.content[0] as { text: string }).text
    } catch (e) {
        console.error('AI pre-session insight failed:', e)
        return getFallbackPreSessionInsight(ctx)
    }
}

export async function getPostSessionInsight(
    ctx: CoachContext,
    sessionSummary: {
        dayName: string
        totalSets: number
        totalExercises: number
        durationMins: number
        exercises: { name: string; sets: number; reps: number; weight: string }[]
    }
): Promise<string> {
    const prompt = buildPostSessionPrompt(ctx, sessionSummary)
    try {
        const message = await client.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 150,
            system: SYSTEM_PROMPT,
            messages: [{ role: 'user', content: prompt }],
        })
        return (message.content[0] as { text: string }).text
    } catch (e) {
        console.error('AI post-session insight failed:', e)
        return getFallbackPostSessionInsight(sessionSummary)
    }
}

export async function getWeeklyRecap(ctx: CoachContext): Promise<string> {
    const prompt = buildWeeklyRecapPrompt(ctx)
    try {
        const message = await client.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 200,
            system: SYSTEM_PROMPT,
            messages: [{ role: 'user', content: prompt }],
        })
        return (message.content[0] as { text: string }).text
    } catch (e) {
        console.error('AI weekly recap failed:', e)
        return getFallbackWeeklyRecap(ctx)
    }
}

function buildDashboardPrompt(ctx: CoachContext): string {
    const parts = ['Give Olivia a short personalized morning insight for today.']

    if (ctx.lastSleep) {
        parts.push(`She slept ${ctx.lastSleep.hours}h last night with a mood of ${ctx.lastSleep.mood}/5.`)
    }
    if (ctx.currentMood !== undefined) {
        const energyLabels: Record<number, string> = { 1: 'very low', 2: 'low', 3: 'moderate', 4: 'high', 5: 'very high' }
        parts.push(`Her energy level today is ${energyLabels[ctx.currentMood] ?? ctx.currentMood}/5.`)
    }
    if (ctx.streak) {
        parts.push(`She is on a ${ctx.streak}-day workout streak.`)
    }
    if (ctx.todayPlan) {
        parts.push(`Today she has planned: ${ctx.todayPlan}.`)
    }
    if (ctx.recentSessions?.length) {
        const last = ctx.recentSessions[0]
        parts.push(`Her last session was ${last.name} on ${last.date}.`)
        if (last.exercises?.length) {
            const topEx = last.exercises[0]
            parts.push(`Her top exercise was ${topEx.name} at ${topEx.weight} for ${topEx.sets}x${topEx.reps}.`)
        }
    }
    if (ctx.weeklyCompleted !== undefined && ctx.weeklyGoal) {
        parts.push(`She has done ${ctx.weeklyCompleted} of her ${ctx.weeklyGoal} weekly workouts.`)
    }

    parts.push('Keep it to 1-2 sentences. Be specific and encouraging.')
    return parts.join(' ')
}

function buildPreSessionPrompt(ctx: CoachContext): string {
    const parts = ['Give Olivia a short pre-workout motivation for her upcoming session.']

    if (ctx.todayPlan) parts.push(`Today is ${ctx.todayPlan}.`)
    if (ctx.lastSleep) parts.push(`She slept ${ctx.lastSleep.hours}h last night.`)
    if (ctx.currentMood) {
        const moodMap: Record<number, string> = { 1: 'tired', 2: 'okay', 3: 'good', 4: 'strong', 5: 'fired up' }
        parts.push(`Her energy today is ${moodMap[ctx.currentMood] ?? 'okay'}.`)
    }
    if (ctx.recentSessions?.length) {
        const last = ctx.recentSessions[0]
        if (last.exercises?.length) {
            const topEx = last.exercises[0]
            parts.push(`Last time she did ${topEx.name} at ${topEx.weight} for ${topEx.sets}x${topEx.reps}. If she hit all reps, suggest increasing weight by 5 lbs.`)
        }
    }

    parts.push('1-2 sentences max. Sound like a knowledgeable friend.')
    return parts.join(' ')
}

function buildPostSessionPrompt(
    ctx: CoachContext,
    summary: {
        dayName: string
        totalSets: number
        totalExercises: number
        durationMins: number
        exercises: { name: string; sets: number; reps: number; weight: string }[]
    }
): string {
    const parts = [
        `Olivia just finished a ${summary.dayName} session.`,
        `She completed ${summary.totalSets} sets across ${summary.totalExercises} exercises in ${summary.durationMins} minutes.`,
    ]

    if (summary.exercises.length) {
        const exList = summary.exercises
            .slice(0, 3)
            .map(e => `${e.name}: ${e.sets}x${e.reps} at ${e.weight}`)
            .join(', ')
        parts.push(`Exercises: ${exList}.`)
    }

    if (ctx.streak) parts.push(`She is now on a ${ctx.streak}-day streak.`)

    parts.push('Give a short post-workout summary and one specific tip or observation. 2-3 sentences.')
    return parts.join(' ')
}

function buildWeeklyRecapPrompt(ctx: CoachContext): string {
    const parts = ['Give Olivia a weekly fitness recap.']

    if (ctx.weeklyCompleted !== undefined && ctx.weeklyGoal) {
        parts.push(`She completed ${ctx.weeklyCompleted} of ${ctx.weeklyGoal} planned workouts this week.`)
    }
    if (ctx.recentSessions?.length) {
        const sessionList = ctx.recentSessions
            .slice(0, 5)
            .map(s => s.name)
            .join(', ')
        parts.push(`Sessions this week: ${sessionList}.`)
    }
    if (ctx.lastSleep) {
        parts.push(`Recent sleep average around ${ctx.lastSleep.hours}h.`)
    }
    if (ctx.streak) {
        parts.push(`Current streak: ${ctx.streak} days.`)
    }

    parts.push('2-3 sentences. Mention one strength and one thing to focus on next week.')
    return parts.join(' ')
}

function getFallbackDashboardInsight(ctx: CoachContext): string {
    if (ctx.lastSleep && ctx.lastSleep.hours >= 7) {
        return `Good sleep last night — you're set up well for today's session. Stay consistent and the results will follow.`
    }
    return `Every session counts. Show up today and keep the streak going.`
}

function getFallbackPreSessionInsight(ctx: CoachContext): string {
    if (ctx.todayPlan) {
        return `Time for ${ctx.todayPlan}. Focus on form and push a little further than last time.`
    }
    return `You showed up — that's already half the battle. Make it count.`
}

function getFallbackPostSessionInsight(summary: { dayName: string; totalSets: number }): string {
    return `Solid ${summary.dayName} session — ${summary.totalSets} sets done. Rest up and come back stronger.`
}

function getFallbackWeeklyRecap(ctx: CoachContext): string {
    return `Good week of training. Keep building on your consistency and the progress will compound.`
}