import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MarketPriceService } from './market-price.service';
import { LiveMarketPriceComponent } from './live-market-price.component';

describe('LiveMarketPriceComponent', () => {
  let fixture: ComponentFixture<LiveMarketPriceComponent>;
  let component: LiveMarketPriceComponent;

  const marketPriceServiceMock = {
    getLiveMarketPrices: jasmine.createSpy('getLiveMarketPrices')
  };

  beforeEach(async () => {
    marketPriceServiceMock.getLiveMarketPrices.calls.reset();

    await TestBed.configureTestingModule({
      imports: [LiveMarketPriceComponent],
      providers: [{ provide: MarketPriceService, useValue: marketPriceServiceMock }]
    }).compileComponents();
  });

  it('renders current and next market prices', () => {
    marketPriceServiceMock.getLiveMarketPrices.and.returnValue(
      of({
        source: 'awattar',
        product: 'DE day-ahead',
        unit: 'Eur/MWh',
        fetched_at: '2026-03-29T12:00:00Z',
        current: {
          ts: '2026-03-29T12:00:00Z',
          price_eur_mwh: 85.1,
          price_ct_kwh: 8.51
        },
        next: {
          ts: '2026-03-29T13:00:00Z',
          price_eur_mwh: 90.2,
          price_ct_kwh: 9.02
        },
        points: [
          {
            ts: '2026-03-29T12:00:00Z',
            price_eur_mwh: 85.1,
            price_ct_kwh: 8.51
          }
        ]
      })
    );

    fixture = TestBed.createComponent(LiveMarketPriceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent;
    expect(content).toContain('8.51 ct/kWh');
    expect(content).toContain('9.02 ct/kWh');
    expect(content).toContain('Zuletzt aktualisiert');
  });

  it('shows dedicated message for 502 responses', () => {
    marketPriceServiceMock.getLiveMarketPrices.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 502 }))
    );

    fixture = TestBed.createComponent(LiveMarketPriceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const errorMessage = fixture.nativeElement.querySelector('.state-message.error') as HTMLElement;
    expect(errorMessage.textContent).toContain('Live-Daten momentan nicht verfügbar.');
  });
});
