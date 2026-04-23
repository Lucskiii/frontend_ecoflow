import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AnalysisCity, AnalysisCityCreateRequest, AnalysisCityListResponse } from './analysis-city.models';
import { API_BASE_URL } from '../api.config';

@Injectable({ providedIn: 'root' })
export class AnalysisCityService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE_URL}/api/analysis-cities`;

  createCity(payload: AnalysisCityCreateRequest): Observable<AnalysisCity> {
    return this.http.post<AnalysisCity>(this.baseUrl, payload);
  }

  listCities(): Observable<AnalysisCityListResponse> {
    return this.http.get<AnalysisCityListResponse>(this.baseUrl);
  }

  getCity(id: number): Observable<AnalysisCity> {
    return this.http.get<AnalysisCity>(`${this.baseUrl}/${id}`);
  }

  deleteCity(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}

export function mapAnalysisCityError(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return 'Aktion fehlgeschlagen. Bitte erneut versuchen.';
  }

  const detail =
    error.error && typeof error.error === 'object' && 'detail' in error.error
      ? String((error.error as { detail?: unknown }).detail ?? '')
      : '';

  if (error.status === 404 && detail) {
    return detail;
  }

  if (error.status === 409) {
    return 'Stadt existiert bereits';
  }

  if (error.status === 502 || error.status === 503) {
    return 'Geocoding service temporarily unavailable.';
  }

  if (detail) {
    return detail;
  }

  return 'Aktion fehlgeschlagen. Bitte erneut versuchen.';
}
