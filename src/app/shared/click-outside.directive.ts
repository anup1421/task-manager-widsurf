import { Directive, ElementRef, Output, EventEmitter, HostListener } from '@angular/core';

@Directive({
  selector: '[appClickOutside]',
  standalone: true
})
export class ClickOutsideDirective {
  @Output() appClickOutside = new EventEmitter<MouseEvent>();

  constructor(private elementRef: ElementRef) {}

  @HostListener('document:click', ['$event'])
  public onClick(event: MouseEvent): void {
    const targetElement = event.target as HTMLElement;
    const clickedInside = this.elementRef.nativeElement.contains(targetElement);
    
    if (!clickedInside) {
      this.appClickOutside.emit(event);
    }
  }
}
