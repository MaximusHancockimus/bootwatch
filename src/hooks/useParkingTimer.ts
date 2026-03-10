import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useNotifications } from './useNotifications';

export type TimerPhase = 'idle' | 'running' | 'warning' | 'critical' | 'expired';

interface TimerState {
  phase: TimerPhase;
  totalSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
}

const WARNING_THRESHOLD = 600;  // 10 minutes
const CRITICAL_THRESHOLD = 300; // 5 minutes

function getPhase(remaining: number, isRunning: boolean): TimerPhase {
  if (!isRunning) return remaining <= 0 && isRunning ? 'expired' : 'idle';
  if (remaining <= 0) return 'expired';
  if (remaining <= CRITICAL_THRESHOLD) return 'critical';
  if (remaining <= WARNING_THRESHOLD) return 'warning';
  return 'running';
}

export function useParkingTimer() {
  const [state, setState] = useState<TimerState>({
    phase: 'idle',
    totalSeconds: 0,
    remainingSeconds: 0,
    isRunning: false,
  });

  const endTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { permissionStatus, requestPermissions, scheduleNotification, cancelAllScheduled } = useNotifications();

  const tick = useCallback(() => {
    if (!endTimeRef.current) return;
    const remaining = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000));
    const isRunning = remaining > 0;

    setState((prev) => ({
      ...prev,
      remainingSeconds: remaining,
      isRunning,
      phase: getPhase(remaining, true),
    }));

    if (remaining <= 0) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      endTimeRef.current = null;
      setState((prev) => ({ ...prev, isRunning: false, phase: 'expired' }));
    }
  }, []);

  // Resume accurately after app returns from background
  useEffect(() => {
    const handleAppState = (next: AppStateStatus) => {
      if (next === 'active' && endTimeRef.current) {
        tick();
      }
    };
    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub.remove();
  }, [tick]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const start = useCallback(async (durationMinutes: number) => {
    const totalSeconds = durationMinutes * 60;
    const endTime = Date.now() + totalSeconds * 1000;
    endTimeRef.current = endTime;

    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(tick, 1000);

    setState({
      phase: 'running',
      totalSeconds,
      remainingSeconds: totalSeconds,
      isRunning: true,
    });

    // Schedule notifications — these fire even when the app is backgrounded/killed
    await cancelAllScheduled();

    let granted = permissionStatus === 'granted';
    if (!granted) {
      granted = await requestPermissions();
    }

    if (granted) {
      if (totalSeconds > 600) {
        await scheduleNotification(
          '⏱️ 10 minutes left!',
          'Your visitor parking time is almost up. Head back soon.',
          totalSeconds - 600,
        );
      }
      if (totalSeconds > 300) {
        await scheduleNotification(
          '⚠️ 5 minutes left!',
          'Move your car now to avoid getting booted!',
          totalSeconds - 300,
        );
      }
      await scheduleNotification(
        '🚨 Time expired!',
        'Your visitor parking time is up. Move your car immediately!',
        totalSeconds,
      );
    }
  }, [tick, permissionStatus, requestPermissions, scheduleNotification, cancelAllScheduled]);

  const cancel = useCallback(async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    endTimeRef.current = null;
    await cancelAllScheduled();
    setState({ phase: 'idle', totalSeconds: 0, remainingSeconds: 0, isRunning: false });
  }, [cancelAllScheduled]);

  return { ...state, start, cancel, permissionStatus };
}
