import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService, CustomerProfile } from '../../auth/auth.service';
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

  protected summary: EnergySummary | null = null;
  protected summaryLoading = true;
  protected summaryError = '';

  protected timeseriesLoading = true;
  protected timeseriesError = '';
  protected chartLines: ChartLine[] = [];
  protected hasTimeseriesData = false;
  protected chartFrom = '';
  protected chartTo = '';

  private readonly seriesConfig: Record<string, { label: string; color: string }> = {
    load: { label: 'Verbrauch', color: '#1f77b4' },
    pv_generation: { label: 'PV-Erzeugung', color: '#2ca02c' },
    grid_import: { label: 'Netzbezug', color: '#ff7f0e' },
    grid_export: { label: 'Einspeisung', color: '#9467bd' }
  };

  ngOnInit(): void {
    this.authService.getCurrentCustomer().subscribe((customer) => {
      this.customer = customer;
    });

    this.loadEnergyData();
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
    this.loadSummary();
    this.loadTimeseries();
  }

  private loadSummary(): void {
    this.summaryLoading = true;
    this.summaryError = '';

    this.energyService
      .getSummary(this.selectedPeriod)
      .pipe(finalize(() => (this.summaryLoading = false)))
      .subscribe({
        next: (summary) => {
          this.summary = summary;
        },
        error: () => {
          this.summary = null;
          this.summaryError = 'Die Kennzahlen konnten nicht geladen werden.';
        }
      });
  }

  private loadTimeseries(): void {
    this.timeseriesLoading = true;
    this.timeseriesError = '';

    const range = this.energyService.getPeriodRange(this.selectedPeriod);

    this.chartFrom = range.from;
    this.chartTo = range.to;
    this.chartLines = [];
    this.hasTimeseriesData = false;

    this.energyService
      .getTimeseries(range.from, range.to, this.selectedPeriod)
      .pipe(finalize(() => (this.timeseriesLoading = false)))
      .subscribe({
        next: (response) => {
          this.chartFrom = response.from;
          this.chartTo = response.to;
          this.chartLines = this.createChartLines(response);
          this.hasTimeseriesData = this.chartLines.some((line) => line.hasData);
        },
        error: () => {
          this.chartLines = [];
          this.hasTimeseriesData = false;
          this.timeseriesError = 'Die Zeitreihe konnte nicht geladen werden.';
        }
      });
  }

  private createChartLines(response: EnergyTimeseriesResponse): ChartLine[] {
    const chartWidth = 760;
    const chartHeight = 280;
    const fromTs = new Date(response.from).getTime();
    const toTs = new Date(response.to).getTime();
    const timespan = Math.max(toTs - fromTs, 1);

    const allValues = response.series.flatMap((series) => series.points.map((point) => point.value));
    const maxValue = Math.max(...allValues, 0.1);

    return Object.keys(this.seriesConfig).map((key) => {
      const series = response.series.find((entry) => entry.meter_type === key);
      const path = series ? this.createPath(series, fromTs, timespan, maxValue, chartWidth, chartHeight) : '';

      return {
        key,
        label: this.seriesConfig[key].label,
        color: this.seriesConfig[key].color,
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
        const y = chartHeight - (point.value / maxValue) * chartHeight;

        return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(' ');
  }
}
