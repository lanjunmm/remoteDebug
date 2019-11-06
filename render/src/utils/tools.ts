export const _log = console.log.bind(null, '[Recorder]:')
export const _warn = console.warn.bind(null, '[Recorder]:')

export function _now(): number {
    if (!window.performance) return Date.now()
    // if user change local time, performance.now() would work accurate still
    return Math.floor(performance.now())
}

export function _throttle<T, K>(func: (T: T) => K, wait: number = 100): (T: T) => K {
    let previous: number = _now()

    return function(...args: any[]): K {
        const now = _now()
        const restTime = now - previous

        if (restTime >= wait) {
            previous = now
            return func.apply(this, args)
        }
    }
}

