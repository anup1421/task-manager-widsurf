import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService, AuthResponse, User } from './auth.service';
import { environment } from '../../environments/environment';
import { HttpErrorResponse } from '@angular/common/http';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiUrl;

  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    roles: ['user']
  };

  const mockAuthResponse: AuthResponse = {
    token: 'mock-jwt-token',
    refreshToken: 'mock-refresh-token',
    user: mockUser,
    expiresIn: 3600
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    
    // Clear any previous state
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    const credentials = { email: 'test@example.com', password: 'password' };

    it('should return user data on successful login', (done) => {
      service.login(credentials).subscribe({
        next: (response) => {
          expect(response).toEqual(mockAuthResponse);
          expect(service.currentUserValue).toEqual(mockUser);
          expect(localStorage.getItem('auth_token')).toBe('mock-jwt-token');
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/auth/login`);
      expect(req.request.method).toBe('POST');
      req.flush(mockAuthResponse);
    });

    it('should handle login error', (done) => {
      const errorResponse = new HttpErrorResponse({
        error: { message: 'Invalid credentials' },
        status: 401,
        statusText: 'Unauthorized'
      });

      service.login(credentials).subscribe({
        error: (error) => {
          expect(error.status).toBe(401);
          expect(service.currentUserValue).toBeNull();
          expect(localStorage.getItem('auth_token')).toBeNull();
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/auth/login`);
      req.flush('Invalid credentials', { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('register', () => {
    const registerData = { 
      name: 'Test User',
      email: 'test@example.com', 
      password: 'password' 
    };

    it('should register a new user', (done) => {
      service.register(registerData).subscribe({
        next: (response: AuthResponse) => {
          expect(response).toEqual(mockAuthResponse);
          expect(service.currentUserValue).toEqual(mockUser);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${apiUrl}/auth/register`);
      expect(req.request.method).toBe('POST');
      req.flush(mockAuthResponse);
    });
  });

  describe('logout', () => {
    beforeEach(() => {
      // Set up a logged in state
      localStorage.setItem('auth_token', 'mock-jwt-token');
      localStorage.setItem('refresh_token', 'mock-refresh-token');
      localStorage.setItem('user_data', JSON.stringify(mockUser));
    });

    it('should clear user data and tokens', () => {
      service.logout();
      
      expect(service.currentUserValue).toBeNull();
      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
      expect(localStorage.getItem('user_data')).toBeNull();
    });
  });

  describe('token refresh', () => {
    it('should refresh token successfully', (done) => {
      service.refreshToken().subscribe({
        next: (response) => {
          expect(response).toEqual(mockAuthResponse);
          expect(service.currentUserValue).toEqual(mockUser);
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/auth/refresh-token`);
      expect(req.request.method).toBe('POST');
      req.flush(mockAuthResponse);
    });

    it('should handle refresh token failure', (done) => {
      // First set a refresh token
      localStorage.setItem('refresh_token', 'expired-refresh-token');
      
      service.refreshToken().subscribe({
        error: (error) => {
          expect(error.message).toContain('session has expired');
          expect(service.currentUserValue).toBeNull();
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/auth/refresh-token`);
      req.flush({ error: 'Invalid refresh token' }, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('isAuthenticated', () => {
    it('should return false when no token exists', () => {
      expect(service.isAuthenticated()).toBeFalse();
    });

    it('should return true when token exists', () => {
      localStorage.setItem('auth_token', 'mock-jwt-token');
      expect(service.isAuthenticated()).toBeTrue();
    });
  });
});
