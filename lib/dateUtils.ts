/**
 * Date utility functions for handling timezone conversions
 * Server returns dates in GMT/UTC format: "2026-01-21 07:27:57"
 * These functions convert to user's local timezone
 */

/**
 * Parse a date string from the server (GMT/UTC) and convert to local Date object
 * Handles formats like "2026-01-21 07:27:57" or ISO strings
 */
export function parseUTCDate(dateString: string): Date {
  if (!dateString) {
    return new Date();
  }

  try {
    // If it's in the format "2026-01-21 07:27:57", convert to ISO format
    // and explicitly mark as UTC
    if (dateString.includes(' ') && !dateString.includes('T')) {
      // Replace space with 'T' and add 'Z' to indicate UTC
      const isoString = dateString.replace(' ', 'T') + 'Z';
      return new Date(isoString);
    }
    
    // If it's already an ISO string or other format, try to parse it
    const date = new Date(dateString);
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return new Date();
    }
    
    return date;
  } catch (error) {
    return new Date();
  }
}

/**
 * Format a date string from server to localized date and time
 * Example: "Jan 21, 2026, 3:27 PM" (in user's timezone)
 */
export function formatDateTime(dateString: string): string {
  try {
    const date = parseUTCDate(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
}

/**
 * Format a date string from server to localized time only
 * Example: "3:27 PM" (in user's timezone)
 */
export function formatTime(dateString: string): string {
  if (!dateString) return "";
  
  try {
    const date = parseUTCDate(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    // Fallback: try to extract time from string format
    const timeMatch = dateString.match(/(\d{1,2}):(\d{2}):(\d{2})/);
    if (timeMatch) {
      const hour = parseInt(timeMatch[1]);
      const minute = timeMatch[2];
      const ampm = hour >= 12 ? "PM" : "AM";
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minute} ${ampm}`;
    }
    return "Unknown time";
  }
}

/**
 * Format a date string from server to localized date and time with full format
 * Example: "1/21/2026 3:27 PM" (in user's timezone)
 */
export function formatFullDateTime(dateString: string): string {
  try {
    const date = parseUTCDate(dateString);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  } catch {
    return "Unknown time";
  }
}

/**
 * Format a date string from server to relative time
 * Example: "Just now", "5m ago", "2h ago", "3 days ago"
 */
export function formatRelativeTime(dateString: string): string {
  if (!dateString) return "";
  
  try {
    const date = parseUTCDate(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    
    if (diffMinutes < 1) {
      return "Just now";
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else {
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) {
        return `${diffHours}h ago`;
      } else {
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays === 1) {
          return "1 day ago";
        } else if (diffDays < 7) {
          return `${diffDays} days ago`;
        } else {
          return date.toLocaleDateString();
        }
      }
    }
  } catch {
    return dateString;
  }
}
