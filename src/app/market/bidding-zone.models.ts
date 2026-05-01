export interface BiddingZone {
  id: number;
  code: string;
  name: string;
}

export interface BiddingZoneListResponse {
  items: BiddingZone[];
}
