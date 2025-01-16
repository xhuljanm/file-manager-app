import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { LayoutComponent } from './shared/layout/layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { StarredComponent } from './pages/starred/starred.component';
import { TrashComponent } from './pages/trash/trash.component';
import { AuthGuard } from './guard/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    canActivate: [AuthGuard],
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
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent }
];
