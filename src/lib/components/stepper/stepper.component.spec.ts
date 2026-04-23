import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StepperStep } from '../../core/models';
import { StepperComponent } from './stepper.component';

describe('StepperComponent', () => {
    let component: StepperComponent;
    let fixture: ComponentFixture<StepperComponent>;

    const steps: StepperStep[] = [
        { id: 'brief', label: 'Brief', description: 'Gather requirements' },
        { id: 'build', label: 'Build', description: 'Implement the flow' },
        { id: 'review', label: 'Review', description: 'Validate before release' }
    ];

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [StepperComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(StepperComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('steps', steps);
        fixture.componentRef.setInput('activeIndex', 1);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should mark the active step as current and previous steps as complete', () => {
        const items = fixture.nativeElement.querySelectorAll('.stepper__item') as NodeListOf<HTMLElement>;

        expect(items[0].classList).toContain('stepper__item--complete');
        expect(items[1].classList).toContain('stepper__item--current');
        expect(items[1].querySelector('.stepper__step')?.getAttribute('aria-current')).toBe('step');
    });

    it('should emit stepChange when a selectable step is clicked', () => {
        fixture.componentRef.setInput('selectable', true);
        fixture.detectChanges();

        const emitSpy = spyOn(component.stepChange, 'emit');
        const buttons = fixture.nativeElement.querySelectorAll('button.stepper__step') as NodeListOf<HTMLButtonElement>;

        buttons[2].click();
        fixture.detectChanges();

        expect(emitSpy).toHaveBeenCalledWith({
            previousIndex: 1,
            index: 2,
            direction: 'next',
            step: steps[2]
        });
    });

    it('should apply the selected current-step animation class', () => {
        fixture.componentRef.setInput('currentAnimation', 'orbit');
        fixture.detectChanges();

        const nav = fixture.nativeElement.querySelector('.stepper') as HTMLElement;

        expect(nav.classList).toContain('stepper--animation-orbit');
    });
});
