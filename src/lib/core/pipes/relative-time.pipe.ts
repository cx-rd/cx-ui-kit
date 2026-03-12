import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'relativeTime',
    standalone: true
})
export class RelativeTimePipe implements PipeTransform {
    transform(value: string | Date | undefined): string {
        if (!value) return '';

        const date = new Date(value);
        const now = new Date();
        const diff = now.getTime() - date.getTime();

        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (seconds < 60) {
            return 'just now';
        } else if (minutes < 60) {
            return `${minutes} mins ago`;
        } else if (hours < 24) {
            return `${hours} hours ago`;
        } else if (days < 7) {
            return `${days} days ago`;
        } else {
            return date.toLocaleDateString();
        }
    }
}
