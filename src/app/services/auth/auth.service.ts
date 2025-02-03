import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { RegisterRequest } from '../../models/register.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:7089';
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private router: Router, private http: HttpClient) {
      const isAuth = localStorage.getItem('isAuthenticated') === 'true';
      this.isAuthenticatedSubject.next(isAuth);
  }

  getUserId() {
    return localStorage.getItem('user_id') as string;
  }

  login(credentials: { email: string; password: string }): Observable<any> {
      return this.http.post('https://localhost:7089/api/Auth/LogIn', credentials, {
          headers: new HttpHeaders({
              'Content-Type': 'application/json',
              'accept': '*/*'
          }),
          responseType: 'text'
      }).pipe(
          map(response => {
              try {
                  const jsonResponse = JSON.parse(response);
                  if (jsonResponse?.token) {
                      localStorage.setItem('auth_token', jsonResponse.token);
                      localStorage.setItem('isAuthenticated', 'true');
                      this.isAuthenticatedSubject.next(true);
                      return jsonResponse;
                  }
                  throw new Error('Invalid response format');
              } catch (e) {
                  throw new Error('Invalid server response');
              }
          }),
          catchError(error => {
              throw new Error(error.error || 'Login failed. Please try again.');
          })
      );
  }

  register(registerData: RegisterRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/Auth/register`, registerData)
      .pipe(
        catchError(error => {
          console.error('Registration error:', error);
          return throwError(() => error);
        })
      );
  }

  checkAuth(): Observable<boolean> {
      return this.isAuthenticated$;
  }

  // synchronous checks
  isAuthenticated(): boolean {
      return localStorage.getItem('isAuthenticated') === 'true';
  }

  logout(): void {
      this.isAuthenticatedSubject.next(false);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('isAuthenticated');
      this.router.navigate(['/login']);
  }

  verifyToken(token: string): Observable<{ isValid: boolean }> {
      const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
      });

      return this.http.get<{ isValid: boolean }>(`${this.apiUrl}/verify-token`, {
          headers,
          withCredentials: true
      }).pipe(
          catchError(() => of({ isValid: false }))
      );
  }
}