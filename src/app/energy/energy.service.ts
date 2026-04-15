import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { EnergyPeriod, EnergySummary, EnergyTimeseriesQueryParams, EnergyTimeseriesResponse } from './energy.models';

@Injectable({ providedIn: 'root' })
export class EnergyService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8000/api/customers/me/energy';

  simulate(): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/simulate`, {});
  }

  getSummary(period?: EnergyPeriod): Observable<EnergySummary> {
    const params = period ? new HttpParams().set('period', period) : new HttpParams();

    return this.http.get<EnergySummary>(`${this.baseUrl}/summary`, { params });
  }

  getTimeseries(params?: EnergyTimeseriesQueryParams): Observable<EnergyTimeseriesResponse> {
    let requestParams = new HttpParams().set('interval', '15m');

    if (params?.from) {
      requestParams = requestParams.set('from', params.from);
    }

    if (params?.to) {
      requestParams = requestParams.set('to', params.to);
    }

    return this.http.get<EnergyTimeseriesResponse>(`${this.baseUrl}/timeseries`, { params: requestParams });
  }

  getPeriodRange(period: EnergyPeriod, now = new Date()): { from: string; to: string } {
    const to = new Date(now);
    const from = new Date(now);

    if (period === 'today') {
      from.setHours(0, 0, 0, 0);
    } else if (period === '7d') {
      from.setDate(from.getDate() - 7);
    } else if (period === '30d') {
      from.setDate(from.getDate() - 30);
    } else {
      from.setTime(0);
    }

    return {
      from: from.toISOString(),
      to: to.toISOString()
    };
  }
}
