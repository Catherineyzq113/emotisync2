import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const serviceUrl = process.env.NOTIFICATION_SERVICE_URL;
  if (!serviceUrl) {
    console.warn('EmotiSync: NOTIFICATION_SERVICE_URL not set — notifications disabled');
    return NextResponse.json({ ok: false, reason: 'service not configured' });
  }

  const body = await req.json();

  const response = await fetch(`${serviceUrl}/schedule`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).catch(() => null);

  if (!response) {
    console.warn('EmotiSync: Notification service unreachable at', serviceUrl);
    return NextResponse.json({ ok: false, reason: 'service unreachable' });
  }

  const data = await response.json().catch(() => ({}));
  return NextResponse.json(data, { status: response.status });
}
