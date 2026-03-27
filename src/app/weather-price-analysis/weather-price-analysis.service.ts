import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  WeatherPriceAnalysisRenameRequest,
  WeatherPriceAnalysisRequest,
  WeatherPriceAnalysisResponse,
  WeatherPriceAnalysisStatusResponse
} from './weather-price-analysis.models';

@Injectable({ providedIn: 'root' })
export class WeatherPriceAnalysisService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8000/api/analysis/weather-price';

  runAnalysis(payload: WeatherPriceAnalysisRequest): Observable<WeatherPriceAnalysisResponse> {
    return this.http.post<WeatherPriceAnalysisResponse>(this.baseUrl, payload);
  }

  getAnalysis(analysisRunId: string): Observable<WeatherPriceAnalysisResponse> {
    return this.http.get<WeatherPriceAnalysisResponse>(`${this.baseUrl}/${analysisRunId}`);
  }

  getAnalysisStatus(analysisRunId: string): Observable<WeatherPriceAnalysisStatusResponse> {
    return this.http.get<WeatherPriceAnalysisStatusResponse>(`${this.baseUrl}/${analysisRunId}/status`);
  }

  renameAnalysisRun(analysisRunId: string, payload: WeatherPriceAnalysisRenameRequest): Observable<WeatherPriceAnalysisStatusResponse> {
    return this.http.patch<WeatherPriceAnalysisStatusResponse>(`${this.baseUrl}/${analysisRunId}/name`, payload);
  }
}

export function mapWeatherPriceAnalysisError(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return 'Analyse fehlgeschlagen. Bitte erneut versuchen.';
  }

  const detail =
    error.error && typeof error.error === 'object' && 'detail' in error.error
      ? String((error.error as { detail?: unknown }).detail ?? '')
      : '';
  const detailLower = detail.toLowerCase();

  if (error.status === 404) {
    if (detailLower.includes('bidding_zone')) {
      return 'Die gewählte Bidding Zone existiert nicht. Bitte Auswahl prüfen.';
    }
    return detail || 'Die angeforderte Analyse oder Stadt wurde nicht gefunden.';
  }

  if (error.status === 422) {
    if (!detail || detailLower.includes('bidding_zone')) {
      return 'Bitte eine gültige Bidding Zone auswählen.';
    }
    return detail || 'Die Eingabedaten sind ungültig. Bitte Daten und Gewichte prüfen.';
  }

  if (error.status === 503) {
    return 'Weather-Daten sind aktuell nicht verfügbar (Upstream-Service nicht erreichbar).';
  }

  if (detail) {
    return detail;
  }

  return 'Analyse fehlgeschlagen. Bitte erneut versuchen.';
}
