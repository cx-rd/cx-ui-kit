export type ToastVariant = 'success' | 'error' | 'info' | 'warning' | 'update' | 'loading' | 'neutral';

export type ToastPosition =
    | 'top-left'
    | 'top-center'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-center'
    | 'bottom-right';

export interface ToastAction {
    id: string;
    label: string;
    appearance?: 'solid' | 'ghost';
}

export interface ToastStyleOverrides {
    accentColor?: string;
    accentSoftColor?: string;
    borderColor?: string;
    glowColor?: string;
    iconColor?: string;
    textColor?: string;
    titleColor?: string;
    messageColor?: string;
    background?: string;
    backdropFilter?: string;
    width?: string;
    maxWidth?: string;
    minHeight?: string;
    borderRadius?: string;
    boxShadow?: string;
}

export interface ToastConfig {
    id?: string;
    variant?: ToastVariant;
    label?: string;
    title: string;
    message?: string;
    icon?: string;
    showIcon?: boolean;
    closable?: boolean;
    duration?: number;
    autoClose?: boolean;
    showProgress?: boolean;
    position?: ToastPosition;
    className?: string;
    styles?: ToastStyleOverrides;
    action?: ToastAction;
    data?: Record<string, unknown>;
}

export interface ToastInstance extends Required<
    Pick<ToastConfig, 'title' | 'variant' | 'closable' | 'showIcon' | 'autoClose' | 'showProgress' | 'position'>
> {
    id: string;
    createdAt: number;
    duration: number;
    label?: string;
    message?: string;
    icon?: string;
    className?: string;
    styles?: ToastStyleOverrides;
    action?: ToastAction;
    data?: Record<string, unknown>;
}
