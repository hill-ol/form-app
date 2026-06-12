function vibrate(pattern: number | number[]) {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(pattern)
    }
}

export const haptics = {
    // Set completed — satisfying double-tap
    setComplete: () => vibrate([40, 30, 60]),
    // Light tap — toggle, button press
    light: () => vibrate(20),
    // Medium — sheet open, selection change
    medium: () => vibrate(40),
    // Error / warning
    warning: () => vibrate([60, 40, 60]),
    // Session finished — celebratory pattern
    sessionComplete: () => vibrate([50, 40, 80, 40, 120]),
    // Rest timer done — two pulses
    restTimerDone: () => vibrate([80, 60, 80]),
    // Swipe delete threshold crossed
    deleteReady: () => vibrate(30),
}
