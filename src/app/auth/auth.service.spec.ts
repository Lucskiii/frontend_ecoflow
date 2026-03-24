import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { EnergyService } from '../energy/energy.service';
import { AuthService, RegisterPayload } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: EnergyService,
          useValue: {
            simulate: () => of(null)
          }
        }
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('sends the complete register payload to /api/auth/register', () => {
    const payload: RegisterPayload = {
      name: 'Max Mustermann',
      email: 'max@example.com',
      password: 'secret123',
      address_line1: 'Musterstraße 1',
      city: 'Wien',
      postal_code: '1010',
      country: 'AT'
    };

    service.register(payload).subscribe();

    const request = httpMock.expectOne('http://localhost:8000/api/auth/register');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);

    request.flush({ success: true });
  });
});
