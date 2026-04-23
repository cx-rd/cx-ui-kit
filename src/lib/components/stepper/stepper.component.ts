import { CommonModule } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    booleanAttribute,
    computed,
    input,
    numberAttribute,
    output
} from '@angular/core';
import {
    StepperCurrentAnimation,
    StepperOrientation,
    StepperStep,
    StepperStepChange,
    StepperStepStatus
} from '../../core/models';

interface ResolvedStepperStep {
    key: string;
    index: number;
    step: StepperStep;
    label: string;
    description: string | null;
    status: StepperStepStatus;
    isCurrent: boolean;
    isDisabled: boolean;
    ariaLabel: string;
}

const CURRENT_ANIMATIONS = new Set<StepperCurrentAnimation>(['none', 'pulse', 'orbit', 'glow']);

@Component({
    selector: 'lib-stepper',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './stepper.component.html',
    styleUrl: './stepper.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class StepperComponent {
    readonly steps = input<ReadonlyArray<StepperStep>>([]);
    readonly activeIndex = input(0, { transform: numberAttribute });
    readonly orientation = input<StepperOrientation>('horizontal');
    readonly currentAnimation = input<StepperCurrentAnimation>('pulse');
    readonly selectable = input(false, { transform: booleanAttribute });
    readonly showDescriptions = input(true, { transform: booleanAttribute });
    readonly ariaLabel = input('Progress steps');

    readonly stepChange = output<StepperStepChange>();

    readonly resolvedSteps = computed<ResolvedStepperStep[]>(() => {
        const steps = this.steps();
        const activeIndex = this.clampIndex(this.activeIndex(), steps.length);

        return steps.map((step, index) => this.resolveStep(step, index, activeIndex));
    });

    get resolvedActiveIndex(): number {
        return this.clampIndex(this.activeIndex(), this.steps().length);
    }

    get resolvedOrientation(): StepperOrientation {
        return this.orientation() === 'vertical' ? 'vertical' : 'horizontal';
    }

    get resolvedCurrentAnimation(): StepperCurrentAnimation {
        const animation = this.currentAnimation();

        return CURRENT_ANIMATIONS.has(animation) ? animation : 'pulse';
    }

    isInteractive(item: ResolvedStepperStep): boolean {
        return this.selectable() && !item.isDisabled;
    }

    selectStep(item: ResolvedStepperStep): void {
        if (!this.isInteractive(item) || item.index === this.resolvedActiveIndex) {
            return;
        }

        const previousIndex = this.resolvedActiveIndex;

        this.stepChange.emit({
            previousIndex,
            index: item.index,
            direction: this.resolveDirection(previousIndex, item.index),
            step: item.step
        });
    }

    private resolveStep(step: StepperStep, index: number, activeIndex: number): ResolvedStepperStep {
        const status = this.resolveStatus(step, index, activeIndex);
        const isCurrent = index === activeIndex;
        const isDisabled = status === 'disabled' || step.disabled === true;
        const label = step.label || `Step ${index + 1}`;
        const stateLabel = this.resolveStateLabel(status, isCurrent);

        return {
            key: step.id ?? String(index),
            index,
            step,
            label,
            description: step.description ?? null,
            status,
            isCurrent,
            isDisabled,
            ariaLabel: `${label}, ${stateLabel}`
        };
    }

    private resolveStatus(step: StepperStep, index: number, activeIndex: number): StepperStepStatus {
        if (step.disabled) {
            return 'disabled';
        }

        if (step.status) {
            return step.status;
        }

        return index < activeIndex ? 'complete' : 'pending';
    }

    private resolveStateLabel(status: StepperStepStatus, isCurrent: boolean): string {
        if (isCurrent) {
            return 'current step';
        }

        switch (status) {
            case 'complete':
                return 'completed step';
            case 'error':
                return 'step with error';
            case 'disabled':
                return 'disabled step';
            case 'pending':
            default:
                return 'pending step';
        }
    }

    private resolveDirection(previousIndex: number, nextIndex: number): StepperStepChange['direction'] {
        if (nextIndex > previousIndex) {
            return 'next';
        }

        if (nextIndex < previousIndex) {
            return 'previous';
        }

        return 'none';
    }

    private clampIndex(index: number, length: number): number {
        if (length <= 0 || !Number.isFinite(index)) {
            return 0;
        }

        return Math.min(Math.max(0, Math.floor(index)), length - 1);
    }
}
