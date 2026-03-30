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
  WeatherPriceAnalysisDataPoint,
  WeatherPriceAnalysisRequest,
  WeatherPriceAnalysisResponse,
  WeatherPriceAnalysisStatusResponse,
  WeatherPriceBucketItem,
  WeatherPriceCorrelationMatrix,
  WeatherPriceStatisticsRequest,
  WeatherPriceStatisticsResponse
} from '../../weather-price-analysis/weather-price-analysis.models';
import {
  WeatherPriceAnalysisService,
  mapWeatherPriceAnalysisError,
  mapWeatherPriceStatisticsError
} from '../../weather-price-analysis/weather-price-analysis.service';
import {
  buildStatisticsRequest,
  formatStatisticValue,
  hasStatisticsContent,
  StatisticsCardViewModel,
  toStatisticsCards
} from '../../weather-price-analysis/weather-price-statistics.helpers';

interface AnalysisChartLine {
  label: string;
  color: string;
  path: string;
  hasData: boolean;
}

interface AnalysisMetricOption {
  key: keyof WeatherPriceAnalysisDataPoint;
  label: string;
  color: string;
}

interface CorrelationMatrixRow {
  metric: string;
  values: Array<{ metric: string; value: string }>;
}

interface ScatterPlotViewModel {
  metric: string;
  points: Array<{ ts_utc: string; cx: number; cy: number; x: string; y: string }>;
}

interface LagLineViewModel {
  metric: string;
  path: string;
  color: string;
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
    run_name: [''],
    bidding_zone_id: [0, [Validators.required, Validators.min(1)]],
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
  protected statusResult: WeatherPriceAnalysisStatusResponse | null = null;
  protected readonly chartMetricOptions: AnalysisMetricOption[] = [
    { key: 'temp_c_weighted', label: 'Temp (°C, weighted)', color: '#3b82f6' },
    { key: 'wind_ms_weighted', label: 'Wind (m/s, weighted)', color: '#8b5cf6' },
    { key: 'cloud_pct_weighted', label: 'Cloud (%, weighted)', color: '#0ea5e9' },
    { key: 'ghi_wm2_weighted', label: 'GHI (W/m², weighted)', color: '#22c55e' }
  ];
  protected selectedChartMetric: AnalysisMetricOption['key'] = 'temp_c_weighted';

  protected readonly loadForm = this.fb.nonNullable.group({
    analysis_run_id: ['', [Validators.required]],
    rename_run_name: ['']
  });

  protected statisticsResult: WeatherPriceStatisticsResponse | null = null;
  protected isStatisticsLoading = false;
  protected statisticsErrorMessage = '';

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

  protected get biddingZoneInvalid(): boolean {
    const control = this.form.controls.bidding_zone_id;
    return control.touched && control.invalid;
  }

  protected get statisticsCards(): StatisticsCardViewModel[] {
    return toStatisticsCards(this.statisticsResult?.descriptive_statistics ?? {});
  }

  protected get hasStatisticsData(): boolean {
    return hasStatisticsContent(this.statisticsResult);
  }

  protected get correlationEntries(): Array<{ metric: string; value: string }> {
    const correlations = this.statisticsResult?.correlations ?? {};
    return Object.entries(correlations).map(([metric, value]) => ({ metric, value: formatStatisticValue(value) }));
  }

  protected get correlationMatrixColumns(): string[] {
    const matrix = this.statisticsResult?.correlation_matrix ?? {};
    return this.getMatrixColumns(matrix);
  }

  protected get correlationMatrixRows(): CorrelationMatrixRow[] {
    const matrix = this.statisticsResult?.correlation_matrix ?? {};
    const columns = this.getMatrixColumns(matrix);
    return Object.entries(matrix).map(([rowMetric, rowValues]) => ({
      metric: rowMetric,
      values: columns.map((columnMetric) => ({
        metric: columnMetric,
        value: formatStatisticValue(rowValues[columnMetric])
      }))
    }));
  }

  protected get bucketAnalysisEntries(): Array<{ metric: string; items: WeatherPriceBucketItem[] }> {
    const bucketAnalysis = this.statisticsResult?.bucket_analysis ?? {};
    return Object.entries(bucketAnalysis)
      .filter(([, items]) => Array.isArray(items))
      .map(([metric, items]) => ({ metric, items }));
  }

