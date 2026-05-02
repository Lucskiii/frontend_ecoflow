import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { BiddingZoneService } from './bidding-zone.service';

describe('BiddingZoneService', () => {
  let service: BiddingZoneService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BiddingZoneService, provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(BiddingZoneService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads bidding zones via GET /api/market/bidding-zones', () => {
    service.listBiddingZones().subscribe();

    const request = httpMock.expectOne('http://localhost:8000/api/market/bidding-zones');
    expect(request.request.method).toBe('GET');

    request.flush({ items: [] });
  });
});
