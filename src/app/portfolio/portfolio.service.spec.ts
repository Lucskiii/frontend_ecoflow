import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../api.config';
import { PortfolioService } from './portfolio.service';

describe('PortfolioService', () => {
  let service: PortfolioService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PortfolioService, provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(PortfolioService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads export summary with period query param', () => {
    service.getExportSummary('7d').subscribe();

    const request = httpMock.expectOne((req) => req.url === `${API_BASE_URL}/api/portfolio/export/summary`);
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('period')).toBe('7d');

    request.flush({});
  });

  it('loads export timeseries with from/to query params', () => {
    service.getExportTimeseries('from-value', 'to-value').subscribe();

    const request = httpMock.expectOne((req) => req.url === `${API_BASE_URL}/api/portfolio/export/timeseries`);
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('from')).toBe('from-value');
    expect(request.request.params.get('to')).toBe('to-value');

    request.flush({ points: [] });
  });
});
