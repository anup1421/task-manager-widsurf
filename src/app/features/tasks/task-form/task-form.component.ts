import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { TaskService, Task, TaskStatus, TaskPriority } from '../../../core/services/task.service';
import { LoadingSpinnerComponent } from '../../../shared/loading-spinner.component';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    LoadingSpinnerComponent
  ],
  template: `
    <div class="task-form-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>{{ isEditMode ? 'Edit Task' : 'Create New Task' }}</mat-card-title>
        </mat-card-header>
        
        <mat-card-content>
          <form [formGroup]="taskForm" (ngSubmit)="onSubmit()">
            <div class="form-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Title</mat-label>
                <input matInput formControlName="title" placeholder="Enter task title" required>
                <mat-error *ngIf="taskForm.get('title')?.hasError('required')">
                  Title is required
                </mat-error>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Description</mat-label>
                <textarea 
                  matInput 
                  formControlName="description" 
                  placeholder="Enter task description"
                  rows="4">
                </textarea>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Status</mat-label>
                <mat-select formControlName="status" required>
                  <mat-option *ngFor="let status of statusOptions" [value]="status">
                    {{ status | titlecase }}
                  </mat-option>
                </mat-select>
                <mat-error *ngIf="taskForm.get('status')?.hasError('required')">
                  Status is required
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Priority</mat-label>
                <mat-select formControlName="priority" required>
                  <mat-option *ngFor="let priority of priorityOptions" [value]="priority">
                    {{ priority | titlecase }}
                  </mat-option>
                </mat-select>
                <mat-error *ngIf="taskForm.get('priority')?.hasError('required')">
                  Priority is required
                </mat-error>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Due Date</mat-label>
                <input 
                  matInput 
                  [matDatepicker]="picker" 
                  formControlName="dueDate"
                  [min]="minDate"
                  required>
                <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
                <mat-datepicker #picker></mat-datepicker>
                <mat-error *ngIf="taskForm.get('dueDate')?.hasError('required')">
                  Due date is required
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Estimated Hours</mat-label>
                <input 
                  matInput 
                  type="number" 
                  min="0" 
                  step="0.5"
                  formControlName="estimatedHours"
                  placeholder="Estimated time to complete">
              </mat-form-field>
            </div>

            <div class="form-actions">
              <button 
                type="button" 
                mat-stroked-button 
                color="primary" 
                [routerLink]="['/tasks']"
                [disabled]="isSubmitting">
                Cancel
              </button>
              <button 
                type="submit" 
                mat-flat-button 
                color="primary"
                [disabled]="taskForm.invalid || isSubmitting">
                <app-loading-spinner *ngIf="isSubmitting" [diameter]="20"></app-loading-spinner>
                <span *ngIf="!isSubmitting">{{ isEditMode ? 'Update' : 'Create' }} Task</span>
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .task-form-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    
    .form-row {
      display: flex;
      gap: 20px;
      margin-bottom: 20px;
    }
    
    .full-width {
      width: 100%;
    }
    
    .half-width {
      flex: 1;
    }
    
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 20px;
    }
    
    mat-card {
      padding: 20px;
    }
    
    mat-card-header {
      margin-bottom: 20px;
    }
    
    mat-card-title {
      font-size: 24px;
      font-weight: 500;
    }
  `]
})
export class TaskFormComponent implements OnInit, OnDestroy {
  taskForm: FormGroup;
  isEditMode = false;
  isSubmitting = false;
  private destroy$ = new Subject<void>();
  
  // Form options
  statusOptions: TaskStatus[] = ['pending', 'in-progress', 'completed', 'archived'];
  priorityOptions: TaskPriority[] = ['low', 'medium', 'high'];
  minDate = new Date();
  
  constructor(
    private fb: FormBuilder,
    private taskService: TaskService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.taskForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      status: ['pending', Validators.required],
      priority: ['medium', Validators.required],
      dueDate: [null, Validators.required],
      estimatedHours: [null, [Validators.min(0)]]
    });
  }


  ngOnInit(): void {
    const taskId = this.route.snapshot.paramMap.get('id');
    
    if (taskId) {
      this.isEditMode = true;
      this.loadTask(taskId);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadTask(taskId: string): void {
    this.isSubmitting = true;
    this.taskService.getTaskById(taskId).subscribe({
      next: (task) => {
        this.taskForm.patchValue({
          title: task.title,
          description: task.description || '',
          status: task.status,
          priority: task.priority,
          dueDate: new Date(task.dueDate),
          estimatedHours: task.estimatedHours
        });
        this.isSubmitting = false;
      },
      error: (error) => {
        console.error('Error loading task:', error);
        this.snackBar.open('Failed to load task. Please try again.', 'Dismiss', {
          duration: 5000,
        });
        this.router.navigate(['/tasks']);
      }
    });
  }

  onSubmit(): void {
    if (this.taskForm.invalid) {
      return;
    }

    this.isSubmitting = true;
    const taskData: Partial<Task> = {
      ...this.taskForm.value,
      dueDate: this.taskForm.value.dueDate.toISOString()
    };

    const taskId = this.route.snapshot.paramMap.get('id');
    const taskObservable = this.isEditMode && taskId
      ? this.taskService.updateTask(taskId, taskData)
      : this.taskService.createTask(taskData);

    taskObservable.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        const message = this.isEditMode 
          ? 'Task updated successfully' 
          : 'Task created successfully';
        
        this.snackBar.open(message, 'Dismiss', {
          duration: 3000,
        });
        
        this.router.navigate(['/tasks']);
      },
      error: (error) => {
        console.error('Error saving task:', error);
        this.snackBar.open(
          `Failed to ${this.isEditMode ? 'update' : 'create'} task. Please try again.`,
          'Dismiss',
          { duration: 5000 }
        );
        this.isSubmitting = false;
      }
    });
  }
}
