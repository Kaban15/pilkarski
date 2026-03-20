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

export const EVENT_TYPE_LABELS: Record<string, string> = {
  OPEN_TRAINING: "Trening otwarty",
  RECRUITMENT: "Nabór",
};

export const SPARING_STATUS_LABELS: Record<string, string> = {
  OPEN: "Otwarty",
  MATCHED: "Dopasowany",
  CANCELLED: "Anulowany",
  COMPLETED: "Zakończony",
};

export const SPARING_STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-green-100 text-green-800",
  MATCHED: "bg-blue-100 text-blue-800",
  CANCELLED: "bg-gray-100 text-gray-600",
  COMPLETED: "bg-purple-100 text-purple-800",
};

export const APPLICATION_STATUS_LABELS: Record<string, string> = {
  PENDING: "Oczekuje",
  ACCEPTED: "Zaakceptowany",
  REJECTED: "Odrzucony",
};

export const APPLICATION_STATUS_COLORS: Record<string, string> = {
  PENDING: "text-yellow-700 bg-yellow-50",
  ACCEPTED: "text-green-700 bg-green-50",
  REJECTED: "text-red-700 bg-red-50",
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
