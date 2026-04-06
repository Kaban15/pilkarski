import type { Locale } from "./translations";
import { translations } from "./translations";

function buildLabelMap(prefix: string, keys: string[], locale: Locale): Record<string, string> {
  const map: Record<string, string> = {};
  for (const key of keys) {
    const tKey = `${prefix}.${key}` as keyof typeof translations;
    map[key] = translations[tKey]?.[locale] ?? key;
  }
  return map;
}

// ---- Label maps (locale-aware) ----

export function getPositionLabels(locale: Locale): Record<string, string> {
  return buildLabelMap("position", ["GK","CB","LB","RB","CDM","CM","CAM","LM","RM","LW","RW","ST"], locale);
}

export function getFootLabels(locale: Locale): Record<string, string> {
  return buildLabelMap("foot", ["LEFT","RIGHT","BOTH"], locale);
}

export function getEventTypeLabels(locale: Locale): Record<string, string> {
  return buildLabelMap("eventType", ["OPEN_TRAINING","RECRUITMENT","TRYOUT","CAMP","CONTINUOUS_RECRUITMENT","INDIVIDUAL_TRAINING","GROUP_TRAINING"], locale);
}

export function getSparingLevelLabels(locale: Locale): Record<string, string> {
  return buildLabelMap("sparingLevel", ["YOUTH","AMATEUR","SEMI_PRO","PRO"], locale);
}

export function getAgeCategoryLabels(locale: Locale): Record<string, string> {
  return buildLabelMap("ageCategory", ["JUNIOR_E","JUNIOR_D","JUNIOR_C","JUNIOR_B","JUNIOR_A","SENIOR_JR","SENIOR","VETERAN"], locale);
}

export function getSparingStatusLabels(locale: Locale): Record<string, string> {
  return buildLabelMap("sparingStatus", ["OPEN","MATCHED","CANCELLED","COMPLETED"], locale);
}

export function getApplicationStatusLabels(locale: Locale): Record<string, string> {
  return buildLabelMap("applicationStatus", ["PENDING","COUNTER_PROPOSED","ACCEPTED","REJECTED"], locale);
}

export function getNotificationTypeLabels(locale: Locale): Record<string, string> {
  return buildLabelMap("notifType", [
    "SPARING_APPLICATION","SPARING_ACCEPTED","SPARING_REJECTED",
    "EVENT_APPLICATION","EVENT_ACCEPTED","EVENT_REJECTED",
    "NEW_MESSAGE","NEW_REVIEW","RECRUITMENT_NEW","RECRUITMENT_MATCH",
    "REMINDER","SPARING_INVITATION","MEMBERSHIP_REQUEST","MEMBERSHIP_ACCEPTED",
    "CLUB_INVITATION","SCORE_SUBMITTED","SCORE_CONFIRMED","SCORE_REJECTED",
    "GOAL_ADDED","TOURNAMENT_APPLICATION","TOURNAMENT_ACCEPTED","TOURNAMENT_REJECTED",
    "TOURNAMENT_STARTED","TOURNAMENT_SCORE_SUBMITTED",
  ], locale);
}

export function getTransferTypeLabels(locale: Locale): Record<string, string> {
  return buildLabelMap("transferType", ["LOOKING_FOR_CLUB","LOOKING_FOR_PLAYER","FREE_AGENT"], locale);
}

export function getTransferStatusLabels(locale: Locale): Record<string, string> {
  return buildLabelMap("transferStatus", ["ACTIVE","CLOSED"], locale);
}

export function getRecruitmentStageLabels(locale: Locale): Record<string, string> {
  return buildLabelMap("recruitmentStage", ["WATCHING","INVITED_TO_TRYOUT","AFTER_TRYOUT","OFFER_SENT","SIGNED","REJECTED"], locale);
}

export function getClubPostCategoryLabels(locale: Locale): Record<string, string> {
  return buildLabelMap("clubPost", ["LOOKING_FOR_GOALKEEPER","LOOKING_FOR_SPARRING","LOOKING_FOR_COACH","GENERAL_NEWS","MATCH_RESULT","INTERNAL"], locale);
}

export function getCoachSpecializationLabels(locale: Locale): Record<string, string> {
  return buildLabelMap("coachSpec", ["YOUTH","GOALKEEPER","FITNESS","TACTICAL","INDIVIDUAL","GENERAL"], locale);
}

