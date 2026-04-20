import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DataTableComponent } from './data-table.component';
import { DataTableColumn } from '../../core/models';

interface TestRow {
    id: number;
    name: string;
    score: number;
}

describe('DataTableComponent', () => {
    let component: DataTableComponent<TestRow>;
    let fixture: ComponentFixture<DataTableComponent<unknown>>;

    const columns: DataTableColumn<TestRow>[] = [
        {
            id: 'name',
            header: 'Name',
            sortable: true
        },
        {
            id: 'score',
            header: 'Score',
            sortable: true,
            align: 'end'
        }
    ];

    const items: TestRow[] = [
        { id: 1, name: 'Gamma', score: 78 },
        { id: 2, name: 'Alpha', score: 91 },
        { id: 3, name: 'Beta', score: 84 }
    ];

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [DataTableComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(DataTableComponent);
        component = fixture.componentInstance as DataTableComponent<TestRow>;
        fixture.componentRef.setInput('columns', columns as ReadonlyArray<DataTableColumn<unknown>>);
        fixture.componentRef.setInput('items', items as ReadonlyArray<unknown>);
        fixture.componentRef.setInput('rowId', 'id');
        fixture.componentRef.setInput('pageSize', 2);
        fixture.detectChanges();
    });

    function getRenderedRows(): HTMLTableRowElement[] {
        return Array.from(
            fixture.nativeElement.querySelectorAll('tbody tr') as NodeListOf<HTMLTableRowElement>
        );
    }

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should paginate client-side rows', () => {
        const rows = getRenderedRows();

        expect(rows.length).toBe(2);
        expect(rows[0].textContent).toContain('Gamma');
        expect(rows[1].textContent).toContain('Alpha');
    });

    it('should sort rows when a sortable column header is clicked', () => {
        fixture.componentRef.setInput('pageSize', 5);
        fixture.detectChanges();

        const firstSortButton = fixture.nativeElement.querySelector('.data-table__sort-button') as HTMLButtonElement;

        firstSortButton.click();
        fixture.detectChanges();

        let rows = getRenderedRows();
        expect(rows[0].textContent).toContain('Alpha');

        firstSortButton.click();
        fixture.detectChanges();

        rows = getRenderedRows();
        expect(rows[0].textContent).toContain('Gamma');
    });

    it('should emit selected row ids when selecting all visible rows', () => {
        fixture.componentRef.setInput('selectionMode', 'multiple');
        fixture.detectChanges();

        const emitSpy = spyOn(component.selectedRowIdsChange, 'emit');
        const headerCheckbox = fixture.nativeElement.querySelector('thead input[type="checkbox"]') as HTMLInputElement;

        headerCheckbox.click();
        fixture.detectChanges();

        expect(emitSpy).toHaveBeenCalledWith([1, 2]);
    });

    it('should emit page changes when the page size selection changes', () => {
        const emitSpy = spyOn(component.pageChange, 'emit');

        component.onPageSizeSelectionChange({
            mode: 'single',
            value: 5,
            values: [5],
            option: { value: 5, label: '5' },
            options: [{ value: 5, label: '5' }]
        });

        expect(emitSpy).toHaveBeenCalledWith({
            pageIndex: 0,
            pageSize: 5,
            totalItems: 3,
            pageCount: 1,
            startIndex: 1,
            endIndex: 3
        });
    });
});