  protected get scatterPlots(): ScatterPlotViewModel[] {
    const scatterData = this.statisticsResult?.scatter_data ?? {};
    return Object.entries(scatterData)
      .filter(([, points]) => Array.isArray(points) && points.length > 0)
      .map(([metric, points]) => {
        const valid = points
          .map((point) => ({
            ts_utc: point.ts_utc,
            x: this.toFiniteNumber(point.x),
            y: this.toFiniteNumber(point.y)
          }))
          .filter(
            (point): point is { ts_utc: string; x: number; y: number } => point.x !== null && point.y !== null
          );
        if (!valid.length) {
          return { metric, points: [] };
        }

        const xValues = valid.map((point) => point.x);
        const yValues = valid.map((point) => point.y);
        const minX = Math.min(...xValues);
        const maxX = Math.max(...xValues);
        const minY = Math.min(...yValues);
        const maxY = Math.max(...yValues);
        const xRange = Math.max(maxX - minX, 1);
        const yRange = Math.max(maxY - minY, 1);

        return {
          metric,
          points: valid.map((point) => ({
            ts_utc: point.ts_utc,
            x: formatStatisticValue(point.x),
            y: formatStatisticValue(point.y),
            cx: ((point.x - minX) / xRange) * 240,
            cy: 140 - ((point.y - minY) / yRange) * 140
          }))
        };
      });
  }

