import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';
import { TaskService, Task } from '../../../core/services/task.service';
import { LoadingSpinnerComponent } from '../../../shared/loading-spinner.component';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../../../shared/confirmation-dialog.component';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    LoadingSpinnerComponent
  ],
  template: `
    <div class="task-list-container">
      <div class="header">
        <h2>My Tasks</h2>
        <button mat-raised-button color="primary" [routerLink]="['/tasks/new']">
          <mat-icon>add</mat-icon> New Task
        </button>
      </div>

      <app-loading-spinner *ngIf="isLoading"></app-loading-spinner>

      <div *ngIf="!isLoading">
        <div class="table-container" *ngIf="tasks.length > 0; else noTasks">
          <table mat-table [dataSource]="tasks" class="mat-elevation-z1">
            <!-- Title Column -->
            <ng-container matColumnDef="title">
              <th mat-header-cell *matHeaderCellDef>Title</th>
              <td mat-cell *matCellDef="let task">
                <a [routerLink]="['/tasks', task.id]">{{ task.title }}</a>
              </td>
            </ng-container>

            <!-- Status Column -->
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let task">
                <span class="status-badge" [class]="task.status">
                  {{ task.status | titlecase }}
                </span>
              </td>
            </ng-container>

            <!-- Priority Column -->
            <ng-container matColumnDef="priority">
              <th mat-header-cell *matHeaderCellDef>Priority</th>
              <td mat-cell *matCellDef="let task">
                <span class="priority-badge" [class]="task.priority">
                  {{ task.priority | titlecase }}
                </span>
              </td>
            </ng-container>

            <!-- Due Date Column -->
            <ng-container matColumnDef="dueDate">
              <th mat-header-cell *matHeaderCellDef>Due Date</th>
              <td mat-cell *matCellDef="let task">
                {{ task.dueDate | date: 'mediumDate' }}
              </td>
            </ng-container>

            <!-- Actions Column -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let task">
                <div class="actions">
                  <button mat-icon-button color="primary" [routerLink]="['/tasks', task.id, 'edit']">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="confirmDelete(task)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
        </div>

        <ng-template #noTasks>
          <div class="no-tasks">
            <p>No tasks found. Create your first task to get started!</p>
            <button mat-raised-button color="primary" [routerLink]="['/tasks/new']">
              Create Task
            </button>
          </div>
        </ng-template>
      </div>
    </div>
  `,
  styles: [`
    .task-list-container {
      padding: 20px;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    
    .table-container {
      overflow-x: auto;
    }
    
    .status-badge, .priority-badge {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 500;
      text-transform: capitalize;
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
    
    .no-tasks {
      text-align: center;
      padding: 40px 20px;
      background-color: #fafafa;
      border-radius: 4px;
      margin-top: 20px;
      
      p {
        margin-bottom: 20px;
        color: #616161;
      }
    }
    
    .actions {
      display: flex;
      gap: 8px;
    }
  `]
})
export class TaskListComponent implements OnInit {
  tasks: Task[] = [];
  isLoading = true;
  displayedColumns: string[] = ['title', 'status', 'priority', 'dueDate', 'actions'];

  constructor(
    private taskService: TaskService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadTasks();
  }

  loadTasks(): void {
    this.isLoading = true;
    this.taskService.getTasks(1, 10).subscribe({
      next: (response) => {
        this.tasks = response.data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading tasks:', error);
        this.snackBar.open('Failed to load tasks. Please try again.', 'Dismiss', {
          duration: 5000,
        });
        this.isLoading = false;
      }
    });
  }

  confirmDelete(task: Task): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Task',
        message: `Are you sure you want to delete "${task.title}"?`,
        confirmText: 'Delete',
        cancelText: 'Cancel'
      } as ConfirmationDialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.deleteTask(task.id!);
      }
    });
  }

  deleteTask(taskId: string): void {
    this.taskService.deleteTask(taskId).subscribe({
      next: () => {
        this.snackBar.open('Task deleted successfully', 'Dismiss', {
          duration: 3000,
        });
        this.loadTasks();
      },
      error: (error) => {
        console.error('Error deleting task:', error);
        this.snackBar.open('Failed to delete task. Please try again.', 'Dismiss', {
          duration: 5000,
        });
      }
    });
  }
}
