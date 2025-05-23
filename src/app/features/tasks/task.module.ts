import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

// Components
import { TaskListComponent } from './task-list/task-list.component.js';
import { TaskFormComponent } from './task-form/task-form.component.js';
import { TaskDetailsComponent } from './task-details/task-details.component.js';

// Services
import { TaskService } from '../../core/services/task.service';

const routes: Routes = [
  { path: '', component: TaskListComponent },
  { path: 'new', component: TaskFormComponent },
  { path: ':id', component: TaskDetailsComponent },
  { path: ':id/edit', component: TaskFormComponent },
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    
    // Import standalone components
    TaskListComponent,
    TaskFormComponent,
    TaskDetailsComponent
  ],
  providers: [
    TaskService
  ]
})
export class TaskModule { }
