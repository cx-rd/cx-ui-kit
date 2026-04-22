import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { DialogComponent } from './dialog.component';

describe('DialogComponent', () => {
    let component: DialogComponent;
    let fixture: ComponentFixture<DialogComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [DialogComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(DialogComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('open', false);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('shows the default title and close button', fakeAsync(() => {
        fixture.componentRef.setInput('open', true);
        fixture.detectChanges();
        tick(10);
        fixture.detectChanges();

        const title = fixture.nativeElement.querySelector('.dialog__title') as HTMLElement | null;
        const closeButton = fixture.nativeElement.querySelector('.dialog__close') as HTMLButtonElement | null;

        expect(title?.textContent?.trim()).toBe('Dialog');
        expect(closeButton).not.toBeNull();
    }));

    it('allows the title and close button to be hidden independently', fakeAsync(() => {
        fixture.componentRef.setInput('open', true);
        fixture.componentRef.setInput('showTitle', false);
        fixture.detectChanges();
        tick(10);
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.dialog__title')).toBeNull();
        expect(fixture.nativeElement.querySelector('.dialog__close')).not.toBeNull();

        fixture.componentRef.setInput('showTitle', true);
        fixture.componentRef.setInput('showClose', false);
        fixture.detectChanges();
        tick(10);
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.dialog__title')).not.toBeNull();
        expect(fixture.nativeElement.querySelector('.dialog__close')).toBeNull();
    }));

    it('keeps the dialog rendered until the close transition finishes', fakeAsync(() => {
        fixture.componentRef.setInput('open', true);
        fixture.detectChanges();
        tick(10);
        fixture.detectChanges();

        const emitClose = spyOn(component.close, 'emit');
        const emitOpenChange = spyOn(component.openChange, 'emit');
        const closeButton = fixture.nativeElement.querySelector('.dialog__close') as HTMLButtonElement;

        closeButton.click();
        fixture.detectChanges();

        expect(emitClose).toHaveBeenCalled();
        expect(emitOpenChange).toHaveBeenCalledWith(false);
        expect(fixture.nativeElement.querySelector('.dialog__surface'))
            .withContext('expected the dialog to stay rendered while the close transition runs')
            .not.toBeNull();

        tick(199);
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.dialog__surface')).not.toBeNull();

        tick(1);
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.dialog__surface')).toBeNull();
    }));
});