export function getCoachLevelLabels(locale: Locale): Record<string, string> {
  return buildLabelMap("coachLevel", ["UEFA_PRO","UEFA_A","UEFA_B","UEFA_C","UEFA_D","OTHER"], locale);
}

export function getRoleLabels(locale: Locale): Record<string, string> {
  return buildLabelMap("role", ["CLUB","PLAYER","COACH"], locale);
}

export function getEventVisibilityLabels(locale: Locale): Record<string, string> {
  return buildLabelMap("eventVisibility", ["PUBLIC","INTERNAL"], locale);
}

export function getAttendanceStatusLabels(locale: Locale): Record<string, string> {
  return buildLabelMap("attendance", ["YES","NO","MAYBE"], locale);
}

export function getTournamentFormatLabels(locale: Locale): Record<string, string> {
  return buildLabelMap("tournamentFormat", ["GROUP_STAGE","KNOCKOUT","GROUP_AND_KNOCKOUT"], locale);
}

export function getTournamentStatusLabels(locale: Locale): Record<string, string> {
  return buildLabelMap("tournamentStatus", ["REGISTRATION","IN_PROGRESS","COMPLETED","CANCELLED"], locale);
}

export function getTournamentPhaseLabels(locale: Locale): Record<string, string> {
  return buildLabelMap("tournamentPhase", ["GROUP","ROUND_OF_16","QUARTER_FINAL","SEMI_FINAL","THIRD_PLACE","FINAL"], locale);
}

// ---- Static defaults (Polish) — backward compatibility ----

export const POSITION_LABELS = getPositionLabels("pl");
export const FOOT_LABELS = getFootLabels("pl");
export const EVENT_TYPE_LABELS = getEventTypeLabels("pl");
export const SPARING_LEVEL_LABELS = getSparingLevelLabels("pl");
export const AGE_CATEGORY_LABELS = getAgeCategoryLabels("pl");
export const SPARING_STATUS_LABELS = getSparingStatusLabels("pl");
export const APPLICATION_STATUS_LABELS = getApplicationStatusLabels("pl");
export const NOTIFICATION_TYPE_LABELS = getNotificationTypeLabels("pl");
export const TRANSFER_TYPE_LABELS = getTransferTypeLabels("pl");
export const TRANSFER_STATUS_LABELS = getTransferStatusLabels("pl");
export const RECRUITMENT_STAGE_LABELS = getRecruitmentStageLabels("pl");
export const CLUB_POST_CATEGORY_LABELS = getClubPostCategoryLabels("pl");
export const COACH_SPECIALIZATION_LABELS = getCoachSpecializationLabels("pl");
export const COACH_LEVEL_LABELS = getCoachLevelLabels("pl");
export const ROLE_LABELS = getRoleLabels("pl");
export const EVENT_VISIBILITY_LABELS = getEventVisibilityLabels("pl");
export const ATTENDANCE_STATUS_LABELS = getAttendanceStatusLabels("pl");
export const TOURNAMENT_FORMAT_LABELS = getTournamentFormatLabels("pl");
export const TOURNAMENT_STATUS_LABELS = getTournamentStatusLabels("pl");
export const TOURNAMENT_PHASE_LABELS = getTournamentPhaseLabels("pl");

// ---- Color maps (no translation needed) ----

export const EVENT_TYPE_COLORS: Record<string, string> = {
  OPEN_TRAINING: "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300",
  RECRUITMENT: "bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300",
  TRYOUT: "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300",
  CAMP: "bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300",
  CONTINUOUS_RECRUITMENT: "bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300",
  INDIVIDUAL_TRAINING: "bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300",
  GROUP_TRAINING: "bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300",
};

export const SPARING_LEVEL_COLORS: Record<string, string> = {
  YOUTH: "bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300",
  AMATEUR: "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300",
  SEMI_PRO: "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300",
  PRO: "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300",
};

export const SPARING_STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
  MATCHED: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200",
  CANCELLED: "bg-secondary text-muted-foreground",
  COMPLETED: "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200",
};

export const APPLICATION_STATUS_COLORS: Record<string, string> = {
  PENDING: "text-yellow-800 dark:text-yellow-200 bg-yellow-50 dark:bg-yellow-950",
  COUNTER_PROPOSED: "text-orange-800 dark:text-orange-200 bg-orange-50 dark:bg-orange-950",
  ACCEPTED: "text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950",
  REJECTED: "text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950",
};

