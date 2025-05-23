import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CommonModule } from '@angular/common';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { LoginComponent } from './login.component';
import { AuthService } from '../auth.service';

// Mock AuthService
class MockAuthService {
  isLoggedIn = jasmine.createSpy('isLoggedIn').and.returnValue(false);
  login = jasmine.createSpy('login').and.returnValue(of({
    token: 'mock-jwt-token',
    refreshToken: 'mock-refresh-token',
    user: { 
      id: '1', 
      email: 'test@example.com', 
      name: 'Test User',
      roles: ['user']
    },
    expiresIn: 3600
  }));
}

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        // Import the standalone component directly
        LoginComponent,
        // Import modules that the component depends on
        CommonModule,
        ReactiveFormsModule,
        HttpClientTestingModule,
        NoopAnimationsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatCardModule,
        MatIconModule,
        MatProgressSpinnerModule,
        RouterTestingModule.withRoutes([
          { path: 'dashboard', component: {} as any },
          { path: 'login', component: {} as any }
        ])
      ],
      providers: [
        { provide: AuthService, useClass: MockAuthService }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router);
    
    // Reset all spies
    authService.isLoggedIn.calls.reset();
    authService.login.calls.reset();
    
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.loginForm).toBeDefined();
    expect(component.isLoading).toBeFalse();
    expect(component.errorMessage).toBe('');
  });

  it('should redirect to dashboard if already logged in', () => {
    // Arrange
    authService.isLoggedIn.and.returnValue(true);
    const navigateSpy = spyOn(router, 'navigate');
    
    // Act
    component.ngOnInit();
    
    // Assert
    expect(navigateSpy).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should initialize the form with empty fields', () => {
    expect(component.loginForm.value).toEqual({
      email: '',
      password: ''
    });
  });

  it('should validate email field as required', () => {
    const emailControl = component.loginForm.get('email');
    
    emailControl?.setValue('');
    expect(emailControl?.valid).toBeFalsy();
    expect(emailControl?.hasError('required')).toBeTruthy();
    
    emailControl?.setValue('invalid-email');
    expect(emailControl?.valid).toBeFalsy();
    expect(emailControl?.hasError('email')).toBeTruthy();
    
    emailControl?.setValue('valid@example.com');
    expect(emailControl?.valid).toBeTruthy();
  });

  it('should validate password field as required and minimum length', () => {
    const passwordControl = component.loginForm.get('password');
    
    passwordControl?.setValue('');
    expect(passwordControl?.valid).toBeFalsy();
    expect(passwordControl?.hasError('required')).toBeTruthy();
    
    passwordControl?.setValue('12345');
    expect(passwordControl?.valid).toBeFalsy();
    expect(passwordControl?.hasError('minlength')).toBeTruthy();
    
    passwordControl?.setValue('123456');
    expect(passwordControl?.valid).toBeTruthy();
  });

  it('should not call login if form is invalid', () => {
    // Set invalid form values
    component.loginForm.setValue({
      email: '',
      password: ''
    });
    
    // Mark controls as touched to trigger validation
    component.loginForm.markAllAsTouched();
    fixture.detectChanges();
    
    // Submit the form
    component.onSubmit();
    
    // Verify login was not called
    expect(authService.login).not.toHaveBeenCalled();
    
    // Verify form is invalid
    expect(component.loginForm.invalid).toBeTrue();
  });

  it('should have a valid form with required fields', () => {
    const form = component.loginForm;
    const emailControl = form.get('email');
    const passwordControl = form.get('password');
    
    // Form should be invalid when empty
    expect(form.invalid).toBeTrue();
    
    // Test email validation
    emailControl?.setValue('');
    expect(emailControl?.hasError('required')).toBeTrue();
    
    emailControl?.setValue('invalid-email');
    expect(emailControl?.hasError('email')).toBeTrue();
    
    // Test password validation
    passwordControl?.setValue('');
    expect(passwordControl?.hasError('required')).toBeTrue();
    
    passwordControl?.setValue('12345');
    expect(passwordControl?.hasError('minlength')).toBeTrue();
    
    // Test valid form
    form.setValue({
      email: 'test@example.com',
      password: 'password123'
    });
    
    expect(form.valid).toBeTrue();
  });

  it('should call login and navigate to dashboard on success', fakeAsync(() => {
    // Arrange
    const mockResponse = {
      token: 'mock-jwt-token',
      refreshToken: 'mock-refresh-token',
      user: {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        roles: ['user']
      },
      expiresIn: 3600
    };

    // Clear any existing tokens before test
    localStorage.removeItem('token');
    
    // Setup spies and mocks
    authService.login.and.returnValue(of(mockResponse));
    const navigateSpy = spyOn(router, 'navigate');
    
    // Verify initial state
    expect(component.isLoading).toBeFalse();
    expect(component.errorMessage).toBe('');
    
    // Set form values
    component.loginForm.setValue({
      email: 'test@example.com',
      password: 'password123'
    });
    
    // Verify form is valid
    expect(component.loginForm.valid).toBeTrue();
    
    // Act - submit the form
    component.onSubmit();
    
    // Verify loading state was set to true
    expect(component.isLoading).toBeTrue();
    
    // Wait for async operations to complete
    tick();
    
    // Assert - verify login was called with correct credentials
    expect(authService.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    });
    
    // Verify navigation occurred with the correct route
    expect(navigateSpy).toHaveBeenCalledWith(['/dashboard']);
    
    // Verify loading state was reset
    expect(component.isLoading).toBeFalse();
    
    // Verify token was stored in localStorage
    expect(localStorage.getItem('token')).toBe('mock-jwt-token');
    
    // Verify no error message is shown
    expect(component.errorMessage).toBe('');
    
    // Clean up
    localStorage.removeItem('token');
  }));

  it('should handle login error', fakeAsync(() => {
    // Arrange
    const errorResponse = {
      error: { message: 'Invalid credentials' },
      status: 401
    };
    
    // Setup spy to return an error
    authService.login.and.returnValue(throwError(() => errorResponse));
    
    // Set form values
    component.loginForm.setValue({
      email: 'wrong@example.com',
      password: 'wrongpassword'
    });
    
    // Act - submit the form
    component.onSubmit();
    tick(); // Wait for async operations
    
    // Assert
    expect(component.errorMessage).toBe('Invalid credentials');
    expect(component.isLoading).toBeFalse();
  }));

  it('should handle login error with default message', fakeAsync(() => {
    // Arrange
    const errorResponse = { status: 500 };
    
    // Setup spy to return an error without a message
    authService.login.and.returnValue(throwError(() => errorResponse));
    
    // Set form values
    component.loginForm.setValue({
      email: 'test@example.com',
      password: 'password123'
    });
    
    // Act - submit the form
    component.onSubmit();
    tick(); // Wait for async operations
    
    // Assert
    expect(component.errorMessage).toBe('Login failed. Please try again.');
    expect(component.isLoading).toBeFalse();
  }));

  it('should show generic error message when error format is unexpected', fakeAsync(() => {
    const errorResponse = { error: { message: 'Invalid credentials' } };
    authService.login.and.returnValue(throwError(() => errorResponse));
    
    component.loginForm.setValue({
      email: 'test@example.com',
      password: 'wrongpassword'
    });
    
    component.onSubmit();
    tick();
    
    expect(component.errorMessage).toBe('Invalid credentials');
    expect(component.isLoading).toBeFalse();
  }));

  it('should show generic error message when error format is unexpected', fakeAsync(() => {
    authService.login.and.returnValue(throwError(() => ({})));
    
    component.loginForm.setValue({
      email: 'test@example.com',
      password: 'password123'
    });
    
    component.onSubmit();
    tick();
    
    expect(component.errorMessage).toBe('Login failed. Please try again.');
  }));
});
