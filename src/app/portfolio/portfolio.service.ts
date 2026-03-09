import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PortfolioExportSummary, PortfolioExportTimeseriesResponse, PortfolioPeriod } from './portfolio.models';

@Injectable({ providedIn: 'root' })
export class PortfolioService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8000/api/portfolio/export';

  getExportSummary(period: PortfolioPeriod): Observable<PortfolioExportSummary> {
    const params = new HttpParams().set('period', period);

    return this.http.get<PortfolioExportSummary>(`${this.baseUrl}/summary`, { params });
  }

  getExportTimeseries(from: string, to: string): Observable<PortfolioExportTimeseriesResponse> {
    const params = new HttpParams().set('from', from).set('to', to);

    return this.http.get<PortfolioExportTimeseriesResponse>(`${this.baseUrl}/timeseries`, { params });
  }
}
