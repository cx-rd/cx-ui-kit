import {
    AfterViewInit,
    Component,
    DestroyRef,
    ElementRef,
    computed,
    effect,
    inject,
    input,
    output,
    viewChild
} from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { SettingsRegistryService } from '../../core/services/settings-registry.service';

@Component({
    selector: 'lib-settings-page',
    standalone: true,
    imports: [NgComponentOutlet],
    templateUrl: './settings-page.component.html',
    styleUrl: './settings-page.component.scss',
    providers: [SettingsRegistryService]
})
export class SettingsPageComponent implements AfterViewInit {
    private readonly registry = inject(SettingsRegistryService);
    private readonly destroyRef = inject(DestroyRef);

    readonly title = input<string>('Settings');
    readonly saveButtonLabel = input<string>('Save Changes');

    readonly activeTabId = input<string | null>(null);
    readonly activeSectionId = input<string | null>(null);

    readonly tabs = computed(() => this.registry.getTabs());
    readonly sections = computed(() => {
        const tabId = this.activeTabId();
        return tabId ? this.registry.getSectionsByTab(tabId) : [];
    });

    readonly scrollContainer = viewChild<ElementRef<HTMLElement>>('scrollContainer');
    readonly contentArea = viewChild<ElementRef<HTMLElement>>('contentArea');

    readonly tabChange = output<string>();
    readonly sectionClick = output<string>();
    readonly sectionScroll = output<string>();
    readonly save = output<void>();

    private observer: IntersectionObserver | null = null;
    private cleanupScrollListener: (() => void) | null = null;
    private cleanupScrollEndListener: (() => void) | null = null;
    private isUserScrolling = true;
    private lastEmittedId: string | null = null;
    private observerSetupTimer: ReturnType<typeof setTimeout> | null = null;
    private scrollRestoreTimer: ReturnType<typeof setTimeout> | null = null;
    private scrollToSectionTimer: ReturnType<typeof setTimeout> | null = null;

    constructor() {
        effect(() => {
            const tabId = this.activeTabId();
            if (tabId) {
                const scrollRoot = this.scrollContainer()?.nativeElement;
                if (scrollRoot) {
                    scrollRoot.scrollTop = 0;
                }
            }
        });

        effect(() => {
            const currentSections = this.sections();
            const currentId = this.activeSectionId();

            if (!currentSections.length) {
                this.cleanupObserver();
                return;
            }

            const isValid = currentSections.some((section) => section.id === currentId);
            if (!currentId || !isValid) {
                this.emitSectionScroll(currentSections[0].id);
            }

            this.scheduleObserverRefresh();

            if (currentId && currentId !== this.lastEmittedId && isValid) {
                this.scheduleScrollToSection(currentId);
            }
        });

        effect(() => {
            const currentSections = this.sections();
            const id = this.activeSectionId();

            if (!id || id === this.lastEmittedId) {
                return;
            }

            if (currentSections.some((section) => section.id === id)) {
                this.scheduleScrollToSection(id);
            }
        });

        this.destroyRef.onDestroy(() => {
            this.clearPendingTimers();
            this.cleanupObserver();
            this.cleanupScrollEndListener?.();
        });
    }

    ngAfterViewInit(): void {
        this.scheduleObserverRefresh();
    }

    selectTab(id: string): void {
        this.tabChange.emit(id);
    }

    handleSectionClick(id: string): void {
        this.lastEmittedId = id;
        this.sectionClick.emit(id);
        this.scrollToSection(id);
    }

