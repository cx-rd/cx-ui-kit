import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ButtonSize, ButtonVariant } from '../../core/models';
import { ButtonComponent } from './button.component';

@Component({
    standalone: true,
    imports: [ButtonComponent],
    template: `
        <lib-button
            [variant]="variant"
            [size]="size"
            [disabled]="disabled"
            (hoverChange)="hoverEvents.push($event.hovering)"
            (activeChange)="activeEvents.push($event.active)">
            Save changes
        </lib-button>
    `
})
class ButtonHostComponent {
    variant: ButtonVariant = 'outline';
    size: ButtonSize = 'lg';
    disabled = false;
    hoverEvents: boolean[] = [];
    activeEvents: boolean[] = [];
}

describe('ButtonComponent', () => {
    let fixture: ComponentFixture<ButtonHostComponent>;
    let host: ButtonHostComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ButtonHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(ButtonHostComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create and render projected content', () => {
        const button = getButton();

        expect(button).toBeTruthy();
        expect(button.textContent?.trim()).toBe('Save changes');
    });

    it('should apply variant and size classes', () => {
        const button = getButton();

        expect(button.classList).toContain('button--outline');
        expect(button.classList).toContain('button--lg');
    });

    it('should emit hoverChange when hover state changes', () => {
        const button = getButton();

        button.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
        fixture.detectChanges();
        button.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
        fixture.detectChanges();

        expect(host.hoverEvents).toEqual([true, false]);
    });

    it('should emit activeChange when pointer active state changes', () => {
        const button = getButton();

        button.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
        fixture.detectChanges();
        button.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
        fixture.detectChanges();

        expect(host.activeEvents).toEqual([true, false]);
    });

    it('should emit activeChange for keyboard activation keys', () => {
        const button = getButton();

        button.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
        fixture.detectChanges();
        button.dispatchEvent(new KeyboardEvent('keyup', { key: ' ', bubbles: true }));
        fixture.detectChanges();

        expect(host.activeEvents).toEqual([true, false]);
    });

    it('should suppress interaction outputs when disabled', () => {
        host.disabled = true;
        fixture.detectChanges();

        const button = getButton();

        button.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
        button.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
        fixture.detectChanges();

        expect(button.disabled).toBeTrue();
        expect(host.hoverEvents).toEqual([]);
        expect(host.activeEvents).toEqual([]);
    });

    function getButton(): HTMLButtonElement {
        return fixture.nativeElement.querySelector('button.button') as HTMLButtonElement;
    }
});
