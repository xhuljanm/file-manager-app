import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, RouterModule, NavigationEnd } from '@angular/router';

import { MatSidenavContainer, MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatToolbar } from '@angular/material/toolbar';
import { MatIcon } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-sidebar',
  imports: [
	MatSidenavContainer,
	MatSidenav,
	MatSidenavModule,
	MatListModule,
	MatToolbar,
	MatIcon,
	MatButtonModule,
	RouterModule
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit {
	@ViewChild('sidenav') sidenav!: MatSidenav; // Access the MatSidenav component instance using the template reference variable 'sidenav'
	opened: boolean = false;

	constructor(private router: Router) {}

	ngOnInit(): void {
		this.router.events.subscribe(event => { // Close the sidebar on route changes
			if (event instanceof NavigationEnd) this.sidenav.close();
		});
	}
}
