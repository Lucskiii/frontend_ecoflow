import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService, CustomerProfile } from '../../auth/auth.service';
import { formatUmsatzEur } from '../../customers/customer-umsatz.utils';
import { EnergyPeriod, EnergySeries, EnergySummary, EnergyTimeseriesResponse } from '../../energy/energy.models';
import { EnergyService } from '../../energy/energy.service';

interface ChartLine {
  key: string;
  label: string;
  color: string;
  path: string;
  hasData: boolean;
}

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly energyService = inject(EnergyService);
  private readonly router = inject(Router);

  protected customer: CustomerProfile | null = null;
  protected selectedPeriod: EnergyPeriod = 'today';
  protected readonly periodOptions: { label: string; value: EnergyPeriod }[] = [
    { label: 'Heute', value: 'today' },
    { label: 'Letzte 7 Tage', value: '7d' },
    { label: 'Letzte 30 Tage', value: '30d' }
  ];

  protected summaryLoading = true;
  protected summaryError = '';

  protected timeseriesLoading = true;
  protected timeseriesError = '';
  protected chartLines: ChartLine[] = [];
  protected hasTimeseriesData = false;
  protected chartFrom = '';
  protected chartTo = '';

  protected summary: EnergySummary | null = null;
  protected customerListLoading = true;
  protected customerListError = '';

  private readonly seriesConfig: Record<string, { label: string; color: string }> = {
    load: { label: 'Verbrauch', color: '#1f77b4' },
    pv_generation: { label: 'PV-Erzeugung', color: '#2ca02c' },
    grid_import: { label: 'Netzbezug', color: '#ff7f0e' },
    grid_export: { label: 'Einspeisung', color: '#9467bd' }
  };

  ngOnInit(): void {
    this.authService.getCurrentCustomer().subscribe((customer) => {
      this.customer = customer;
      this.customerListLoading = false;
      this.customerListError = '';
      this.loadEnergyData();
    }, () => {
      this.customer = null;
      this.customerListLoading = false;
      this.customerListError = 'Kundenliste konnte nicht geladen werden.';
    });
  }

  protected formatUmsatz(value: string | number | null | undefined): string {
    return formatUmsatzEur(value);
  }

  protected onPeriodChange(period: EnergyPeriod): void {
    if (period === this.selectedPeriod) {
      return;
    }

    this.selectedPeriod = period;
    this.loadEnergyData();
  }

  protected logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private loadEnergyData(): void {
    this.loadTimeseries();
  }

  private loadTimeseries(): void {
    this.summaryLoading = true;
    this.summaryError = '';
    this.timeseriesLoading = true;
    this.timeseriesError = '';
    this.chartLines = [];
    this.hasTimeseriesData = false;
    this.summary = null;

    const queryParams = this.energyService.getPeriodRange(this.selectedPeriod);
    this.chartFrom = queryParams.from;
    this.chartTo = queryParams.to;

    this.energyService
      .getTimeseries(queryParams)
      .pipe(
        finalize(() => {
          this.summaryLoading = false;
          this.timeseriesLoading = false;
        })
      )
      .subscribe({
        next: (response) => {
          this.chartFrom = response.from;
          this.chartTo = response.to;
          this.chartLines = this.createChartLines(response);
          this.hasTimeseriesData = this.chartLines.some((line) => line.hasData);
          this.summary = this.createSummary(response);
        },
        error: () => {
          this.summary = null;
          this.summaryError = 'Die Kennzahlen konnten nicht geladen werden.';
          this.chartLines = [];
          this.hasTimeseriesData = false;
          this.timeseriesError = 'Die Zeitreihe konnte nicht geladen werden.';
        }
      });
  }

  private createSummary(response: EnergyTimeseriesResponse): EnergySummary {
    const totals = response.series.reduce<Record<string, number>>((acc, series) => {
      acc[series.meter_type] = series.points.reduce((sum, point) => sum + this.toNumericValue(point.value), 0);
      return acc;
    }, {});

    const pvGeneration = totals['pv_generation'] ?? 0;
    const selfConsumption = Math.max(pvGeneration - (totals['grid_export'] ?? 0), 0);

    return {
      period: this.selectedPeriod,
      load_kwh: totals['load'] ?? 0,
      grid_import_kwh: totals['grid_import'] ?? 0,
      grid_export_kwh: totals['grid_export'] ?? 0,
      pv_generation_kwh: pvGeneration,
      self_consumption_share_pct: pvGeneration > 0 ? (selfConsumption / pvGeneration) * 100 : undefined
    };
  }

  private createChartLines(response: EnergyTimeseriesResponse): ChartLine[] {
    const chartWidth = 760;
    const chartHeight = 280;
    const fromTs = new Date(response.from).getTime();
    const toTs = new Date(response.to).getTime();
    const timespan = Math.max(toTs - fromTs, 1);
    const allValues = response.series.flatMap((series) =>
      series.points.map((point) => this.toNumericValue(point.value)).filter((value) => value > 0)
    );
    const maxValue = Math.max(...allValues, 0.1);

    return Object.entries(this.seriesConfig).map(([key, config]) => {
      const series = response.series.find((entry) => entry.meter_type === key);
      const path = series ? this.createPath(series, fromTs, timespan, maxValue, chartWidth, chartHeight) : '';

      return {
        key,
        label: config.label,
        color: config.color,
        path,
        hasData: Boolean(series?.points.length)
      };
    });
  }

  private createPath(
    series: EnergySeries,
    fromTs: number,
    timespan: number,
    maxValue: number,
    chartWidth: number,
    chartHeight: number
  ): string {
    if (!series.points.length) {
      return '';
    }

    return series.points
      .map((point, index) => {
        const x = ((new Date(point.ts).getTime() - fromTs) / timespan) * chartWidth;
        const value = this.toNumericValue(point.value);
        const y = chartHeight - (value / maxValue) * chartHeight;

        return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(' ');
  }

  private toNumericValue(value: number | string): number {
    const numericValue = typeof value === 'number' ? value : Number.parseFloat(value);

    return Number.isFinite(numericValue) ? numericValue : 0;
  }
}
