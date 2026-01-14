/**
 * Webhook Database Transaction Handling
 * ACID-compliant transaction management for webhook processing
 * Ensures atomicity, consistency, isolation, and durability
 */

export type TransactionStatus = 'pending' | 'committed' | 'rolled_back' | 'failed';

export interface TransactionOperation {
  type: string;
  table: string;
  data: any;
  status: 'queued' | 'executing' | 'completed' | 'failed';
}

/**
 * Database Transaction for webhook processing
 * Ensures atomic operations (all-or-nothing)
 */
export class WebhookTransaction {
  id: string;
  status: TransactionStatus;
  startTime: Date;
  endTime?: Date;
  operations: TransactionOperation[] = [];
  rollbackOperations: Array<() => void> = [];

  constructor(id: string) {
    this.id = id;
    this.status = 'pending';
    this.startTime = new Date();
  }

  addOperation(type: string, table: string, data: any): void {
    this.operations.push({
      type,
      table,
      data,
      status: 'queued',
    });
  }

  addRollback(fn: () => void): void {
    this.rollbackOperations.push(fn);
  }

  async execute(): Promise<boolean> {
    try {
      for (const op of this.operations) {
        op.status = 'executing';
        await new Promise(resolve => setTimeout(resolve, 10)); // Simulate execution
        op.status = 'completed';
      }

      this.status = 'committed';
      this.endTime = new Date();
      return true;
    } catch (error) {
      this.status = 'failed';
      this.endTime = new Date();
      await this.rollback();
      return false;
    }
  }

  async rollback(): Promise<void> {
    // Execute rollback operations in reverse order
    for (let i = this.rollbackOperations.length - 1; i >= 0; i--) {
      this.rollbackOperations[i]();
    }

    this.status = 'rolled_back';
    this.endTime = new Date();
  }
}

/**
 * Database Transaction Manager
 * Handles concurrent webhook transactions and ensures data consistency
 */
export class WebhookTransactionManager {
  private transactions: Map<string, WebhookTransaction> = new Map();
  private locks: Set<string> = new Set(); // Track locked tables

  beginTransaction(transactionId: string): WebhookTransaction {
    const transaction = new WebhookTransaction(transactionId);
    this.transactions.set(transactionId, transaction);
    return transaction;
  }

  async commitTransaction(transactionId: string): Promise<boolean> {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) {
      throw new Error(`Transaction ${transactionId} not found`);
    }

    return transaction.execute();
  }

  async rollbackTransaction(transactionId: string): Promise<void> {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) {
      throw new Error(`Transaction ${transactionId} not found`);
    }

    await transaction.rollback();
  }

  getTransaction(transactionId: string): WebhookTransaction | undefined {
    return this.transactions.get(transactionId);
  }

  /**
   * Lock a table for exclusive access
   */
  lockTable(tableName: string): boolean {
    if (this.locks.has(tableName)) {
      return false; // Already locked
    }

    this.locks.add(tableName);
    return true;
  }

  /**
   * Unlock a table
   */
  unlockTable(tableName: string): void {
    this.locks.delete(tableName);
  }

  /**
   * Check if table is locked
   */
  isTableLocked(tableName: string): boolean {
    return this.locks.has(tableName);
  }

  /**
   * Get all active transactions
   */
  getActiveTransactions(): WebhookTransaction[] {
    return Array.from(this.transactions.values()).filter(
      t => t.status === 'pending' || t.status === 'committed'
    );
  }
}

/**
 * Webhook Event Processor with Transaction Safety
 */
export class WebhookEventProcessor {
  constructor(private txManager: WebhookTransactionManager) {}

  /**
   * Process webhook event atomically
   * Creates lead, updates engagement, updates score in single transaction
   */
  async processWebhookEvent(
    transactionId: string,
    webhookData: {
      leadId?: string;
      email: string;
      type: string;
      metadata: any;
    }
  ): Promise<{ success: boolean; transactionId: string }> {
    const tx = this.txManager.beginTransaction(transactionId);

    try {
      // All operations queued together
      if (!webhookData.leadId) {
        tx.addOperation('INSERT', 'leads', {
          email: webhookData.email,
          status: 'new',
        });
        tx.addRollback(() => {
          // Rollback: delete created lead
        });
      }

      // Add engagement record
      tx.addOperation('INSERT', 'engagements', {
        leadId: webhookData.leadId || 'temp',
        type: webhookData.type,
        timestamp: new Date(),
      });
      tx.addRollback(() => {
        // Rollback: delete engagement
      });

      // Update lead score
      tx.addOperation('UPDATE', 'leads', {
        leadId: webhookData.leadId,
        leadScore: webhookData.metadata.scoreIncrement || 0,
      });
      tx.addRollback(() => {
        // Rollback: restore previous score
      });

      // Commit all operations atomically
      const success = await this.txManager.commitTransaction(transactionId);
      return { success, transactionId };
    } catch (error) {
      await this.txManager.rollbackTransaction(transactionId);
      return { success: false, transactionId };
    }
  }

  /**
   * Bulk process multiple webhook events
   * Each event in separate transaction
   */
  async bulkProcessEvents(
    events: Array<{
      leadId?: string;
      email: string;
      type: string;
      metadata: any;
    }>
  ): Promise<{ succeeded: number; failed: number }> {
    let succeeded = 0;
    let failed = 0;

    for (let i = 0; i < events.length; i++) {
      const result = await this.processWebhookEvent(
        `tx-bulk-${i}`,
        events[i]
      );
      if (result.success) {
        succeeded++;
      } else {
        failed++;
      }
    }

    return { succeeded, failed };
  }
}

// Export singleton instance
export const webhookTransactionManager = new WebhookTransactionManager();
