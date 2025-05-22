import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  standalone: true
})
export class DashboardComponent implements OnInit {
  taskForm: FormGroup;
  tasks: any[] = [];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    this.taskForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', Validators.required]
    });
  }

  ngOnInit() {
    // Load tasks from local storage or API
    const storedTasks = localStorage.getItem('tasks');
    this.tasks = storedTasks ? JSON.parse(storedTasks) : [];
  }

  addTask(): void {
    if (this.taskForm.invalid) {
      return;
    }

    const newTask = {
      id: Date.now(),
      title: this.taskForm.value.title,
      description: this.taskForm.value.description
    };

    this.tasks.push(newTask);
    this.saveTasks();
    this.taskForm.reset();
  }

  editTask(task: any): void {
    // Implement task editing logic
  }

  deleteTask(task: any): void {
    this.tasks = this.tasks.filter(t => t.id !== task.id);
    this.saveTasks();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private saveTasks(): void {
    localStorage.setItem('tasks', JSON.stringify(this.tasks));
  }
}
