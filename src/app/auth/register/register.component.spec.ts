import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';

import { RegisterComponent } from './register.component';
import { AuthService } from '../auth.service';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: Router;

  const mockAuthResponse = {
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

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['register', 'isAuthenticated']);
    
    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        RouterTestingModule.withRoutes([{ path: 'login', component: {} as any }])
      ],
      providers: [
        { provide: AuthService, useValue: authServiceSpy }
      ]
    })
    .compileComponents();

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router);
    
    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should redirect to dashboard if already authenticated', () => {
    authService.isAuthenticated.and.returnValue(true);
    const navigateSpy = spyOn(router, 'navigate');
    
    component.ngOnInit();
    
    expect(navigateSpy).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should initialize the form with empty fields', () => {
    expect(component.registerForm.value).toEqual({
      name: '',
      email: '',
      password: ''
    });
  });

  it('should validate name field as required and minimum length', () => {
    const nameControl = component.registerForm.get('name');
    
    nameControl?.setValue('');
    expect(nameControl?.valid).toBeFalsy();
    expect(nameControl?.hasError('required')).toBeTruthy();
    
    nameControl?.setValue('ab');
    expect(nameControl?.valid).toBeFalsy();
    expect(nameControl?.hasError('minlength')).toBeTruthy();
    
    nameControl?.setValue('Test User');
    expect(nameControl?.valid).toBeTruthy();
  });

  it('should validate email field as required and format', () => {
    const emailControl = component.registerForm.get('email');
    
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
    const passwordControl = component.registerForm.get('password');
    
    passwordControl?.setValue('');
    expect(passwordControl?.valid).toBeFalsy();
    expect(passwordControl?.hasError('required')).toBeTruthy();
    
    passwordControl?.setValue('12345');
    expect(passwordControl?.valid).toBeFalsy();
    expect(passwordControl?.hasError('minlength')).toBeTruthy();
    
    passwordControl?.setValue('password123');
    expect(passwordControl?.valid).toBeTruthy();
  });

  it('should not call register if form is invalid', () => {
    component.registerForm.setValue({
      name: '',
      email: 'invalid-email',
      password: '123'
    });
    
    component.onSubmit();
    
    expect(authService.register).not.toHaveBeenCalled();
  });

  it('should call register and show success message on success', fakeAsync(() => {
    authService.register.and.returnValue(of(mockAuthResponse));
    const navigateSpy = spyOn(router, 'navigate');
    
    component.registerForm.setValue({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });
    
    component.onSubmit();
    tick();
    
    expect(authService.register).toHaveBeenCalledWith({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });
    
    expect(component.successMessage).toBe('Registration successful! Redirecting to login...');
    expect(component.isLoading).toBeFalse();
    
    // Test the navigation after delay
    tick(2000);
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  }));

  it('should handle registration error', fakeAsync(() => {
    const errorResponse = {
      error: { message: 'Email already in use' }
    };
    
    authService.register.and.returnValue(throwError(() => errorResponse));
    
    component.registerForm.setValue({
      name: 'Test User',
      email: 'existing@example.com',
      password: 'password123'
    });
    
    component.onSubmit();
    tick();
    
    expect(component.errorMessage).toBe('Email already in use');
    expect(component.isLoading).toBeFalse();
  }));

  it('should show generic error message when error format is unexpected', fakeAsync(() => {
    authService.register.and.returnValue(throwError(() => ({})));
    
    component.registerForm.setValue({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });
    
    component.onSubmit();
    tick();
    
    expect(component.errorMessage).toBe('Registration failed. Please try again.');
  }));
});
