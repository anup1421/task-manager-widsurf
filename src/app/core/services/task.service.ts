import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'archived';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id?: string;
  title: string;
  description?: string;
  dueDate: string; // ISO date string from API
  priority: TaskPriority;
  status: TaskStatus;
  estimatedHours?: number;
  createdAt?: string;
  updatedAt?: string;
  userId?: string;
}

export interface TaskListResponse {
  data: Task[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  statusCode?: number;
}

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private apiUrl = `${environment.apiUrl}${environment.tasks.base}`;

  constructor(private http: HttpClient) {}

  /**
   * Get all tasks with pagination and optional filtering
   * @param page Page number (1-based)
   * @param limit Number of items per page
   * @param status Optional status filter
   * @param priority Optional priority filter
   * @param sort Optional sort field and direction (e.g., 'dueDate:asc')
   */
  getTasks(
    page: number = 1,
    limit: number = 10,
    status?: TaskStatus,
    priority?: TaskPriority,
    sort?: string
  ): Observable<TaskListResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (status) params = params.set('status', status);
    if (priority) params = params.set('priority', priority);
    if (sort) params = params.set('sort', sort);

    return this.http.get<ApiResponse<TaskListResponse>>(this.apiUrl, { params })
      .pipe(
        map(response => response.data || { data: [], total: 0, page, limit, totalPages: 0 }),
        catchError(this.handleError)
      );
  }

  /**
   * Get a single task by ID
   * @param id Task ID
   */
  getTaskById(id: string): Observable<Task> {
    if (!id) {
      return throwError(() => new Error('Task ID is required'));
    }
    return this.http.get<ApiResponse<Task>>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => response.data!),
        catchError(this.handleError)
      );
  }

  /**
   * Create a new task
   * @param task Task data
   */
  createTask(task: Partial<Task>): Observable<Task> {
    return this.http.post<ApiResponse<Task>>(this.apiUrl, task)
      .pipe(
        map(response => response.data!),
        catchError(this.handleError)
      );
  }

  /**
   * Update an existing task
   * @param id Task ID
   * @param task Updated task data
   */
  updateTask(id: string, task: Partial<Task>): Observable<Task> {
    if (!id) {
      return throwError(() => new Error('Task ID is required'));
    }
    return this.http.put<ApiResponse<Task>>(`${this.apiUrl}/${id}`, task)
      .pipe(
        map(response => response.data!),
        catchError(this.handleError)
      );
  }

  /**
   * Delete a task
   * @param id Task ID
   */
  deleteTask(id: string): Observable<{ success: boolean }> {
    if (!id) {
      return throwError(() => new Error('Task ID is required'));
    }
    return this.http.delete<ApiResponse<{ success: boolean }>>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => ({
          success: response.success || false,
          message: response.message
        })),
        catchError(this.handleError)
      );
  }

  /**
   * Mark task as completed
   * @param id Task ID
   */
  completeTask(id: string): Observable<Task> {
    if (!id) {
      return throwError(() => new Error('Task ID is required'));
    }
    return this.http.patch<ApiResponse<Task>>(
      `${this.apiUrl}/${id}/complete`,
      { status: 'completed' as TaskStatus }
    ).pipe(
      map(response => response.data!),
      catchError(this.handleError)
    );
  }

  /**
   * Search tasks by query string
   * @param query Search query
   * @param status Optional status filter
   */
  searchTasks(
    query: string,
    status?: TaskStatus
  ): Observable<Task[]> {
    let params = new HttpParams().set('q', query);
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<ApiResponse<Task[]>>(`${this.apiUrl}/search`, { params })
      .pipe(
        map(response => response.data || []),
        catchError(this.handleError)
      );
  }

  /**
   * Handle HTTP errors
   * @private
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      const apiError = error.error as ApiResponse<any>;
      errorMessage = apiError?.message || error.message || 'Unknown error occurred';
    }
    
    console.error('API Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}
