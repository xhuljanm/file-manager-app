import { Routes } from '@angular/router';
import { LayoutComponent } from './shared/layout/layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { StarredComponent } from './pages/starred/starred.component';
import { TrashComponent } from './pages/trash/trash.component';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: '', component: LayoutComponent,
    children: [
      {
        path: 'dashboard',
        component: DashboardComponent
      },
      {
        path: 'starred',
        component: StarredComponent
      },
      {
        path: 'trash',
        component: TrashComponent
      }
    ]
  }
];
