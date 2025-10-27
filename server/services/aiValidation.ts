import { db } from "../db";
import { groundTruthDatasets, validationRuns, type GroundTruthDataset } from "@shared/schema";
import { extractFromFile, type ExtractionResult } from "./aiExtraction";
import { eq } from "drizzle-orm";
import fs from "fs/promises";

export interface ValidationResult {
  datasetId: string;
  runId: string;
  accuracyOverall: number;
  accuracyByField: {
    fundName: boolean;
    fundSize: boolean;
    vintage: boolean;
    portfolioCount: boolean;
    sectors: number; // percentage
    gpName: boolean;
    gpFirmName: boolean;
    strategy: boolean;
    geography: boolean;
    contactInfo: boolean;
  };
  confidenceScores: {
    overall: number;
    fundName: number;
    fundSize: number;
    vintage: number;
    portfolioCount: number;
    gpInfo: number;
  };
  processingTimeMs: number;
  passed: boolean; // >= 95% accuracy
}

/**
 * Compare two strings for approximate equality (case-insensitive, whitespace normalized)
 */
function stringsApproximatelyEqual(
  str1: string | null | undefined,
  str2: string | null | undefined,
  threshold = 0.85
): boolean {
  if (!str1 && !str2) return true; // both null/undefined
  if (!str1 || !str2) return false; // one is null/undefined
  
  const normalize = (s: string) => 
    s.toLowerCase().replace(/\s+/g, " ").trim();
  
  const normalized1 = normalize(str1);
  const normalized2 = normalize(str2);
  
  // Exact match after normalization
  if (normalized1 === normalized2) return true;
  
  // Check if one contains the other (for partial matches)
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
    return true;
  }
  
  // Calculate Levenshtein distance for similarity
  const distance = levenshteinDistance(normalized1, normalized2);
  const maxLength = Math.max(normalized1.length, normalized2.length);
  const similarity = 1 - distance / maxLength;
  
  return similarity >= threshold;
}

/**
 * Levenshtein distance algorithm for string similarity
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * Compare numbers with tolerance (within 10% for fund size)
 */
function numbersApproximatelyEqual(
  num1: number | string | null | undefined,
  num2: number | string | null | undefined,
  tolerancePercent = 10
): boolean {
  if (!num1 && !num2) return true;
  if (!num1 || !num2) return false;
  
  const n1 = typeof num1 === "string" ? parseFloat(num1) : num1;
  const n2 = typeof num2 === "string" ? parseFloat(num2) : num2;
  
  if (isNaN(n1) || isNaN(n2)) return false;
  
  const tolerance = Math.abs(n2) * (tolerancePercent / 100);
  return Math.abs(n1 - n2) <= tolerance;
}

/**
 * Compare arrays of sectors
 */
function calculateSectorAccuracy(
  extracted: string[] | null | undefined,
  expected: string[] | null | undefined
): number {
  if (!extracted && !expected) return 100;
  if (!extracted || !expected) return 0;
  if (extracted.length === 0 && expected.length === 0) return 100;
  if (extracted.length === 0 || expected.length === 0) return 0;
  
  // Count how many expected sectors are found in extracted
  let matchCount = 0;
  for (const expectedSector of expected) {
    for (const extractedSector of extracted) {
      if (stringsApproximatelyEqual(expectedSector, extractedSector, 0.8)) {
        matchCount++;
        break;
      }
    }
  }
  
  // Calculate accuracy as percentage of expected sectors found
  return (matchCount / expected.length) * 100;
}

/**
 * Run validation test on a ground truth dataset
 */
