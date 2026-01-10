/**
 * Stub for notification digest service
 * TODO: Implement full digest functionality
 */

export type DigestPriority = "high" | "medium" | "low";

export interface DigestNotification {
  id: string;
  title: string;
  message: string;
  priority: DigestPriority;
  createdAt: Date;
}

export const digestService = {
  isConfigured() {
    return false;
  },
  configure(_config: unknown) {
    return;
  },
  async createDigest() {
    return null;
  },
  async sendDigest(_userEmail: string, _summary: string, _frequency: string, _dashboardUrl: string) {
    return { status: "sent" as const, error: undefined as string | undefined };
  },
  async createSummary(_brandName: string, _notifications: unknown[], _periodStart?: Date, _periodEnd?: Date) {
    return "";
  },
  async getStatus() {
    return null;
  },
  async getDeliveryHistory(_limit?: number) {
    return [];
  },
};
