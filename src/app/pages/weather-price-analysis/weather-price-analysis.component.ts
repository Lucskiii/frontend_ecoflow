import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AnalysisCity } from '../../analysis-cities/analysis-city.models';
import { AnalysisCityService } from '../../analysis-cities/analysis-city.service';
import {
  WeatherPriceAnalysisRequest,
  WeatherPriceAnalysisResponse
} from '../../weather-price-analysis/weather-price-analysis.models';
import {
  WeatherPriceAnalysisService,
  mapWeatherPriceAnalysisError
} from '../../weather-price-analysis/weather-price-analysis.service';

interface AnalysisChartLine {
  label: string;
  color: string;
  path: string;
  hasData: boolean;
}

@Component({
  selector: 'app-weather-price-analysis',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './weather-price-analysis.component.html',
  styleUrl: './weather-price-analysis.component.scss'
})
export class WeatherPriceAnalysisComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly analysisCityService = inject(AnalysisCityService);
  private readonly weatherPriceAnalysisService = inject(WeatherPriceAnalysisService);

  protected readonly form = this.fb.nonNullable.group({
    start_date: ['', [Validators.required]],
    end_date: ['', [Validators.required]],
    product_id: [''],
    price_type: ['spot', [Validators.required]],
    cities: this.fb.array<FormGroup>([], [this.uniqueCityValidator, this.minOneCityValidator])
  });

  protected availableCities: AnalysisCity[] = [];
  protected isLoadingCities = true;
  protected isSubmitting = false;
  protected successMessage = '';
  protected errorMessage = '';
  protected result: WeatherPriceAnalysisResponse | null = null;
  protected chartLines: AnalysisChartLine[] = [];
  protected hasChartData = false;

  ngOnInit(): void {
    this.loadCities();
    this.addCity();
  }

  protected get citiesControls(): FormGroup[] {
    return this.citiesFormArray.controls;
  }

  protected get hasResults(): boolean {
    return Boolean(this.result);
  }

  protected addCity(): void {
    this.citiesFormArray.push(
      this.fb.nonNullable.group({
        analysis_city_id: [0, [Validators.required, Validators.min(1)]],
        weight: [1, [Validators.required, Validators.min(0.0000001)]]
      })
    );
    this.citiesFormArray.updateValueAndValidity();
  }

  protected removeCity(index: number): void {
    this.citiesFormArray.removeAt(index);
    this.citiesFormArray.updateValueAndValidity();
  }

  protected cityNameById(cityId: number): string {
    const city = this.availableCities.find((item) => item.id === cityId);
    return city ? `${city.city_name} (${city.country_code || city.country_name})` : `City #${cityId}`;
  }


  protected normalizedWeightForCity(cityId: number): string {
    if (!this.result) {
      return '-';
    }

    const key = String(cityId);
    return Object.prototype.hasOwnProperty.call(this.result.normalized_weights, key)
      ? String(this.result.normalized_weights[key])
      : '-';
  }
  protected submit(): void {
    if (this.form.invalid || this.isSubmitting) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.buildPayload();
    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.weatherPriceAnalysisService
      .runAnalysis(payload)
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: (response) => {
          this.result = response;
          this.chartLines = this.createChartLines(response);
          this.hasChartData = this.chartLines.some((line) => line.hasData);
          this.successMessage = `Analyse ${response.analysis_run_id} erfolgreich erstellt.`;
        },
        error: (error: unknown) => {
          this.result = null;
          this.chartLines = [];
          this.hasChartData = false;
          this.errorMessage = mapWeatherPriceAnalysisError(error);
        }
      });
  }

  private get citiesFormArray(): FormArray<FormGroup> {
    return this.form.controls.cities;
  }

  private buildPayload(): WeatherPriceAnalysisRequest {
    const value = this.form.getRawValue();

    return {
      start_date: value.start_date,
      end_date: value.end_date,
      product_id: value.product_id.trim() || undefined,
      price_type: value.price_type,
      cities: value.cities.map((city) => ({
        analysis_city_id: Number(city['analysis_city_id']),
        weight: Number(city['weight'])
      }))
    };
  }

  private loadCities(): void {
    this.isLoadingCities = true;

    this.analysisCityService
      .listCities()
      .pipe(finalize(() => (this.isLoadingCities = false)))
      .subscribe({
        next: (response) => {
          this.availableCities = response.items;
        },
        error: () => {
          this.availableCities = [];
          this.errorMessage = 'Analysis Cities konnten nicht geladen werden.';
        }
      });
  }

  private minOneCityValidator(control: AbstractControl): ValidationErrors | null {
    const entries = (control.value as Array<{ analysis_city_id: number; weight: number }> | null) ?? [];
    return entries.length > 0 ? null : { minOneCity: true };
  }

  private uniqueCityValidator(control: AbstractControl): ValidationErrors | null {
    const entries = (control.value as Array<{ analysis_city_id: number; weight: number }> | null) ?? [];
    const ids = entries.map((entry) => Number(entry.analysis_city_id)).filter((id) => id > 0);
    return new Set(ids).size === ids.length ? null : { duplicateCities: true };
  }

  private createChartLines(response: WeatherPriceAnalysisResponse): AnalysisChartLine[] {
    if (!response.data.length) {
      return [];
    }

    const chartWidth = 760;
    const chartHeight = 220;

    const sorted = [...response.data].sort((a, b) => new Date(a.ts_utc).getTime() - new Date(b.ts_utc).getTime());
    const fromTs = new Date(sorted[0].ts_utc).getTime();
    const toTs = new Date(sorted[sorted.length - 1].ts_utc).getTime();
    const timespan = Math.max(toTs - fromTs, 1);

    const lineDefs: Array<{ label: string; color: string; values: number[] }> = [
      { label: 'Preis (EUR/MWh)', color: '#f97316', values: sorted.map((row) => row.price_eur_mwh) },
      { label: 'Temp (°C, weighted)', color: '#3b82f6', values: sorted.map((row) => row.temp_c_weighted) }
    ];

    return lineDefs.map((line) => {
      const minValue = Math.min(...line.values);
      const maxValue = Math.max(...line.values);
      const valueRange = Math.max(maxValue - minValue, 1);

      const path = sorted
        .map((row, index) => {
          const x = ((new Date(row.ts_utc).getTime() - fromTs) / timespan) * chartWidth;
          const value = line.values[index];
          const y = chartHeight - ((value - minValue) / valueRange) * chartHeight;
          return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
        })
        .join(' ');

      return {
        label: line.label,
        color: line.color,
        path,
        hasData: line.values.length > 0
      };
    });
  }
}
