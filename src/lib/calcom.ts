export interface CalComBooking {
  id: number;
  uid: string;
  title: string;
  description?: string;
  startTime: string; // ISO datetime
  endTime: string;
  status: string;
  attendees: { name: string; email: string }[];
  location?: string;
  meetingUrl?: string;
}

export interface CalComUser {
  id: number;
  email: string;
  name: string;
  timeZone: string;
  username: string;
}

export async function isCalComConfigured(): Promise<boolean> {
  const apiKey = process.env.CALCOM_API_KEY;
  return Boolean(apiKey && apiKey.trim().length > 0);
}

async function calcomFetch(endpoint: string, options?: RequestInit): Promise<any> {
  if (!(await isCalComConfigured())) {
    return null;
  }
  
  const baseUrl = process.env.CALCOM_BASE_URL || 'https://api.cal.com/v2';
  const apiKey = process.env.CALCOM_API_KEY!;
  
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'cal-api-version': '2024-08-13',
        ...(options?.headers || {})
      }
    });

    if (!response.ok) {
      console.error(`Cal.com API error: ${response.status} ${response.statusText}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Cal.com fetch error:', error);
    return null;
  }
}

export async function getMe(): Promise<CalComUser | null> {
  try {
    const result = await calcomFetch('/me');
    if (result && result.status === 'success' && result.data) {
      return result.data as CalComUser;
    }
    return null;
  } catch (error) {
    console.error('Error fetching Cal.com user info:', error);
    return null;
  }
}

function normalizeBooking(raw: any): CalComBooking {
  return {
    id: raw.id,
    uid: raw.uid,
    title: raw.title,
    description: raw.description,
    startTime: raw.start || raw.startTime,
    endTime: raw.end || raw.endTime,
    status: raw.status,
    attendees: raw.attendees || [],
    location: raw.location,
    meetingUrl: raw.meetingUrl,
  };
}

export async function getUpcomingBookings(): Promise<CalComBooking[]> {
  try {
    const result = await calcomFetch('/bookings?status=upcoming');
    if (result && result.data && Array.isArray(result.data)) {
      return result.data.map(normalizeBooking);
    }
    return [];
  } catch (error) {
    console.error('Error fetching upcoming bookings:', error);
    return [];
  }
}

export async function getAllBookings(): Promise<CalComBooking[]> {
  try {
    const result = await calcomFetch('/bookings');
    if (result && result.data && Array.isArray(result.data)) {
      return result.data.map(normalizeBooking);
    }
    return [];
  } catch (error) {
    console.error('Error fetching all bookings:', error);
    return [];
  }
}

export async function getBookingsForDateRange(startDate?: string, endDate?: string): Promise<CalComBooking[]> {
  try {
    let query = '/bookings';
    const params: string[] = [];
    if (startDate) params.push(`afterStart=${encodeURIComponent(startDate)}`);
    if (endDate) params.push(`beforeEnd=${encodeURIComponent(endDate)}`);
    if (params.length > 0) {
      query += `?${params.join('&')}`;
    }

    const result = await calcomFetch(query);
    if (result && result.data && Array.isArray(result.data)) {
      return result.data.map(normalizeBooking);
    }
    return [];
  } catch (error) {
    console.error('Error fetching bookings for date range:', error);
    return [];
  }
}

export async function getBookingByUid(uid: string): Promise<CalComBooking | null> {
  try {
    const result = await calcomFetch(`/bookings/${uid}`);
    if (result && result.data) {
      return normalizeBooking(result.data);
    }
    return null;
  } catch (error) {
    console.error(`Error fetching booking ${uid}:`, error);
    return null;
  }
}

export interface CalComEventType {
  id: number;
  title: string;
  slug: string;
  length: number;
}

export async function getEventTypes(): Promise<CalComEventType[]> {
  return [];
}
