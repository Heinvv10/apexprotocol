/**
 * Auto-scheduling Recommendations (F115)
 * Auto-scheduling recommendations based on priority and dependencies
 */

import { createId } from "@paralleldrive/cuid2";
import type { Recommendation, PriorityLevel } from "./types";

// Schedule types
export interface ScheduledRecommendation {
  id: string;
  recommendationId: string;
  brandId: string;
  scheduledFor: Date;
  deadline?: Date;
  status: ScheduleStatus;
  assignee?: string;
  estimatedDuration: number; // minutes
  actualDuration?: number;
  dependencies: string[];
  blockedBy: string[];
  priority: PriorityLevel;
  createdAt: Date;
  updatedAt: Date;
}

export type ScheduleStatus =
  | "pending"
  | "scheduled"
  | "in_progress"
  | "completed"
  | "skipped"
  | "blocked"
  | "overdue";

export interface ScheduleConfig {
  workingHoursStart: number; // 0-23
  workingHoursEnd: number; // 0-23
  workingDays: number[]; // 0=Sunday, 6=Saturday
  maxDailyItems: number;
  bufferBetweenItems: number; // minutes
  priorityWindows: PriorityWindow[];
  autoRescheduleOnBlock: boolean;
}

export interface PriorityWindow {
  priority: PriorityLevel;
  maxDaysDelay: number;
  targetCompletionPercent: number;
}

export interface ScheduleResult {
  scheduled: ScheduledRecommendation[];
  unscheduled: string[];
  conflicts: ScheduleConflict[];
  metrics: ScheduleMetrics;
}

export interface ScheduleConflict {
  recommendationId: string;
  reason: string;
  conflictsWith?: string;
  resolution?: string;
}

export interface ScheduleMetrics {
  totalScheduled: number;
  totalUnscheduled: number;
  averageDelay: number;
  utilizationRate: number;
  criticalPathLength: number;
}

// Default configuration
const DEFAULT_CONFIG: ScheduleConfig = {
  workingHoursStart: 9,
  workingHoursEnd: 17,
  workingDays: [1, 2, 3, 4, 5], // Monday-Friday
  maxDailyItems: 5,
  bufferBetweenItems: 15,
  priorityWindows: [
    { priority: "critical", maxDaysDelay: 1, targetCompletionPercent: 100 },
    { priority: "high", maxDaysDelay: 3, targetCompletionPercent: 90 },
    { priority: "medium", maxDaysDelay: 7, targetCompletionPercent: 80 },
    { priority: "low", maxDaysDelay: 14, targetCompletionPercent: 70 },
  ],
  autoRescheduleOnBlock: true,
};

/**
 * Auto-Scheduling Engine
 */
export class AutoScheduler {
  private config: ScheduleConfig;
  private schedules: Map<string, ScheduledRecommendation> = new Map();
  private byBrand: Map<string, string[]> = new Map();
  private byDate: Map<string, string[]> = new Map();

