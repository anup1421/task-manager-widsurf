import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { TaskService, Task, TaskStatus, TaskPriority } from '../../../core/services/task.service';
import { LoadingSpinnerComponent } from '../../../shared/loading-spinner.component';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../../../shared/confirmation-dialog.component';

@Component({
  selector: 'app-task-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatDividerModule,
    MatChipsModule,
    LoadingSpinnerComponent
  ],
  template: `
    <div class="task-details-container">
      <mat-card *ngIf="!isLoading; else loading">
        <mat-card-header>
          <mat-card-title>{{ task?.title }}</mat-card-title>
          <mat-card-subtitle>
            <span class="status-badge" [class]="task?.status">
              {{ task?.status | titlecase }}
            </span>
            <span class="priority-badge" [class]="task?.priority">
              {{ task?.priority | titlecase }} Priority
            </span>
          </mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <div class="task-meta">
            <div class="meta-item">
              <mat-icon>event</mat-icon>
              <span>Due: {{ task?.dueDate | date:'mediumDate' }}</span>
            </div>
            
            <div class="meta-item" *ngIf="task?.estimatedHours !== undefined">
              <mat-icon>schedule</mat-icon>
              <span>Estimated: {{ task?.estimatedHours }} hours</span>
            </div>
            
            <div class="meta-item">
              <mat-icon>calendar_today</mat-icon>
              <span>Created: {{ task?.createdAt | date:'mediumDate' }}</span>
            </div>
            
            <div class="meta-item" *ngIf="task?.updatedAt">
              <mat-icon>update</mat-icon>
              <span>Last updated: {{ task?.updatedAt | date:'medium' }}</span>
            </div>
          </div>

          <mat-divider class="divider"></mat-divider>

          <div class="task-description">
            <h3>Description</h3>
            <p>{{ task?.description || 'No description provided.' }}</p>
          </div>
        </mat-card-content>

        <mat-card-actions align="end">
          <button 
            mat-stroked-button 
            color="primary" 
            [routerLink]="['/tasks']"
            [disabled]="isDeleting">
            Back to List
          </button>
          
          <button 
            mat-stroked-button 
            color="primary" 
            [routerLink]="['/tasks', task?.id, 'edit']"
            [disabled]="isDeleting">
            <mat-icon>edit</mat-icon>
            Edit
          </button>
          
          <button 
            mat-flat-button 
            color="warn" 
            (click)="confirmDelete()"
            [disabled]="isDeleting">
            <mat-icon>delete</mat-icon>
            <span *ngIf="!isDeleting">Delete</span>
            <span *ngIf="isDeleting">Deleting...</span>
          </button>
        </mat-card-actions>
      </mat-card>
    </div>

    <ng-template #loading>
      <div class="loading-container">
        <app-loading-spinner></app-loading-spinner>
      </div>
    </ng-template>
  `,
  styles: [`
    .task-details-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    
    .status-badge, .priority-badge {
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 0.875rem;
      font-weight: 500;
      margin-right: 8px;
    }
    
    .status-badge {
      &.pending {
        background-color: #fff3e0;
        color: #e65100;
      }
      
      &.in-progress {
        background-color: #e3f2fd;
        color: #1565c0;
      }
      
      &.completed {
        background-color: #e8f5e9;
        color: #2e7d32;
      }
      
      &.archived {
        background-color: #f5f5f5;
        color: #424242;
      }
    }
    
    .priority-badge {
      &.high {
        background-color: #ffebee;
        color: #c62828;
      }
      
      &.medium {
        background-color: #fff8e1;
        color: #ff8f00;
      }
      
      &.low {
        background-color: #f1f8e9;
        color: #33691e;
      }
    }
    
    .task-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
      margin-bottom: 20px;
    }
    
    .meta-item {
      display: flex;
      align-items: center;
      color: #616161;
      
      mat-icon {
        margin-right: 8px;
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }
    
    .divider {
      margin: 20px 0;
    }
    
    .task-description {
      h3 {
        margin-top: 0;
        color: #212121;
      }
      
      p {
        white-space: pre-line;
        line-height: 1.6;
        color: #424242;
      }
    }
    
    .loading-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 300px;
    }
    
    mat-card-actions {
      padding: 16px;
      margin: 0;
    }
  `]
})
export class TaskDetailsComponent implements OnInit, OnDestroy {
  task: Task | null = null;
  isLoading = true;
  isDeleting = false;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private taskService: TaskService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadTask();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadTask(): void {
    const taskId = this.route.snapshot.paramMap.get('id');
    
    if (!taskId) {
      this.router.navigate(['/tasks']);
      return;
    }

    this.taskService.getTaskById(taskId).subscribe({
      next: (task) => {
        this.task = task;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading task:', error);
        this.snackBar.open('Failed to load task. It may have been deleted or you may not have permission to view it.', 'Dismiss', {
          duration: 5000,
        });
        this.router.navigate(['/tasks']);
      }
    });
  }

  confirmDelete(): void {
    if (!this.task) return;

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Task',
        message: `Are you sure you want to delete "${this.task.title}"? This action cannot be undone.`,
        confirmText: 'Delete',
        confirmColor: 'warn',
        cancelText: 'Cancel'
      } as ConfirmationDialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.deleteTask();
      }
    });
  }

  private deleteTask(): void {
    if (!this.task?.id) return;

    this.isDeleting = true;
    this.taskService.deleteTask(this.task.id).subscribe({
      next: () => {
        this.snackBar.open('Task deleted successfully', 'Dismiss', {
          duration: 3000,
        });
        this.router.navigate(['/tasks']);
      },
      error: (error) => {
        console.error('Error deleting task:', error);
        this.snackBar.open('Failed to delete task. Please try again.', 'Dismiss', {
          duration: 5000,
        });
        this.isDeleting = false;
      }
    });
  }
}
