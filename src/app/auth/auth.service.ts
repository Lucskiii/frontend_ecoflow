import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, map, of, tap } from 'rxjs';

interface AuthResponse {
  token?: string;
  access_token?: string;
}

export interface CustomerProfile {
  name: string;
  email: string;
}

interface JwtPayload {
  name?: string;
  email?: string;
  [key: string]: unknown;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenStorageKey = 'auth_token';
  private readonly currentCustomerSubject = new BehaviorSubject<CustomerProfile | null>(null);

  readonly currentCustomer$ = this.currentCustomerSubject.asObservable();

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>('http://localhost:8000/api/auth/login', { email, password })
      .pipe(
        tap((response) => this.storeTokenFromResponse(response)),
        tap(() => this.loadCurrentCustomer().subscribe())
      );
  }

  register(name: string, email: string, password: string): Observable<unknown> {
    return this.http.post('http://localhost:8000/api/auth/register', { name, email, password });
  }

  getCurrentCustomer(): Observable<CustomerProfile | null> {
    const cachedCustomer = this.currentCustomerSubject.getValue();

    if (cachedCustomer) {
      return of(cachedCustomer);
    }

    return this.loadCurrentCustomer();
  }

  updateProfile(profile: CustomerProfile): Observable<CustomerProfile> {
    return this.http.put<CustomerProfile>('http://localhost:8000/api/customers/me', profile).pipe(
      tap((updatedProfile) => this.currentCustomerSubject.next(updatedProfile))
    );
  }

  logout(): void {
    localStorage.removeItem(this.tokenStorageKey);
    this.currentCustomerSubject.next(null);
  }

  isLoggedIn(): boolean {
    return Boolean(localStorage.getItem(this.tokenStorageKey));
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenStorageKey);
  }

  private loadCurrentCustomer(): Observable<CustomerProfile | null> {
    const token = this.getToken();

    if (!token) {
      this.currentCustomerSubject.next(null);
      return of(null);
    }

    const customerFromToken = this.extractCustomerFromToken(token);

    return this.http
      .get<CustomerProfile>('http://localhost:8000/api/customers/me', {
        headers: new HttpHeaders({ Authorization: `Bearer ${token}` })
      })
      .pipe(
        tap((customer) => this.currentCustomerSubject.next(customer)),
        map((customer) => customer ?? customerFromToken),
        catchError(() => {
          this.currentCustomerSubject.next(customerFromToken);
          return of(customerFromToken);
        })
      );
  }

  private extractCustomerFromToken(token: string): CustomerProfile | null {
    const payload = this.parseJwtPayload(token);

    if (!payload) {
      return null;
    }

    const name = typeof payload.name === 'string' ? payload.name : '';
    const email = typeof payload.email === 'string' ? payload.email : '';

    if (!name && !email) {
      return null;
    }

    return {
      name: name || email,
      email
    };
  }

  private parseJwtPayload(token: string): JwtPayload | null {
    const tokenParts = token.split('.');

    if (tokenParts.length < 2) {
      return null;
    }

    try {
      const base64Payload = tokenParts[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(base64Payload)) as JwtPayload;
    } catch {
      return null;
    }
  }

  private storeTokenFromResponse(response: AuthResponse): void {
    const token = response.token ?? response.access_token;

    if (token) {
      localStorage.setItem(this.tokenStorageKey, token);
    }
  }
}
