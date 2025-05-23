import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  template: `
    <div class="spinner-container" *ngIf="isLoading">
      <mat-spinner [diameter]="diameter" [color]="color"></mat-spinner>
      <p class="loading-text" *ngIf="message">{{ message }}</p>
    </div>
  `,
  styles: [`
    .spinner-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      text-align: center;
    }
    
    .loading-text {
      margin-top: 1rem;
      color: rgba(0, 0, 0, 0.6);
    }
  `]
})
export class LoadingSpinnerComponent {
  @Input() isLoading: boolean = true;
  @Input() message: string = 'Loading...';
  @Input() diameter: number = 50;
  @Input() color: 'primary' | 'accent' | 'warn' = 'primary';
}
