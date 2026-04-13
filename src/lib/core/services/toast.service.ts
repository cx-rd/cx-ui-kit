import { Injectable, signal } from '@angular/core';
import { ToastConfig, ToastInstance, ToastPosition, ToastVariant } from '../models';

const DEFAULT_DURATION = 5000;
const DEFAULT_POSITION: ToastPosition = 'top-right';

const DEFAULT_LABELS: Record<ToastVariant, string> = {
    success: 'SUCCESS',
    error: 'ERROR',
    info: 'INFO',
    warning: 'WARNING',
    update: 'UPDATE',
    loading: 'LOADING',
    neutral: 'NOTICE'
};

interface ToastTimerState {
    remaining: number;
    startedAt: number | null;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
    readonly toasts = signal<ToastInstance[]>([]);

    private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();
    private readonly timerStates = new Map<string, ToastTimerState>();

    /** Creates a toast instance, stores it, and starts its auto-close timer when needed. */
    show(config: ToastConfig): string {
        const toast = this.buildToast(config);
        this.toasts.update(items => [...items, toast]);

        if (toast.autoClose && toast.duration > 0) {
            this.startTimer(toast.id, toast.duration);
        }

        return toast.id;
    }

    /** Creates a success toast with the shared default configuration. */
    success(config: Omit<ToastConfig, 'variant'>): string {
        return this.show({ ...config, variant: 'success' });
    }

    /** Creates an error toast with the shared default configuration. */
    error(config: Omit<ToastConfig, 'variant'>): string {
        return this.show({ ...config, variant: 'error' });
    }

    /** Creates an info toast with the shared default configuration. */
    info(config: Omit<ToastConfig, 'variant'>): string {
        return this.show({ ...config, variant: 'info' });
    }

    /** Creates a warning toast with the shared default configuration. */
    warning(config: Omit<ToastConfig, 'variant'>): string {
        return this.show({ ...config, variant: 'warning' });
    }

    /** Creates a loading toast that stays visible until dismissed manually. */
    loading(config: Omit<ToastConfig, 'variant' | 'autoClose'>): string {
        return this.show({ ...config, variant: 'loading', autoClose: false });
    }

    /** Dismisses a single toast and clears any active timer bookkeeping. */
    dismiss(id: string): void {
        this.clearTimer(id);
        this.toasts.update(items => items.filter(item => item.id !== id));
    }

    /** Dismisses every toast, or only the toasts in one position bucket when provided. */
    dismissAll(position?: ToastPosition): void {
        const ids = this.toasts()
            .filter(item => !position || item.position === position)
            .map(item => item.id);

        ids.forEach(id => this.clearTimer(id));
        this.toasts.update(items => {
            if (!position) {
                return [];
            }

            return items.filter(item => item.position !== position);
        });
    }

    /** Pauses a single toast timer and preserves its remaining duration. */
    pause(id: string): void {
        const timerState = this.timerStates.get(id);

        if (!timerState || timerState.startedAt === null) {
            return;
        }

        const elapsed = Date.now() - timerState.startedAt;
        timerState.remaining = Math.max(0, timerState.remaining - elapsed);
        timerState.startedAt = null;
        this.clearActiveTimer(id);
    }

    /** Pauses every auto-closing toast that belongs to the given stack position. */
    pausePosition(position: ToastPosition): void {
        for (const toast of this.getTimedToasts(position)) {
            this.pause(toast.id);
        }
    }

    /** Resumes a single toast timer using its preserved remaining duration. */
    resume(id: string, duration?: number): void {
        const toast = this.toasts().find(item => item.id === id);

        if (!toast || !toast.autoClose) {
            return;
        }

        const timerState = this.timerStates.get(id);
        const remaining = duration ?? timerState?.remaining ?? toast.duration;

        if (remaining <= 0) {
            this.dismiss(id);
            return;
        }

        this.startTimer(id, remaining);
    }

    /** Resumes every paused auto-closing toast that belongs to the given stack position. */
    resumePosition(position: ToastPosition): void {
        for (const toast of this.getTimedToasts(position)) {
            this.resume(toast.id);
        }
    }

    /** Normalizes consumer config into the concrete toast instance stored by the service. */
    private buildToast(config: ToastConfig): ToastInstance {
        const variant = config.variant ?? 'info';
        const duration = config.duration ?? DEFAULT_DURATION;

        return {
            id: config.id ?? this.generateId(),
            createdAt: Date.now(),
            variant,
            label: config.label ?? DEFAULT_LABELS[variant],
            title: config.title,
            message: config.message,
            icon: config.icon,
            showIcon: config.showIcon ?? true,
            closable: config.closable ?? true,
            duration,
            autoClose: config.autoClose ?? variant !== 'loading',
            showProgress: config.showProgress ?? true,
            position: config.position ?? DEFAULT_POSITION,
            className: config.className,
            styles: config.styles,
            action: config.action,
            data: config.data
        };
    }

    /** Starts or restarts a toast timer while capturing the remaining duration metadata. */
    private startTimer(id: string, duration: number): void {
        this.clearActiveTimer(id);
        this.timerStates.set(id, { remaining: duration, startedAt: Date.now() });

        const timer = setTimeout(() => this.dismiss(id), duration);
        this.timers.set(id, timer);
    }

    /** Stops an active timeout without discarding the saved remaining duration. */
    private clearActiveTimer(id: string): void {
        const timer = this.timers.get(id);

        if (!timer) {
            return;
        }

        clearTimeout(timer);
        this.timers.delete(id);
    }

    /** Clears all timer state for a toast once it is fully dismissed. */
    private clearTimer(id: string): void {
        this.clearActiveTimer(id);
        this.timerStates.delete(id);
    }

    /** Returns only the auto-closing toasts that currently belong to the requested stack. */
    private getTimedToasts(position: ToastPosition): ToastInstance[] {
        return this.toasts().filter(item => item.position === position && item.autoClose && item.duration > 0);
    }

    /** Generates a unique id for internal toast tracking. */
    private generateId(): string {
        return `tp-toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    }
}
