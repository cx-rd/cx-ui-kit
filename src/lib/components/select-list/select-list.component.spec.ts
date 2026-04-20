import { OverlayContainer } from '@angular/cdk/overlay';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { SelectListComponent } from './select-list.component';

describe('SelectListComponent', () => {
    let component: SelectListComponent<string>;
    let fixture: ComponentFixture<SelectListComponent<string>>;
    let overlayContainer: OverlayContainer;
    let overlayContainerElement: HTMLElement;
    let testStyle: HTMLStyleElement;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SelectListComponent]
        }).compileComponents();

        overlayContainer = TestBed.inject(OverlayContainer);
        overlayContainerElement = overlayContainer.getContainerElement();
        testStyle = document.createElement('style');
        testStyle.textContent = '*, *::before, *::after { transition: none !important; animation: none !important; }';
        document.head.appendChild(testStyle);

        fixture = TestBed.createComponent(SelectListComponent<string>);
        component = fixture.componentInstance;

        fixture.nativeElement.style.display = 'block';
        fixture.nativeElement.style.width = '280px';
        fixture.nativeElement.style.margin = '120px';

        fixture.componentRef.setInput('label', 'Deployment target');
        fixture.componentRef.setInput('placeholder', 'Choose a target');
        fixture.componentRef.setInput('options', [
            { label: 'Sandbox', value: 'sandbox' },
            { label: 'Staging', value: 'staging' },
            { label: 'Production', value: 'production' }
        ]);
        fixture.detectChanges();
    });

    afterEach(() => {
        overlayContainer.ngOnDestroy();
        testStyle.remove();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('positions the overlay panel relative to the trigger in overlay mode', fakeAsync(() => {
        const trigger = fixture.nativeElement.querySelector('.select-list__trigger') as HTMLButtonElement;

        trigger.click();
        fixture.detectChanges();
        tick(10);
        tick(180);
        fixture.detectChanges();

        const panel = overlayContainerElement.querySelector('.select-list__panel') as HTMLElement | null;

        expect(panel).withContext('expected the panel to render in the global overlay container').not.toBeNull();

        const triggerRect = trigger.getBoundingClientRect();
        const panelRect = panel!.getBoundingClientRect();
        const expectedTop = triggerRect.bottom + 8;

        expect(Math.abs(panelRect.left - triggerRect.left))
            .withContext(`expected panel left ${panelRect.left} to align with trigger left ${triggerRect.left}`)
            .toBeLessThan(4);
        expect(Math.abs(panelRect.top - expectedTop))
            .withContext(`expected panel top ${panelRect.top} to sit below trigger bottom ${expectedTop}`)
            .toBeLessThan(4);
    }));

    it('keeps the overlay panel rendered until the close animation finishes', fakeAsync(() => {
        const trigger = fixture.nativeElement.querySelector('.select-list__trigger') as HTMLButtonElement;

        trigger.click();
        fixture.detectChanges();
        tick(10);
        fixture.detectChanges();

        expect(overlayContainerElement.querySelector('.select-list__panel')).not.toBeNull();

        trigger.click();
        fixture.detectChanges();

        expect(overlayContainerElement.querySelector('.select-list__panel'))
            .withContext('expected overlay panel to stay attached while the close animation runs')
            .not.toBeNull();

        tick(179);
        fixture.detectChanges();

        expect(overlayContainerElement.querySelector('.select-list__panel')).not.toBeNull();

        tick(1);
        fixture.detectChanges();

        expect(overlayContainerElement.querySelector('.select-list__panel')).toBeNull();
    }));

    it('closes the panel when clicking outside the component', fakeAsync(() => {
        const trigger = fixture.nativeElement.querySelector('.select-list__trigger') as HTMLButtonElement;

        trigger.click();
        fixture.detectChanges();
        tick(10);
        tick(180);
        fixture.detectChanges();

        expect(overlayContainerElement.querySelector('.select-list__panel')).not.toBeNull();

        document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        fixture.detectChanges();
        tick(180);
        fixture.detectChanges();

        expect(overlayContainerElement.querySelector('.select-list__panel')).toBeNull();
    }));
});
