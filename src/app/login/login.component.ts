import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth/service/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
	constructor(private authService: AuthService, private router: Router) {}
	ngOnInit(): void {
		if(this.authService.isAuthenticated()) this.router.navigate(['/dashboard'])
	}
}
