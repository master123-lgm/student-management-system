import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomeComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly session = this.authService.session;
  readonly canManageRecords = computed(() => this.authService.role() === 'ADMIN');

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }
}
