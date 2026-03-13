import {
    Component,
    input,
    output,
    computed,
    ElementRef,
    viewChild,
    AfterViewInit,
    OnDestroy,
    effect,
    inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsRegistryService } from '../../core/services/settings-registry.service';

@Component({
    selector: 'lib-settings-page',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './settings-page.component.html',
    styleUrl: './settings-page.component.scss',
    providers: [SettingsRegistryService]
})
export class SettingsPageComponent implements AfterViewInit, OnDestroy {
    private registry = inject(SettingsRegistryService);

    title = input<string>('Settings');
    saveButtonLabel = input<string>('Save Changes');

    activeTabId = input<string | null>(null);
    activeSectionId = input<string | null>(null);

    tabs = computed(() => this.registry.getTabs());
    sections = computed(() => {
        const tabId = this.activeTabId();
        return tabId ? this.registry.getSectionsByTab(tabId) : [];
    });

    scrollContainer = viewChild<ElementRef<HTMLElement>>('scrollContainer');
    contentArea = viewChild<ElementRef<HTMLElement>>('contentArea');

    tabChange = output<string>();
    sectionClick = output<string>();
    sectionScroll = output<string>();
    save = output<void>();

    private observer: IntersectionObserver | null = null;
    private isUserScrolling = true;
    private lastEmittedId: string | null = null;

    constructor() {
        // Effect to handle tab changes: Reset scroll position
        effect(() => {
            const tabId = this.activeTabId();
            if (tabId) {
                const scrollRoot = this.scrollContainer()?.nativeElement;
                if (scrollRoot) {
                    scrollRoot.scrollTop = 0;
                }
            }
        });

        // Effect to handle section changes: Focus and Observation
        effect(() => {
            const currentSections = this.sections();
            if (currentSections.length > 0) {
                const currentId = this.activeSectionId();
                const isValid = currentSections.some(s => s.id === currentId);

                if (!currentId || !isValid) {
                    this.emitSectionScroll(currentSections[0].id);
                }
                
                // Allow view to render then setup observer and possibly scroll
                setTimeout(() => {
                    this.setupIntersectionObserver();
                    
                    // If we have a valid ID that didn't come from a scroll event (e.g., Refresh or Tab switch)
                    // Trigger manual scroll to it
                    const id = this.activeSectionId();
                    if (id && id !== this.lastEmittedId && isValid) {
                        this.scrollToSection(id);
                    }
                }, 100);
            }
        });

        // Handle external section selection (Direct input change)
        effect(() => {
            const id = this.activeSectionId();
            if (id && id !== this.lastEmittedId) {
                const currentSections = this.sections();
                if (currentSections.some(s => s.id === id)) {
                    this.scrollToSection(id);
                }
            }
        });
    }

    ngAfterViewInit() {
        // Handled by effects mostly, but ensure observer is ready
        setTimeout(() => this.setupIntersectionObserver(), 200);
    }

    ngOnDestroy() {
        this.cleanupObserver();
    }

    private cleanupObserver() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
    }

    private setupIntersectionObserver() {
        this.cleanupObserver();

        const scrollRoot = this.scrollContainer()?.nativeElement;
        const content = this.contentArea()?.nativeElement;

        if (!scrollRoot || !content) return;

        const options = {
            root: scrollRoot,
            rootMargin: '-5% 0px -75% 0px',
            threshold: 0
        };

        this.observer = new IntersectionObserver((entries) => {
            if (!this.isUserScrolling) return;

            const intersectingEntry = entries.find(entry => entry.isIntersecting);
            if (intersectingEntry) {
                this.emitSectionScroll((intersectingEntry.target as HTMLElement).id);
            }
        }, options);

        this.sections().forEach(section => {
            const element = content.querySelector<HTMLElement>(`#${section.id}`);
            if (element) {
                this.observer?.observe(element);
            }
        });

        scrollRoot.addEventListener('scroll', () => {
            if (!this.isUserScrolling) return;
            
            if (scrollRoot.scrollTop < 10) {
                const firstSection = this.sections()[0];
                if (firstSection && this.activeSectionId() !== firstSection.id) {
                    this.emitSectionScroll(firstSection.id);
                }
            }
        }, { passive: true });
    }

    private emitSectionScroll(id: string) {
        this.lastEmittedId = id;
        this.sectionScroll.emit(id);
    }

    selectTab(id: string) {
        this.tabChange.emit(id);
    }

    handleSectionClick(id: string) {
        this.lastEmittedId = id;
        this.sectionClick.emit(id);
        this.scrollToSection(id);
    }

    scrollToSection(id: string) {
        const scrollRoot = this.scrollContainer()?.nativeElement;
        const content = this.contentArea()?.nativeElement;

        if (!scrollRoot || !content) return;

        const element = content.querySelector<HTMLElement>(`#${id}`);
        if (!element) return;

        this.isUserScrolling = false;

        const targetTop =
            element.getBoundingClientRect().top -
            scrollRoot.getBoundingClientRect().top +
            scrollRoot.scrollTop -
            20;

        scrollRoot.scrollTo({
            top: targetTop,
            behavior: 'smooth'
        });

        let scrollTimeout: any;
        const onScrollEnd = () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.isUserScrolling = true;
                scrollRoot.removeEventListener('scroll', onScrollEnd);
            }, 100);
        };
        scrollRoot.addEventListener('scroll', onScrollEnd);
        
        setTimeout(() => {
            this.isUserScrolling = true;
            scrollRoot.removeEventListener('scroll', onScrollEnd);
        }, 1000);
    }

    onSave() {
        this.save.emit();
    }
}
