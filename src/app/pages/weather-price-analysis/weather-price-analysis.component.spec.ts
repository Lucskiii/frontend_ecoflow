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
          },
          {
            id: 2,
            city_name: 'Hamburg',
            country_code: 'DE',
            country_name: 'Germany',
            latitude: 53.55,
            longitude: 10,
            open_meteo_location_id: 456,
            admin1: 'Hamburg',
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
        normalized_weights: { '1': 0.5, '2': 0.5 },
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
    )
  };

  beforeEach(async () => {
    analysisCityServiceMock.listCities.calls.reset();
    weatherPriceServiceMock.runAnalysis.calls.reset();
    weatherPriceServiceMock.getAnalysis.calls.reset();
    weatherPriceServiceMock.getAnalysisStatus.calls.reset();
    weatherPriceServiceMock.renameAnalysisRun.calls.reset();

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
    const cities = (component as any).form.controls.cities;
    cities.at(0).patchValue({ analysis_city_id: 1, weight: 3 });

    (component as any).form.patchValue({
      run_name: 'Q2 Städte-Mix',
      start_date: '2026-03-01',
      end_date: '2026-03-03',
      product_id: 'PHELIX',
      price_type: 'spot'
    });

    (component as any).submit();

    expect(weatherPriceServiceMock.runAnalysis).toHaveBeenCalledWith({
      run_name: 'Q2 Städte-Mix',
      start_date: '2026-03-01',
      end_date: '2026-03-03',
      product_id: 'PHELIX',
      price_type: 'spot',
      cities: [{ analysis_city_id: 1, weight: 3 }]
    });
    expect((component as any).successMessage).toContain('erfolgreich');
  });

  it('shows duplicate city validation error', () => {
    (component as any).addCity();
    const cities = (component as any).form.controls.cities;
    cities.at(0).patchValue({ analysis_city_id: 1, weight: 1 });
    cities.at(1).patchValue({ analysis_city_id: 1, weight: 2 });

    cities.updateValueAndValidity();

    expect(cities.errors?.['duplicateCities']).toBeTrue();
  });



  it('loads an existing analysis by run id', () => {
    (component as any).loadForm.patchValue({ analysis_run_id: 'run-1' });

    (component as any).loadExistingAnalysis();

    expect(weatherPriceServiceMock.getAnalysis).toHaveBeenCalledWith('run-1');
    expect((component as any).result?.run_name).toBe('Gespeicherter Lauf');
  });

  it('renames an analysis run', () => {
    (component as any).loadForm.patchValue({ analysis_run_id: 'run-1', rename_run_name: 'Neuer Name' });

    (component as any).renameAnalysis();

    expect(weatherPriceServiceMock.renameAnalysisRun).toHaveBeenCalledWith('run-1', { run_name: 'Neuer Name' });
  });

  it('maps API error message on submit failure', () => {
    weatherPriceServiceMock.runAnalysis.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 422, error: { detail: 'invalid weights' } }))
    );

    const cities = (component as any).form.controls.cities;
    cities.at(0).patchValue({ analysis_city_id: 1, weight: 0.1 });

    (component as any).form.patchValue({
      run_name: 'Q2 Städte-Mix',
      start_date: '2026-03-01',
      end_date: '2026-03-03',
      price_type: 'spot'
    });

    (component as any).submit();

    expect((component as any).errorMessage).toBe('invalid weights');
  });
});
