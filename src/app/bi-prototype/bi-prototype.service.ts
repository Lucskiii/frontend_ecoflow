import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api.config';
import {
  BiPrototypeEnergyTrendQuery,
  BiPrototypeEnergyTrendResponse,
  BiPrototypePriceTrendQuery,
  BiPrototypePriceTrendResponse,
  BiPrototypeSyncQuery,
  BiPrototypeSyncResponse
} from './bi-prototype.models';

@Injectable({ providedIn: 'root' })
export class BiPrototypeService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE_URL}/api/bi/prototype`;

  sync(query: BiPrototypeSyncQuery): Observable<BiPrototypeSyncResponse> {
    const params = new HttpParams().set('from', query.from).set('to', query.to);
    return this.http.post<BiPrototypeSyncResponse>(`${this.baseUrl}/sync`, {}, { params });
  }

  getEnergyTrend(query: BiPrototypeEnergyTrendQuery): Observable<BiPrototypeEnergyTrendResponse> {
    let params = new HttpParams().set('from', query.from).set('to', query.to);
    if (query.site_key) {
      params = params.set('site_key', query.site_key);
    }

    return this.http.get<BiPrototypeEnergyTrendResponse>(`${this.baseUrl}/energy-trend`, { params });
  }

  getPriceTrend(query: BiPrototypePriceTrendQuery): Observable<BiPrototypePriceTrendResponse> {
    let params = new HttpParams().set('from', query.from).set('to', query.to);
    if (query.market_product_key) {
      params = params.set('market_product_key', query.market_product_key);
    }
    if (query.bidding_zone_id) {
      params = params.set('bidding_zone_id', query.bidding_zone_id);
    }

    return this.http.get<BiPrototypePriceTrendResponse>(`${this.baseUrl}/price-trend`, { params });
  }
}

export function mapBiPrototypeError(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return 'Anfrage fehlgeschlagen. Bitte erneut versuchen.';
  }

  const detail =
    error.error && typeof error.error === 'object' && 'detail' in error.error
      ? String((error.error as { detail?: unknown }).detail ?? '')
      : '';

  if (error.status === 400 || error.status === 422) {
    return detail || 'Ungültige Anfrageparameter. Bitte Zeitfenster und Filter prüfen.';
  }

  if (error.status === 404) {
    return detail || 'Die angeforderte BI-Ressource wurde nicht gefunden.';
  }

  if (error.status === 500 || error.status === 503) {
    return detail || 'Der BI-Service ist aktuell nicht verfügbar.';
  }

  return detail || 'Die BI-Anfrage konnte nicht verarbeitet werden.';
}
