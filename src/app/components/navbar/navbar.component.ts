import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuthService } from '../../services/auth/auth.service';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    FormsModule
  ],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
  searchText: string = '';

  constructor(private authService: AuthService) {}

  logout(): void {
    this.authService.logout();
  }
}
