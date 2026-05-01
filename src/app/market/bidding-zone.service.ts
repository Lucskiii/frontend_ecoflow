import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api.config';
import { BiddingZoneListResponse } from './bidding-zone.models';

@Injectable({ providedIn: 'root' })
export class BiddingZoneService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE_URL}/api/market/bidding-zones`;

  listBiddingZones(): Observable<BiddingZoneListResponse> {
    return this.http.get<BiddingZoneListResponse>(this.baseUrl);
  }
}
