// Points awarded per action
export const POINTS_MAP: Record<string, number> = {
  sparing_created: 10,
  sparing_matched: 15,
  event_created: 10,
  recruitment_created: 10,
  application_sent: 5,
  application_accepted: 10,
  review_given: 10,
  transfer_created: 5,
  player_added_to_radar: 3,
  club_post_created: 5,
  message_sent: 2,
  profile_completed: 20,
  first_training_published: 15,
  first_club_post: 10,
  first_nabor_application: 10,
  profile_region_set: 5,
  tournament_created: 15,
  tournament_win: 20,
};

export const POINTS_LABELS: Record<string, string> = {
  sparing_created: "Utworzenie sparingu",
  sparing_matched: "Dopasowanie sparingu",
  event_created: "Utworzenie wydarzenia",
  recruitment_created: "Utworzenie naboru",
  application_sent: "Wysłanie zgłoszenia",
  application_accepted: "Zaakceptowanie zgłoszenia",
  review_given: "Wystawienie recenzji",
  transfer_created: "Dodanie ogłoszenia transferowego",
  player_added_to_radar: "Dodanie zawodnika na radar",
  club_post_created: "Dodanie postu klubowego",
  message_sent: "Wysłanie wiadomości",
  profile_completed: "Uzupełnienie profilu",
  first_training_published: "Publikacja pierwszego treningu",
  first_club_post: "Pierwszy post na tablicy",
  first_nabor_application: "Pierwsza aplikacja na nabór",
  profile_region_set: "Ustawienie regionu w profilu",
  tournament_created: "Utworzenie turnieju",
  tournament_win: "Zwycięstwo w turnieju",
};

// Badge definitions
export interface BadgeDef {
  key: string;
  name: string;
  description: string;
  icon: string; // emoji
  check: (stats: BadgeCheckStats) => boolean;
}

export interface BadgeCheckStats {
  totalPoints: number;
  sparingsCreated: number;
  sparingsMatched: number;
  eventsCreated: number;
  reviewsGiven: number;
  messagesCount: number;
  applicationsCount: number;
  tournamentsWon?: number;
}

export const BADGES: BadgeDef[] = [
  { key: "first_sparing", name: "Debiutant", description: "Stwórz pierwszy sparing", icon: "⚽", check: (s) => s.sparingsCreated >= 1 },
  { key: "sparing_master", name: "Mistrz sparingów", description: "Stwórz 10 sparingów", icon: "🏆", check: (s) => s.sparingsCreated >= 10 },
  { key: "matchmaker", name: "Matchmaker", description: "Dopasuj 5 sparingów", icon: "🤝", check: (s) => s.sparingsMatched >= 5 },
  { key: "event_organizer", name: "Organizator", description: "Stwórz 5 wydarzeń", icon: "📋", check: (s) => s.eventsCreated >= 5 },
  { key: "reviewer", name: "Recenzent", description: "Wystaw 3 recenzje", icon: "⭐", check: (s) => s.reviewsGiven >= 3 },
  { key: "communicator", name: "Komunikator", description: "Wyślij 50 wiadomości", icon: "💬", check: (s) => s.messagesCount >= 50 },
  { key: "active_player", name: "Aktywny gracz", description: "Zdobądź 100 punktów", icon: "🔥", check: (s) => s.totalPoints >= 100 },
  { key: "veteran", name: "Weteran", description: "Zdobądź 500 punktów", icon: "🎖️", check: (s) => s.totalPoints >= 500 },
  { key: "applicant", name: "Łowca okazji", description: "Wyślij 10 zgłoszeń", icon: "🎯", check: (s) => s.applicationsCount >= 10 },
  { key: "tournament_champion", name: "Mistrz turniejów", description: "Wygraj 3 turnieje", icon: "🏆", check: (s) => (s.tournamentsWon ?? 0) >= 3 },
];
