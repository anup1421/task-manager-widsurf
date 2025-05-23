import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private router: Router) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // Auto logout if 401 response returned from API
          // The JWT interceptor will handle token refresh if possible
          // If we get here, it means the refresh token is also invalid
          this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
        } else if (error.status === 403) {
          // Forbidden - redirect to unauthorized page or show message
          this.router.navigate(['/unauthorized']);
        } else if (error.status === 404) {
          // Not found - redirect to not-found page
          this.router.navigate(['/not-found']);
        }
        
        // Handle other errors
        let errorMessage = 'An error occurred';
        if (error.error instanceof ErrorEvent) {
          // Client-side error
          errorMessage = `Error: ${error.error.message}`;
        } else {
          // Server-side error
          errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
          if (error.error?.message) {
            errorMessage = error.error.message;
          }
        }
        
        console.error(errorMessage);
        return throwError(() => new Error(errorMessage));
      })
    );
  }
}
