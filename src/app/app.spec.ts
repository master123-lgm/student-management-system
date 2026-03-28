import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { authGuard, dashboardRedirectGuard } from './auth/auth.guard';
import { routes } from './app.routes';
import { HomeComponent } from './home/home';
import { LoginComponent } from './login/login';
import { RegisterComponent } from './register/register';
import { Student } from './student/student';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should define the system route configuration', () => {
    expect(routes[0]).toEqual({ path: 'login', component: LoginComponent });
    expect(routes[1]).toEqual({ path: 'register', component: RegisterComponent });
    expect(routes[2]).toEqual({ path: '', canActivate: [dashboardRedirectGuard], component: HomeComponent });
    expect(routes[3]).toEqual({ path: 'home', component: HomeComponent, canActivate: [authGuard] });
    expect(routes[4]?.path).toBe('student-dashboard');
    expect(routes[4]?.component).toBe(Student);
    expect(typeof routes[4]?.canActivate?.[0]).toBe('function');
    expect(routes[5]?.path).toBe('teacher-dashboard');
    expect(routes[5]?.component).toBe(Student);
    expect(typeof routes[5]?.canActivate?.[0]).toBe('function');
    expect(routes[6]?.path).toBe('admin-dashboard');
    expect(routes[6]?.component).toBe(Student);
    expect(typeof routes[6]?.canActivate?.[0]).toBe('function');
    expect(routes[7]).toEqual({ path: 'students', component: Student, canActivate: [authGuard] });
    expect(routes[8]).toEqual({ path: '**', redirectTo: 'login' });
  });
});
