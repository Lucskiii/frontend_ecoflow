import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../api.config';
import { MarketPriceService } from './market-price.service';

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

  it('loads prices with from/to query params', () => {
    service.getPrices('2026-01-01T00:00:00.000Z', '2026-01-02T00:00:00.000Z').subscribe();

    const request = httpMock.expectOne((req) => req.url === `${API_BASE_URL}/api/market/prices`);
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('from')).toBe('2026-01-01T00:00:00.000Z');
    expect(request.request.params.get('to')).toBe('2026-01-02T00:00:00.000Z');

    request.flush({ points: [] });
  });
});
