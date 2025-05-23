import { Pipe, PipeTransform } from '@angular/core';

type SortOrder = 'asc' | 'desc';

@Pipe({
  name: 'sortBy',
  standalone: true
})
export class SortByPipe implements PipeTransform {
  transform<T>(items: T[], field: keyof T, order: SortOrder = 'asc'): T[] {
    if (!items || !field) {
      return items;
    }

    return [...items].sort((a, b) => {
      const aValue = a[field];
      const bValue = b[field];

      if (aValue === null || aValue === undefined) return order === 'asc' ? -1 : 1;
      if (bValue === null || bValue === undefined) return order === 'asc' ? 1 : -1;
      
      if (aValue < bValue) {
        return order === 'asc' ? -1 : 1;
      } else if (aValue > bValue) {
        return order === 'asc' ? 1 : -1;
      } else {
        return 0;
      }
    });
  }
}
