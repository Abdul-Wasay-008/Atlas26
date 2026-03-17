import { keplerPeriodDays } from "./planetOrbit";

export const ASTEROID_COUNT = 5000;

export const INNER_RADIUS = 13.5;
export const OUTER_RADIUS = 16.5;

export const BELT_THICKNESS = 1.4;

export const MIN_SCALE = 0.008;
export const MAX_SCALE = 0.035;

/** Median belt distance ~2.8 AU — used for the reference orbital period */
const MEDIAN_BELT_AU = 2.8;
export const BASE_ORBITAL_PERIOD_DAYS = keplerPeriodDays(MEDIAN_BELT_AU);

export const MEDIAN_RADIUS = (INNER_RADIUS + OUTER_RADIUS) / 2;

export const GEOMETRY_DETAIL = 0;

/**
 * Visual speed boost so belt motion is perceptible at 1x time.
 * The real orbital period (~4.7 yr) makes the belt look stationary at scene
 * scale; this multiplier only affects apparent rotation speed while keeping the
 * belt fully driven by the time engine (pause, speed, time-travel all work).
 */
export const BELT_VISUAL_SPEED_MULTIPLIER = 80;
