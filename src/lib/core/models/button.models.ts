export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonType = 'button' | 'submit' | 'reset';

export interface ButtonHoverChange {
    hovering: boolean;
    event: MouseEvent;
}

export interface ButtonActiveChange {
    active: boolean;
    event: PointerEvent | KeyboardEvent | FocusEvent;
}
