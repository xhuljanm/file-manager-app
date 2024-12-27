import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

// Material Imports
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatRippleModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatSidenavModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatRippleModule,
    MatTooltipModule,
    RouterModule
  ]
})
export class SidebarComponent {
  isExpanded = true;

  menuItems = [
    { icon: 'folder', text: 'Dashboard', tooltip: 'Dashboard', routerLink: '/dashboard' },
    { icon: 'star', text: 'Starred', tooltip: 'Starred', routerLink: '/starred' },
    { icon: 'delete', text: 'Trash', tooltip: 'Trash', routerLink: '/trash' }
  ];

  toggleSidebar() {
    this.isExpanded = !this.isExpanded;
  }
}
