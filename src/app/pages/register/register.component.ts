import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  form!: FormGroup;
  isRegistering: boolean = false;
  showSuccessMessage: boolean = false;
  showErrorMessage: boolean = false;
  errorMessage: string = '';
  hidePassword: boolean = true;
  hideConfirmPassword: boolean = true;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          this.passwordStrengthValidator,
        ],
      ],
      confirmPassword: ['', [Validators.required]],
    }, { validators: this.passwordMatchValidator });
  }

  private passwordMatchValidator(form: AbstractControl): ValidationErrors | null {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;

    if (password && confirmPassword && password !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }

  private passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.value;

    if (!password) {
      return null;  // If the field is empty, no validation errors.
    }

    // Regex to check for at least one uppercase letter, one number, one special character, and minimum length of 8 characters
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isValidLength = password.length >= 8;

    const errors: ValidationErrors = {};

    if (!hasUpperCase) {
      errors['uppercase'] = 'Password must contain at least one uppercase letter.';
    }
    if (!hasLowerCase) {
      errors['lowercase'] = 'Password must contain at least one lowercase letter.';
    }
    if (!hasNumber) {
      errors['number'] = 'Password must contain at least one number.';
    }
    if (!hasSpecialChar) {
      errors['specialChar'] = 'Password must contain at least one special character.';
    }
    if (!isValidLength) {
      errors['minlength'] = 'Password must be at least 8 characters long.';
    }

    return Object.keys(errors).length > 0 ? errors : null;
  }

  getErrorMessage(controlName: string): string {
    const control = this.form.get(controlName);
    if (!control) return '';

    if (control.hasError('required')) return `${controlName.charAt(0).toUpperCase() + controlName.slice(1)} is required`;
    if (controlName === 'email' && control.hasError('email')) return 'Please enter a valid email address';
    if (controlName === 'username' && control.hasError('minlength')) return 'Username must be at least 3 characters long';
    if (controlName === 'password') {
      if (control.hasError('minlength')) return 'Password must be at least 8 characters long';
      if (control.hasError('passwordStrength')) return 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character';
    }
    if (controlName === 'confirmPassword' && control.hasError('passwordMismatch')) return 'Passwords do not match';

    return '';
  }

  onSubmit(): void {
    if (this.form.valid) {
      const { email, username, password } = this.form.value;
      this.isRegistering = true;
      this.showErrorMessage = false;

      this.http.post('https://localhost:7089/api/Auth/Register', { email, username, password }, {
        headers: new HttpHeaders({
          'Content-Type': 'application/json',
          'accept': '*/*'
        }),
      }).pipe(
        catchError(err => {
          console.error('Registration failed', err);
          this.showErrorMessage = true;

          err.status ? this.errorMessage = err.error || 'Registration failed. Please try again.' : this.errorMessage = 'Server offline. Come back later.';
          return of(null);
        }),
        finalize(() => {
          this.isRegistering = false;
        })
      ).subscribe((response: any) => {
        if (response) {
          this.showSuccessMessage = true;
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 1500);
        }
      });
    } else {
      this.form.markAllAsTouched();
    }
  }
}