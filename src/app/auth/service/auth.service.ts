import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
	constructor(private router: Router) {}

	logout() {
		localStorage.clear();
		this.router.navigate(['/login']);
		console.log('Logging out...');
	}

	isAuthenticated(): boolean {
		return !!localStorage.getItem('token');
  	}
}