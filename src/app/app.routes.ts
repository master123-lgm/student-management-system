import { Routes } from '@angular/router';
import { authGuard, dashboardRedirectGuard, roleGuard } from './auth/auth.guard';
import { HomeComponent } from './home/home';
import { LoginComponent } from './login/login';
import { RegisterComponent } from './register/register';
import { Student } from './student/student';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: '', canActivate: [dashboardRedirectGuard], component: HomeComponent },
  { path: 'home', component: HomeComponent, canActivate: [authGuard] },
  { path: 'student-dashboard', component: Student, canActivate: [roleGuard(['STUDENT'])] },
  { path: 'teacher-dashboard', component: Student, canActivate: [roleGuard(['TEACHER'])] },
  { path: 'admin-dashboard', component: Student, canActivate: [roleGuard(['ADMIN'])] },
  { path: 'students', component: Student, canActivate: [authGuard] },
  { path: '**', redirectTo: 'login' },
];
