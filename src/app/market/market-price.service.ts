import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { MarketPriceResponse } from './market.models';

@Injectable({ providedIn: 'root' })
export class MarketPriceService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/market/prices';

  getPrices(from: string, to: string): Observable<MarketPriceResponse> {
    const params = new HttpParams().set('from', from).set('to', to);

    return this.http.get<MarketPriceResponse>(this.baseUrl, { params });
  }
}
