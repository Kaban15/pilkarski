import type { ApplicationStatus, SparingStatus } from "@/generated/prisma/client";

export const REPUTATION_THRESHOLDS = {
  minResponseSample: 3,
  minFulfilmentSample: 3,
  windowDays: 180,
} as const;

export type ReputationInput = {
  receivedApps: { status: ApplicationStatus; createdAt: Date; updatedAt: Date }[];
  ownedOffers: { status: SparingStatus; hadAcceptedApp: boolean }[];
};

export type ReputationStats = {
  responseRate: number | null;
  avgResponseMs: number | null;
  fulfilmentRate: number | null;
  responseSample: number;
  fulfilmentSample: number;
};

export function computeReputation({ receivedApps, ownedOffers }: ReputationInput): ReputationStats {
  const responded = receivedApps.filter((a) => a.status !== "PENDING");
  const responseSample = receivedApps.length;
  const responseRate =
    responseSample >= REPUTATION_THRESHOLDS.minResponseSample ? responded.length / responseSample : null;

  const avgResponseMs =
    responded.length > 0
      ? responded.reduce((s, a) => s + (a.updatedAt.getTime() - a.createdAt.getTime()), 0) /
        responded.length
      : null;

  const completed = ownedOffers.filter((o) => o.status === "COMPLETED").length;
  const cancelledWithMatch = ownedOffers.filter(
    (o) => o.status === "CANCELLED" && o.hadAcceptedApp,
  ).length;
  const fulfilmentSample = completed + cancelledWithMatch;
  const fulfilmentRate =
    fulfilmentSample >= REPUTATION_THRESHOLDS.minFulfilmentSample ? completed / fulfilmentSample : null;

  return {
    responseRate,
    avgResponseMs,
    fulfilmentRate,
    responseSample,
    fulfilmentSample,
  };
}

export function formatResponseTime(ms: number | null): string | null {
  if (ms == null) return null;
  const minutes = ms / 60000;
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = minutes / 60;
  if (hours < 24) return `${Math.round(hours)} h`;
  const days = hours / 24;
  return `${Math.round(days)} dni`;
}

export function formatRate(rate: number | null): string | null {
  if (rate == null) return null;
  return `${Math.round(rate * 100)}%`;
}
