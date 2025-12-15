/**
 * ML-based Priority Adjustment (F114)
 * Machine learning model to optimize recommendation priority based on historical outcomes
 */

import { feedbackManager, type TrainingData } from "./feedback";

// ML Model types
export interface MLPriorityModel {
  version: string;
  trainedAt: Date;
  sampleCount: number;
  weights: MLWeights;
  categoryAdjustments: Record<string, number>;
  sourceAdjustments: Record<string, number>;
  performanceMetrics: ModelMetrics;
}

export interface MLWeights {
  baseImpact: number;
  baseEffort: number;
  baseUrgency: number;
  baseConfidence: number;
  ratingMultiplier: number;
  implementationBonus: number;
  successBonus: number;
  impactMultiplier: number;
}

export interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  mse: number; // Mean squared error for regression
  trainingLoss: number;
  validationLoss: number;
}

export interface PredictionResult {
  adjustedScore: number;
  originalScore: number;
  adjustment: number;
  confidence: number;
  factors: PredictionFactors;
}

export interface PredictionFactors {
  categoryFactor: number;
  sourceFactor: number;
  historicalFactor: number;
  complexityFactor: number;
}

// Default model weights (before training)
const DEFAULT_WEIGHTS: MLWeights = {
  baseImpact: 0.4,
  baseEffort: 0.3,
  baseUrgency: 0.2,
  baseConfidence: 0.1,
  ratingMultiplier: 0.15,
  implementationBonus: 0.1,
  successBonus: 0.2,
  impactMultiplier: 0.25,
};

/**
 * ML Priority Adjustment Engine
 */
export class MLPriorityEngine {
  private model: MLPriorityModel;
  private trainingData: TrainingData[] = [];
  private isTraining: boolean = false;

  constructor() {
    this.model = this.initializeModel();
  }

  /**
   * Initialize model with default weights
   */
  private initializeModel(): MLPriorityModel {
    return {
      version: "1.0.0",
      trainedAt: new Date(),
      sampleCount: 0,
      weights: { ...DEFAULT_WEIGHTS },
      categoryAdjustments: {},
      sourceAdjustments: {},
      performanceMetrics: {
        accuracy: 0,
        precision: 0,
        recall: 0,
        f1Score: 0,
        mse: 1,
        trainingLoss: 1,
        validationLoss: 1,
      },
    };
  }

  /**
   * Train the model on historical feedback data
   */
  async train(options: { epochs?: number; learningRate?: number } = {}): Promise<ModelMetrics> {
    if (this.isTraining) {
      throw new Error("Model is already training");
    }

    this.isTraining = true;

    try {
      const { epochs = 100, learningRate = 0.01 } = options;

      // Get training data from feedback manager
      this.trainingData = feedbackManager.exportForTraining();

      if (this.trainingData.length < 10) {
        // Not enough data, return current metrics
        return this.model.performanceMetrics;
      }

      // Split data into training and validation sets
      const splitIndex = Math.floor(this.trainingData.length * 0.8);
      const trainingSet = this.trainingData.slice(0, splitIndex);
      const validationSet = this.trainingData.slice(splitIndex);

      // Gradient descent training
      for (let epoch = 0; epoch < epochs; epoch++) {
        const trainingLoss = this.trainEpoch(trainingSet, learningRate);
        const validationLoss = this.validate(validationSet);

        // Early stopping if validation loss increases
        if (
          epoch > 10 &&
          validationLoss > this.model.performanceMetrics.validationLoss * 1.1
        ) {
          break;
        }

        this.model.performanceMetrics.trainingLoss = trainingLoss;
        this.model.performanceMetrics.validationLoss = validationLoss;
      }

      // Calculate category and source adjustments
      this.calculateCategoryAdjustments(trainingSet);
      this.calculateSourceAdjustments(trainingSet);

      // Calculate final metrics
      this.calculateMetrics(validationSet);

      // Update model metadata
      this.model.trainedAt = new Date();
      this.model.sampleCount = this.trainingData.length;
      this.model.version = this.incrementVersion(this.model.version);

      return this.model.performanceMetrics;
    } finally {
      this.isTraining = false;
    }
  }

  /**
   * Train a single epoch
   */
  private trainEpoch(data: TrainingData[], learningRate: number): number {
    let totalLoss = 0;

    for (const sample of data) {
      // Calculate predicted score
      const predicted = this.predictFromSample(sample);

      // Calculate actual score (based on outcome)
      const actual = this.calculateActualScore(sample);

      // Calculate error
      const error = actual - predicted;
      totalLoss += error * error;

      // Update weights using gradient descent
      this.updateWeights(sample, error, learningRate);
    }

    return totalLoss / data.length;
  }

