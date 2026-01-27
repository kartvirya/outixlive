export interface Promoter {
  id: string;
  name: string;
  logo: string;
  coverImage?: string;
  eventCount: number;
  isSubscribed: number; // 0 or 1
  brandColor: string;
  website: string;
  latitude: number;
  longitude: number;
  address: string;
  phone?: string;
  email?: string;
}

export const promoters: Promoter[] = [
  {
    id: "1",
    name: "ACE Racing Events",
    logo: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=200&fit=crop",
    coverImage:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=400&fit=crop",
    eventCount: 12,
    isSubscribed: true,
    brandColor: "0 84% 60%",
    website: "https://aceracingevents.com",
    latitude: 32.7767,
    longitude: -96.797,
    address: "Dallas, TX",
  },
  {
    id: "2",
    name: "Thunder Valley Raceway",
    logo: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=200&h=200&fit=crop",
    coverImage:
      "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&h=400&fit=crop",
    eventCount: 8,
    isSubscribed: false,
    brandColor: "220 90% 56%",
    website: "https://thundervalleyraceway.com",
    latitude: 35.8801,
    longitude: -83.5556,
    address: "Bristol, TN",
  },
  {
    id: "3",
    name: "Velocity Championships",
    logo: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=200&h=200&fit=crop",
    coverImage:
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=400&fit=crop",
    eventCount: 15,
    isSubscribed: true,
    brandColor: "142 76% 36%",
    website: "https://velocitychamps.com",
    latitude: 29.7604,
    longitude: -95.3698,
    address: "Houston, TX",
  },
  {
    id: "4",
    name: "Drag Racing Pro",
    logo: "https://images.unsplash.com/photo-1541348263662-e068662d82af?w=200&h=200&fit=crop",
    coverImage:
      "https://images.unsplash.com/photo-1541348263662-e068662d82af?w=800&h=400&fit=crop",
    eventCount: 6,
    isSubscribed: false,
    brandColor: "280 84% 60%",
    website: "https://dragracingpro.com",
    latitude: 29.9511,
    longitude: -90.0715,
    address: "New Orleans, LA",
  },
  {
    id: "5",
    name: "National Speed Series",
    logo: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=200&h=200&fit=crop",
    coverImage:
      "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&h=400&fit=crop",
    eventCount: 20,
    isSubscribed: false,
    brandColor: "32 95% 55%",
    website: "https://nationalspeedseries.com",
    latitude: 36.1699,
    longitude: -115.1398,
    address: "Las Vegas, NV",
  },
  {
    id: "6",
    name: "Elite Motorsports",
    logo: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=200&h=200&fit=crop",
    coverImage:
      "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&h=400&fit=crop",
    eventCount: 9,
    isSubscribed: true,
    brandColor: "190 100% 50%",
    website: "https://elitemotorsports.com",
    latitude: 33.4484,
    longitude: -112.074,
    address: "Phoenix, AZ",
  },
];

export interface Event {
  id: string;
  name: string;
  image: string;
  date: string;
  location: string;
  isSubscribed: number; // 0 or 1
  promoterId?: string;
}

export const events: Event[] = [
  {
    id: "1",
    name: "Spring Championship Shootout",
    image:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop",
    date: "Jan 10-12, 2026",
    location: "Thunder Valley Speedway, TX",
    isSubscribed: true,
    promoterId: "1",
  },
  {
    id: "2",
    name: "Memorial Day Classic",
    image:
      "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=400&h=400&fit=crop",
    date: "May 25-27, 2024",
    location: "Gainesville Raceway, FL",
    isSubscribed: false,
    promoterId: "2",
  },
  {
    id: "3",
    name: "Summer Showdown",
    image:
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&h=400&fit=crop",
    date: "Jul 4-6, 2024",
    location: "Maple Grove, PA",
    isSubscribed: true,
    promoterId: "3",
  },
  {
    id: "4",
    name: "Night of Champions",
    image:
      "https://images.unsplash.com/photo-1541348263662-e068662d82af?w=400&h=400&fit=crop",
    date: "Aug 10-12, 2024",
    location: "Bristol Dragway, TN",
    isSubscribed: false,
    promoterId: "4",
  },
  {
    id: "5",
    name: "Fall Nationals",
    image:
      "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&h=400&fit=crop",
    date: "Sep 20-22, 2024",
    location: "Las Vegas Strip, NV",
    isSubscribed: false,
    promoterId: "5",
  },
  {
    id: "6",
    name: "Winter Warm-Up",
    image:
      "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&h=400&fit=crop",
    date: "Dec 5-7, 2024",
    location: "Phoenix Dragway, AZ",
    isSubscribed: true,
    promoterId: "6",
  },
];

