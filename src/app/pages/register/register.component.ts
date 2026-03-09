import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../auth/auth.service';

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
    password: ['', [Validators.required]]
  });

  protected isLoading = false;
  protected errorMessage = '';
  protected successMessage = '';

  protected submit(): void {
    if (this.registerForm.invalid || this.isLoading) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const { name, email, password } = this.registerForm.getRawValue();
    this.errorMessage = '';
    this.successMessage = '';
    this.isLoading = true;

    this.authService
      .register(name, email, password)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: () => {
          this.successMessage = 'Registrierung erfolgreich. Du kannst dich jetzt anmelden.';
          this.registerForm.reset();
          setTimeout(() => this.router.navigate(['/login']), 800);
        },
        error: () => {
          this.errorMessage = 'Registrierung fehlgeschlagen. Bitte erneut versuchen.';
        }
      });
  }
}