  constructor(config: Partial<ScheduleConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Schedule multiple recommendations
   */
  scheduleRecommendations(
    recommendations: Recommendation[],
    brandId: string,
    options: {
      startDate?: Date;
      assignees?: string[];
      respectDependencies?: boolean;
    } = {}
  ): ScheduleResult {
    const {
      startDate = new Date(),
      assignees = [],
      respectDependencies = true,
    } = options;

    const scheduled: ScheduledRecommendation[] = [];
    const unscheduled: string[] = [];
    const conflicts: ScheduleConflict[] = [];

    // Sort by priority and dependencies
    const sortedRecs = this.topologicalSort(recommendations, respectDependencies);

    // Track daily slots
    const dailySlots = new Map<string, number>();
    let currentDate = new Date(startDate);
    let currentTime = this.getNextWorkingTime(currentDate);

    for (const rec of sortedRecs) {
      // Check for dependency conflicts
      const dependencyConflict = this.checkDependencies(rec, scheduled);
      if (dependencyConflict) {
        conflicts.push(dependencyConflict);
        if (!this.config.autoRescheduleOnBlock) {
          unscheduled.push(rec.id);
          continue;
        }
      }

      // Find next available slot
      const slot = this.findNextSlot(
        rec,
        currentTime,
        dailySlots,
        scheduled
      );

      if (!slot) {
        unscheduled.push(rec.id);
        conflicts.push({
          recommendationId: rec.id,
          reason: "No available slot within priority window",
        });
        continue;
      }

      // Calculate deadline based on priority
      const deadline = this.calculateDeadline(rec.priority, slot);

      // Create scheduled item
      const scheduledRec: ScheduledRecommendation = {
        id: createId(),
        recommendationId: rec.id,
        brandId,
        scheduledFor: slot,
        deadline,
        status: "scheduled",
        assignee: this.assignToAssignee(rec, assignees),
        estimatedDuration: this.estimateDuration(rec),
        dependencies: rec.relatedRecommendations || [],
        blockedBy: dependencyConflict ? [dependencyConflict.conflictsWith!] : [],
        priority: rec.priority,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      scheduled.push(scheduledRec);
      this.addToIndex(scheduledRec);

      // Update daily slots
      const dateKey = slot.toISOString().split("T")[0];
      dailySlots.set(dateKey, (dailySlots.get(dateKey) || 0) + 1);

      // Move to next slot
      currentTime = new Date(
        slot.getTime() + scheduledRec.estimatedDuration * 60 * 1000 + this.config.bufferBetweenItems * 60 * 1000
      );
    }

    return {
      scheduled,
      unscheduled,
      conflicts,
      metrics: this.calculateMetrics(scheduled, unscheduled),
    };
  }

  /**
   * Topological sort by priority and dependencies
   */
  private topologicalSort(
    recommendations: Recommendation[],
    respectDependencies: boolean
  ): Recommendation[] {
    // First, sort by priority
    const sorted = [...recommendations].sort((a, b) => {
      const priorityOrder: Record<PriorityLevel, number> = {
        critical: 0,
        high: 1,
        medium: 2,
        low: 3,
      };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    if (!respectDependencies) {
      return sorted;
    }

    // Build dependency graph
    const recMap = new Map(recommendations.map((r) => [r.id, r]));
    const visited = new Set<string>();
    const result: Recommendation[] = [];

    const visit = (rec: Recommendation) => {
      if (visited.has(rec.id)) return;
      visited.add(rec.id);

      // Visit dependencies first
      for (const depId of rec.relatedRecommendations || []) {
        const dep = recMap.get(depId);
        if (dep) visit(dep);
      }

      result.push(rec);
    };

    for (const rec of sorted) {
      visit(rec);
    }

    return result;
  }

  /**
   * Check for dependency conflicts
   */
  private checkDependencies(
    rec: Recommendation,
    scheduled: ScheduledRecommendation[]
  ): ScheduleConflict | null {
    const dependencies = rec.relatedRecommendations || [];

    for (const depId of dependencies) {
      const scheduledDep = scheduled.find((s) => s.recommendationId === depId);
      if (!scheduledDep) {
        return {
          recommendationId: rec.id,
          reason: "Dependency not scheduled",
          conflictsWith: depId,
          resolution: "Schedule dependency first or ignore",
        };
      }

      if (scheduledDep.status === "blocked" || scheduledDep.status === "skipped") {
        return {
          recommendationId: rec.id,
          reason: "Dependency is blocked or skipped",
          conflictsWith: scheduledDep.recommendationId,
          resolution: "Resolve dependency issue first",
        };
      }
    }

    return null;
  }

  /**
   * Find next available slot
   */
  private findNextSlot(
    rec: Recommendation,
    startTime: Date,
    dailySlots: Map<string, number>,
    scheduled: ScheduledRecommendation[]
  ): Date | null {
    const priorityWindow = this.config.priorityWindows.find(
      (w) => w.priority === rec.priority
    );
    const maxDaysDelay = priorityWindow?.maxDaysDelay || 14;
    const maxDate = new Date(startTime.getTime() + maxDaysDelay * 24 * 60 * 60 * 1000);

    let currentTime = new Date(startTime);

    while (currentTime < maxDate) {
      const dateKey = currentTime.toISOString().split("T")[0];
      const slotsUsed = dailySlots.get(dateKey) || 0;

      // Check if within working hours and days
      if (this.isWorkingTime(currentTime) && slotsUsed < this.config.maxDailyItems) {
        // Check for conflicts with existing scheduled items
        const conflict = this.hasTimeConflict(
          currentTime,
          this.estimateDuration(rec),
          scheduled
        );

        if (!conflict) {
          return currentTime;
        }
      }

      // Move to next slot
      currentTime = this.getNextWorkingTime(
        new Date(currentTime.getTime() + 30 * 60 * 1000)
      );
    }

    return null;
  }

  /**
   * Check if there's a time conflict
   */
  private hasTimeConflict(
    startTime: Date,
    duration: number,
    scheduled: ScheduledRecommendation[]
  ): boolean {
    const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

    for (const item of scheduled) {
      const itemEnd = new Date(
        item.scheduledFor.getTime() + item.estimatedDuration * 60 * 1000
      );

      // Check overlap
      if (startTime < itemEnd && endTime > item.scheduledFor) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if time is within working hours
   */
  private isWorkingTime(date: Date): boolean {
    const day = date.getDay();
    const hour = date.getHours();

    return (
      this.config.workingDays.includes(day) &&
      hour >= this.config.workingHoursStart &&
      hour < this.config.workingHoursEnd
    );
  }

  /**
   * Get next working time from given date
   */
  private getNextWorkingTime(date: Date): Date {
    const result = new Date(date);

    // If before working hours, move to start
    if (result.getHours() < this.config.workingHoursStart) {
      result.setHours(this.config.workingHoursStart, 0, 0, 0);
    }

    // If after working hours, move to next day
    if (result.getHours() >= this.config.workingHoursEnd) {
      result.setDate(result.getDate() + 1);
      result.setHours(this.config.workingHoursStart, 0, 0, 0);
    }

    // Find next working day
    while (!this.config.workingDays.includes(result.getDay())) {
      result.setDate(result.getDate() + 1);
      result.setHours(this.config.workingHoursStart, 0, 0, 0);
    }

    return result;
  }

  /**
   * Calculate deadline based on priority
   */
  private calculateDeadline(priority: PriorityLevel, scheduledFor: Date): Date {
    const window = this.config.priorityWindows.find((w) => w.priority === priority);
    const maxDays = window?.maxDaysDelay || 14;

    const deadline = new Date(scheduledFor);
    deadline.setDate(deadline.getDate() + maxDays);

    return deadline;
  }

  /**
   * Estimate duration for recommendation
   */
  private estimateDuration(rec: Recommendation): number {
    // Map effort score (0-100, lower = easier) to duration in minutes
    const score = rec.effort.score;

    // Score ranges: 0-25 = quick (15min), 26-50 = moderate (60min),
    // 51-75 = substantial (240min), 76-100 = major (480min)
    if (score <= 25) return 15;
    if (score <= 50) return 60;
    if (score <= 75) return 240;
    return 480;
  }

  /**
   * Assign to an assignee based on workload
   */
  private assignToAssignee(rec: Recommendation, assignees: string[]): string | undefined {
    if (assignees.length === 0) return undefined;

    // Simple round-robin assignment
    // In production, this would consider workload, expertise, etc.
    const assigneeWorkloads = new Map<string, number>();

    for (const schedule of this.schedules.values()) {
      if (schedule.assignee && schedule.status !== "completed") {
        assigneeWorkloads.set(
          schedule.assignee,
          (assigneeWorkloads.get(schedule.assignee) || 0) + 1
        );
      }
    }

    // Find assignee with lowest workload
    let minWorkload = Infinity;
    let selectedAssignee = assignees[0];

    for (const assignee of assignees) {
      const workload = assigneeWorkloads.get(assignee) || 0;
      if (workload < minWorkload) {
        minWorkload = workload;
        selectedAssignee = assignee;
      }
    }

    return selectedAssignee;
  }

  /**
   * Add scheduled item to indexes
   */
  private addToIndex(scheduled: ScheduledRecommendation): void {
    this.schedules.set(scheduled.id, scheduled);

    // Index by brand
    const brandSchedules = this.byBrand.get(scheduled.brandId) || [];
    brandSchedules.push(scheduled.id);
    this.byBrand.set(scheduled.brandId, brandSchedules);

    // Index by date
    const dateKey = scheduled.scheduledFor.toISOString().split("T")[0];
    const dateSchedules = this.byDate.get(dateKey) || [];
    dateSchedules.push(scheduled.id);
    this.byDate.set(dateKey, dateSchedules);
  }

  /**
   * Calculate schedule metrics
   */
  private calculateMetrics(
    scheduled: ScheduledRecommendation[],
    unscheduled: string[]
  ): ScheduleMetrics {
    const totalScheduled = scheduled.length;
    const totalUnscheduled = unscheduled.length;
    const total = totalScheduled + totalUnscheduled;

    // Calculate average delay (days from now)
    const now = new Date();
    const delays = scheduled.map(
      (s) => (s.scheduledFor.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
    );
    const averageDelay =
      delays.length > 0 ? delays.reduce((a, b) => a + b, 0) / delays.length : 0;

    // Calculate utilization rate (scheduled / total)
    const utilizationRate = total > 0 ? totalScheduled / total : 0;

    // Calculate critical path length
    const criticalPathLength = this.calculateCriticalPath(scheduled);

    return {
      totalScheduled,
      totalUnscheduled,
      averageDelay,
      utilizationRate,
      criticalPathLength,
    };
  }

  /**
   * Calculate critical path length
   */
  private calculateCriticalPath(scheduled: ScheduledRecommendation[]): number {
    if (scheduled.length === 0) return 0;

    // Build dependency graph
    const graph = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    for (const item of scheduled) {
      graph.set(item.recommendationId, item.dependencies);
      inDegree.set(item.recommendationId, 0);
    }

    // Calculate in-degrees
    for (const item of scheduled) {
      for (const dep of item.dependencies) {
        inDegree.set(dep, (inDegree.get(dep) || 0) + 1);
      }
    }

    // Find longest path using topological sort
    let maxLength = 0;
    const queue = scheduled.filter((s) => (inDegree.get(s.recommendationId) || 0) === 0);
    const distances = new Map<string, number>();

    for (const item of queue) {
      distances.set(item.recommendationId, item.estimatedDuration);
    }

    while (queue.length > 0) {
      const current = queue.shift()!;
      const currentDist = distances.get(current.recommendationId) || 0;
      maxLength = Math.max(maxLength, currentDist);

      for (const dep of current.dependencies) {
        const newDist = currentDist + (scheduled.find((s) => s.recommendationId === dep)?.estimatedDuration || 0);
        distances.set(dep, Math.max(distances.get(dep) || 0, newDist));

        const degree = (inDegree.get(dep) || 1) - 1;
        inDegree.set(dep, degree);

        if (degree === 0) {
          const item = scheduled.find((s) => s.recommendationId === dep);
          if (item) queue.push(item);
        }
      }
    }

    return maxLength;
  }

  /**
   * Get schedule by ID
   */
  getSchedule(id: string): ScheduledRecommendation | undefined {
    return this.schedules.get(id);
  }

  /**
   * Get schedules for a brand
   */
  getBrandSchedules(brandId: string): ScheduledRecommendation[] {
    const ids = this.byBrand.get(brandId) || [];
    return ids
      .map((id) => this.schedules.get(id))
      .filter((s): s is ScheduledRecommendation => s !== undefined);
  }

  /**
   * Get schedules for a date
   */
  getDateSchedules(date: Date): ScheduledRecommendation[] {
    const dateKey = date.toISOString().split("T")[0];
    const ids = this.byDate.get(dateKey) || [];
    return ids
      .map((id) => this.schedules.get(id))
      .filter((s): s is ScheduledRecommendation => s !== undefined);
  }

  /**
   * Update schedule status
   */
  updateStatus(
    id: string,
    status: ScheduleStatus,
    actualDuration?: number
  ): ScheduledRecommendation | undefined {
    const schedule = this.schedules.get(id);
    if (!schedule) return undefined;

    schedule.status = status;
    schedule.updatedAt = new Date();

    if (actualDuration !== undefined) {
      schedule.actualDuration = actualDuration;
    }

    this.schedules.set(id, schedule);

    // Handle cascading effects
    if (status === "completed") {
      this.unblockDependents(schedule.recommendationId);
    } else if (status === "blocked" || status === "skipped") {
      this.blockDependents(schedule.recommendationId);
    }

    return schedule;
  }

  /**
   * Unblock items that depend on completed item
   */
  private unblockDependents(recommendationId: string): void {
    for (const [id, schedule] of this.schedules) {
      if (schedule.blockedBy.includes(recommendationId)) {
        schedule.blockedBy = schedule.blockedBy.filter((b) => b !== recommendationId);
        if (schedule.blockedBy.length === 0 && schedule.status === "blocked") {
          schedule.status = "scheduled";
        }
        schedule.updatedAt = new Date();
        this.schedules.set(id, schedule);
      }
    }
  }

  /**
   * Block items that depend on blocked/skipped item
   */
  private blockDependents(recommendationId: string): void {
    for (const [id, schedule] of this.schedules) {
      if (schedule.dependencies.includes(recommendationId)) {
        if (!schedule.blockedBy.includes(recommendationId)) {
          schedule.blockedBy.push(recommendationId);
        }
        schedule.status = "blocked";
        schedule.updatedAt = new Date();
        this.schedules.set(id, schedule);
      }
    }
  }

  /**
   * Reschedule an item
   */
  reschedule(
    id: string,
    newDate: Date
  ): ScheduledRecommendation | undefined {
    const schedule = this.schedules.get(id);
    if (!schedule) return undefined;

    // Remove from old date index
    const oldDateKey = schedule.scheduledFor.toISOString().split("T")[0];
    const oldDateSchedules = this.byDate.get(oldDateKey) || [];
    this.byDate.set(
      oldDateKey,
      oldDateSchedules.filter((s) => s !== id)
    );

    // Update schedule
    schedule.scheduledFor = newDate;
    schedule.updatedAt = new Date();
    this.schedules.set(id, schedule);

    // Add to new date index
    const newDateKey = newDate.toISOString().split("T")[0];
    const newDateSchedules = this.byDate.get(newDateKey) || [];
    newDateSchedules.push(id);
    this.byDate.set(newDateKey, newDateSchedules);

    return schedule;
  }

  /**
   * Get overdue schedules
   */
  getOverdueSchedules(): ScheduledRecommendation[] {
    const now = new Date();
    const overdue: ScheduledRecommendation[] = [];

    for (const schedule of this.schedules.values()) {
      if (
        schedule.deadline &&
        schedule.deadline < now &&
        schedule.status !== "completed" &&
        schedule.status !== "skipped"
      ) {
        schedule.status = "overdue";
        this.schedules.set(schedule.id, schedule);
        overdue.push(schedule);
      }
    }

    return overdue;
  }

  /**
   * Get upcoming schedules
   */
  getUpcomingSchedules(days: number = 7): ScheduledRecommendation[] {
    const now = new Date();
    const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    return Array.from(this.schedules.values())
      .filter(
        (s) =>
          s.scheduledFor >= now &&
          s.scheduledFor <= future &&
          s.status === "scheduled"
      )
      .sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime());
  }

  /**
   * Get schedule statistics
   */
  getStatistics(): {
    total: number;
    byStatus: Record<ScheduleStatus, number>;
    completionRate: number;
    averageDuration: number;
    overdueCount: number;
  } {
    const stats: Record<ScheduleStatus, number> = {
      pending: 0,
      scheduled: 0,
      in_progress: 0,
      completed: 0,
      skipped: 0,
      blocked: 0,
      overdue: 0,
    };

    let totalDuration = 0;
    let completedCount = 0;

    for (const schedule of this.schedules.values()) {
      stats[schedule.status]++;
      if (schedule.actualDuration !== undefined) {
        totalDuration += schedule.actualDuration;
        completedCount++;
      }
    }

    const total = this.schedules.size;
    const completionRate = total > 0 ? stats.completed / total : 0;
    const averageDuration = completedCount > 0 ? totalDuration / completedCount : 0;

    return {
      total,
      byStatus: stats,
      completionRate,
      averageDuration,
      overdueCount: stats.overdue,
    };
  }
}

// Export singleton scheduler
export const autoScheduler = new AutoScheduler();

/**
 * Convenience function to schedule recommendations
 */
export function scheduleRecommendations(
  recommendations: Recommendation[],
  brandId: string,
  options?: {
    startDate?: Date;
    assignees?: string[];
    respectDependencies?: boolean;
  }
): ScheduleResult {
  return autoScheduler.scheduleRecommendations(recommendations, brandId, options);
}

/**
 * Format schedule for API response
 */
export function formatScheduleResponse(schedule: ScheduledRecommendation) {
  return {
    id: schedule.id,
    recommendationId: schedule.recommendationId,
    scheduledFor: schedule.scheduledFor.toISOString(),
    deadline: schedule.deadline?.toISOString() || null,
    status: schedule.status,
    assignee: schedule.assignee,
    estimatedDuration: schedule.estimatedDuration,
    actualDuration: schedule.actualDuration,
    dependencies: schedule.dependencies,
    blockedBy: schedule.blockedBy,
    priority: schedule.priority,
  };
}
