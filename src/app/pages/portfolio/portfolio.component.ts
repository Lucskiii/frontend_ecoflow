import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { EnergyService } from '../../energy/energy.service';
import { MarketPricePoint, MarketPriceResponse } from '../../market/market.models';
import { MarketPriceService } from '../../market/market-price.service';
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
  private readonly marketPriceService = inject(MarketPriceService);

  protected selectedPeriod: PortfolioPeriod = 'today';
  protected readonly periodOptions: { label: string; value: PortfolioPeriod }[] = [
    { label: 'Heute', value: 'today' },
    { label: '7 Tage', value: '7d' },
    { label: '30 Tage', value: '30d' },
    { label: 'All-Time', value: 'all' }
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

  protected priceLoading = true;
  protected priceError = '';
  protected pricePath = '';
  protected hasPriceData = false;
  protected priceFrom = '';
  protected priceTo = '';
  protected priceSource = '';
  protected priceProduct = '';
  protected priceUnit = '';
  protected currentPrice: number | null = null;
  protected minPrice: number | null = null;
  protected maxPrice: number | null = null;
  protected avgPrice: number | null = null;

  private latestPriceRequestId = 0;

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
    this.loadPrices();
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

  private loadPrices(): void {
    const requestId = ++this.latestPriceRequestId;
    this.priceLoading = true;
    this.priceError = '';

    const range = this.energyService.getPeriodRange(this.selectedPeriod);
    this.priceFrom = range.from;
    this.priceTo = range.to;
    this.hasPriceData = false;
    this.pricePath = '';

    this.marketPriceService
      .getPrices(range.from, range.to)
      .pipe(
        finalize(() => {
          if (requestId === this.latestPriceRequestId) {
            this.priceLoading = false;
          }
        })
      )
      .subscribe({
        next: (response) => {
          if (requestId !== this.latestPriceRequestId) {
            return;
          }

          this.priceSource = response.source;
          this.priceProduct = response.product;
          this.priceUnit = response.unit;
          this.priceFrom = response.from;
          this.priceTo = response.to;

          const points = [...response.points].sort(
            (a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime()
          );

          this.hasPriceData = points.length > 0;
          this.pricePath = this.createPricePath(response, points);
          this.setPriceStats(points);
        },
        error: () => {
          if (requestId !== this.latestPriceRequestId) {
            return;
          }

          this.priceError = 'Die Strompreise konnten nicht geladen werden.';
          this.hasPriceData = false;
          this.pricePath = '';
          this.currentPrice = null;
          this.minPrice = null;
          this.maxPrice = null;
          this.avgPrice = null;
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

  private createPricePath(response: MarketPriceResponse, points: MarketPricePoint[]): string {
    if (!points.length) {
      return '';
    }

    const chartWidth = 760;
    const chartHeight = 220;
    const fromTs = new Date(response.from).getTime();
    const toTs = new Date(response.to).getTime();
    const timespan = Math.max(toTs - fromTs, 1);

    const values = points.map((point) => point.price_eur_mwh);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const valueRange = Math.max(maxValue - minValue, 1);

    return points
      .map((point, index) => {
        const x = ((new Date(point.ts).getTime() - fromTs) / timespan) * chartWidth;
        const y = chartHeight - ((point.price_eur_mwh - minValue) / valueRange) * chartHeight;

        return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(' ');
  }

  private setPriceStats(points: MarketPricePoint[]): void {
    if (!points.length) {
      this.currentPrice = null;
      this.minPrice = null;
      this.maxPrice = null;
      this.avgPrice = null;
      return;
    }

    const values = points.map((point) => point.price_eur_mwh);
    this.currentPrice = values[values.length - 1] ?? null;
    this.minPrice = Math.min(...values);
    this.maxPrice = Math.max(...values);
    this.avgPrice = values.reduce((sum, value) => sum + value, 0) / values.length;
  }
}
