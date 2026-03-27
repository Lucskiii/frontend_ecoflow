import { HttpErrorResponse } from '@angular/common/http';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { WeatherPriceAnalysisService, mapWeatherPriceAnalysisError } from './weather-price-analysis.service';

describe('WeatherPriceAnalysisService', () => {
  let service: WeatherPriceAnalysisService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [WeatherPriceAnalysisService, provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(WeatherPriceAnalysisService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('sends POST /api/analysis/weather-price', () => {
    service
      .runAnalysis({
        bidding_zone_id: 10,
        start_date: '2025-01-01',
        end_date: '2025-01-02',
        price_type: 'spot',
        cities: [{ analysis_city_id: 1, weight: 0.7 }]
      })
      .subscribe();

    const request = httpMock.expectOne('http://localhost:8000/api/analysis/weather-price');
    expect(request.request.method).toBe('POST');
    expect(request.request.body.bidding_zone_id).toBe(10);
    request.flush({ analysis_run_id: 'abc', normalized_weights: {}, data: [] });
  });

  it('sends GET /api/analysis/weather-price/{id}', () => {
    service.getAnalysis('run-1').subscribe();

    const request = httpMock.expectOne('http://localhost:8000/api/analysis/weather-price/run-1');
    expect(request.request.method).toBe('GET');
    request.flush({ analysis_run_id: 'run-1', normalized_weights: {}, data: [] });
  });

  it('sends GET /api/analysis/weather-price/{id}/status', () => {
    service.getAnalysisStatus('run-2').subscribe();

    const request = httpMock.expectOne('http://localhost:8000/api/analysis/weather-price/run-2/status');
    expect(request.request.method).toBe('GET');
    request.flush({ analysis_run_id: 'run-2', status: 'done' });
  });

  it('sends PATCH /api/analysis/weather-price/{id}/name', () => {
    service.renameAnalysisRun('run-2', { run_name: 'Mein Lauf' }).subscribe();

    const request = httpMock.expectOne('http://localhost:8000/api/analysis/weather-price/run-2/name');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ run_name: 'Mein Lauf' });
    request.flush({ analysis_run_id: 'run-2', run_name: 'Mein Lauf', status: 'renamed' });
  });
});

describe('mapWeatherPriceAnalysisError', () => {
  it('maps 404 to friendly message', () => {
    const mapped = mapWeatherPriceAnalysisError(new HttpErrorResponse({ status: 404 }));
    expect(mapped).toBe('Die angeforderte Analyse oder Stadt wurde nicht gefunden.');
  });

  it('maps 404 bidding zone errors to friendly message', () => {
    const mapped = mapWeatherPriceAnalysisError(
      new HttpErrorResponse({ status: 404, error: { detail: 'bidding_zone not found' } })
    );
    expect(mapped).toBe('Die gewählte Bidding Zone existiert nicht. Bitte Auswahl prüfen.');
  });

  it('maps 422 to validation message', () => {
    const mapped = mapWeatherPriceAnalysisError(new HttpErrorResponse({ status: 422 }));
    expect(mapped).toBe('Bitte eine gültige Bidding Zone auswählen.');
  });

  it('keeps detailed 422 messages for non-bidding-zone errors', () => {
    const mapped = mapWeatherPriceAnalysisError(new HttpErrorResponse({ status: 422, error: { detail: 'invalid weights' } }));
    expect(mapped).toBe('invalid weights');
  });

  it('maps 503 to upstream message', () => {
    const mapped = mapWeatherPriceAnalysisError(new HttpErrorResponse({ status: 503 }));
    expect(mapped).toBe('Weather-Daten sind aktuell nicht verfügbar (Upstream-Service nicht erreichbar).');
  });
});
