import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { EnergyService } from '../../energy/energy.service';
import { DashboardComponent } from './dashboard.component';

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;

  const authServiceMock = {
    getCurrentCustomer: jasmine.createSpy('getCurrentCustomer').and.returnValue(
      of({ name: 'Max Mustermann', email: 'max@example.com', umsatz_eur: '12.5' })
    ),
    logout: jasmine.createSpy('logout')
  };

  const energyServiceMock = {
    getPeriodRange: jasmine.createSpy('getPeriodRange').and.returnValue({
      from: '2026-04-01T00:00:00Z',
      to: '2026-04-02T00:00:00Z'
    }),
    getTimeseries: jasmine.createSpy('getTimeseries').and.returnValue(
      of({
        interval_minutes: 15,
        from: '2026-04-01T00:00:00Z',
        to: '2026-04-02T00:00:00Z',
        series: []
      })
    )
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: EnergyService, useValue: energyServiceMock },
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
  });

  it('renders kundenliste with umsatz column and formatted value', () => {
    const element: HTMLElement = fixture.nativeElement;

    expect(element.textContent).toContain('Kundenliste');
    expect(element.textContent).toContain('Umsatz (EUR)');
    expect(element.textContent).toContain('12,50 €');
  });
});
