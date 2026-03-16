export class SessionResponse {
  id: string;
  device: string;
  browser: string;
  ip: string;
  lastSeenAt: Date;
  isCurrent: boolean;
}

export class SessionListResponse {
  sessions: SessionResponse[];
  total: number;
}
