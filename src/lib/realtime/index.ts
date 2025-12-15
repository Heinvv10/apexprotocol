/**
 * Realtime Module (F138)
 * WebSocket real-time updates for mentions, recommendations, and GEO scores
 */

export {
  webSocketManager,
  WebSocketManager,
  formatClientInfo,
  formatSubscriptionInfo,
  formatEventInfo,
  CHANNEL_PATTERNS,
  type RealtimeEventType,
  type RealtimeEvent,
  type RealtimeSubscription,
  type RealtimeClient,
  type RealtimeMessage,
  type RealtimeResponse,
} from "./websocket";
