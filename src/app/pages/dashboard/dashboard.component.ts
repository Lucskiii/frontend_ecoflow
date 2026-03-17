import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService, CustomerProfile } from '../../auth/auth.service';
import { DailyConsumptionItem, EnergyPeriod, EnergySummary } from '../../energy/energy.models';
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

  private readonly seriesConfig: Record<string, { label: string; color: string }> = {
    load: { label: 'Verbrauch', color: '#1f77b4' },
    pv_generation: { label: 'PV-Erzeugung', color: '#2ca02c' },
    grid_import: { label: 'Netzbezug', color: '#ff7f0e' },
    grid_export: { label: 'Einspeisung', color: '#9467bd' }
  };

  ngOnInit(): void {
    this.authService.getCurrentCustomer().subscribe((customer) => {
      this.customer = customer;
      this.loadEnergyData();
    });
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
    const customerId = this.customer?.id;

    if (!customerId) {
      this.timeseriesLoading = false;
      this.timeseriesError = 'Kein Kunde ausgewählt.';
      this.chartLines = [];
      this.hasTimeseriesData = false;
      return;
    }

    this.timeseriesLoading = true;
    this.timeseriesError = '';

    const range = this.energyService.getPeriodRange(this.selectedPeriod);

    this.chartFrom = range.from;
    this.chartTo = range.to;
    this.chartLines = [];
    this.hasTimeseriesData = false;

    this.energyService
      .getCustomerDailyConsumption(customerId, {
        start_date: this.toDateParam(range.from),
        end_date: this.toDateParam(range.to)
      })
      .pipe(finalize(() => (this.timeseriesLoading = false)))
      .subscribe({
        next: (items) => {
          this.chartLines = this.createChartLines(items);
          this.hasTimeseriesData = this.chartLines.some((line) => line.hasData);

          if (items.length) {
            this.chartFrom = new Date(`${items[0].consumption_date}T00:00:00Z`).toISOString();
            this.chartTo = new Date(`${items[items.length - 1].consumption_date}T00:00:00Z`).toISOString();
          }
        },
        error: () => {
          this.chartLines = [];
          this.hasTimeseriesData = false;
          this.timeseriesError = 'Die Zeitreihe konnte nicht geladen werden.';
        }
      });
  }

  private createChartLines(items: DailyConsumptionItem[]): ChartLine[] {
    const chartWidth = 760;
    const chartHeight = 280;
    const points = items
      .map((item) => ({ ts: `${item.consumption_date}T00:00:00Z`, value: item.consumption_kwh }))
      .sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());

    const fromTs = points.length ? new Date(points[0].ts).getTime() : Date.now();
    const toTs = points.length ? new Date(points[points.length - 1].ts).getTime() : fromTs;
    const timespan = Math.max(toTs - fromTs, 1);
    const maxValue = Math.max(...points.map((point) => point.value), 0.1);

    return Object.keys(this.seriesConfig).map((key) => {
      const hasData = key === 'load' && points.length > 0;
      const path = hasData ? this.createPath(points, fromTs, timespan, maxValue, chartWidth, chartHeight) : '';

      return {
        key,
        label: this.seriesConfig[key].label,
        color: this.seriesConfig[key].color,
        path,
        hasData
      };
    });
  }

  private createPath(
    points: Array<{ ts: string; value: number }>,
    fromTs: number,
    timespan: number,
    maxValue: number,
    chartWidth: number,
    chartHeight: number
  ): string {
    if (!points.length) {
      return '';
    }

    return points
      .map((point, index) => {
        const x = ((new Date(point.ts).getTime() - fromTs) / timespan) * chartWidth;
        const y = chartHeight - (point.value / maxValue) * chartHeight;

        return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(' ');
  }

  private toDateParam(dateValue: string): string {
    return dateValue.slice(0, 10);
  }
}
