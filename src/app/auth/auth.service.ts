import { Injectable, PLATFORM_ID, Inject, Optional } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  roles?: string[];
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
  expiresIn: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_KEY = 'user_data';
  private tokenExpirationTimer: any = null;
  
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser$: Observable<User | null>;
  
  private storage: Storage | null = null;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: any
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.storage = localStorage;
      const userJson = this.storage?.getItem(this.USER_KEY);
      this.currentUserSubject = new BehaviorSubject<User | null>(
        userJson ? JSON.parse(userJson) : null
      );
    } else {
      this.currentUserSubject = new BehaviorSubject<User | null>(null);
    }
    this.currentUser$ = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${environment.apiUrl}${environment.auth.login}`, 
      credentials
    ).pipe(
      tap(response => this.setSession(response)),
      catchError(this.handleError)
    );
  }

  private setSession(authResult: AuthResponse): void {
    if (!this.storage) return;
    
    // Clear any existing timer
    if (this.tokenExpirationTimer) {
      clearTimeout(this.tokenExpirationTimer);
    }
    
    // Set the token expiration timer (subtract 60 seconds as a buffer)
    const expiresIn = (authResult.expiresIn - 60) * 1000; // Convert to milliseconds
    this.tokenExpirationTimer = setTimeout(() => {
      this.refreshToken().subscribe({
        error: () => this.logout()
      });
    }, expiresIn);
    
    this.storage.setItem(this.TOKEN_KEY, authResult.token);
    this.storage.setItem(this.REFRESH_TOKEN_KEY, authResult.refreshToken);
    this.storage.setItem(this.USER_KEY, JSON.stringify(authResult.user));
    this.currentUserSubject.next(authResult.user);
  }

  logout(notifyUser: boolean = true): void {
    if (!this.storage) return;
    
    // Clear the token expiration timer
    if (this.tokenExpirationTimer) {
      clearTimeout(this.tokenExpirationTimer);
      this.tokenExpirationTimer = null;
    }
    
    // Get the token before clearing it
    const token = this.getToken();
    
    // Clear local storage
    this.storage.removeItem(this.TOKEN_KEY);
    this.storage.removeItem(this.REFRESH_TOKEN_KEY);
    this.storage.removeItem(this.USER_KEY);
    
    // Notify subscribers
    this.currentUserSubject.next(null);
    
    // Call logout API if we have a token
    if (token) {
      try {
        this.http.post(
          `${environment.apiUrl}${environment.auth.logout || '/auth/logout'}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        ).subscribe({
          error: (error) => {
            console.error('Logout API error:', error);
            if (notifyUser) {
              // You might want to show a notification here
            }
          }
        });
      } catch (error) {
        console.error('Error during logout:', error);
      }
    }
  }

  getToken(): string | null {
    return this.storage?.getItem(this.TOKEN_KEY) || null;
  }

  getRefreshToken(): string | null {
    return this.storage?.getItem(this.REFRESH_TOKEN_KEY) || null;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated();
  }

  register(userData: { name: string; email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${environment.apiUrl}${environment.auth.register}`, 
      userData
    ).pipe(
      tap(response => this.setSession(response)),
      catchError(this.handleError)
    );
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.logout(false);
      return throwError(() => new Error('No refresh token available'));
    }
    
    // Get the current token for the request
    const currentToken = this.getToken();
    
    return this.http.post<AuthResponse>(
      `${environment.apiUrl}${environment.auth.refresh}`,
      { refreshToken },
      {
        headers: {
          'Content-Type': 'application/json',
          ...(currentToken && { Authorization: `Bearer ${currentToken}` })
        }
      }
    ).pipe(
      tap({
        next: (response) => this.setSession(response),
        error: (error) => {
          console.error('Token refresh failed:', error);
          this.logout(false);
        }
      }),
      catchError(error => {
        this.logout(false);
        return throwError(() => ({
          message: 'Your session has expired. Please log in again.',
          originalError: error
        }));
      })
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unexpected error occurred';
    let errorDetails: any = {};
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `A client-side error occurred: ${error.error.message}`;
      errorDetails = { type: 'client', error: error.error };
    } else {
      // Server-side error
      switch (error.status) {
        case 0:
          errorMessage = 'Unable to connect to the server. Please check your internet connection.';
          break;
        case 400:
          errorMessage = 'Invalid request. Please check your input.';
          errorDetails = error.error?.errors || error.error;
          break;
        case 401:
          errorMessage = 'Your session has expired. Please log in again.';
          this.logout(false);
          break;
        case 403:
          errorMessage = 'You do not have permission to perform this action.';
          break;
        case 404:
          errorMessage = 'The requested resource was not found.';
          break;
        case 500:
          errorMessage = 'A server error occurred. Please try again later.';
          break;
        default:
          errorMessage = `Server returned error: ${error.status} - ${error.statusText}`;
      }
    }
    
    console.error('AuthService error:', {
      message: errorMessage,
      status: error.status,
      details: errorDetails,
      url: error.url
    });
    
    return throwError(() => ({
      message: errorMessage,
      details: errorDetails,
      status: error.status,
      originalError: error
    }));
  }
}
