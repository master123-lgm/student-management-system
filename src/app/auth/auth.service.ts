import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EMPTY, Observable, catchError, map, of, tap, timeout } from 'rxjs';
import { AuthSession, LoginRequest, RegisterRequest, UserRole } from './auth.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly authApiUrl = `${environment.apiBaseUrl}/api/auth`;
  private readonly storageKey = 'student-system-auth';
  private readonly sessionState = signal<AuthSession | null>(this.readStoredSession());
  private readonly backendStatusState = signal<'unknown' | 'ready' | 'down'>('unknown');

  readonly session = this.sessionState.asReadonly();
  readonly backendStatus = this.backendStatusState.asReadonly();
  readonly isAuthenticated = computed(() => this.sessionState() !== null);
  readonly role = computed(() => this.sessionState()?.role ?? null);

  login(credentials: LoginRequest): Observable<AuthSession> {
    return this.http.post<AuthSession>(`${this.authApiUrl}/login`, credentials).pipe(
      timeout(3000),
      tap((session) => {
        this.sessionState.set(session);
        localStorage.setItem(this.storageKey, JSON.stringify(session));
      }),
    );
  }

  register(payload: RegisterRequest): Observable<AuthSession> {
    return this.http.post<AuthSession>(`${this.authApiUrl}/register`, payload).pipe(
      timeout(3000),
      tap((session) => {
        this.sessionState.set(session);
        localStorage.setItem(this.storageKey, JSON.stringify(session));
      }),
    );
  }

  warmupBackend(): void {
    this.checkBackend().subscribe();
  }

  checkBackend(): Observable<boolean> {
    return this.http.get(`${this.authApiUrl}/ping`).pipe(
      timeout(2500),
      map(() => {
        this.backendStatusState.set('ready');
        return true;
      }),
      catchError(() => {
        this.backendStatusState.set('down');
        return of(false);
      }),
    );
  }

  logout(): void {
    this.sessionState.set(null);
    localStorage.removeItem(this.storageKey);
  }

  getToken(): string | null {
    return this.sessionState()?.token ?? null;
  }

  getDashboardRoute(role: UserRole | null = this.role()): string {
    switch (role) {
      case 'STUDENT':
        return '/student-dashboard';
      case 'TEACHER':
        return '/teacher-dashboard';
      case 'ADMIN':
        return '/admin-dashboard';
      default:
        return '/login';
    }
  }

  private readStoredSession(): AuthSession | null {
    const rawSession = localStorage.getItem(this.storageKey);

    if (!rawSession) {
      return null;
    }

    try {
      return JSON.parse(rawSession) as AuthSession;
    } catch {
      localStorage.removeItem(this.storageKey);
      return null;
    }
  }
}
