import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

// Default API URL - replace with your actual API endpoint
const API_URL = 'https://api.example.com';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = API_URL;
  private storage: Storage | null = null;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: any
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.storage = localStorage;
    }
  }

  login(credentials: LoginCredentials): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, credentials);
  }

  private getStorage(): Storage | null {
    if (!this.storage) {
      console.error('Storage is not available');
      return null;
    }
    return this.storage;
  }

  logout(): void {
    const storage = this.getStorage();
    if (storage) {
      storage.removeItem('token');
    }
  }

  isLoggedIn(): boolean {
    const storage = this.getStorage();
    if (!storage) {
      return false;
    }
    return !!storage.getItem('token');
  }

  getToken(): string | null {
    const storage = this.getStorage();
    if (!storage) {
      return null;
    }
    return storage.getItem('token');
  }
}
