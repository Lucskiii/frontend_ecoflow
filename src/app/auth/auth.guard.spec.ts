import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from './auth.service';

describe('authGuard', () => {
  it('returns true when user is logged in', () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: { isLoggedIn: () => true }
        },
        {
          provide: Router,
          useValue: { createUrlTree: jasmine.createSpy('createUrlTree') }
        }
      ]
    });

    const result = TestBed.runInInjectionContext(() => authGuard(null as never, null as never));

    expect(result).toBeTrue();
  });

  it('redirects to /login when user is not logged in', () => {
    const urlTree = {} as ReturnType<Router['createUrlTree']>;
    const createUrlTree = jasmine.createSpy('createUrlTree').and.returnValue(urlTree);

    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: { isLoggedIn: () => false }
        },
        {
          provide: Router,
          useValue: { createUrlTree }
        }
      ]
    });

    const result = TestBed.runInInjectionContext(() => authGuard(null as never, null as never));

    expect(createUrlTree).toHaveBeenCalledWith(['/login']);
    expect(result).toBe(urlTree);
  });
});
