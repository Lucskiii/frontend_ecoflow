import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

interface AuthResponse {
  token?: string;
  access_token?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenStorageKey = 'auth_token';

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>('http://localhost:8000/api/auth/login', { email, password })
      .pipe(tap((response) => this.storeTokenFromResponse(response)));
  }

  register(name: string, email: string, password: string): Observable<unknown> {
    return this.http.post('http://localhost:8000/api/auth/register', { name, email, password });
  }

  logout(): void {
    localStorage.removeItem(this.tokenStorageKey);
  }

  isLoggedIn(): boolean {
    return Boolean(localStorage.getItem(this.tokenStorageKey));
  }

  private storeTokenFromResponse(response: AuthResponse): void {
    const token = response.token ?? response.access_token;

    if (token) {
      localStorage.setItem(this.tokenStorageKey, token);
    }
  }
}