    scrollToSection(id: string): void {
        const scrollRoot = this.scrollContainer()?.nativeElement;
        const content = this.contentArea()?.nativeElement;

        if (!scrollRoot || !content) {
            return;
        }

        const element = content.querySelector<HTMLElement>(`#${id}`);
        if (!element) {
            return;
        }

        this.cleanupScrollEndListener?.();
        this.isUserScrolling = false;

        const targetTop =
            element.getBoundingClientRect().top -
            scrollRoot.getBoundingClientRect().top +
            scrollRoot.scrollTop -
            20;

        const restoreUserScrolling = () => {
            this.isUserScrolling = true;
            this.cleanupScrollEndListener?.();
            this.cleanupScrollEndListener = null;
        };

        const onScrollEnd = () => {
            if (this.scrollRestoreTimer) {
                clearTimeout(this.scrollRestoreTimer);
            }

            this.scrollRestoreTimer = setTimeout(() => {
                this.scrollRestoreTimer = null;
                restoreUserScrolling();
            }, 100);
        };

        scrollRoot.addEventListener('scroll', onScrollEnd);
        this.cleanupScrollEndListener = () => scrollRoot.removeEventListener('scroll', onScrollEnd);

        scrollRoot.scrollTo({
            top: targetTop,
            behavior: 'smooth'
        });

        if (this.scrollRestoreTimer) {
            clearTimeout(this.scrollRestoreTimer);
        }

        this.scrollRestoreTimer = setTimeout(() => {
            this.scrollRestoreTimer = null;
            restoreUserScrolling();
        }, 1000);
    }

    onSave(): void {
        this.save.emit();
    }

    private scheduleObserverRefresh(delay = 0): void {
        if (this.observerSetupTimer) {
            clearTimeout(this.observerSetupTimer);
        }

        this.observerSetupTimer = setTimeout(() => {
            this.observerSetupTimer = null;
            this.setupIntersectionObserver();
        }, delay);
    }

    private scheduleScrollToSection(id: string): void {
        if (this.scrollToSectionTimer) {
            clearTimeout(this.scrollToSectionTimer);
        }

        this.scrollToSectionTimer = setTimeout(() => {
            this.scrollToSectionTimer = null;
            this.scrollToSection(id);
        }, 0);
    }

    private cleanupObserver(): void {
        this.cleanupScrollListener?.();
        this.cleanupScrollListener = null;

        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
    }

    private setupIntersectionObserver(): void {
        this.cleanupObserver();

        const scrollRoot = this.scrollContainer()?.nativeElement;
        const content = this.contentArea()?.nativeElement;

        if (!scrollRoot || !content) {
            return;
        }

        this.observer = new IntersectionObserver((entries) => {
            if (!this.isUserScrolling) {
                return;
            }

            const intersectingEntry = entries.find((entry) => entry.isIntersecting);
            if (intersectingEntry) {
                this.emitSectionScroll((intersectingEntry.target as HTMLElement).id);
            }
        }, {
            root: scrollRoot,
            rootMargin: '-5% 0px -75% 0px',
            threshold: 0
        });

        for (const section of this.sections()) {
            const element = content.querySelector<HTMLElement>(`#${section.id}`);
            if (element) {
                this.observer.observe(element);
            }
        }

        const onScroll = () => {
            if (!this.isUserScrolling) {
                return;
            }

            if (scrollRoot.scrollTop < 10) {
                const firstSection = this.sections()[0];
                if (firstSection && this.activeSectionId() !== firstSection.id) {
                    this.emitSectionScroll(firstSection.id);
                }
            }
        };

        scrollRoot.addEventListener('scroll', onScroll, { passive: true });
        this.cleanupScrollListener = () => scrollRoot.removeEventListener('scroll', onScroll);
    }

    private emitSectionScroll(id: string): void {
        this.lastEmittedId = id;
        this.sectionScroll.emit(id);
    }

    private clearPendingTimers(): void {
        if (this.observerSetupTimer) {
            clearTimeout(this.observerSetupTimer);
            this.observerSetupTimer = null;
        }

        if (this.scrollRestoreTimer) {
            clearTimeout(this.scrollRestoreTimer);
            this.scrollRestoreTimer = null;
        }

        if (this.scrollToSectionTimer) {
            clearTimeout(this.scrollToSectionTimer);
            this.scrollToSectionTimer = null;
        }
    }
}
