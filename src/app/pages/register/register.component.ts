import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { catchError, finalize, of } from 'rxjs';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    HttpClientModule,
    CommonModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
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
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  private passwordMatchValidator(form: FormGroup): null {
    const passwordControl = form.get('password');
    const confirmPasswordControl = form.get('confirmPassword');

    if (!passwordControl || !confirmPasswordControl) {
      return null;
    }

    const password = passwordControl.value;
    const confirmPassword = confirmPasswordControl.value;

    if (password !== confirmPassword) {
      confirmPasswordControl.setErrors({ passwordMismatch: true });
    } else {
      const errors = confirmPasswordControl.errors;
      if (errors) {
        delete errors['passwordMismatch'];
        if (Object.keys(errors).length === 0) {
          confirmPasswordControl.setErrors(null);
        } else {
          confirmPasswordControl.setErrors(errors);
        }
      }
    }
    return null;
  }

  getErrorMessage(controlName: string): string {
    const control = this.form.get(controlName);
    if (!control) return '';

    if (control.hasError('required')) return `${controlName.charAt(0).toUpperCase() + controlName.slice(1)} is required`;
    if (controlName === 'email' && control.hasError('email')) return 'Please enter a valid email address';
    if (controlName === 'username' && control.hasError('minlength')) return 'Username must be at least 3 characters long';
    if (controlName === 'password' && control.hasError('minlength')) return 'Password must be at least 6 characters long';
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
