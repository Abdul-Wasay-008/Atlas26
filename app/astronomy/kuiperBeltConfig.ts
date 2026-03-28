import { keplerPeriodDays } from "./planetOrbit";
import { quality } from "@/app/store/qualityStore";

export const KUIPER_COUNT = quality.kuiperCount;

export const INNER_RADIUS = 37.5;
export const OUTER_RADIUS = 48.0;

export const BELT_THICKNESS = 2.0;

export const MIN_SCALE = 0.01;
export const MAX_SCALE = 0.05;

/** Median Kuiper Belt distance ~42 AU */
const MEDIAN_KUIPER_AU = 42.0;
export const BASE_ORBITAL_PERIOD_DAYS = keplerPeriodDays(MEDIAN_KUIPER_AU);

export const GEOMETRY_DETAIL = 0;

/**
 * Visual speed boost so belt motion is perceptible at 1x time.
 * The real orbital period (~270 yr) at 42 AU is extremely slow; this multiplier
 * only affects apparent rotation speed while keeping the belt fully driven by
 * the time engine (pause, speed, time-travel all work).
 */
export const KUIPER_VISUAL_SPEED_MULTIPLIER = 1000;
