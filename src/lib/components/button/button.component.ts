import {
    ChangeDetectionStrategy,
    Component,
    booleanAttribute,
    computed,
    input,
    output,
    signal
} from '@angular/core';
import {
    ButtonActiveChange,
    ButtonHoverChange,
    ButtonSize,
    ButtonType,
    ButtonVariant
} from '../../core/models';

const BUTTON_VARIANTS = new Set<ButtonVariant>(['primary', 'secondary', 'outline', 'ghost', 'danger']);
const BUTTON_SIZES = new Set<ButtonSize>(['sm', 'md', 'lg']);
const BUTTON_TYPES = new Set<ButtonType>(['button', 'submit', 'reset']);

function optionalBooleanAttribute(value: boolean | string | null | undefined): boolean | null {
    return value == null ? null : booleanAttribute(value);
}

@Component({
    selector: 'lib-button',
    standalone: true,
    templateUrl: './button.component.html',
    styleUrl: './button.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ButtonComponent {
    readonly variant = input<ButtonVariant>('primary');
    readonly size = input<ButtonSize>('md');
    readonly type = input<ButtonType>('button');
    readonly disabled = input(false, { transform: booleanAttribute });
    readonly fullWidth = input(false, { transform: booleanAttribute });
    readonly ariaLabel = input<string | null>(null);
    readonly pressed = input<boolean | null, boolean | string | null | undefined>(null, {
        transform: optionalBooleanAttribute
    });

    readonly hoverChange = output<ButtonHoverChange>();
    readonly activeChange = output<ButtonActiveChange>();

    readonly isHovered = signal(false);
    readonly isActive = signal(false);

    readonly resolvedVariant = computed<ButtonVariant>(() => {
        const variant = this.variant();

        return BUTTON_VARIANTS.has(variant) ? variant : 'primary';
    });

    readonly resolvedSize = computed<ButtonSize>(() => {
        const size = this.size();

        return BUTTON_SIZES.has(size) ? size : 'md';
    });

    readonly resolvedType = computed<ButtonType>(() => {
        const type = this.type();

        return BUTTON_TYPES.has(type) ? type : 'button';
    });

    onHoverChange(hovering: boolean, event: MouseEvent): void {
        if (this.disabled() || this.isHovered() === hovering) {
            return;
        }

        this.isHovered.set(hovering);
        this.hoverChange.emit({ hovering, event });
    }

    onActiveChange(active: boolean, event: PointerEvent | KeyboardEvent): void {
        this.setActiveState(active, event);
    }

    onKeyDown(event: KeyboardEvent): void {
        if (this.isActivationKey(event)) {
            this.setActiveState(true, event);
        }
    }

    onKeyUp(event: KeyboardEvent): void {
        if (this.isActivationKey(event)) {
            this.setActiveState(false, event);
        }
    }

    onBlur(event: FocusEvent): void {
        this.setActiveState(false, event);
    }

    private setActiveState(active: boolean, event: ButtonActiveChange['event']): void {
        if (this.disabled() || this.isActive() === active) {
            return;
        }

        this.isActive.set(active);
        this.activeChange.emit({ active, event });
    }

    private isActivationKey(event: KeyboardEvent): boolean {
        return event.key === 'Enter' || event.key === ' ';
    }
}
