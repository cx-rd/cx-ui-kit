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

    constructor() {
        effect(() => {
            const currentSections = this.sections();
            if (currentSections.length > 0) {
                setTimeout(() => this.setupIntersectionObserver(), 100);
            }
        });
    }

    ngAfterViewInit() {
        this.setupIntersectionObserver();
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
            rootMargin: '0px 0px -70% 0px',
            threshold: 0
        };

        this.observer = new IntersectionObserver((entries) => {
            if (!this.isUserScrolling) return;

            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.sectionScroll.emit((entry.target as HTMLElement).id);
                }
            });
        }, options);

        this.sections().forEach(section => {
            const element = content.querySelector<HTMLElement>(`#${section.id}`);
            if (element) {
                this.observer?.observe(element);
            }
        });
    }

    selectTab(id: string) {
        this.tabChange.emit(id);
    }

    handleSectionClick(id: string) {
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

        setTimeout(() => {
            this.isUserScrolling = true;
        }, 800);
    }

    onSave() {
        this.save.emit();
    }
}
