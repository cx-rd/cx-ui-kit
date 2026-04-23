import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TimelineItem } from '../../core/models';
import { TimelineComponent } from './timeline.component';

@Component({
    standalone: true,
    imports: [TimelineComponent],
    template: `
        <ng-template #markerTemplate let-item>
            <span class="custom-marker">{{ item.icon }}</span>
        </ng-template>

        <lib-timeline
            [items]="items"
            [markerTemplate]="markerTemplate">
        </lib-timeline>
    `
})
class TimelineMarkerTemplateHostComponent {
    readonly items: TimelineItem[] = [
        {
            id: 'shipment',
            title: 'Shipment departed',
            icon: 'local_shipping'
        }
    ];
}

describe('TimelineComponent', () => {
    let component: TimelineComponent;
    let fixture: ComponentFixture<TimelineComponent>;

    const items: TimelineItem[] = [
        {
            id: 'draft',
            title: 'Draft created',
            description: 'Initial proposal was opened.',
            status: 'complete'
        },
        {
            id: 'review',
            title: 'Review started',
            description: 'Approvers are checking the request.'
        },
        {
            id: 'release',
            title: 'Release window',
            description: 'Production launch is waiting for approval.',
            status: 'warning'
        }
    ];

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TimelineComponent, TimelineMarkerTemplateHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(TimelineComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('items', items);
        fixture.componentRef.setInput('activeIndex', 1);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should mark the active item and completed connector', () => {
        const entries = fixture.nativeElement.querySelectorAll('.timeline__entry') as NodeListOf<HTMLElement>;

        expect(entries[0].classList).toContain('timeline__entry--status-complete');
        expect(entries[0].classList).toContain('timeline__entry--connector-complete');
        expect(entries[1].classList).toContain('timeline__entry--active');
    });

    it('should render saturated dots as the default markers', () => {
        const markers = fixture.nativeElement.querySelectorAll('.timeline__marker') as NodeListOf<HTMLElement>;

        expect(markers.length).toBe(3);
        expect(markers[0].querySelector('.timeline__dot')).toBeTruthy();
        expect(markers[0].textContent?.trim()).toBe('');
    });

    it('should render a custom marker template when provided', () => {
        const hostFixture = TestBed.createComponent(TimelineMarkerTemplateHostComponent);
        hostFixture.detectChanges();

        const marker = hostFixture.nativeElement.querySelector('.custom-marker') as HTMLElement;

        expect(marker.textContent?.trim()).toBe('local_shipping');
        expect(hostFixture.nativeElement.querySelector('.timeline__dot')).toBeNull();
    });

    it('should emit itemSelect when a selectable marker is clicked', () => {
        fixture.componentRef.setInput('selectable', true);
        fixture.detectChanges();

        const emitSpy = spyOn(component.itemSelect, 'emit');
        const buttons = fixture.nativeElement.querySelectorAll('button.timeline__marker') as NodeListOf<HTMLButtonElement>;

        buttons[2].click();
        fixture.detectChanges();

        expect(emitSpy).toHaveBeenCalledWith(jasmine.objectContaining({
            index: 2,
            id: 'release',
            item: items[2],
            previousActiveIndex: 1
        }));
    });

    it('should apply layout and marker animation classes', () => {
        fixture.componentRef.setInput('layout', 'alternate');
        fixture.componentRef.setInput('markerAnimation', 'beam');
        fixture.detectChanges();

        const timeline = fixture.nativeElement.querySelector('.timeline') as HTMLElement;

        expect(timeline.classList).toContain('timeline--layout-alternate');
        expect(timeline.classList).toContain('timeline--animation-beam');
    });
});
