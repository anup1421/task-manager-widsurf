import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filter',
  standalone: true
})
export class FilterPipe implements PipeTransform {
  transform(items: any[], searchText: string, field: string = 'name'): any[] {
    if (!items) return [];
    if (!searchText) return items;

    searchText = searchText.toLowerCase();

    return items.filter(item => {
      if (item && item[field]) {
        return item[field].toLowerCase().includes(searchText);
      }
      return false;
    });
  }
}
