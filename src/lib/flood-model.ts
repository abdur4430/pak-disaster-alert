/**
 * Flood risk prediction model.
 *
 * Combines 5 weighted factors into a 0-100 risk score:
 * 1. Accumulated Rainfall (35%) — crowdsourced reports in catchment over 72h
 * 2. Forecast Rain (25%) — Open-Meteo next 48h precipitation
 * 3. Elevation Factor (20%) — point elevation vs surrounding average
 * 4. Soil Drainage (10%) — sandy=drains well, clay=retains water
 * 5. Historical Pattern (10%) — current vs 5-year seasonal average
 */

import { FLOOD_MODEL_WEIGHTS, FLOOD_RISK_LEVELS } from "@/lib/constants";
import type {
  FloodRiskLevel,
  FloodContributingFactors,
  FloodPrediction,
} from "@/lib/types";

export interface FloodModelInput {
  latitude: number;
  longitude: number;
  /** Total accumulated rainfall (mm) from crowdsourced reports in catchment area over 72h. */
  accumulated_rainfall_mm: number;
  /** Number of rain reports in the catchment. */
  report_count: number;
  /** Forecasted precipitation total (mm) for next 48h. */
  forecast_rain_mm: number;
  /** Elevation of the point in meters. */
  elevation: number;
  /** Average elevation of surrounding area in meters. */
  surrounding_elevation_avg: number;
  /** Soil drainage score 0-100 (100 = drains well). */
  drainage_score: number;
  /** Current period precipitation (mm). */
  current_precipitation_mm: number;
  /** 5-year seasonal average precipitation (mm). */
  historical_avg_mm: number;
}

/**
 * Logarithmic scaling for rainfall — diminishing returns above thresholds.
 * 0mm → 0, 50mm → ~50, 150mm → ~80, 300mm+ → ~100
 */
function rainfallToScore(mm: number): number {
  if (mm <= 0) return 0;
  return Math.min(100, 25 * Math.log2(1 + mm / 10));
}

/**
 * Convert elevation difference to risk score.
 * Negative difference (point is lower) → higher risk.
 */
function elevationToScore(
  pointElevation: number,
  surroundingAvg: number
): number {
  const diff = surroundingAvg - pointElevation;
  // If point is 50m+ below surroundings → max risk
  if (diff >= 50) return 100;
  if (diff <= -50) return 0;
  // Linear interpolation
  return Math.max(0, Math.min(100, 50 + diff));
}

/**
 * Convert drainage score to flood risk (inverted — poor drainage = high risk).
 */
function drainageToRisk(drainageScore: number): number {
  return 100 - drainageScore;
}

/**
 * Compare current precipitation to historical average.
 * Above average → higher risk.
 */
function historicalToScore(current: number, historical: number): number {
  if (historical <= 0) return current > 0 ? 70 : 30;
  const ratio = current / historical;
  // ratio 0 → 0, 1 → 40, 2 → 80, 3+ → 100
  return Math.min(100, ratio * 40);
}

/** Map a 0-100 score to a risk level. */
function scoreToLevel(score: number): FloodRiskLevel {
  for (const level of FLOOD_RISK_LEVELS) {
    if (score < level.max) return level.id;
  }
  return "extreme";
}

/**
 * Compute flood risk prediction from all input factors.
 */
export function computeFloodRisk(input: FloodModelInput): FloodPrediction {
  const rainfallScore = rainfallToScore(input.accumulated_rainfall_mm);
  const forecastScore = rainfallToScore(input.forecast_rain_mm);
  const elevationScore = elevationToScore(
    input.elevation,
    input.surrounding_elevation_avg
  );
  const drainageRisk = drainageToRisk(input.drainage_score);
  const historicalScore = historicalToScore(
    input.current_precipitation_mm,
    input.historical_avg_mm
  );

  const risk_score = Math.round(
    rainfallScore * FLOOD_MODEL_WEIGHTS.accumulated_rainfall +
      forecastScore * FLOOD_MODEL_WEIGHTS.forecast_rain +
      elevationScore * FLOOD_MODEL_WEIGHTS.elevation +
      drainageRisk * FLOOD_MODEL_WEIGHTS.soil_drainage +
      historicalScore * FLOOD_MODEL_WEIGHTS.historical_pattern
  );

  const contributing_factors: FloodContributingFactors = {
    accumulated_rainfall: {
      score: Math.round(rainfallScore),
      detail: `${input.accumulated_rainfall_mm.toFixed(1)}mm from ${input.report_count} reports in 72h`,
    },
    forecast_rain: {
      score: Math.round(forecastScore),
      detail: `${input.forecast_rain_mm.toFixed(1)}mm forecasted next 48h`,
    },
    elevation: {
      score: Math.round(elevationScore),
      detail: `${input.elevation.toFixed(0)}m (area avg: ${input.surrounding_elevation_avg.toFixed(0)}m)`,
    },
    soil_drainage: {
      score: Math.round(drainageRisk),
      detail: `Drainage score: ${input.drainage_score.toFixed(0)}/100`,
    },
    historical_pattern: {
      score: Math.round(historicalScore),
      detail: `${input.current_precipitation_mm.toFixed(1)}mm vs ${input.historical_avg_mm.toFixed(1)}mm seasonal avg`,
    },
  };

  return {
    latitude: input.latitude,
    longitude: input.longitude,
    risk_score: Math.min(100, Math.max(0, risk_score)),
    risk_level: scoreToLevel(risk_score),
    contributing_factors,
    report_count: input.report_count,
    computed_at: new Date().toISOString(),
  };
}
