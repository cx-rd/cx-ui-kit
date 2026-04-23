export type StepperOrientation = 'horizontal' | 'vertical';

export type StepperCurrentAnimation = 'none' | 'pulse' | 'orbit' | 'glow';

export type StepperStepStatus = 'pending' | 'complete' | 'error' | 'disabled';

export interface StepperStep {
    id?: string;
    label: string;
    description?: string;
    status?: StepperStepStatus;
    disabled?: boolean;
    meta?: Record<string, unknown>;
}

export interface StepperStepChange {
    previousIndex: number;
    index: number;
    direction: 'previous' | 'next' | 'none';
    step: StepperStep;
}
