import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import { catchError, of } from 'rxjs';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth/auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
      ReactiveFormsModule,
      RouterModule,
      HttpClientModule,
      CommonModule,
      MatCardModule,
      MatFormFieldModule,
      MatInputModule,
      MatButtonModule,
      MatIconModule,
      MatProgressSpinnerModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  form: FormGroup;
  isLoggingIn: boolean = false;
  showSuccessMessage: boolean = false;
  showErrorMessage: boolean = false;
  errorMessage: string = '';
  hidePassword: boolean = true;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    if(this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  getErrorMessage(controlName: string): string {
    const control = this.form.get(controlName);
    if (!control) return '';

    if (control.hasError('required')) return `${controlName.charAt(0).toUpperCase() + controlName.slice(1)} is required`;
    if (controlName === 'email' && control.hasError('email')) return 'Please enter a valid email address';

    return '';
  }

  onSubmit() {
    if (this.form.valid) {
      const loginData = this.form.value;
      this.isLoggingIn = true;
      this.showErrorMessage = false;

      this.http.post('https://localhost:7089/api/Auth/LogIn', loginData, {
        headers: new HttpHeaders({
          'Content-Type': 'application/json',
          'accept': '*/*'
        }),
      }).pipe(
        catchError(err => {
          console.error('Login failed', err);
          this.isLoggingIn = false;
          this.showErrorMessage = true;
          err.status ? this.errorMessage = err.error || 'Login failed. Please try again.' : this.errorMessage = 'Server offline. Come back later.';
          return of(null);
        })
      ).subscribe((response: any) => {
        this.isLoggingIn = false;
        if (response) {
          try {
            this.showSuccessMessage = true;
            localStorage.setItem('auth_token', response.token);
            localStorage.setItem('isAuthenticated', 'true');
            localStorage.setItem('user_id', response.id);

            setTimeout(() => {
              this.router.navigate(['/dashboard']);
            }, 1500);
          } catch (e) {
            this.showErrorMessage = true;
            this.errorMessage = 'Invalid server response';
          }
        }
      });
    }
  }
}