  protected get lagLines(): LagLineViewModel[] {
    const lagAnalysis = this.statisticsResult?.lag_analysis ?? {};
    const colors = ['#ef4444', '#3b82f6', '#8b5cf6', '#22c55e', '#f97316'];

    return Object.entries(lagAnalysis)
      .filter(([, points]) => Array.isArray(points) && points.length > 0)
      .map(([metric, points], index) => {
        const validPoints = points
          .map((point) => ({ lag: this.toFiniteNumber(point.lag), value: this.toFiniteNumber(point.value) }))
          .filter((point): point is { lag: number; value: number } => point.lag !== null && point.value !== null);
        if (!validPoints.length) {
          return { metric, path: '', color: colors[index % colors.length] };
        }

        const minValue = Math.min(...validPoints.map((point) => point.value));
        const maxValue = Math.max(...validPoints.map((point) => point.value));
        const valueRange = Math.max(maxValue - minValue, 1);

        const path = validPoints
          .map((point, pointIndex) => {
            const x = (point.lag / 3) * 300;
            const y = 120 - ((point.value - minValue) / valueRange) * 120;
            return `${pointIndex === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
          })
          .join(' ');

        return {
          metric,
          path,
          color: colors[index % colors.length]
        };
      });
  }

  protected citySelectionInvalid(index: number): boolean {
    const control = this.citiesControls[index]?.controls['analysis_city_id'];
    return Boolean(control && control.touched && control.invalid);
  }

  protected weightInvalid(index: number): boolean {
    const control = this.citiesControls[index]?.controls['weight'];
    return Boolean(control && control.touched && control.invalid);
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
      this.errorMessage = 'Bitte Formular prüfen: Bidding Zone, Zeitraum, Städteauswahl und Gewichte sind erforderlich.';
      this.successMessage = '';
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
          this.loadForm.patchValue({ analysis_run_id: response.analysis_run_id, rename_run_name: response.run_name ?? '' });
          this.successMessage = response.run_name
            ? `Analyse "${response.run_name}" (${response.analysis_run_id}) erfolgreich erstellt.`
            : `Analyse ${response.analysis_run_id} erfolgreich erstellt.`;
        },
        error: (error: unknown) => {
          this.result = null;
          this.chartLines = [];
          this.hasChartData = false;
          this.errorMessage = mapWeatherPriceAnalysisError(error);
        }
      });
  }

  protected computeStatistics(): void {
    if (this.isStatisticsLoading) {
      return;
    }

    const requestPayload = this.buildStatisticsPayload();
    if (!requestPayload) {
      this.statisticsErrorMessage = 'Bitte eine analysis_run_id angeben oder eine gültige aktuelle Auswahl ausfüllen.';
      return;
    }

    this.isStatisticsLoading = true;
    this.statisticsErrorMessage = '';

    this.weatherPriceAnalysisService
      .computeStatistics(requestPayload)
      .pipe(finalize(() => (this.isStatisticsLoading = false)))
      .subscribe({
        next: (response) => {
          this.statisticsResult = response;
        },
        error: (error: unknown) => {
          this.statisticsResult = null;
          this.statisticsErrorMessage = mapWeatherPriceStatisticsError(error);
        }
      });
  }

  protected formatValue(value: unknown): string {
    return formatStatisticValue(value);
  }

  protected onChartMetricChange(metric: string): void {
    const selectedMetric = this.chartMetricOptions.find((option) => option.key === metric)?.key;
    if (!selectedMetric) {
      return;
    }

    this.selectedChartMetric = selectedMetric;
    if (this.result) {
      this.chartLines = this.createChartLines(this.result);
      this.hasChartData = this.chartLines.some((line) => line.hasData);
    }
  }

  private get citiesFormArray(): FormArray<FormGroup> {
    return this.form.controls.cities;
  }

  private buildPayload(): WeatherPriceAnalysisRequest {
    const value = this.form.getRawValue();

    return {
      run_name: value.run_name.trim() || undefined,
      bidding_zone_id: Number(value.bidding_zone_id),
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

  private buildStatisticsPayload(): WeatherPriceStatisticsRequest | null {
    const analysisRunIdControlValue = this.loadForm.controls.analysis_run_id.value;
    const analysisRunIdRaw =
      typeof analysisRunIdControlValue === 'string' ? analysisRunIdControlValue : String(analysisRunIdControlValue ?? '');
    if (!analysisRunIdRaw.trim() && this.form.invalid) {
      this.form.markAllAsTouched();
      return null;
    }

    const formValue = this.form.getRawValue();
    return buildStatisticsRequest({
      analysisRunIdRaw,
      start_date: formValue.start_date,
      end_date: formValue.end_date,
      bidding_zone_id: Number(formValue.bidding_zone_id),
      product_id: formValue.product_id,
      price_type: formValue.price_type,
      cities: formValue.cities.map((city) => ({
        analysis_city_id: Number(city['analysis_city_id']),
        weight: Number(city['weight'])
      }))
    });
  }

  protected loadExistingAnalysis(): void {
    const analysisRunId = this.loadForm.controls.analysis_run_id.value.trim();
    if (!analysisRunId) {
      this.loadForm.controls.analysis_run_id.markAsTouched();
      this.errorMessage = 'Bitte eine analysis_run_id zum Laden angeben.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.weatherPriceAnalysisService
      .getAnalysis(analysisRunId)
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: (response) => {
          this.result = response;
          this.chartLines = this.createChartLines(response);
          this.hasChartData = this.chartLines.some((line) => line.hasData);
          this.statusResult = null;
          this.loadForm.patchValue({ rename_run_name: response.run_name ?? '' });
          this.successMessage = response.run_name
            ? `Analyse "${response.run_name}" (${response.analysis_run_id}) geladen.`
            : `Analyse ${response.analysis_run_id} geladen.`;
        },
        error: (error: unknown) => {
          this.errorMessage = mapWeatherPriceAnalysisError(error);
        }
      });
  }

  protected loadAnalysisStatus(): void {
    const analysisRunId = this.loadForm.controls.analysis_run_id.value.trim();
    if (!analysisRunId) {
      this.loadForm.controls.analysis_run_id.markAsTouched();
      this.errorMessage = 'Bitte eine analysis_run_id für den Status angeben.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.weatherPriceAnalysisService
      .getAnalysisStatus(analysisRunId)
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: (response) => {
          this.statusResult = response;
          this.successMessage = response.run_name
            ? `Status für "${response.run_name}" geladen: ${response.status}.`
            : `Status für ${response.analysis_run_id} geladen: ${response.status}.`;
        },
        error: (error: unknown) => {
          this.statusResult = null;
          this.errorMessage = mapWeatherPriceAnalysisError(error);
        }
      });
  }

  protected renameAnalysis(): void {
    const analysisRunId = this.loadForm.controls.analysis_run_id.value.trim();
    const runName = this.loadForm.controls.rename_run_name.value.trim();

    if (!analysisRunId || !runName) {
      this.errorMessage = 'Für das Umbenennen sind analysis_run_id und run_name erforderlich.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.weatherPriceAnalysisService
      .renameAnalysisRun(analysisRunId, { run_name: runName })
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: (response) => {
          this.statusResult = response;
          if (this.result && this.result.analysis_run_id === analysisRunId) {
            this.result = { ...this.result, run_name: runName };
          }
          this.successMessage = `Analyse ${analysisRunId} wurde auf "${runName}" umbenannt.`;
        },
        error: (error: unknown) => {
          this.errorMessage = mapWeatherPriceAnalysisError(error);
        }
      });
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

    const selectedMetricOption =
      this.chartMetricOptions.find((option) => option.key === this.selectedChartMetric) ?? this.chartMetricOptions[0];

    const lineDefs: Array<{ label: string; color: string; values: number[] }> = [
      { label: 'Preis (EUR/MWh)', color: '#f97316', values: sorted.map((row) => row.price_eur_mwh) },
      {
        label: selectedMetricOption.label,
        color: selectedMetricOption.color,
        values: sorted.map((row) => Number(row[selectedMetricOption.key]))
      }
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

  private getMatrixColumns(matrix: WeatherPriceCorrelationMatrix): string[] {
    const rowKeys = Object.keys(matrix);
    const colKeys = rowKeys.flatMap((key) => Object.keys(matrix[key] ?? {}));
    return Array.from(new Set([...rowKeys, ...colKeys]));
  }

  private toFiniteNumber(value: unknown): number | null {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : null;
  }
}