export async function runValidation(datasetId: string): Promise<ValidationResult> {
  const startTime = Date.now();
  
  // Fetch ground truth dataset
  const [dataset] = await db
    .select()
    .from(groundTruthDatasets)
    .where(eq(groundTruthDatasets.id, datasetId))
    .limit(1);
  
  if (!dataset) {
    throw new Error(`Ground truth dataset not found: ${datasetId}`);
  }
  
  // Read test document
  let fileBuffer: Buffer;
  try {
    fileBuffer = await fs.readFile(dataset.documentPath);
  } catch (error) {
    throw new Error(
      `Failed to read test document at ${dataset.documentPath}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
  
  // Run AI extraction
  const extractionResult: ExtractionResult = await extractFromFile(
    fileBuffer,
    dataset.documentType
  );
  
  const processingTimeMs = Date.now() - startTime;
  
  // Calculate accuracy for each field
  const accuracyFundName = stringsApproximatelyEqual(
    extractionResult.fundName,
    dataset.expectedFundName
  );
  
  const accuracyFundSize = numbersApproximatelyEqual(
    extractionResult.fundSize,
    dataset.expectedFundSize,
    10 // 10% tolerance
  );
  
  const accuracyVintage = extractionResult.vintage === (dataset.expectedVintage || null);
  
  const accuracyPortfolioCount = 
    extractionResult.portfolioCount === (dataset.expectedPortfolioCount || null);
  
  const accuracySectorsPercent = calculateSectorAccuracy(
    extractionResult.sectors,
    dataset.expectedSectors
  );
  
  const accuracyGpName = stringsApproximatelyEqual(
    extractionResult.gpName,
    dataset.expectedGpName
  );
  
  const accuracyGpFirmName = stringsApproximatelyEqual(
    extractionResult.gpFirmName,
    dataset.expectedGpFirmName
  );
  
  const accuracyStrategy = stringsApproximatelyEqual(
    extractionResult.strategy,
    dataset.expectedStrategy
  );
  
  const accuracyGeography = stringsApproximatelyEqual(
    extractionResult.geography,
    dataset.expectedGeography
  );
  
  const accuracyContactInfo = 
    stringsApproximatelyEqual(extractionResult.contactEmail, dataset.expectedContactEmail) ||
    stringsApproximatelyEqual(extractionResult.contactName, dataset.expectedContactName);
  
  // Calculate overall accuracy (weighted average)
  // Critical fields: fundName (20%), fundSize (20%), vintage (15%)
  // Important fields: portfolioCount (10%), sectors (10%), GP info (15%)
  // Supporting fields: strategy (5%), geography (3%), contact (2%)
  const accuracyOverall = 
    (accuracyFundName ? 20 : 0) +
    (accuracyFundSize ? 20 : 0) +
    (accuracyVintage ? 15 : 0) +
    (accuracyPortfolioCount ? 10 : 0) +
    (accuracySectorsPercent * 0.1) + // 10% weight for sectors
    (accuracyGpName ? 7.5 : 0) +
    (accuracyGpFirmName ? 7.5 : 0) +
    (accuracyStrategy ? 5 : 0) +
    (accuracyGeography ? 3 : 0) +
    (accuracyContactInfo ? 2 : 0);
  
  // Store validation run in database
  const [validationRun] = await db
    .insert(validationRuns)
    .values({
      datasetId,
      extractedFundName: extractionResult.fundName,
      extractedFundSize: extractionResult.fundSize?.toString() || null,
      extractedVintage: extractionResult.vintage,
      extractedPortfolioCount: extractionResult.portfolioCount,
      extractedSectors: extractionResult.sectors,
      extractedGpName: extractionResult.gpName,
      extractedGpFirmName: extractionResult.gpFirmName,
      extractedGpTrackRecord: extractionResult.gpTrackRecord,
      extractedFundStructure: extractionResult.fundStructure,
      extractedStrategy: extractionResult.strategy,
      extractedGeography: extractionResult.geography,
      extractedContactName: extractionResult.contactName,
      extractedContactEmail: extractionResult.contactEmail,
      extractedContactPhone: extractionResult.contactPhone,
      confidenceOverall: extractionResult.confidence.overall,
      confidenceFundName: extractionResult.confidence.fundName,
      confidenceFundSize: extractionResult.confidence.fundSize,
      confidenceVintage: extractionResult.confidence.vintage,
      confidencePortfolioCount: extractionResult.confidence.portfolioCount,
      confidenceGpInfo: extractionResult.confidence.gpInfo,
      accuracyOverall: accuracyOverall.toString(),
      accuracyFundName,
      accuracyFundSize,
      accuracyVintage,
      accuracyPortfolioCount,
      accuracySectors: accuracySectorsPercent.toString(),
      accuracyGpName,
      accuracyGpFirmName,
      accuracyStrategy,
      accuracyGeography,
      accuracyContactInfo,
      processingTimeMs,
      runType: "automated",
    })
    .returning();
  
  return {
    datasetId,
    runId: validationRun.id,
    accuracyOverall,
    accuracyByField: {
      fundName: accuracyFundName,
      fundSize: accuracyFundSize,
      vintage: accuracyVintage,
      portfolioCount: accuracyPortfolioCount,
      sectors: accuracySectorsPercent,
      gpName: accuracyGpName,
      gpFirmName: accuracyGpFirmName,
      strategy: accuracyStrategy,
      geography: accuracyGeography,
      contactInfo: accuracyContactInfo,
    },
    confidenceScores: extractionResult.confidence,
    processingTimeMs,
    passed: accuracyOverall >= 95,
  };
}

/**
 * Run validation on all active ground truth datasets
 */
export async function runAllValidations(): Promise<ValidationResult[]> {
  const datasets = await db
    .select()
    .from(groundTruthDatasets)
    .where(eq(groundTruthDatasets.active, true));
  
  const results: ValidationResult[] = [];
  
  for (const dataset of datasets) {
    try {
      const result = await runValidation(dataset.id);
      results.push(result);
    } catch (error) {
      console.error(`Validation failed for dataset ${dataset.id}:`, error);
      // Continue with other datasets even if one fails
    }
  }
  
  return results;
}
