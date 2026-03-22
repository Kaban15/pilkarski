export const POSITION_LABELS: Record<string, string> = {
  GK: "Bramkarz",
  CB: "Śr. obrońca",
  LB: "L. obrońca",
  RB: "P. obrońca",
  CDM: "Def. pomocnik",
  CM: "Śr. pomocnik",
  CAM: "Of. pomocnik",
  LM: "L. pomocnik",
  RM: "P. pomocnik",
  LW: "L. skrzydłowy",
  RW: "P. skrzydłowy",
  ST: "Napastnik",
};

export const FOOT_LABELS: Record<string, string> = {
  LEFT: "Lewa",
  RIGHT: "Prawa",
  BOTH: "Obie",
};

export const EVENT_TYPE_LABELS: Record<string, string> = {
  OPEN_TRAINING: "Trening otwarty",
  RECRUITMENT: "Nabór",
};

export const EVENT_TYPE_COLORS: Record<string, string> = {
  OPEN_TRAINING: "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300",
  RECRUITMENT: "bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300",
};

export const SPARING_STATUS_LABELS: Record<string, string> = {
  OPEN: "Otwarty",
  MATCHED: "Dopasowany",
  CANCELLED: "Anulowany",
  COMPLETED: "Zakończony",
};

export const SPARING_STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
  MATCHED: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200",
  CANCELLED: "bg-secondary text-muted-foreground",
  COMPLETED: "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200",
};

export const APPLICATION_STATUS_LABELS: Record<string, string> = {
  PENDING: "Oczekuje",
  ACCEPTED: "Zaakceptowany",
  REJECTED: "Odrzucony",
};

export const APPLICATION_STATUS_COLORS: Record<string, string> = {
  PENDING: "text-yellow-800 dark:text-yellow-200 bg-yellow-50 dark:bg-yellow-950",
  ACCEPTED: "text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950",
  REJECTED: "text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950",
};

export const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  SPARING_APPLICATION: "Zgłoszenie na sparing",
  SPARING_ACCEPTED: "Sparing zaakceptowany",
  SPARING_REJECTED: "Sparing odrzucony",
  EVENT_APPLICATION: "Zgłoszenie na wydarzenie",
  EVENT_ACCEPTED: "Wydarzenie zaakceptowane",
  EVENT_REJECTED: "Wydarzenie odrzucone",
  NEW_MESSAGE: "Nowa wiadomość",
};

export const NOTIFICATION_TYPE_COLORS: Record<string, string> = {
  SPARING_APPLICATION: "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300",
  SPARING_ACCEPTED: "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300",
  SPARING_REJECTED: "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300",
  EVENT_APPLICATION: "bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300",
  EVENT_ACCEPTED: "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300",
  EVENT_REJECTED: "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300",
  NEW_MESSAGE: "bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300",
};

export function getUserDisplayName(user: {
  email?: string;
  club?: { name: string } | null;
  player?: { firstName: string; lastName: string } | null;
} | null): string {
  if (!user) return "Nieznany użytkownik";
  if (user.club) return user.club.name;
  if (user.player) return `${user.player.firstName} ${user.player.lastName}`;
  return user.email ?? "Nieznany użytkownik";
}