  /**
   * Validate on held-out data
   */
  private validate(data: TrainingData[]): number {
    let totalLoss = 0;

    for (const sample of data) {
      const predicted = this.predictFromSample(sample);
      const actual = this.calculateActualScore(sample);
      const error = actual - predicted;
      totalLoss += error * error;
    }

    return totalLoss / data.length;
  }

  /**
   * Predict score from training sample
   */
  private predictFromSample(sample: TrainingData): number {
    const weights = this.model.weights;

    // Base score from rating
    let score = (sample.rating / 5) * weights.ratingMultiplier;

    // Implementation bonus
    if (sample.implemented) {
      score += weights.implementationBonus;
    }

    // Success bonus
    if (sample.success) {
      score += weights.successBonus;
    }

    // Impact multiplier
    if (sample.impact !== undefined) {
      score += (sample.impact / 100) * weights.impactMultiplier;
    }

    // Effort adjustment (inverse - lower effort = higher score)
    if (sample.effortRating !== undefined) {
      score += ((6 - sample.effortRating) / 5) * weights.baseEffort;
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Calculate actual score from outcomes
   */
  private calculateActualScore(sample: TrainingData): number {
    let score = 0;

    // Rating contribution (normalized)
    score += sample.rating / 5 * 0.2;

    // Helpful contribution
    if (sample.helpful) score += 0.2;

    // Implementation success
    if (sample.implemented && sample.success) {
      score += 0.4;
    } else if (sample.implemented) {
      score += 0.2;
    }

    // Measured impact
    if (sample.impact !== undefined) {
      score += (sample.impact / 100) * 0.2;
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Update weights using gradient descent
   */
  private updateWeights(sample: TrainingData, error: number, learningRate: number): void {
    const weights = this.model.weights;

    // Update rating multiplier
    weights.ratingMultiplier += learningRate * error * (sample.rating / 5);

    // Update implementation bonus
    if (sample.implemented) {
      weights.implementationBonus += learningRate * error;
    }

    // Update success bonus
    if (sample.success) {
      weights.successBonus += learningRate * error;
    }

    // Update impact multiplier
    if (sample.impact !== undefined) {
      weights.impactMultiplier += learningRate * error * (sample.impact / 100);
    }

    // Clamp weights to reasonable ranges
    weights.ratingMultiplier = Math.max(0.05, Math.min(0.5, weights.ratingMultiplier));
    weights.implementationBonus = Math.max(0, Math.min(0.3, weights.implementationBonus));
    weights.successBonus = Math.max(0, Math.min(0.4, weights.successBonus));
    weights.impactMultiplier = Math.max(0.1, Math.min(0.5, weights.impactMultiplier));
  }

  /**
   * Calculate category-specific adjustments
   */
  private calculateCategoryAdjustments(data: TrainingData[]): void {
    const categoryScores: Record<string, { total: number; count: number }> = {};

    // This would normally use recommendation categories, but we'll use tags as proxy
    for (const sample of data) {
      for (const tag of sample.tags) {
        if (!categoryScores[tag]) {
          categoryScores[tag] = { total: 0, count: 0 };
        }
        categoryScores[tag].total += this.calculateActualScore(sample);
        categoryScores[tag].count++;
      }
    }

    // Calculate average score per category
    const globalAvg = data.reduce((sum, s) => sum + this.calculateActualScore(s), 0) / data.length;

    for (const [category, scores] of Object.entries(categoryScores)) {
      const avgScore = scores.total / scores.count;
      // Adjustment is relative to global average
      this.model.categoryAdjustments[category] = avgScore / globalAvg;
    }
  }

  /**
   * Calculate source-specific adjustments
   */
  private calculateSourceAdjustments(data: TrainingData[]): void {
    // In a real implementation, this would track recommendation sources
    // For now, we'll set default adjustments
    this.model.sourceAdjustments = {
      monitor: 1.0,
      audit: 1.1,
      competitor: 0.9,
      manual: 1.0,
    };
  }

  /**
   * Calculate final metrics
   */
  private calculateMetrics(validationSet: TrainingData[]): void {
    if (validationSet.length === 0) return;

    let tp = 0, fp = 0, tn = 0, fn = 0;
    let totalSquaredError = 0;

    const threshold = 0.5;

    for (const sample of validationSet) {
      const predicted = this.predictFromSample(sample);
      const actual = this.calculateActualScore(sample);

      // For regression MSE
      totalSquaredError += (actual - predicted) ** 2;

      // For classification metrics (threshold-based)
      const predictedPositive = predicted >= threshold;
      const actualPositive = actual >= threshold;

      if (predictedPositive && actualPositive) tp++;
      else if (predictedPositive && !actualPositive) fp++;
      else if (!predictedPositive && !actualPositive) tn++;
      else fn++;
    }

    const accuracy = (tp + tn) / validationSet.length;
    const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
    const f1Score = precision + recall > 0 ? 2 * (precision * recall) / (precision + recall) : 0;
    const mse = totalSquaredError / validationSet.length;

    this.model.performanceMetrics = {
      ...this.model.performanceMetrics,
      accuracy,
      precision,
      recall,
      f1Score,
      mse,
    };
  }

  /**
   * Adjust priority score using trained model
   */
  adjustPriority(params: {
    originalScore: number;
    category?: string;
    source?: string;
    complexity?: number;
    historicalSuccessRate?: number;
  }): PredictionResult {
    const { originalScore, category, source, complexity = 0.5, historicalSuccessRate = 0.5 } = params;

    // Category adjustment
    const categoryFactor = category
      ? this.model.categoryAdjustments[category] || 1.0
      : 1.0;

    // Source adjustment
    const sourceFactor = source
      ? this.model.sourceAdjustments[source] || 1.0
      : 1.0;

    // Historical success adjustment
    const historicalFactor = 0.8 + historicalSuccessRate * 0.4; // Range: 0.8 - 1.2

    // Complexity adjustment (simpler = higher score)
    const complexityFactor = 1.2 - complexity * 0.4; // Range: 0.8 - 1.2

    // Calculate adjustment
    const combinedFactor = categoryFactor * sourceFactor * historicalFactor * complexityFactor;
    const adjustment = (combinedFactor - 1) * originalScore;
    const adjustedScore = Math.max(0, Math.min(100, originalScore + adjustment * 100));

    // Calculate confidence based on training data amount and model performance
    const confidence = Math.min(
      0.95,
      0.5 + (this.model.sampleCount / 1000) * 0.25 + this.model.performanceMetrics.accuracy * 0.2
    );

    return {
      adjustedScore,
      originalScore,
      adjustment: adjustedScore - originalScore,
      confidence,
      factors: {
        categoryFactor,
        sourceFactor,
        historicalFactor,
        complexityFactor,
      },
    };
  }

  /**
   * Batch adjust priorities
   */
  batchAdjustPriorities(
    recommendations: Array<{
      id: string;
      originalScore: number;
      category?: string;
      source?: string;
      complexity?: number;
    }>
  ): Map<string, PredictionResult> {
    const results = new Map<string, PredictionResult>();

    for (const rec of recommendations) {
      results.set(rec.id, this.adjustPriority({
        originalScore: rec.originalScore,
        category: rec.category,
        source: rec.source,
        complexity: rec.complexity,
      }));
    }

    return results;
  }

  /**
   * Get model info
   */
  getModelInfo(): MLPriorityModel {
    return { ...this.model };
  }

  /**
   * Get model performance metrics
   */
  getMetrics(): ModelMetrics {
    return { ...this.model.performanceMetrics };
  }

  /**
   * Check if model needs retraining
   */
  needsRetraining(options: {
    maxAge?: number; // Max model age in hours
    minAccuracy?: number;
    newDataThreshold?: number;
  } = {}): boolean {
    const {
      maxAge = 24,
      minAccuracy = 0.7,
      newDataThreshold = 100,
    } = options;

    // Check model age
    const modelAge = (Date.now() - this.model.trainedAt.getTime()) / (1000 * 60 * 60);
    if (modelAge > maxAge) return true;

    // Check accuracy
    if (this.model.performanceMetrics.accuracy < minAccuracy) return true;

    // Check if significant new data available
    const currentDataCount = feedbackManager.exportForTraining().length;
    if (currentDataCount - this.model.sampleCount > newDataThreshold) return true;

    return false;
  }

  /**
   * Export model for persistence
   */
  exportModel(): string {
    return JSON.stringify(this.model, null, 2);
  }

  /**
   * Import model from persistence
   */
  importModel(modelJson: string): void {
    const imported = JSON.parse(modelJson) as MLPriorityModel;
    imported.trainedAt = new Date(imported.trainedAt);
    this.model = imported;
  }

  /**
   * Increment version string
   */
  private incrementVersion(version: string): string {
    const parts = version.split(".").map(Number);
    parts[2]++;
    if (parts[2] >= 100) {
      parts[2] = 0;
      parts[1]++;
    }
    if (parts[1] >= 100) {
      parts[1] = 0;
      parts[0]++;
    }
    return parts.join(".");
  }
}

/**
 * Create singleton ML engine
 */
export const mlPriorityEngine = new MLPriorityEngine();

/**
 * Convenience function to adjust priority
 */
export function adjustPriority(
  originalScore: number,
  options: {
    category?: string;
    source?: string;
    complexity?: number;
    historicalSuccessRate?: number;
  } = {}
): PredictionResult {
  return mlPriorityEngine.adjustPriority({ originalScore, ...options });
}

/**
 * Convenience function to train model
 */
export async function trainModel(options?: {
  epochs?: number;
  learningRate?: number;
}): Promise<ModelMetrics> {
  return mlPriorityEngine.train(options);
}
