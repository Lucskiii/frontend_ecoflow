import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { ProfileComponent } from './profile.component';

describe('ProfileComponent', () => {
  let fixture: ComponentFixture<ProfileComponent>;

  const authServiceMock = {
    getCurrentCustomer: jasmine.createSpy('getCurrentCustomer').and.returnValue(
      of({ name: 'Max Mustermann', email: 'max@example.com', umsatz_eur: '1' })
    ),
    getRevenuePeriods: jasmine.createSpy('getRevenuePeriods').and.returnValue(
      of({
        customer_id: 'c-1',
        periods: [
          { period: 'all', from: '2025-01-01T00:00:00Z', to: '2026-04-20T00:00:00Z', umsatz_eur: '140', calculated_at: '2026-04-20T00:00:00Z' },
          { period: '30d', from: '2026-03-21T00:00:00Z', to: '2026-04-20T00:00:00Z', umsatz_eur: '22.5', calculated_at: '2026-04-20T00:00:00Z' },
          { period: '7d', from: '2026-04-13T00:00:00Z', to: '2026-04-20T00:00:00Z', umsatz_eur: '5', calculated_at: '2026-04-20T00:00:00Z' }
        ]
      })
    ),
    updateProfile: jasmine.createSpy('updateProfile').and.returnValue(of({}))
  };
  const routerMock = {
    navigate: jasmine.createSpy('navigate').and.resolveTo(true)
  };

  beforeEach(async () => {
    authServiceMock.getCurrentCustomer.calls.reset();
    routerMock.navigate.calls.reset();

    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    fixture.detectChanges();
  });

  it('renders formatted umsatz for all configured periods', () => {
    const element: HTMLElement = fixture.nativeElement;

    expect(element.textContent).toContain('Umsatz Gesamt');
    expect(element.textContent).toContain('Umsatz 30 Tage');
    expect(element.textContent).toContain('Umsatz 7 Tage');
    expect((element.querySelector('#umsatzAll') as HTMLInputElement).value).toBe('140,00 €');
    expect((element.querySelector('#umsatz30d') as HTMLInputElement).value).toBe('22,50 €');
    expect((element.querySelector('#umsatz7d') as HTMLInputElement).value).toBe('5,00 €');
  });

  it('resets the form and navigates to dashboard when cancel is clicked', () => {
    const element: HTMLElement = fixture.nativeElement;
    const nameInput = element.querySelector('#name') as HTMLInputElement;

    nameInput.value = 'Erika Mustermann';
    nameInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const cancelButton = element.querySelector('button[type="button"]') as HTMLButtonElement;
    cancelButton.click();

    expect(routerMock.navigate).toHaveBeenCalledWith(['/dashboard']);
    expect((element.querySelector('#name') as HTMLInputElement).value).toBe('Max Mustermann');
  });
});
