import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import {
  LiveMarketPriceApiPoint,
  LiveMarketPriceApiResponse,
  LiveMarketPricePoint,
  LiveMarketPriceResponse,
  MarketPriceResponse
} from './market.models';
import { SKIP_AUTH } from '../auth/auth.interceptor';

const EUR_MWH_TO_CT_KWH = 0.1;

export function mapLiveMarketPricePoint(point: LiveMarketPriceApiPoint | null): LiveMarketPricePoint | null {
  if (!point) {
    return null;
  }

  const priceCtKwh = point.price_ct_kwh ?? point.price_eur_mwh * EUR_MWH_TO_CT_KWH;

  return {
    ts: point.ts,
    price_eur_mwh: point.price_eur_mwh,
    price_ct_kwh: Number(priceCtKwh.toFixed(4))
  };
}

export function mapLiveMarketPriceResponse(response: LiveMarketPriceApiResponse): LiveMarketPriceResponse {
  return {
    source: response.source,
    product: response.product,
    unit: response.unit,
    fetched_at: response.fetched_at,
    current: mapLiveMarketPricePoint(response.current),
    next: mapLiveMarketPricePoint(response.next),
    points: response.points.map((point) => mapLiveMarketPricePoint(point)).filter((point): point is LiveMarketPricePoint => point !== null)
  };
}

@Injectable({ providedIn: 'root' })
export class MarketPriceService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8000/api/market/prices';

  getPrices(from: string, to: string): Observable<MarketPriceResponse> {
    const params = new HttpParams().set('from', from).set('to', to);

    return this.http.get<MarketPriceResponse>(this.baseUrl, { params });
  }

  getLiveMarketPrices(lookbackHours = 3, lookaheadHours = 36): Observable<LiveMarketPriceResponse> {
    const params = new HttpParams()
      .set('lookback_hours', lookbackHours)
      .set('lookahead_hours', lookaheadHours);

    const context = new HttpContext().set(SKIP_AUTH, true);

    return this.http
      .get<LiveMarketPriceApiResponse>(`${this.baseUrl}/live`, { params, context })
      .pipe(map((response) => mapLiveMarketPriceResponse(response)));
  }
}
