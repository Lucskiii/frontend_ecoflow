import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../api.config';
import { EnergyService } from './energy.service';

describe('EnergyService', () => {
  let service: EnergyService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EnergyService, provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(EnergyService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('calls simulate endpoint with empty payload', () => {
    service.simulate().subscribe();

    const request = httpMock.expectOne(`${API_BASE_URL}/api/customers/me/energy/simulate`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({});

    request.flush({});
  });

  it('loads summary without period param when omitted', () => {
    service.getSummary().subscribe();

    const request = httpMock.expectOne((req) => req.url === `${API_BASE_URL}/api/customers/me/energy/summary`);
    expect(request.request.method).toBe('GET');
    expect(request.request.params.has('period')).toBeFalse();

    request.flush({});
  });

  it('loads summary with period param when provided', () => {
    service.getSummary('7d').subscribe();

    const request = httpMock.expectOne((req) => req.url === `${API_BASE_URL}/api/customers/me/energy/summary`);
    expect(request.request.params.get('period')).toBe('7d');

    request.flush({});
  });

  it('loads timeseries with default interval only when no optional params are given', () => {
    service.getTimeseries().subscribe();

    const request = httpMock.expectOne((req) => req.url === `${API_BASE_URL}/api/customers/me/energy/timeseries`);
    expect(request.request.params.get('interval')).toBe('15m');
    expect(request.request.params.has('from')).toBeFalse();
    expect(request.request.params.has('to')).toBeFalse();

    request.flush({ points: [] });
  });

  it('loads timeseries with interval and optional from/to params', () => {
    service.getTimeseries({ from: 'a', to: 'b' }).subscribe();

    const request = httpMock.expectOne((req) => req.url === `${API_BASE_URL}/api/customers/me/energy/timeseries`);
    expect(request.request.params.get('interval')).toBe('15m');
    expect(request.request.params.get('from')).toBe('a');
    expect(request.request.params.get('to')).toBe('b');

    request.flush({ points: [] });
  });

  it('returns expected period range for today', () => {
    const now = new Date('2026-05-02T10:20:30.000Z');
    const expectedLocalMidnight = new Date(now);
    expectedLocalMidnight.setHours(0, 0, 0, 0);

    const result = service.getPeriodRange('today', now);

    expect(result.from).toBe(expectedLocalMidnight.toISOString());
    expect(result.to).toBe('2026-05-02T10:20:30.000Z');
  });

  it('returns expected period range for 7d', () => {
    const now = new Date('2026-05-02T10:20:30.000Z');

    const result = service.getPeriodRange('7d', now);

    expect(result.from).toBe('2026-04-25T10:20:30.000Z');
    expect(result.to).toBe('2026-05-02T10:20:30.000Z');
  });

  it('returns expected period range for 30d', () => {
    const now = new Date('2026-05-02T10:20:30.000Z');

    const result = service.getPeriodRange('30d', now);

    expect(result.from).toBe('2026-04-02T10:20:30.000Z');
    expect(result.to).toBe('2026-05-02T10:20:30.000Z');
  });

  it('falls back to epoch start for unsupported periods', () => {
    const now = new Date('2026-05-02T10:20:30.000Z');

    const result = service.getPeriodRange('all', now);

    expect(result.from).toBe('1970-01-01T00:00:00.000Z');
    expect(result.to).toBe('2026-05-02T10:20:30.000Z');
  });
});
