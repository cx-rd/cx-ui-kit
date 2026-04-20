import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PaginatorComponent } from './paginator.component';

describe('PaginatorComponent', () => {
    let component: PaginatorComponent;
    let fixture: ComponentFixture<PaginatorComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [PaginatorComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(PaginatorComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('pageIndex', 1);
        fixture.componentRef.setInput('pageSize', 10);
        fixture.componentRef.setInput('totalItems', 95);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should emit the next page when the next button is clicked', () => {
        const emitSpy = spyOn(component.pageChange, 'emit');
        const buttons = fixture.nativeElement.querySelectorAll('button');

        buttons[buttons.length - 2].click();
        fixture.detectChanges();

        expect(emitSpy).toHaveBeenCalledWith({
            pageIndex: 2,
            pageSize: 10,
            totalItems: 95,
            pageCount: 10,
            startIndex: 21,
            endIndex: 30
        });
    });
});
