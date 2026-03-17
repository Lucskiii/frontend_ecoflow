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

  private readonly seriesConfig: Record<string, { label: string; color: string; getValue: (item: DailyConsumptionItem) => number | undefined }> = {
    load: { label: 'Verbrauch', color: '#1f77b4', getValue: (item) => item.consumption_kwh },
    pv_generation: { label: 'PV-Erzeugung', color: '#2ca02c', getValue: (item) => item.pv_generation_kwh },
    grid_import: { label: 'Netzbezug', color: '#ff7f0e', getValue: (item) => item.grid_import_kwh },
    grid_export: { label: 'Einspeisung', color: '#9467bd', getValue: (item) => item.grid_export_kwh }
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
    this.loadTimeseries();
  }

  private loadTimeseries(): void {
    const customerId = this.customer?.id;

    if (!customerId) {
      this.summaryLoading = false;
      this.summaryError = 'Kein Kunde ausgewählt.';
      this.summary = null;
      this.timeseriesLoading = false;
      this.timeseriesError = 'Kein Kunde ausgewählt.';
      this.chartLines = [];
      this.hasTimeseriesData = false;
      return;
    }

    this.summaryLoading = true;
    this.summaryError = '';
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
      .pipe(
        finalize(() => {
          this.summaryLoading = false;
          this.timeseriesLoading = false;
        })
      )
      .subscribe({
        next: (items) => {
          const sortedItems = [...items].sort(
            (a, b) => new Date(`${a.consumption_date}T00:00:00Z`).getTime() - new Date(`${b.consumption_date}T00:00:00Z`).getTime()
          );

          this.chartLines = this.createChartLines(sortedItems);
          this.hasTimeseriesData = this.chartLines.some((line) => line.hasData);
          this.summary = this.createSummary(sortedItems);

          if (sortedItems.length) {
            this.chartFrom = new Date(`${sortedItems[0].consumption_date}T00:00:00Z`).toISOString();
            this.chartTo = new Date(`${sortedItems[sortedItems.length - 1].consumption_date}T00:00:00Z`).toISOString();
          }
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

  private createSummary(items: DailyConsumptionItem[]): EnergySummary {
    const total = (values: number[]) => values.reduce((sum, value) => sum + value, 0);
    const selfConsumptionValues = items
      .map((item) => item.self_consumption_share_pct)
      .filter((value): value is number => typeof value === 'number');

    return {
      period: this.selectedPeriod,
      load_kwh: total(items.map((item) => item.consumption_kwh ?? 0)),
      grid_import_kwh: total(items.map((item) => item.grid_import_kwh ?? 0)),
      grid_export_kwh: total(items.map((item) => item.grid_export_kwh ?? 0)),
      pv_generation_kwh: total(items.map((item) => item.pv_generation_kwh ?? 0)),
      self_consumption_share_pct: selfConsumptionValues.length
        ? total(selfConsumptionValues) / selfConsumptionValues.length
        : undefined
    };
  }

  private createChartLines(items: DailyConsumptionItem[]): ChartLine[] {
    const chartWidth = 760;
    const chartHeight = 280;
    const allPoints = Object.entries(this.seriesConfig).flatMap(([key, config]) =>
      items
        .map((item) => {
          const value = config.getValue(item);
          return {
            key,
            ts: `${item.consumption_date}T00:00:00Z`,
            value: typeof value === 'number' ? value : undefined
          };
        })
        .filter((point): point is { key: string; ts: string; value: number } => typeof point.value === 'number')
    );

    const fromTs = allPoints.length ? new Date(allPoints[0].ts).getTime() : Date.now();
    const toTs = allPoints.length ? new Date(allPoints[allPoints.length - 1].ts).getTime() : fromTs;
    const timespan = Math.max(toTs - fromTs, 1);
    const maxValue = Math.max(...allPoints.map((point) => point.value), 0.1);

    return Object.keys(this.seriesConfig).map((key) => {
      const points = allPoints.filter((point) => point.key === key);
      const hasData = points.length > 0;
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
