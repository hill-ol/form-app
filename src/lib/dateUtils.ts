export function localDateString(d = new Date()): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function parseLocalDate(dateStr: string): Date {
    const [y, m, day] = dateStr.split('-').map(Number)
    return new Date(y, m - 1, day)
}
