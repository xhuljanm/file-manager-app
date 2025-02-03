import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { DarkModeService } from '../../services/dark-mode/dark-mode.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, CommonModule, MatSidenavModule]
})
export class LayoutComponent implements OnInit, OnDestroy {
  isSidebarCollapsed = false;
  private darkModeSubscription: Subscription | undefined;

  constructor(private darkModeService: DarkModeService) {}

  ngOnInit(): void {
    this.darkModeSubscription = this.darkModeService.darkMode$.subscribe();
  }

  ngOnDestroy(): void {
    if (this.darkModeSubscription) {
      this.darkModeSubscription.unsubscribe();
    }
  }
  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }
}
