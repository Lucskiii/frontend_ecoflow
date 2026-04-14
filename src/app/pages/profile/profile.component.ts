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
  protected umsatzDisplay = formatUmsatzEur(0);

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
    this.loadProfile();
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
          this.profileForm.setValue({
            name: customer?.name ?? '',
            email: customer?.email ?? ''
          });
          this.umsatzDisplay = formatUmsatzEur(customer?.umsatz_eur);
        },
        error: () => {
          this.errorMessage = 'Profildaten konnten nicht geladen werden.';
        }
      });
  }
}
