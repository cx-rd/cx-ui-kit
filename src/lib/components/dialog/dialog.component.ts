import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    HostListener,
    OnDestroy,
    booleanAttribute,
    computed,
    effect,
    inject,
    input,
    output,
    viewChild
} from '@angular/core';

const DIALOG_TRANSITION_MS = 200;
const DIALOG_RENDER_TICK_MS = 10;

@Component({
    selector: 'lib-dialog',
    standalone: true,
    templateUrl: './dialog.component.html',
    styleUrl: './dialog.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DialogComponent implements OnDestroy {
    private readonly cdr = inject(ChangeDetectorRef);
    private readonly surfaceElement = viewChild<unknown, ElementRef<HTMLElement>>('surfaceElement', { read: ElementRef });

    private static nextId = 0;

    readonly open = input(true, { transform: booleanAttribute });
    readonly title = input('Dialog');
    readonly showTitle = input(true, { transform: booleanAttribute });
    readonly showClose = input(true, { transform: booleanAttribute });
    readonly closeOnBackdrop = input(true, { transform: booleanAttribute });
    readonly closeOnEscape = input(true, { transform: booleanAttribute });
    readonly ariaLabel = input('Dialog');
    readonly closeAriaLabel = input('Close dialog');

    readonly close = output<void>();
    readonly openChange = output<boolean>();

    readonly dialogId = `tp-dialog-${DialogComponent.nextId}`;
    readonly titleId = `tp-dialog-title-${DialogComponent.nextId++}`;
    readonly hasHeader = computed(() => this.showTitle() || this.showClose());

    isRendered = false;
    isOpen = false;

    private openTimer?: ReturnType<typeof setTimeout>;
    private closeTimer?: ReturnType<typeof setTimeout>;
    private previouslyFocusedElement: HTMLElement | null = null;

    constructor() {
        effect(() => {
            if (this.open()) {
                this.openDialog();
                return;
            }

            this.closeDialog();
        });
    }

    ngOnDestroy(): void {
        this.clearTimers();
    }

    @HostListener('document:keydown.escape', ['$event'])
    onDocumentEscape(event: Event): void {
        if (!(event instanceof KeyboardEvent)) {
            return;
        }

        if (event.defaultPrevented || !this.isRendered || !this.isOpen || !this.closeOnEscape()) {
            return;
        }

        event.preventDefault();
        this.requestClose();
    }

    onBackdropClick(): void {
        if (!this.closeOnBackdrop()) {
            return;
        }

        this.requestClose();
    }

    requestClose(): void {
        if (!this.isRendered) {
            return;
        }

        this.closeDialog();
        this.openChange.emit(false);
        this.close.emit();
    }

    private openDialog(): void {
        this.clearCloseTimer();

        if (!this.isRendered) {
            this.previouslyFocusedElement = document.activeElement instanceof HTMLElement
                ? document.activeElement
                : null;
            this.isRendered = true;
        }

        if (this.isOpen && !this.openTimer) {
            return;
        }

        this.clearOpenTimer();
        this.openTimer = setTimeout(() => {
            this.openTimer = undefined;
            this.isOpen = true;
            this.focusSurface();
            this.cdr.markForCheck();
        }, DIALOG_RENDER_TICK_MS);

        this.cdr.markForCheck();
    }

    private closeDialog(): void {
        if (!this.isRendered) {
            return;
        }

        const wasOpening = !!this.openTimer;

        this.clearOpenTimer();

        if (!this.isOpen && !wasOpening) {
            return;
        }

        this.isOpen = false;

        if (wasOpening) {
            this.finalizeClose();
            return;
        }

        this.clearCloseTimer();
        this.closeTimer = setTimeout(() => {
            this.closeTimer = undefined;
            this.finalizeClose();
        }, DIALOG_TRANSITION_MS);

        this.cdr.markForCheck();
    }

    private finalizeClose(): void {
        this.clearCloseTimer();

        if (!this.isRendered) {
            return;
        }

        this.isOpen = false;
        this.isRendered = false;
        this.restoreFocus();
        this.cdr.markForCheck();
    }

    private focusSurface(): void {
        this.surfaceElement()?.nativeElement.focus({ preventScroll: true });
    }

    private restoreFocus(): void {
        if (!this.previouslyFocusedElement?.isConnected) {
            this.previouslyFocusedElement = null;
            return;
        }

        this.previouslyFocusedElement.focus({ preventScroll: true });
        this.previouslyFocusedElement = null;
    }

    private clearOpenTimer(): void {
        if (this.openTimer) {
            clearTimeout(this.openTimer);
            this.openTimer = undefined;
        }
    }

    private clearCloseTimer(): void {
        if (this.closeTimer) {
            clearTimeout(this.closeTimer);
            this.closeTimer = undefined;
        }
    }

    private clearTimers(): void {
        this.clearOpenTimer();
        this.clearCloseTimer();
    }
}
