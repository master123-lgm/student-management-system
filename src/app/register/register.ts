import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { RegisterRequest } from '../auth/auth.model';

@Component({
  selector: 'app-register',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class RegisterComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly backendStatus = this.authService.backendStatus;
  readonly backendUrl = this.authService.apiBaseUrl;
  registration: RegisterRequest = {
    username: '',
    password: '',
    role: 'STUDENT',
  };
  errorMessage = '';
  isSubmitting = false;

  ngOnInit(): void {
    this.authService.warmupBackend();
  }

  register(): void {
    this.errorMessage = '';
    this.registration.username = this.registration.username.trim();
    this.registration.password = this.registration.password.trim();

    if (!this.registration.username || !this.registration.password) {
      this.errorMessage = 'Enter both username and password to sign up.';
      return;
    }

    this.isSubmitting = true;
    this.authService.warmupBackend();

    this.authService.register(this.registration).subscribe({
      next: () => {
        this.router.navigateByUrl('/');
      },
      error: (error) => {
        this.errorMessage = this.getAuthErrorMessage(error, 'sign up');
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
