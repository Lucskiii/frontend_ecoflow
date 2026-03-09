import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { EnergyPeriod, EnergySummary, EnergyTimeseriesResponse } from './energy.models';

@Injectable({ providedIn: 'root' })
export class EnergyService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8000/api/customers/me/energy';

  getSummary(period?: EnergyPeriod): Observable<EnergySummary> {
    const params = this.addPeriodParam(new HttpParams(), period);

    return this.http.get<EnergySummary>(`${this.baseUrl}/summary`, { params });
  }

  getTimeseries(from?: string, to?: string, period?: EnergyPeriod): Observable<EnergyTimeseriesResponse> {
    let params = this.addPeriodParam(new HttpParams(), period);

    if (from) {
      params = params.set('from', from);
    }

    if (to) {
      params = params.set('to', to);
    }

    return this.http.get<EnergyTimeseriesResponse>(`${this.baseUrl}/timeseries`, { params });
  }

  private addPeriodParam(params: HttpParams, period?: EnergyPeriod): HttpParams {
    return period ? params.set('period', period) : params;
  }
}
