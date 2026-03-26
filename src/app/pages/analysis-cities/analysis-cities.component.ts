import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AnalysisCity } from '../../analysis-cities/analysis-city.models';
import { AnalysisCityService, mapAnalysisCityError } from '../../analysis-cities/analysis-city.service';

@Component({
  selector: 'app-analysis-cities',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './analysis-cities.component.html',
  styleUrl: './analysis-cities.component.scss'
})
export class AnalysisCitiesComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly analysisCityService = inject(AnalysisCityService);

  protected readonly form = this.fb.nonNullable.group({
    city_name: ['', [Validators.required]],
    country_code: ['']
  });

  protected cities: AnalysisCity[] = [];
  protected isSubmitting = false;
  protected isLoadingList = true;
  protected deletingCityId: number | null = null;
  protected errorMessage = '';
  protected successMessage = '';

  ngOnInit(): void {
    this.loadCities();
  }

  protected submit(): void {
    if (this.form.invalid || this.isSubmitting) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.form.getRawValue();

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.analysisCityService
      .createCity({
        city_name: payload.city_name.trim(),
        country_code: payload.country_code.trim() || undefined
      })
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: () => {
          this.successMessage = 'Stadt erfolgreich hinzugefügt.';
          this.form.reset({ city_name: '', country_code: '' });
          this.loadCities();
        },
        error: (error: unknown) => {
          this.errorMessage = mapAnalysisCityError(error);
        }
      });
  }

  protected deleteCity(cityId: number): void {
    if (this.deletingCityId !== null) {
      return;
    }

    this.deletingCityId = cityId;
    this.errorMessage = '';

    this.analysisCityService
      .deleteCity(cityId)
      .pipe(finalize(() => (this.deletingCityId = null)))
      .subscribe({
        next: () => {
          this.successMessage = 'Stadt erfolgreich gelöscht.';
          this.loadCities();
        },
        error: (error: unknown) => {
          this.errorMessage = mapAnalysisCityError(error);
        }
      });
  }

  private loadCities(): void {
    this.isLoadingList = true;

    this.analysisCityService
      .listCities()
      .pipe(finalize(() => (this.isLoadingList = false)))
      .subscribe({
        next: (response) => {
          this.cities = response.items;
        },
        error: (error: unknown) => {
          this.cities = [];
          this.errorMessage = mapAnalysisCityError(error);
        }
      });
  }
}
