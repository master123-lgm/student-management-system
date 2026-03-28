import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly backendStatus = this.authService.backendStatus;
  readonly backendUrl = this.authService.apiBaseUrl;
  credentials = {
    username: '',
    password: '',
  };
  errorMessage = '';
  isSubmitting = false;

  ngOnInit(): void {
    this.authService.warmupBackend();
  }

  login(): void {
    this.errorMessage = '';
    this.credentials.username = this.credentials.username.trim();
    this.credentials.password = this.credentials.password.trim();

    if (!this.credentials.username || !this.credentials.password) {
      this.errorMessage = 'Enter both username and password to continue.';
      return;
    }

    this.isSubmitting = true;
    this.authService.warmupBackend();

    this.authService.login(this.credentials).subscribe({
      next: (session) => {
        this.router.navigateByUrl(this.authService.getDashboardRoute(session.role));
      },
      error: (error) => {
        this.errorMessage = this.getAuthErrorMessage(error, 'log in');
        this.isSubmitting = false;
      },
      complete: () => {
        this.isSubmitting = false;
      },
    });
  }

  private getAuthErrorMessage(error: unknown, action: string): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return `Cannot reach backend at ${this.backendUrl}. Start the Spring Boot server and try again.`;
      }

      return error.error?.message ?? `Authentication failed while trying to ${action}.`;
    }

    return `Request timed out while trying to ${action}. If Render is waking up, wait a few seconds and try again.`;
  }
}
