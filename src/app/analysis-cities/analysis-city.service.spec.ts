import { HttpErrorResponse } from '@angular/common/http';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AnalysisCityService, mapAnalysisCityError } from './analysis-city.service';

describe('AnalysisCityService', () => {
  let service: AnalysisCityService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AnalysisCityService, provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(AnalysisCityService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('creates an analysis city via POST /api/analysis-cities', () => {
    service.createCity({ city_name: 'Berlin', country_code: 'DE' }).subscribe();

    const request = httpMock.expectOne('http://localhost:8000/api/analysis-cities');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ city_name: 'Berlin', country_code: 'DE' });

    request.flush({ id: 1 });
  });

  it('lists analysis cities via GET /api/analysis-cities', () => {
    service.listCities().subscribe();

    const request = httpMock.expectOne('http://localhost:8000/api/analysis-cities');
    expect(request.request.method).toBe('GET');

    request.flush({ items: [] });
  });

  it('deletes analysis city via DELETE /api/analysis-cities/{id}', () => {
    service.deleteCity(7).subscribe();

    const request = httpMock.expectOne('http://localhost:8000/api/analysis-cities/7');
    expect(request.request.method).toBe('DELETE');

    request.flush(null);
  });
});

describe('mapAnalysisCityError', () => {
  it('maps 404 to backend detail', () => {
    const mapped = mapAnalysisCityError(
      new HttpErrorResponse({ status: 404, error: { detail: 'Die eingegebene Stadt wurde nicht gefunden.' } })
    );

    expect(mapped).toBe('Die eingegebene Stadt wurde nicht gefunden.');
  });

  it('maps 409 to duplicate-city message', () => {
    const mapped = mapAnalysisCityError(new HttpErrorResponse({ status: 409, error: { detail: 'duplicate' } }));

    expect(mapped).toBe('Stadt existiert bereits');
  });

  it('maps 502/503 to geocoding unavailable message', () => {
    const mapped502 = mapAnalysisCityError(new HttpErrorResponse({ status: 502 }));
    const mapped503 = mapAnalysisCityError(new HttpErrorResponse({ status: 503 }));

    expect(mapped502).toBe('Geocoding service temporarily unavailable.');
    expect(mapped503).toBe('Geocoding service temporarily unavailable.');
  });

  it('prefers backend detail over generic fallback', () => {
    const mapped = mapAnalysisCityError(
      new HttpErrorResponse({ status: 400, error: { detail: 'Ungültige Eingabe.' } })
    );

    expect(mapped).toBe('Ungültige Eingabe.');
  });
});
