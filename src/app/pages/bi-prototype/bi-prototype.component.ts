import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import {
  BiPrototypeEnergyTrendResponse,
  BiPrototypePriceTrendResponse,
  BiPrototypeSyncResponse,
  BiPrototypeTrendPoint
} from '../../bi-prototype/bi-prototype.models';
import { BiPrototypeService, mapBiPrototypeError } from '../../bi-prototype/bi-prototype.service';

interface TrendChartViewModel {
  path: string;
  hasData: boolean;
}

@Component({
  selector: 'app-bi-prototype',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './bi-prototype.component.html',
  styleUrl: './bi-prototype.component.scss'
})
export class BiPrototypeComponent {
  private readonly fb = inject(FormBuilder);
  private readonly biPrototypeService = inject(BiPrototypeService);

  protected readonly syncForm = this.fb.nonNullable.group({
    from: ['', [Validators.required]],
    to: ['', [Validators.required]]
  });

  protected readonly energyTrendForm = this.fb.nonNullable.group({
    from: ['', [Validators.required]],
    to: ['', [Validators.required]],
    site_key: ['']
  });

  protected readonly priceTrendForm = this.fb.nonNullable.group({
    from: ['', [Validators.required]],
    to: ['', [Validators.required]],
    market_product_key: [''],
    bidding_zone_id: ['']
  });

  protected syncLoading = false;
  protected syncError = '';
  protected syncResult: BiPrototypeSyncResponse | null = null;

  protected energyLoading = false;
  protected energyError = '';
  protected energyResult: BiPrototypeEnergyTrendResponse | null = null;
  protected energyChart: TrendChartViewModel = { path: '', hasData: false };

  protected priceLoading = false;
  protected priceError = '';
  protected priceResult: BiPrototypePriceTrendResponse | null = null;
  protected priceChart: TrendChartViewModel = { path: '', hasData: false };

  protected startSync(): void {
    const validationError = this.validateRange(this.syncForm.controls.from.value, this.syncForm.controls.to.value);
    if (validationError || this.syncLoading) {
      this.syncError = validationError ?? '';
      return;
    }

    this.syncLoading = true;
    this.syncError = '';

    this.biPrototypeService
      .sync({
        from: this.syncForm.controls.from.value,
        to: this.syncForm.controls.to.value
      })
      .pipe(finalize(() => (this.syncLoading = false)))
      .subscribe({
        next: (response) => {
          this.syncResult = response;
        },
        error: (error: unknown) => {
          this.syncResult = null;
          this.syncError = mapBiPrototypeError(error);
        }
      });
  }

  protected loadEnergyTrend(): void {
    const validationError = this.validateRange(this.energyTrendForm.controls.from.value, this.energyTrendForm.controls.to.value);
    if (validationError || this.energyLoading) {
      this.energyError = validationError ?? '';
      return;
    }

    this.energyLoading = true;
    this.energyError = '';

    this.biPrototypeService
      .getEnergyTrend({
        from: this.energyTrendForm.controls.from.value,
        to: this.energyTrendForm.controls.to.value,
        site_key: this.energyTrendForm.controls.site_key.value.trim() || undefined
      })
      .pipe(finalize(() => (this.energyLoading = false)))
      .subscribe({
        next: (response) => {
          this.energyResult = response;
          this.energyChart = this.buildChart(response.points);
        },
        error: (error: unknown) => {
          this.energyResult = null;
          this.energyChart = { path: '', hasData: false };
          this.energyError = mapBiPrototypeError(error);
        }
      });
  }

  protected loadPriceTrend(): void {
    const validationError = this.validateRange(this.priceTrendForm.controls.from.value, this.priceTrendForm.controls.to.value);
    if (validationError || this.priceLoading) {
      this.priceError = validationError ?? '';
      return;
    }

    this.priceLoading = true;
    this.priceError = '';

    this.biPrototypeService
      .getPriceTrend({
        from: this.priceTrendForm.controls.from.value,
        to: this.priceTrendForm.controls.to.value,
        market_product_key: this.priceTrendForm.controls.market_product_key.value.trim() || undefined,
        bidding_zone_id: this.priceTrendForm.controls.bidding_zone_id.value.trim() || undefined
      })
      .pipe(finalize(() => (this.priceLoading = false)))
      .subscribe({
        next: (response) => {
          this.priceResult = response;
          this.priceChart = this.buildChart(response.points);
        },
        error: (error: unknown) => {
          this.priceResult = null;
          this.priceChart = { path: '', hasData: false };
          this.priceError = mapBiPrototypeError(error);
        }
      });
  }

  private validateRange(from: string, to: string): string | null {
    if (!from || !to) {
      return 'Bitte from und to ausfüllen.';
    }

    if (!this.hasTimezoneInfo(from) || !this.hasTimezoneInfo(to)) {
      return 'from/to müssen als ISO-Datetime mit Zeitzone angegeben werden (z.B. 2026-04-20T10:00:00+02:00).';
    }

    const fromTs = Date.parse(from);
    const toTs = Date.parse(to);

    if (!Number.isFinite(fromTs) || !Number.isFinite(toTs)) {
      return 'from/to sind nicht als gültige ISO-Datetime parsebar.';
    }

    if (fromTs >= toTs) {
      return 'from muss zeitlich vor to liegen.';
    }

    return null;
  }

  private hasTimezoneInfo(value: string): boolean {
    return /([zZ]|[+\-]\d{2}:\d{2})$/.test(value.trim());
  }

  private buildChart(points: BiPrototypeTrendPoint[]): TrendChartViewModel {
    if (!points.length) {
      return { path: '', hasData: false };
    }

    const sanitizedPoints = points
      .map((point) => ({ ...point, parsedTs: Date.parse(point.ts) }))
      .filter(
        (point): point is BiPrototypeTrendPoint & { parsedTs: number } =>
          Number.isFinite(point.parsedTs) && Number.isFinite(point.value)
      );

    if (!sanitizedPoints.length) {
      return { path: '', hasData: false };
    }

    const chartWidth = 760;
    const chartHeight = 240;
    const minTs = Math.min(...sanitizedPoints.map((point) => point.parsedTs));
    const maxTs = Math.max(...sanitizedPoints.map((point) => point.parsedTs));
    const tsRange = Math.max(maxTs - minTs, 1);

    const minValue = Math.min(...sanitizedPoints.map((point) => point.value));
    const maxValue = Math.max(...sanitizedPoints.map((point) => point.value));
    const valueRange = Math.max(maxValue - minValue, 1);

    const path = sanitizedPoints
      .map((point, index) => {
        const x = ((point.parsedTs - minTs) / tsRange) * chartWidth;
        const y = chartHeight - ((point.value - minValue) / valueRange) * chartHeight;
        return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(' ');

    return { path, hasData: true };
  }
}