export type NotificationType =
  | "event"
  | "alert"
  | "info"
  | "schedule"
  | "call"
  | "urgent"
  | "service_request";
export type ServiceStatus = "pending" | "in_progress" | "completed";

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: NotificationType;
  eventName?: string;
  eventId?: string;
  venueId?: string;
  userId?: string;
  isRead: boolean;
  serviceType?: "fuel" | "pump_out" | "repair" | "other";
  serviceStatus?: ServiceStatus;
  serviceAmount?: number;
  pitNumber?: string;
  details?: string;
}

export const notifications: Notification[] = [
  {
    id: "1",
    title: "Class Call",
    message: "Round 1 - Box Cars to Lanes 1 and 2. Please report immediately.",
    time: "5m ago",
    type: "call",
    eventName: "Spring Championship Shootout",
    eventId: "1",
    venueId: "1",
    userId: "user-1",
    isRead: false,
  },
  {
    id: "2",
    title: "Pump Out Complete",
    message: "Your pump out request has been completed.",
    time: "15m ago",
    type: "service_request",
    eventName: "Spring Championship Shootout",
    eventId: "1",
    venueId: "1",
    userId: "user-1",
    isRead: false,
    serviceType: "pump_out",
    serviceStatus: "completed",
    serviceAmount: 25.0,
    pitNumber: "A-42",
    details: "Completed by Track Services at 2:45 PM",
  },
  {
    id: "3",
    title: "Fuel Request In Progress",
    message:
      "Your fuel request is being processed. A crew member is on the way.",
    time: "20m ago",
    type: "service_request",
    eventName: "Spring Championship Shootout",
    eventId: "1",
    venueId: "1",
    userId: "user-1",
    isRead: false,
    serviceType: "fuel",
    serviceStatus: "in_progress",
    serviceAmount: 75.5,
    pitNumber: "A-42",
    details: "Estimated arrival: 5 minutes",
  },
  {
    id: "4",
    title: "Schedule Update",
    message: "Pro Stock eliminations moved to 3:00 PM due to weather delay.",
    time: "23m ago",
    type: "alert",
    eventName: "Spring Championship Shootout",
    eventId: "1",
    venueId: "1",
    userId: "user-1",
    isRead: false,
  },
  {
    id: "5",
    title: "Event Starting Soon",
    message: "Memorial Day Classic gates open in 1 hour. Get there early!",
    time: "1h ago",
    type: "event",
    eventName: "Memorial Day Classic",
    eventId: "2",
    venueId: "2",
    isRead: false,
  },
  {
    id: "6",
    title: "New Event Added",
    message: "Thunder Valley Raceway just added a new event. Check it out!",
    time: "2h ago",
    type: "info",
    venueId: "2",
    isRead: true,
  },
  {
    id: "7",
    title: "Weather Alert",
    message:
      "Possible rain expected Saturday afternoon. Track prep may be affected.",
    time: "4h ago",
    type: "alert",
    eventName: "Summer Showdown",
    eventId: "3",
    venueId: "3",
    isRead: true,
    details:
      "Please check with track officials for updated timing. Cover your equipment if leaving pits unattended.",
  },
];
