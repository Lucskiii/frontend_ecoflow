import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService, CustomerProfile } from '../../auth/auth.service';
import { formatUmsatzEur } from '../../customers/customer-umsatz.utils';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  protected readonly profileForm = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]]
  });

  protected isLoading = false;
  protected isSaving = false;
  protected errorMessage = '';
  protected successMessage = '';
  protected alltimeUmsatzDisplay = formatUmsatzEur(0);
  protected umsatz30dDisplay = formatUmsatzEur(0);
  protected umsatz7dDisplay = formatUmsatzEur(0);
  private initialProfile: CustomerProfile = { name: '', email: '' };

  ngOnInit(): void {
    this.loadProfile();
  }

  protected save(): void {
    if (this.profileForm.invalid || this.isSaving) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const profile: CustomerProfile = this.profileForm.getRawValue();

    this.errorMessage = '';
    this.successMessage = '';
    this.isSaving = true;

    this.authService
      .updateProfile(profile)
      .pipe(finalize(() => (this.isSaving = false)))
      .subscribe({
        next: () => {
          this.successMessage = 'Profil erfolgreich gespeichert.';
        },
        error: () => {
          this.errorMessage = 'Profil konnte nicht gespeichert werden. Bitte erneut versuchen.';
        }
      });
  }

  protected reset(): void {
    this.profileForm.reset(this.initialProfile);
    this.profileForm.markAsPristine();
    this.profileForm.markAsUntouched();
    this.errorMessage = '';
    this.successMessage = '';
  }

  private loadProfile(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.isLoading = true;

    this.authService
      .getCurrentCustomer()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (customer) => {
          this.initialProfile = {
            name: customer?.name ?? '',
            email: customer?.email ?? ''
          };
          this.profileForm.setValue(this.initialProfile);
          this.loadRevenuePeriods();
        },
        error: () => {
          this.errorMessage = 'Profildaten konnten nicht geladen werden.';
        }
      });
  }

  private loadRevenuePeriods(): void {
    this.authService.getRevenuePeriods().subscribe({
      next: (response) => {
        const periods = response?.periods ?? [];
        this.alltimeUmsatzDisplay = formatUmsatzEur(periods.find((period) => period.period === 'all')?.umsatz_eur);
        this.umsatz30dDisplay = formatUmsatzEur(periods.find((period) => period.period === '30d')?.umsatz_eur);
        this.umsatz7dDisplay = formatUmsatzEur(periods.find((period) => period.period === '7d')?.umsatz_eur);
      },
      error: () => {
        this.alltimeUmsatzDisplay = formatUmsatzEur(0);
        this.umsatz30dDisplay = formatUmsatzEur(0);
        this.umsatz7dDisplay = formatUmsatzEur(0);
      }
    });
  }
}
