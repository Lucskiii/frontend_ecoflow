import { Component, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService, RegisterPayload } from '../../auth/auth.service';

@Component({
  selector: 'app-register',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly registerForm = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
    address_line1: ['', [Validators.required]],
    city: ['', [Validators.required]],
    postal_code: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9 -]{3,10}$/)]],
    country: ['AT', [Validators.required]]
  });

  protected isLoading = false;
  protected errorMessage = '';
  protected successMessage = '';
  protected readonly countries = [
    { value: 'AT', label: 'Österreich' },
    { value: 'DE', label: 'Deutschland' }
  ];

  protected submit(): void {
    if (this.registerForm.invalid || this.isLoading) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const payload: RegisterPayload = this.registerForm.getRawValue();
    this.errorMessage = '';
    this.successMessage = '';
    this.isLoading = true;

    this.authService
      .register(payload)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: () => {
          this.successMessage = 'Registrierung erfolgreich. Du kannst dich jetzt anmelden.';
          this.registerForm.reset({
            name: '',
            email: '',
            password: '',
            address_line1: '',
            city: '',
            postal_code: '',
            country: 'AT'
          });
          setTimeout(() => this.router.navigate(['/login']), 800);
        },
        error: (error) => {
          this.errorMessage = this.mapRegisterError(error);
        }
      });
  }

  private mapRegisterError(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'Registrierung fehlgeschlagen. Bitte erneut versuchen.';
    }

    if (error.status === 409) {
      return 'Diese E-Mail ist bereits registriert.';
    }

    if (error.status === 422) {
      const backendError = error.error as { message?: string; errors?: Record<string, string[] | string> } | null;
      const firstFieldErrors = backendError?.errors ? Object.values(backendError.errors)[0] : undefined;
      const firstError =
        Array.isArray(firstFieldErrors) && firstFieldErrors.length > 0
          ? firstFieldErrors[0]
          : typeof firstFieldErrors === 'string'
            ? firstFieldErrors
            : undefined;

      return firstError ?? backendError?.message ?? 'Validierungsfehler. Bitte überprüfe deine Eingaben.';
    }

    return 'Registrierung fehlgeschlagen. Bitte erneut versuchen.';
  }
}
