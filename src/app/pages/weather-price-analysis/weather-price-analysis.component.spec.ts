import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AnalysisCityService } from '../../analysis-cities/analysis-city.service';
import { WeatherPriceAnalysisService } from '../../weather-price-analysis/weather-price-analysis.service';
import { WeatherPriceAnalysisComponent } from './weather-price-analysis.component';

describe('WeatherPriceAnalysisComponent', () => {
  let fixture: ComponentFixture<WeatherPriceAnalysisComponent>;
  let component: WeatherPriceAnalysisComponent;

  const analysisCityServiceMock = {
    listCities: jasmine.createSpy('listCities').and.returnValue(
      of({
        items: [
          {
            id: 1,
            city_name: 'Berlin',
            country_code: 'DE',
            country_name: 'Germany',
            latitude: 52.52,
            longitude: 13.405,
            open_meteo_location_id: 123,
            admin1: 'Berlin',
            timezone: 'Europe/Berlin',
            created_at: '2026-03-01T00:00:00Z'
          }
        ]
      })
    )
  };

  const weatherPriceServiceMock = {
    runAnalysis: jasmine.createSpy('runAnalysis').and.returnValue(
      of({
        analysis_run_id: 'run-1',
        run_name: 'Q2 Städte-Mix',
        normalized_weights: { '1': 1 },
        rows_inserted_weather: 10,
        rows_inserted_aggregate: 10,
        rows_inserted_analysis: 10,
        data: []
      })
    ),
    getAnalysis: jasmine.createSpy('getAnalysis').and.returnValue(
      of({
        analysis_run_id: 'run-1',
        run_name: 'Gespeicherter Lauf',
        normalized_weights: { '1': 1 },
        rows_inserted_weather: 5,
        rows_inserted_aggregate: 5,
        rows_inserted_analysis: 5,
        data: []
      })
    ),
    getAnalysisStatus: jasmine.createSpy('getAnalysisStatus').and.returnValue(
      of({ analysis_run_id: 'run-1', run_name: 'Gespeicherter Lauf', status: 'done' })
    ),
    renameAnalysisRun: jasmine.createSpy('renameAnalysisRun').and.returnValue(
      of({ analysis_run_id: 'run-1', run_name: 'Neuer Name', status: 'renamed' })
    ),
    computeStatistics: jasmine.createSpy('computeStatistics').and.returnValue(
      of({
        meta: { observations: 2 },
        descriptive_statistics: {
          price_eur_mwh: { mean: 77, median: 77.5, std: 2.5, min: 75, max: 80 }
        },
        correlations: { temp_vs_price: -0.45 },
        correlation_matrix: { price_eur_mwh: { temp_c_weighted: -0.45 } },
        bucket_analysis: { temperature: [{ bucket: '0-5', count: 2, avg_price: 77 }] },
        scatter_data: { temp_vs_price: [{ ts_utc: '2026-03-01T00:00:00Z', x: 5, y: 80 }] },
        lag_analysis: { temp: [{ lag: 0, value: -0.45 }, { lag: 1, value: -0.4 }] },
        interpretation_hints: ['Leichte negative Korrelation']
      })
    )
  };

  beforeEach(async () => {
    Object.values(weatherPriceServiceMock).forEach((spy) => (spy as jasmine.Spy).calls.reset());
    analysisCityServiceMock.listCities.calls.reset();

    await TestBed.configureTestingModule({
      imports: [WeatherPriceAnalysisComponent],
      providers: [
        { provide: AnalysisCityService, useValue: analysisCityServiceMock },
        { provide: WeatherPriceAnalysisService, useValue: weatherPriceServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(WeatherPriceAnalysisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads available analysis cities on init', () => {
    expect(analysisCityServiceMock.listCities).toHaveBeenCalled();
  });

  it('submits weather-price analysis payload', () => {
    (component as any).form.controls.cities.at(0).patchValue({ analysis_city_id: 1, weight: 3 });
    (component as any).form.patchValue({
      run_name: 'Q2 Städte-Mix',
      bidding_zone_id: 10,
      start_date: '2026-03-01',
      end_date: '2026-03-03',
      product_id: 'PHELIX',
      price_type: 'spot'
    });

    (component as any).submit();

    expect(weatherPriceServiceMock.runAnalysis).toHaveBeenCalled();
    expect((component as any).successMessage).toContain('erfolgreich');
  });

  it('computes statistics successfully and renders insights', () => {
    (component as any).form.controls.cities.at(0).patchValue({ analysis_city_id: 1, weight: 1 });
    (component as any).form.patchValue({
      bidding_zone_id: 10,
      start_date: '2026-03-01',
      end_date: '2026-03-03',
      price_type: 'spot'
    });

    (component as any).computeStatistics();
    fixture.detectChanges();

    expect(weatherPriceServiceMock.computeStatistics).toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Leichte negative Korrelation');
  });

  it('shows empty-state message for empty statistics response', () => {
    weatherPriceServiceMock.computeStatistics.and.returnValue(
      of({
        meta: {},
        descriptive_statistics: {},
        correlations: {},
        correlation_matrix: {},
        bucket_analysis: {},
        scatter_data: {},
        lag_analysis: {},
        interpretation_hints: []
      })
    );

    (component as any).form.controls.cities.at(0).patchValue({ analysis_city_id: 1, weight: 1 });
    (component as any).form.patchValue({
      bidding_zone_id: 10,
      start_date: '2026-03-01',
      end_date: '2026-03-03',
      price_type: 'spot'
    });

    (component as any).computeStatistics();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('keine auswertbaren Daten');
  });

  it('shows statistics error state', () => {
    weatherPriceServiceMock.computeStatistics.and.returnValue(throwError(() => new HttpErrorResponse({ status: 422 })));

    (component as any).form.controls.cities.at(0).patchValue({ analysis_city_id: 1, weight: 1 });
    (component as any).form.patchValue({
      bidding_zone_id: 10,
      start_date: '2026-03-01',
      end_date: '2026-03-03',
      price_type: 'spot'
    });

    (component as any).computeStatistics();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Zu wenig Daten');
  });
});
