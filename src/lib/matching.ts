import type { MatchLevel } from './types';

export interface MatchInput {
  distanceKm?: number;
  requestedQty?: number;
  availableQty: number;
  availableUntil: string; // ISO
}

/**
 * Simple rule-based matching using distance, quantity fit, and urgency.
 * Returns a match level and a human-readable reason.
 */
export function computeMatch(input: MatchInput): {
  level: MatchLevel;
  reason: string;
} {
  const { distanceKm, requestedQty, availableQty, availableUntil } = input;

  let score = 0;
  const reasons: string[] = [];

  // Distance scoring (max 40)
  if (distanceKm !== undefined) {
    if (distanceKm <= 5) {
      score += 40;
      reasons.push('nearby');
    } else if (distanceKm <= 15) {
      score += 25;
      reasons.push('moderate distance');
    } else if (distanceKm <= 30) {
      score += 10;
      reasons.push('far');
    } else {
      score += 0;
      reasons.push('very far');
    }
  }

  // Quantity fit scoring (max 30)
  if (requestedQty !== undefined && requestedQty > 0) {
    const ratio = requestedQty / availableQty;
    if (ratio <= 1 && ratio >= 0.5) {
      score += 30;
      reasons.push('quantity fits well');
    } else if (ratio < 0.5) {
      score += 15;
      reasons.push('small portion of surplus');
    } else if (ratio > 1 && ratio <= 1.5) {
      score += 10;
      reasons.push('slightly over available');
    } else {
      score += 0;
      reasons.push('quantity mismatch');
    }
  } else {
    // No explicit request quantity — judge by available surplus size
    if (availableQty >= 20) score += 25;
    else if (availableQty >= 10) score += 18;
    else score += 12;
  }

  // Urgency scoring (max 30) — more remaining time = better (easier to coordinate)
  const hoursLeft = (new Date(availableUntil).getTime() - Date.now()) / 3_600_000;
  if (hoursLeft >= 6) {
    score += 30;
    reasons.push('plenty of time');
  } else if (hoursLeft >= 3) {
    score += 20;
    reasons.push('few hours left');
  } else if (hoursLeft >= 1) {
    score += 10;
    reasons.push('urgent');
  } else {
    score += 3;
    reasons.push('very urgent');
  }

  let level: MatchLevel = 'low';
  if (score >= 70) level = 'good';
  else if (score >= 45) level = 'moderate';

  return { level, reason: reasons.join(' · ') };
}

export const MATCH_LABEL: Record<MatchLevel, string> = {
  good: 'Good Match',
  moderate: 'Moderate Match',
  low: 'Low Match',
};

export const MATCH_DOT: Record<MatchLevel, string> = {
  good: '🟢',
  moderate: '🟡',
  low: '⚪',
};
