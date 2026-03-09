import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { EnergyService } from '../../energy/energy.service';
import {
  PortfolioExportSummary,
  PortfolioExportTimeseriesResponse,
  PortfolioPeriod,
  PortfolioSeries
} from '../../portfolio/portfolio.models';
import { PortfolioService } from '../../portfolio/portfolio.service';

interface ChartLine {
  key: string;
  label: string;
  color: string;
  path: string;
  hasData: boolean;
}

@Component({
  selector: 'app-portfolio',
  imports: [CommonModule, RouterLink],
  templateUrl: './portfolio.component.html',
  styleUrl: './portfolio.component.scss'
})
export class PortfolioComponent implements OnInit {
  private readonly portfolioService = inject(PortfolioService);
  private readonly energyService = inject(EnergyService);

  protected selectedPeriod: PortfolioPeriod = 'today';
  protected readonly periodOptions: { label: string; value: PortfolioPeriod }[] = [
    { label: 'Heute', value: 'today' },
    { label: '7 Tage', value: '7d' },
    { label: '30 Tage', value: '30d' }
  ];

  protected summary: PortfolioExportSummary | null = null;
  protected summaryLoading = true;
  protected summaryError = '';

  protected timeseriesLoading = true;
  protected timeseriesError = '';
  protected chartLines: ChartLine[] = [];
  protected hasTimeseriesData = false;
  protected chartFrom = '';
  protected chartTo = '';

  private readonly seriesConfig: Record<string, { label: string; color: string }> = {
    portfolio_grid_export: { label: 'Portfolio Grid Export', color: '#1f77b4' },
    portfolio_tradable_export: { label: 'Tradable Export', color: '#2ca02c' }
  };

  ngOnInit(): void {
    this.loadPortfolioData();
  }

  protected onPeriodChange(period: PortfolioPeriod): void {
    if (period === this.selectedPeriod) {
      return;
    }

    this.selectedPeriod = period;
    this.loadPortfolioData();
  }

  private loadPortfolioData(): void {
    this.loadSummary();
    this.loadTimeseries();
  }

  private loadSummary(): void {
    this.summaryLoading = true;
    this.summaryError = '';

    this.portfolioService
      .getExportSummary(this.selectedPeriod)
      .pipe(finalize(() => (this.summaryLoading = false)))
      .subscribe({
        next: (summary) => {
          this.summary = summary;
        },
        error: () => {
          this.summary = null;
          this.summaryError = 'Die Portfolio-Kennzahlen konnten nicht geladen werden.';
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

    this.portfolioService
      .getExportTimeseries(range.from, range.to)
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
          this.timeseriesError = 'Die Portfolio-Zeitreihe konnte nicht geladen werden.';
        }
      });
  }

  private createChartLines(response: PortfolioExportTimeseriesResponse): ChartLine[] {
    const chartWidth = 760;
    const chartHeight = 280;
    const fromTs = new Date(response.from).getTime();
    const toTs = new Date(response.to).getTime();
    const timespan = Math.max(toTs - fromTs, 1);

    const allValues = response.series.flatMap((series) => series.points.map((point) => point.value));
    const maxValue = Math.max(...allValues, 0.1);

    return Object.keys(this.seriesConfig).map((key) => {
      const series = response.series.find((entry) => entry.name === key);
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
    series: PortfolioSeries,
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