export const NOTIFICATION_TYPE_COLORS: Record<string, string> = {
  SPARING_APPLICATION: "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300",
  SPARING_ACCEPTED: "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300",
  SPARING_REJECTED: "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300",
  EVENT_APPLICATION: "bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300",
  EVENT_ACCEPTED: "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300",
  EVENT_REJECTED: "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300",
  NEW_MESSAGE: "bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300",
  NEW_REVIEW: "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300",
  RECRUITMENT_NEW: "bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300",
  RECRUITMENT_MATCH: "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300",
  REMINDER: "bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-300",
  SPARING_INVITATION: "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300",
  MEMBERSHIP_REQUEST: "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300",
  MEMBERSHIP_ACCEPTED: "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300",
  CLUB_INVITATION: "text-emerald-800 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950",
  SCORE_SUBMITTED: "text-blue-800 dark:text-blue-200 bg-blue-50 dark:bg-blue-950",
  SCORE_CONFIRMED: "text-green-800 dark:text-green-200 bg-green-50 dark:bg-green-950",
  SCORE_REJECTED: "text-red-800 dark:text-red-200 bg-red-50 dark:bg-red-950",
  GOAL_ADDED: "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300",
  TOURNAMENT_APPLICATION: "bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-300",
  TOURNAMENT_ACCEPTED: "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300",
  TOURNAMENT_REJECTED: "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300",
  TOURNAMENT_STARTED: "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300",
  TOURNAMENT_SCORE_SUBMITTED: "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300",
};

export const TRANSFER_TYPE_COLORS: Record<string, string> = {
  LOOKING_FOR_CLUB: "bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300",
  LOOKING_FOR_PLAYER: "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300",
  FREE_AGENT: "bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-300",
};

export const TRANSFER_STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
  CLOSED: "bg-secondary text-muted-foreground",
};

export const RECRUITMENT_STAGE_COLORS: Record<string, string> = {
  WATCHING: "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300",
  INVITED_TO_TRYOUT: "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300",
  AFTER_TRYOUT: "bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300",
  OFFER_SENT: "bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300",
  SIGNED: "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300",
  REJECTED: "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300",
};

export const CLUB_POST_CATEGORY_COLORS: Record<string, string> = {
  LOOKING_FOR_GOALKEEPER: "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300",
  LOOKING_FOR_SPARRING: "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300",
  LOOKING_FOR_COACH: "bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300",
  GENERAL_NEWS: "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300",
  MATCH_RESULT: "bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300",
  INTERNAL: "bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300",
};

export const TOURNAMENT_STATUS_COLORS: Record<string, string> = {
  REGISTRATION: "bg-emerald-500/10 text-emerald-500",
  IN_PROGRESS: "bg-amber-500/10 text-amber-500",
  COMPLETED: "bg-muted text-muted-foreground",
  CANCELLED: "bg-red-500/10 text-red-500",
};

// ---- Utility functions ----

export function getUserDisplayName(user: {
  email?: string;
  club?: { name: string } | null;
  player?: { firstName: string; lastName: string } | null;
  coach?: { firstName: string; lastName: string } | null;
} | null, locale: Locale = "pl"): string {
  if (!user) return translations["common.unknownUser"][locale];
  if (user.club) return user.club.name;
  if (user.player) return `${user.player.firstName} ${user.player.lastName}`;
  if (user.coach) return `${user.coach.firstName} ${user.coach.lastName}`;
  return user.email ?? translations["common.unknownUser"][locale];
}

export function getProfileHref(user: {
  role?: string;
  club?: { id: string } | null;
  player?: { id: string } | null;
  coach?: { id: string } | null;
} | null): string | null {
  if (!user) return null;
  if (user.role === "CLUB" && user.club) return `/clubs/${user.club.id}`;
  if (user.role === "PLAYER" && user.player) return `/players/${user.player.id}`;
  if (user.role === "COACH" && user.coach) return `/coaches/${user.coach.id}`;
  return null;
}

/**
 * Polish noun pluralization: 1 -> one, 2-4/22-24/... -> few, rest -> many.
 * Handles teens (12-14 -> many) correctly.
 */
export function pluralPL(n: number, one: string, few: string, many: string): string {
  if (n === 1) return one;
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}
