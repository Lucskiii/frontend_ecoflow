import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { mapLiveMarketPriceResponse, MarketPriceService } from './market-price.service';
import { LiveMarketPriceApiResponse } from './market.models';

describe('MarketPriceService', () => {
  let service: MarketPriceService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MarketPriceService, provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(MarketPriceService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('maps live API response and falls back to converted ct/kWh values', () => {
    const payload: LiveMarketPriceApiResponse = {
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
        price_eur_mwh: 90.2
      },
      points: [
        {
          ts: '2026-03-29T12:00:00Z',
          price_eur_mwh: 85.1,
          price_ct_kwh: 8.51
        },
        {
          ts: '2026-03-29T13:00:00Z',
          price_eur_mwh: 90.2
        }
      ]
    };

    const mapped = mapLiveMarketPriceResponse(payload);

    expect(mapped.current?.price_ct_kwh).toBe(8.51);
    expect(mapped.next?.price_ct_kwh).toBe(9.02);
    expect(mapped.points[1].price_ct_kwh).toBe(9.02);
  });

  it('calls live endpoint with default lookback and lookahead params', () => {
    service.getLiveMarketPrices().subscribe((response) => {
      expect(response.product).toBe('DE day-ahead');
      expect(response.current?.price_ct_kwh).toBe(8.51);
    });

    const request = httpMock.expectOne(
      'http://localhost:8000/api/market/prices/live?lookback_hours=3&lookahead_hours=36'
    );
    expect(request.request.method).toBe('GET');

    request.flush({
      source: 'awattar',
      product: 'DE day-ahead',
      unit: 'Eur/MWh',
      fetched_at: '2026-03-29T12:00:00Z',
      current: {
        ts: '2026-03-29T12:00:00Z',
        price_eur_mwh: 85.1,
        price_ct_kwh: 8.51
      },
      next: null,
      points: []
    });
  });
});
