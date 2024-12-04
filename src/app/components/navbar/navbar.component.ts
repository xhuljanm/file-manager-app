import { Component } from '@angular/core';

import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../auth/service/auth.service';

import {MatToolbarModule} from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-navbar',
  imports: [MatToolbarModule, MatIconModule, MatButtonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
	constructor(private router: Router, private authService: AuthService) { }

	onLogout(): void {
		this.authService.logout();
	}
}
