import { Routes } from '@angular/router';
import { AuthGuard } from './auth/guard/auth.guard';
import { DashboardComponent } from './dashboard/dashboard.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { MyFilesComponent } from './my-files/my-files.component';
import { MyAccountComponent } from './my-account/my-account.component';
import { LayoutComponent } from './shared/layout/layout.component';

export const routes: Routes = [
	{ path: '', component: LayoutComponent, canActivate: [AuthGuard],
		children: [
			{ path: 'dashboard', component: DashboardComponent, },
			{ path: '', component: DashboardComponent, },
			{ path: 'my-files', component: MyFilesComponent, },
			{ path: 'my-account', component: MyAccountComponent, },
		]
	},
	{ path: 'login', component: LoginComponent },
	{ path: 'register', component: RegisterComponent },
	{ path: '**', redirectTo: '/login' }
];