import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { ProfileComponent } from './profile.component';

describe('ProfileComponent', () => {
  let fixture: ComponentFixture<ProfileComponent>;

  const authServiceMock = {
    getCurrentCustomer: jasmine.createSpy('getCurrentCustomer').and.returnValue(
      of({ name: 'Max Mustermann', email: 'max@example.com', umsatz_eur: '1' })
    ),
    updateProfile: jasmine.createSpy('updateProfile').and.returnValue(of({}))
  };

  beforeEach(async () => {
    authServiceMock.getCurrentCustomer.calls.reset();

    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [{ provide: AuthService, useValue: authServiceMock }]
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    fixture.detectChanges();
  });

  it('renders formatted umsatz in profile detail', () => {
    const element: HTMLElement = fixture.nativeElement;

    expect(element.textContent).toContain('Umsatz');
    expect((element.querySelector('#umsatz') as HTMLInputElement).value).toBe('1,00 €');
  });
});
