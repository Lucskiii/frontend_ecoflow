import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Subject, switchMap, takeUntil, timer } from 'rxjs';
import { LiveMarketPriceResponse } from './market.models';
import { MarketPriceService } from './market-price.service';

@Component({
  selector: 'app-live-market-price',
  imports: [CommonModule],
  providers: [DatePipe, DecimalPipe],
  templateUrl: './live-market-price.component.html',
  styleUrl: './live-market-price.component.scss'
})
export class LiveMarketPriceComponent implements OnInit, OnDestroy {
  private readonly marketPriceService = inject(MarketPriceService);
  private readonly datePipe = inject(DatePipe);
  private readonly decimalPipe = inject(DecimalPipe);
  private readonly destroy$ = new Subject<void>();

  protected loading = true;
  protected errorMessage = '';
  protected liveData: LiveMarketPriceResponse | null = null;

  ngOnInit(): void {
    timer(0, 60_000)
      .pipe(
        switchMap(() => {
          this.loading = true;
          this.errorMessage = '';

          return this.marketPriceService.getLiveMarketPrices();
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response) => {
          this.liveData = response;
          this.loading = false;
        },
        error: (error: HttpErrorResponse) => {
          this.liveData = null;
          this.loading = false;
          this.errorMessage =
            error.status === 502
              ? 'Live-Daten momentan nicht verfügbar.'
              : 'Live-Strompreise konnten nicht geladen werden.';
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected formatPrice(value: number | undefined): string {
    if (value === undefined) {
      return '—';
    }

    return this.decimalPipe.transform(value, '1.2-3') ?? '—';
  }

  protected formatLocalTime(timestamp: string | undefined): string {
    if (!timestamp) {
      return '—';
    }

    return this.datePipe.transform(timestamp, 'shortTime') ?? '—';
  }

  protected formatLocalDateTime(timestamp: string | undefined): string {
    if (!timestamp) {
      return '—';
    }

    return this.datePipe.transform(timestamp, 'short') ?? '—';
  }
}
