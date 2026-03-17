import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  DailyConsumptionItem,
  DailyConsumptionParams,
  EnergyPeriod,
  EnergySummary,
  EnergyTimeseriesResponse
} from './energy.models';

@Injectable({ providedIn: 'root' })
export class EnergyService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8000/api/customers/me/energy';
  private readonly customerBaseUrl = 'http://localhost:8000/api/customers';

  getSummary(period?: EnergyPeriod): Observable<EnergySummary> {
    const params = this.addPeriodParam(new HttpParams(), period);

    return this.http.get<EnergySummary>(`${this.baseUrl}/summary`, { params });
  }

  getTimeseries(from?: string, to?: string, period?: EnergyPeriod): Observable<EnergyTimeseriesResponse> {
    if ((!from || !to) && period) {
      const range = this.getPeriodRange(period);
      from = from ?? range.from;
      to = to ?? range.to;
    }

    let params = this.addPeriodParam(new HttpParams(), period);

    if (from) {
      params = params.set('from', from);
    }

    if (to) {
      params = params.set('to', to);
    }

    return this.http.get<EnergyTimeseriesResponse>(`${this.baseUrl}/timeseries`, { params });
  }

  getCustomerDailyConsumption(
    customerId: string,
    params?: DailyConsumptionParams
  ): Observable<DailyConsumptionItem[]> {
    let requestParams = new HttpParams();

    if (params?.start_date) {
      requestParams = requestParams.set('start_date', params.start_date);
    }

    if (params?.end_date) {
      requestParams = requestParams.set('end_date', params.end_date);
    }

    requestParams = requestParams.set('auto_generate', String(params?.auto_generate ?? true));

    return this.http.get<DailyConsumptionItem[]>(
      `${this.customerBaseUrl}/${customerId}/consumption/daily`,
      { params: requestParams }
    );
  }

  private addPeriodParam(params: HttpParams, period?: EnergyPeriod): HttpParams {
    return period ? params.set('period', period) : params;
  }

  getPeriodRange(period: EnergyPeriod, now = new Date()): { from: string; to: string } {
    const to = new Date(now);
    const from = new Date(now);

    if (period === 'today') {
      from.setHours(0, 0, 0, 0);
    } else if (period === '7d') {
      from.setDate(from.getDate() - 7);
    } else {
      from.setDate(from.getDate() - 30);
    }

    return {
      from: from.toISOString(),
      to: to.toISOString()
    };
  }
}
