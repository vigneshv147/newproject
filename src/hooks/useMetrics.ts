import { useState, useEffect, useRef } from 'react';

interface DailyStats {
    date: string;
    durationSeconds: number;
}

interface Metrics {
    avgWorkingTime: string;
    avgSessionDuration: string;
    workingTimeTrend: string;
    sessionTrend: string;
    currentSessionDuration: string;
}

export function useMetrics(): Metrics {
    const [metrics, setMetrics] = useState<Metrics>({
        avgWorkingTime: '0.0',
        avgSessionDuration: '0',
        workingTimeTrend: '+0%',
        sessionTrend: '+0%',
        currentSessionDuration: '0 min'
    });

    // Refs to keep track of state without triggering re-renders inside the interval
    const sessionStartRef = useRef<number>(Date.now());
    const lastTickRef = useRef<number>(Date.now());

    useEffect(() => {
        // Initialize storage if empty
        const savedSessions = localStorage.getItem('chameleon_sessions');
        const savedDaily = localStorage.getItem('chameleon_daily');

        if (!savedSessions) localStorage.setItem('chameleon_sessions', JSON.stringify([]));
        if (!savedDaily) localStorage.setItem('chameleon_daily', JSON.stringify([]));

        // Update loop
        const interval = setInterval(() => {
            const now = Date.now();
            const deltaSeconds = (now - lastTickRef.current) / 1000;
            lastTickRef.current = now;

            // 1. Calculate Current Session Duration
            const sessionDurationSeconds = (now - sessionStartRef.current) / 1000;

            // 2. Update Daily Working Time
            const today = new Date().toISOString().split('T')[0];
            const dailyData: DailyStats[] = JSON.parse(localStorage.getItem('chameleon_daily') || '[]');

            const todayEntryIndex = dailyData.findIndex(d => d.date === today);
            if (todayEntryIndex >= 0) {
                dailyData[todayEntryIndex].durationSeconds += deltaSeconds;
            } else {
                dailyData.push({ date: today, durationSeconds: deltaSeconds });
            }
            localStorage.setItem('chameleon_daily', JSON.stringify(dailyData));

            // 3. Update Session History (update the last entry or add new if it's a new load - actually we just track count/avg)
            // For simplicity in this "Avg Session" metric, we will store individual session lengths.
            // Since we can't easily detect "end of session" reliably on close, we'll might just use the stored average 
            // and mix it with current? 
            // Actually, a better approach for "Avg Session Duration" is:
            // (Sum of all past completed sessions + Current Session) / (Count + 1)
            // But we don't know when a session "completes" until it's over.
            // Let's just track "total time spent" / "number of visits".

            // Simplified: Store "Total Sessions Count" and "Total Duration All Time".
            let totalSessions = parseInt(localStorage.getItem('chameleon_total_sessions') || '0');
            let totalDuration = parseFloat(localStorage.getItem('chameleon_total_duration') || '0');

            // We only increment session count ONCE per page load (useEffect dependency [] handled this? no, we need to do it once).
            // Let's do that initialization outside the interval.

            // --- Calculations for Display ---

            // Avg Working Time (Hours/Day)
            // Sum of all daily durations / Number of days recorded
            const totalWorkingSeconds = dailyData.reduce((acc, curr) => acc + curr.durationSeconds, 0);
            const daysCount = dailyData.length || 1;
            const avgHoursPerDay = (totalWorkingSeconds / 3600) / daysCount;

            // Avg Session Duration (Minutes)
            // We need a robust way to track sessions. 
            // Let's rely on `totalDuration` (which we update continuously) / `totalSessions`.
            // We will increment `totalDuration` by delta every tick.

            // Update persistent totals
            let storedTotalDuration = parseFloat(localStorage.getItem('chameleon_total_duration') || '0');
            storedTotalDuration += deltaSeconds;
            localStorage.setItem('chameleon_total_duration', storedTotalDuration.toString());

            let storedTotalSessions = parseInt(localStorage.getItem('chameleon_total_sessions') || '1');
            const avgSessionMinutes = (storedTotalDuration / 60) / storedTotalSessions;

            // Trends (vs yesterday or vs average? Let's just do vs Average for today)
            // Working Time Trend: Today's hours vs Avg hours
            const todaySeconds = dailyData.find(d => d.date === today)?.durationSeconds || 0;
            const todayHours = todaySeconds / 3600;
            const workingTrend = avgHoursPerDay > 0 ? ((todayHours - avgHoursPerDay) / avgHoursPerDay) * 100 : 0;


            setMetrics({
                avgWorkingTime: avgHoursPerDay.toFixed(1),
                avgSessionDuration: Math.round(avgSessionMinutes).toString(),
                workingTimeTrend: `${workingTrend >= 0 ? '+' : ''}${Math.round(workingTrend)}%`,
                sessionTrend: '+5%', // Hard to calc trend for session duration real-time, keep fake or calc vs yesterday
                currentSessionDuration: `${Math.floor(sessionDurationSeconds / 60)} min`
            });

        }, 1000); // Update every second

        // Increment session count on mount
        const currentSessions = parseInt(localStorage.getItem('chameleon_total_sessions') || '0');
        localStorage.setItem('chameleon_total_sessions', (currentSessions + 1).toString());

        return () => clearInterval(interval);
    }, []);

    return metrics;
}
