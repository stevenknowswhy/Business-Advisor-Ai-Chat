// Minimal mock of next/server for API route tests in Jest
export class NextRequest {
  url: string;
  constructor(url: string) { this.url = url; }
  static from() { return new NextRequest('http://localhost'); }
}
export class NextResponse {
  static json(data: any, init?: any) { return { json: data, status: init?.status ?? 200 }; }
}
export const headers = () => new Map<string,string>();
export const cookies = { get: () => undefined };

