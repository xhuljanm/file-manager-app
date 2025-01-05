import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatRippleModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatRippleModule,
    MatTooltipModule
  ]
})
export class SidebarComponent {
  isExpanded = false;

  menuItems = [
    { icon: 'folder', text: 'Dashboard', tooltip: 'Dashboard', routerLink: '/dashboard' },
    { icon: 'star', text: 'Starred', tooltip: 'Starred', routerLink: '/starred' },
    { icon: 'delete', text: 'Trash', tooltip: 'Trash', routerLink: '/trash' }
  ];

  toggleSidebar() {
    this.isExpanded = !this.isExpanded;
  }
}
