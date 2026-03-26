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
  TRYOUT: "Testy",
  CAMP: "Obóz / Camp",
  CONTINUOUS_RECRUITMENT: "Ciągły nabór",
  INDIVIDUAL_TRAINING: "Trening indywidualny",
  GROUP_TRAINING: "Trening grupowy",
};

export const EVENT_TYPE_COLORS: Record<string, string> = {
  OPEN_TRAINING: "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300",
  RECRUITMENT: "bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300",
  TRYOUT: "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300",
  CAMP: "bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300",
  CONTINUOUS_RECRUITMENT: "bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300",
  INDIVIDUAL_TRAINING: "bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300",
  GROUP_TRAINING: "bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300",
};

export const SPARING_LEVEL_LABELS: Record<string, string> = {
  YOUTH: "Młodzieżowy",
  AMATEUR: "Amatorski",
  SEMI_PRO: "Półprofesjonalny",
  PRO: "Profesjonalny",
};

export const SPARING_LEVEL_COLORS: Record<string, string> = {
  YOUTH: "bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300",
  AMATEUR: "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300",
  SEMI_PRO: "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300",
  PRO: "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300",
};

export const AGE_CATEGORY_LABELS: Record<string, string> = {
  JUNIOR_E: "Żak (U-8/U-9)",
  JUNIOR_D: "Orlik (U-10/U-11)",
  JUNIOR_C: "Młodzik (U-12/U-13)",
  JUNIOR_B: "Trampkarz (U-14/U-15)",
  JUNIOR_A: "Junior mł. (U-16/U-17)",
  SENIOR_JR: "Junior (U-18/U-19)",
  SENIOR: "Senior",
  VETERAN: "Oldboj (35+)",
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
  COUNTER_PROPOSED: "Kontr-propozycja",
  ACCEPTED: "Zaakceptowany",
  REJECTED: "Odrzucony",
};

export const APPLICATION_STATUS_COLORS: Record<string, string> = {
  PENDING: "text-yellow-800 dark:text-yellow-200 bg-yellow-50 dark:bg-yellow-950",
  COUNTER_PROPOSED: "text-orange-800 dark:text-orange-200 bg-orange-50 dark:bg-orange-950",
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
  NEW_REVIEW: "Nowa recenzja",
  RECRUITMENT_NEW: "Nowy nabór",
  RECRUITMENT_MATCH: "Nabór na Twoją pozycję",
  REMINDER: "Przypomnienie",
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
};

export const TRANSFER_TYPE_LABELS: Record<string, string> = {
  LOOKING_FOR_CLUB: "Szukam klubu",
  LOOKING_FOR_PLAYER: "Szukam zawodnika",
  FREE_AGENT: "Wolny agent",
};

export const TRANSFER_TYPE_COLORS: Record<string, string> = {
  LOOKING_FOR_CLUB: "bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300",
  LOOKING_FOR_PLAYER: "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300",
  FREE_AGENT: "bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-300",
};

export const TRANSFER_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Aktywne",
  CLOSED: "Zamknięte",
};

export const TRANSFER_STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
  CLOSED: "bg-secondary text-muted-foreground",
};

export const RECRUITMENT_STAGE_LABELS: Record<string, string> = {
  WATCHING: "Na radarze",
  INVITED_TO_TRYOUT: "Zaproszony na testy",
  AFTER_TRYOUT: "Po testach",
  OFFER_SENT: "Oferta wysłana",
  SIGNED: "Podpisany",
  REJECTED: "Odrzucony",
};

export const RECRUITMENT_STAGE_COLORS: Record<string, string> = {
  WATCHING: "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300",
  INVITED_TO_TRYOUT: "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300",
  AFTER_TRYOUT: "bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300",
  OFFER_SENT: "bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300",
  SIGNED: "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300",
  REJECTED: "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300",
};

export const CLUB_POST_CATEGORY_LABELS: Record<string, string> = {
  LOOKING_FOR_GOALKEEPER: "Szukamy bramkarza",
  LOOKING_FOR_SPARRING: "Szukamy sparingpartnera",
  LOOKING_FOR_COACH: "Szukamy trenera",
  GENERAL_NEWS: "Aktualność",
  MATCH_RESULT: "Wynik meczu",
};

export const CLUB_POST_CATEGORY_COLORS: Record<string, string> = {
  LOOKING_FOR_GOALKEEPER: "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300",
  LOOKING_FOR_SPARRING: "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300",
  LOOKING_FOR_COACH: "bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300",
  GENERAL_NEWS: "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300",
  MATCH_RESULT: "bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300",
};

// Coach
export const COACH_SPECIALIZATION_LABELS: Record<string, string> = {
  YOUTH: "Trener młodzieży",
  GOALKEEPER: "Trener bramkarzy",
  FITNESS: "Trener przygotowania fizycznego",
  TACTICAL: "Trener taktyki",
  INDIVIDUAL: "Trener indywidualny",
  GENERAL: "Trener ogólny",
};

export const COACH_LEVEL_LABELS: Record<string, string> = {
  UEFA_PRO: "UEFA Pro",
  UEFA_A: "UEFA A",
  UEFA_B: "UEFA B",
  UEFA_C: "UEFA C",
  UEFA_D: "UEFA D / Grassroots",
  OTHER: "Inne",
};

export const ROLE_LABELS: Record<string, string> = {
  CLUB: "Klub",
  PLAYER: "Zawodnik",
  COACH: "Trener",
};

export function getUserDisplayName(user: {
  email?: string;
  club?: { name: string } | null;
  player?: { firstName: string; lastName: string } | null;
  coach?: { firstName: string; lastName: string } | null;
} | null): string {
  if (!user) return "Nieznany użytkownik";
  if (user.club) return user.club.name;
  if (user.player) return `${user.player.firstName} ${user.player.lastName}`;
  if (user.coach) return `${user.coach.firstName} ${user.coach.lastName}`;
  return user.email ?? "Nieznany użytkownik";
}
