import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService, CustomerProfile } from '../../auth/auth.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected customer: CustomerProfile | null = null;

  ngOnInit(): void {
    this.authService.getCurrentCustomer().subscribe((customer) => {
      this.customer = customer;
    });
  }

  protected logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
