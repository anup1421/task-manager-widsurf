import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-error-message',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  template: `
    <mat-card class="error-card" *ngIf="message">
      <mat-card-header>
        <mat-icon mat-card-avatar color="warn">error</mat-icon>
        <mat-card-title>Error</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <p>{{ message }}</p>
        <p *ngIf="details" class="error-details">{{ details }}</p>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .error-card {
      margin: 16px 0;
      background-color: #ffebee;
    }
    
    .error-details {
      font-family: monospace;
      font-size: 0.9em;
      white-space: pre-wrap;
      margin-top: 8px;
      color: #b71c1c;
    }
  `]
})
export class ErrorMessageComponent {
  @Input() message: string = '';
  @Input() details?: string;
}
