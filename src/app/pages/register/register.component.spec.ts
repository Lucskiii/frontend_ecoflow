import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService, RegisterPayload } from '../../auth/auth.service';
import { RegisterComponent } from './register.component';

describe('RegisterComponent', () => {
  let fixture: ComponentFixture<RegisterComponent>;
  let component: RegisterComponent;

  const authServiceMock = {
    register: jasmine.createSpy('register')
  };

  const routerMock = {
    navigate: jasmine.createSpy('navigate')
  };

  beforeEach(async () => {
    authServiceMock.register.calls.reset();
    routerMock.navigate.calls.reset();

    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('validates required address fields on submit', () => {
    (component as any).submit();
    fixture.detectChanges();

    const nativeElement = fixture.nativeElement as HTMLElement;

    expect(nativeElement.textContent).toContain('Adresse ist erforderlich.');
    expect(nativeElement.textContent).toContain('Stadt ist erforderlich.');
    expect(nativeElement.textContent).toContain('Postleitzahl ist erforderlich.');
    expect(authServiceMock.register).not.toHaveBeenCalled();
  });

  it('submits the complete register payload', () => {
    authServiceMock.register.and.returnValue(of({}));

    (component as any).registerForm.setValue({
      name: 'Max Mustermann',
      email: 'max@example.com',
      password: 'secret123',
      address_line1: 'Musterstraße 1',
      city: 'Wien',
      postal_code: '1010',
      country: 'AT'
    });

    (component as any).submit();

    const expectedPayload: RegisterPayload = {
      name: 'Max Mustermann',
      email: 'max@example.com',
      password: 'secret123',
      address_line1: 'Musterstraße 1',
      city: 'Wien',
      postal_code: '1010',
      country: 'AT'
    };

    expect(authServiceMock.register).toHaveBeenCalledWith(expectedPayload);
  });

  it('shows backend validation message for 422 responses', () => {
    authServiceMock.register.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 422,
            error: {
              errors: {
                postal_code: ['Postleitzahl hat ein ungültiges Format.']
              }
            }
          })
      )
    );

    (component as any).registerForm.setValue({
      name: 'Max Mustermann',
      email: 'max@example.com',
      password: 'secret123',
      address_line1: 'Musterstraße 1',
      city: 'Wien',
      postal_code: 'INVALID',
      country: 'AT'
    });

    (component as any).submit();

    expect((component as any).errorMessage).toBe('Postleitzahl hat ein ungültiges Format.');
  });

  it('keeps success flow unchanged and redirects after successful registration', fakeAsync(() => {
    authServiceMock.register.and.returnValue(of({}));

    (component as any).registerForm.setValue({
      name: 'Max Mustermann',
      email: 'max@example.com',
      password: 'secret123',
      address_line1: 'Musterstraße 1',
      city: 'Wien',
      postal_code: '1010',
      country: 'AT'
    });

    (component as any).submit();
    tick(800);

    expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
  }));
});
