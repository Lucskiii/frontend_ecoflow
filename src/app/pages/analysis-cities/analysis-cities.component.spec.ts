import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AnalysisCityService } from '../../analysis-cities/analysis-city.service';
import { AnalysisCitiesComponent } from './analysis-cities.component';

describe('AnalysisCitiesComponent', () => {
  let fixture: ComponentFixture<AnalysisCitiesComponent>;
  let component: AnalysisCitiesComponent;

  const analysisCityServiceMock = {
    listCities: jasmine.createSpy('listCities').and.returnValue(of({ items: [] })),
    createCity: jasmine.createSpy('createCity').and.returnValue(of({ id: 1 })),
    deleteCity: jasmine.createSpy('deleteCity').and.returnValue(of(void 0))
  };

  beforeEach(async () => {
    analysisCityServiceMock.listCities.calls.reset();
    analysisCityServiceMock.createCity.calls.reset();
    analysisCityServiceMock.deleteCity.calls.reset();
    analysisCityServiceMock.listCities.and.returnValue(of({ items: [] }));
    analysisCityServiceMock.createCity.and.returnValue(of({ id: 1 }));

    await TestBed.configureTestingModule({
      imports: [AnalysisCitiesComponent],
      providers: [{ provide: AnalysisCityService, useValue: analysisCityServiceMock }]
    }).compileComponents();

    fixture = TestBed.createComponent(AnalysisCitiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads city list on init', () => {
    expect(analysisCityServiceMock.listCities).toHaveBeenCalled();
  });

  it('submits and reloads list on success', () => {
    (component as any).form.setValue({ city_name: 'Berlin', country_code: 'DE' });

    (component as any).submit();

    expect(analysisCityServiceMock.createCity).toHaveBeenCalledWith({ city_name: 'Berlin', country_code: 'DE' });
    expect(analysisCityServiceMock.listCities).toHaveBeenCalledTimes(2);
    expect((component as any).successMessage).toBe('Stadt erfolgreich hinzugefügt.');
  });

  it('shows mapped 404 detail when submit fails', () => {
    analysisCityServiceMock.createCity.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 404,
            error: { detail: 'Die eingegebene Stadt wurde im Open-Meteo-Geocoding nicht gefunden.' }
          })
      )
    );
    (component as any).form.setValue({ city_name: 'InvalidCity', country_code: '' });

    (component as any).submit();

    expect((component as any).errorMessage).toBe(
      'Die eingegebene Stadt wurde im Open-Meteo-Geocoding nicht gefunden.'
    );
  });

  it('maps 409 response to duplicate-city message', () => {
    analysisCityServiceMock.createCity.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 409, error: { detail: 'Analysis city already exists.' } }))
    );
    (component as any).form.setValue({ city_name: 'Berlin', country_code: 'DE' });

    (component as any).submit();

    expect((component as any).errorMessage).toBe('Stadt existiert bereits');
  });
});
