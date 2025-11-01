interface BulkOperation {
  id: string;
  type: 'delete' | 'update' | 'publish' | 'unpublish' | 'export' | 'import' | 'duplicate';
  entityType: 'book' | 'chapter' | 'page' | 'post' | 'media' | 'user';
  entityIds: string[];
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  totalItems: number;
  processedItems: number;
  successCount: number;
  errorCount: number;
  errors: Array<{
    entityId: string;
    error: string;
  }>;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  createdBy: string;
  metadata?: Record<string, any>;
}

interface BulkOperationResult {
  success: boolean;
  operationId: string;
  totalProcessed: number;
  successCount: number;
  errorCount: number;
  errors: Array<{
    entityId: string;
    error: string;
  }>;
}

class BulkOperationsManager {
  private operations: Map<string, BulkOperation> = new Map();
  private runningOperations: Set<string> = new Set();
  private maxConcurrentOperations: number = 3;

  // Create a new bulk operation
  createOperation(
    type: BulkOperation['type'],
    entityType: BulkOperation['entityType'],
    entityIds: string[],
    createdBy: string,
    metadata?: Record<string, any>
  ): BulkOperation {
    const operation: BulkOperation = {
      id: `bulk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      entityType,
      entityIds,
      status: 'pending',
      progress: 0,
      totalItems: entityIds.length,
      processedItems: 0,
      successCount: 0,
      errorCount: 0,
      errors: [],
      createdAt: new Date().toISOString(),
      createdBy,
      metadata
    };

    this.operations.set(operation.id, operation);
    return operation;
  }

  // Start a bulk operation
  async startOperation(operationId: string): Promise<BulkOperationResult> {
    const operation = this.operations.get(operationId);
    if (!operation) {
      throw new Error('Operation not found');
    }

    if (operation.status !== 'pending') {
      throw new Error('Operation is not pending');
    }

    if (this.runningOperations.size >= this.maxConcurrentOperations) {
      throw new Error('Maximum concurrent operations reached');
    }

    operation.status = 'running';
    operation.startedAt = new Date().toISOString();
    this.runningOperations.add(operationId);

    try {
      const result = await this.executeOperation(operation);
      operation.status = 'completed';
      operation.completedAt = new Date().toISOString();
      operation.progress = 100;
      operation.successCount = result.successCount;
      operation.errorCount = result.errorCount;
      operation.errors = result.errors;

      this.runningOperations.delete(operationId);
      return result;
    } catch (error) {
      operation.status = 'failed';
      operation.completedAt = new Date().toISOString();
      operation.errors.push({
        entityId: 'system',
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      this.runningOperations.delete(operationId);
      throw error;
    }
  }

  // Execute the actual bulk operation
  private async executeOperation(operation: BulkOperation): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      success: true,
      operationId: operation.id,
      totalProcessed: 0,
      successCount: 0,
      errorCount: 0,
      errors: []
    };

    for (let i = 0; i < operation.entityIds.length; i++) {
      const entityId = operation.entityIds[i];
      
      try {
        await this.processEntity(operation, entityId);
        result.successCount++;
      } catch (error) {
        result.errorCount++;
        result.errors.push({
          entityId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      result.totalProcessed++;
      operation.processedItems = i + 1;
      operation.progress = Math.round(((i + 1) / operation.totalItems) * 100);
    }

    result.success = result.errorCount === 0;
    return result;
  }

  // Process individual entity
  private async processEntity(operation: BulkOperation, entityId: string): Promise<void> {
    switch (operation.type) {
      case 'delete':
        await this.deleteEntity(operation.entityType, entityId);
        break;
      case 'update':
        await this.updateEntity(operation.entityType, entityId, operation.metadata);
        break;
      case 'publish':
        await this.publishEntity(operation.entityType, entityId);
        break;
      case 'unpublish':
        await this.unpublishEntity(operation.entityType, entityId);
        break;
      case 'export':
        await this.exportEntity(operation.entityType, entityId);
        break;
      case 'duplicate':
        await this.duplicateEntity(operation.entityType, entityId);
        break;
      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }

  // Delete entity
  private async deleteEntity(entityType: string, entityId: string): Promise<void> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // In real implementation, call actual API
    console.log(`Deleting ${entityType} with ID: ${entityId}`);
  }

  // Update entity
  private async updateEntity(entityType: string, entityId: string, metadata?: Record<string, any>): Promise<void> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // In real implementation, call actual API
    console.log(`Updating ${entityType} with ID: ${entityId}`, metadata);
  }

  // Publish entity
  private async publishEntity(entityType: string, entityId: string): Promise<void> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // In real implementation, call actual API
    console.log(`Publishing ${entityType} with ID: ${entityId}`);
  }

  // Unpublish entity
  private async unpublishEntity(entityType: string, entityId: string): Promise<void> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // In real implementation, call actual API
    console.log(`Unpublishing ${entityType} with ID: ${entityId}`);
  }

  // Export entity
  private async exportEntity(entityType: string, entityId: string): Promise<void> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // In real implementation, call actual API
    console.log(`Exporting ${entityType} with ID: ${entityId}`);
  }

  // Duplicate entity
  private async duplicateEntity(entityType: string, entityId: string): Promise<void> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // In real implementation, call actual API
    console.log(`Duplicating ${entityType} with ID: ${entityId}`);
  }

  // Get operation status
  getOperation(operationId: string): BulkOperation | null {
    return this.operations.get(operationId) || null;
  }

  // Get all operations
  getAllOperations(): BulkOperation[] {
    return Array.from(this.operations.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // Get operations by user
  getOperationsByUser(userId: string): BulkOperation[] {
    return this.getAllOperations().filter(op => op.createdBy === userId);
  }

  // Get running operations
  getRunningOperations(): BulkOperation[] {
    return this.getAllOperations().filter(op => op.status === 'running');
  }

  // Cancel operation
  cancelOperation(operationId: string): boolean {
    const operation = this.operations.get(operationId);
    if (!operation || operation.status !== 'running') {
      return false;
    }

    operation.status = 'cancelled';
    operation.completedAt = new Date().toISOString();
    this.runningOperations.delete(operationId);
    
    return true;
  }

  // Delete operation
  deleteOperation(operationId: string): boolean {
    const operation = this.operations.get(operationId);
    if (!operation || operation.status === 'running') {
      return false;
    }

    this.operations.delete(operationId);
    return true;
  }

  // Get operation statistics
  getOperationStats(): {
    totalOperations: number;
    runningOperations: number;
    completedOperations: number;
    failedOperations: number;
    totalProcessed: number;
    totalSuccess: number;
    totalErrors: number;
  } {
    const operations = this.getAllOperations();
    
    return {
      totalOperations: operations.length,
      runningOperations: operations.filter(op => op.status === 'running').length,
      completedOperations: operations.filter(op => op.status === 'completed').length,
      failedOperations: operations.filter(op => op.status === 'failed').length,
      totalProcessed: operations.reduce((sum, op) => sum + op.processedItems, 0),
      totalSuccess: operations.reduce((sum, op) => sum + op.successCount, 0),
      totalErrors: operations.reduce((sum, op) => sum + op.errorCount, 0)
    };
  }

  // Cleanup old operations
  cleanupOldOperations(maxAge: number = 7 * 24 * 60 * 60 * 1000): number {
    const cutoffTime = Date.now() - maxAge;
    let deletedCount = 0;

    for (const [id, operation] of this.operations.entries()) {
      const operationTime = new Date(operation.createdAt).getTime();
      if (operationTime < cutoffTime && operation.status !== 'running') {
        this.operations.delete(id);
        deletedCount++;
      }
    }

    return deletedCount;
  }

  // Bulk delete books
  async bulkDeleteBooks(bookIds: string[], userId: string): Promise<BulkOperationResult> {
    const operation = this.createOperation('delete', 'book', bookIds, userId);
    return await this.startOperation(operation.id);
  }

  // Bulk update books
  async bulkUpdateBooks(bookIds: string[], updates: Record<string, any>, userId: string): Promise<BulkOperationResult> {
    const operation = this.createOperation('update', 'book', bookIds, userId, updates);
    return await this.startOperation(operation.id);
  }

  // Bulk publish books
  async bulkPublishBooks(bookIds: string[], userId: string): Promise<BulkOperationResult> {
    const operation = this.createOperation('publish', 'book', bookIds, userId);
    return await this.startOperation(operation.id);
  }

  // Bulk unpublish books
  async bulkUnpublishBooks(bookIds: string[], userId: string): Promise<BulkOperationResult> {
    const operation = this.createOperation('unpublish', 'book', bookIds, userId);
    return await this.startOperation(operation.id);
  }

  // Bulk export books
  async bulkExportBooks(bookIds: string[], userId: string): Promise<BulkOperationResult> {
    const operation = this.createOperation('export', 'book', bookIds, userId);
    return await this.startOperation(operation.id);
  }

  // Bulk duplicate books
  async bulkDuplicateBooks(bookIds: string[], userId: string): Promise<BulkOperationResult> {
    const operation = this.createOperation('duplicate', 'book', bookIds, userId);
    return await this.startOperation(operation.id);
  }
}

// Global bulk operations manager
const bulkOperationsManager = new BulkOperationsManager();

// Export manager and types
export { bulkOperationsManager };
export type { BulkOperation, BulkOperationResult };
export default bulkOperationsManager;
