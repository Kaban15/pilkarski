export type Locale = "pl" | "en";

export const translations = {
  // Navigation
  "nav.feed": { pl: "Pulpit", en: "Feed" },
  "nav.sparings": { pl: "Sparingi", en: "Sparrings" },
  "nav.events": { pl: "Wydarzenia", en: "Events" },
  "nav.recruitment": { pl: "Rekrutacja", en: "Recruitment" },
  "nav.messages": { pl: "Wiadomości", en: "Messages" },
  "nav.notifications": { pl: "Powiadomienia", en: "Notifications" },
  "nav.notifications.short": { pl: "Powiadom.", en: "Notifs" },
  "nav.profile": { pl: "Profil", en: "Profile" },
  "nav.squad": { pl: "Kadra", en: "Squad" },
  "nav.trainings": { pl: "Treningi", en: "Trainings" },
  "nav.calendar": { pl: "Kalendarz", en: "Calendar" },
  "nav.tournaments": { pl: "Turnieje", en: "Tournaments" },
  "nav.community": { pl: "Tablica", en: "Board" },
  "nav.transfers": { pl: "Transfery", en: "Transfers" },
  "nav.leagues": { pl: "Ligi", en: "Leagues" },
  "nav.search": { pl: "Szukaj", en: "Search" },
  "nav.clubChat": { pl: "Czat klubu", en: "Club Chat" },
  "nav.favorites": { pl: "Ulubione", en: "Favorites" },
  "nav.admin": { pl: "Admin", en: "Admin" },
  "nav.more": { pl: "Więcej", en: "More" },
  "nav.logout": { pl: "Wyloguj", en: "Log out" },
  "nav.panel": { pl: "Panel", en: "Panel" },

  // Bottom nav (shorter labels for mobile)
  "nav.events.mobile": { pl: "Nabory", en: "Events" },

  // Roles
  "role.CLUB": { pl: "Klub", en: "Club" },
  "role.PLAYER": { pl: "Zawodnik", en: "Player" },
  "role.COACH": { pl: "Trener", en: "Coach" },
  "role.default": { pl: "Użytkownik", en: "User" },

  // Theme
  "theme.light": { pl: "Tryb jasny", en: "Light mode" },
  "theme.dark": { pl: "Tryb ciemny", en: "Dark mode" },
  "theme.switchLight": { pl: "Przełącz na tryb jasny", en: "Switch to light mode" },
  "theme.switchDark": { pl: "Przełącz na tryb ciemny", en: "Switch to dark mode" },

  // Language
  "lang.toggle": { pl: "English", en: "Polski" },
  "lang.label": { pl: "Zmień język", en: "Change language" },

  // Positions
  "position.GK": { pl: "Bramkarz", en: "Goalkeeper" },
  "position.CB": { pl: "Śr. obrońca", en: "Center Back" },
  "position.LB": { pl: "L. obrońca", en: "Left Back" },
  "position.RB": { pl: "P. obrońca", en: "Right Back" },
  "position.CDM": { pl: "Def. pomocnik", en: "Def. Midfielder" },
  "position.CM": { pl: "Śr. pomocnik", en: "Midfielder" },
  "position.CAM": { pl: "Of. pomocnik", en: "Att. Midfielder" },
  "position.LM": { pl: "L. pomocnik", en: "Left Midfielder" },
  "position.RM": { pl: "P. pomocnik", en: "Right Midfielder" },
  "position.LW": { pl: "L. skrzydłowy", en: "Left Winger" },
  "position.RW": { pl: "P. skrzydłowy", en: "Right Winger" },
  "position.ST": { pl: "Napastnik", en: "Striker" },

  // Foot
  "foot.LEFT": { pl: "Lewa", en: "Left" },
  "foot.RIGHT": { pl: "Prawa", en: "Right" },
  "foot.BOTH": { pl: "Obie", en: "Both" },

  // Event types
  "eventType.OPEN_TRAINING": { pl: "Trening otwarty", en: "Open Training" },
  "eventType.RECRUITMENT": { pl: "Nabór", en: "Recruitment" },
  "eventType.TRYOUT": { pl: "Testy", en: "Tryouts" },
  "eventType.CAMP": { pl: "Obóz / Camp", en: "Camp" },
  "eventType.CONTINUOUS_RECRUITMENT": { pl: "Ciągły nabór", en: "Continuous Recruitment" },
  "eventType.INDIVIDUAL_TRAINING": { pl: "Trening indywidualny", en: "Individual Training" },
  "eventType.GROUP_TRAINING": { pl: "Trening grupowy", en: "Group Training" },

  // Sparing levels
  "sparingLevel.YOUTH": { pl: "Młodzieżowy", en: "Youth" },
  "sparingLevel.AMATEUR": { pl: "Amatorski", en: "Amateur" },
  "sparingLevel.SEMI_PRO": { pl: "Półprofesjonalny", en: "Semi-Pro" },
  "sparingLevel.PRO": { pl: "Profesjonalny", en: "Professional" },

  // Age categories
  "ageCategory.JUNIOR_E": { pl: "Żak (U-8/U-9)", en: "U-8/U-9" },
  "ageCategory.JUNIOR_D": { pl: "Orlik (U-10/U-11)", en: "U-10/U-11" },
  "ageCategory.JUNIOR_C": { pl: "Młodzik (U-12/U-13)", en: "U-12/U-13" },
  "ageCategory.JUNIOR_B": { pl: "Trampkarz (U-14/U-15)", en: "U-14/U-15" },
  "ageCategory.JUNIOR_A": { pl: "Junior mł. (U-16/U-17)", en: "U-16/U-17" },
  "ageCategory.SENIOR_JR": { pl: "Junior (U-18/U-19)", en: "U-18/U-19" },
  "ageCategory.SENIOR": { pl: "Senior", en: "Senior" },
  "ageCategory.VETERAN": { pl: "Oldboj (35+)", en: "Veteran (35+)" },

  // Sparing status
  "sparingStatus.OPEN": { pl: "Otwarty", en: "Open" },
  "sparingStatus.MATCHED": { pl: "Dopasowany", en: "Matched" },
  "sparingStatus.CANCELLED": { pl: "Anulowany", en: "Cancelled" },
  "sparingStatus.COMPLETED": { pl: "Zakończony", en: "Completed" },

  // Application status
  "applicationStatus.PENDING": { pl: "Oczekuje", en: "Pending" },
  "applicationStatus.COUNTER_PROPOSED": { pl: "Kontr-propozycja", en: "Counter-proposed" },
  "applicationStatus.ACCEPTED": { pl: "Zaakceptowany", en: "Accepted" },
  "applicationStatus.REJECTED": { pl: "Odrzucony", en: "Rejected" },

  // Notification types
  "notifType.SPARING_APPLICATION": { pl: "Zgłoszenie na sparing", en: "Sparring application" },
  "notifType.SPARING_ACCEPTED": { pl: "Sparing zaakceptowany", en: "Sparring accepted" },
  "notifType.SPARING_REJECTED": { pl: "Sparing odrzucony", en: "Sparring rejected" },
  "notifType.EVENT_APPLICATION": { pl: "Zgłoszenie na wydarzenie", en: "Event application" },
  "notifType.EVENT_ACCEPTED": { pl: "Wydarzenie zaakceptowane", en: "Event accepted" },
  "notifType.EVENT_REJECTED": { pl: "Wydarzenie odrzucone", en: "Event rejected" },
  "notifType.NEW_MESSAGE": { pl: "Nowa wiadomość", en: "New message" },
  "notifType.NEW_REVIEW": { pl: "Nowa recenzja", en: "New review" },
  "notifType.RECRUITMENT_NEW": { pl: "Nowy nabór", en: "New recruitment" },
  "notifType.RECRUITMENT_MATCH": { pl: "Nabór na Twoją pozycję", en: "Recruitment for your position" },
  "notifType.REMINDER": { pl: "Przypomnienie", en: "Reminder" },
  "notifType.SPARING_INVITATION": { pl: "Zaproszenie na sparing", en: "Sparring invitation" },
  "notifType.MEMBERSHIP_REQUEST": { pl: "Prośba o dołączenie", en: "Membership request" },
  "notifType.MEMBERSHIP_ACCEPTED": { pl: "Dołączenie do klubu", en: "Membership accepted" },
  "notifType.CLUB_INVITATION": { pl: "Zaproszenie do klubu", en: "Club invitation" },
  "notifType.SCORE_SUBMITTED": { pl: "Wynik do potwierdzenia", en: "Score to confirm" },
  "notifType.SCORE_CONFIRMED": { pl: "Wynik potwierdzony", en: "Score confirmed" },
  "notifType.SCORE_REJECTED": { pl: "Wynik odrzucony", en: "Score rejected" },
  "notifType.GOAL_ADDED": { pl: "Bramka", en: "Goal" },
  "notifType.TOURNAMENT_APPLICATION": { pl: "Zgłoszenie do turnieju", en: "Tournament application" },
  "notifType.TOURNAMENT_ACCEPTED": { pl: "Przyjęty do turnieju", en: "Tournament accepted" },
  "notifType.TOURNAMENT_REJECTED": { pl: "Odrzucony z turnieju", en: "Tournament rejected" },
  "notifType.TOURNAMENT_STARTED": { pl: "Turniej rozpoczęty", en: "Tournament started" },
  "notifType.TOURNAMENT_SCORE_SUBMITTED": { pl: "Wynik turnieju do potwierdzenia", en: "Tournament score to confirm" },

  // Transfer types
  "transferType.LOOKING_FOR_CLUB": { pl: "Szukam klubu", en: "Looking for club" },
  "transferType.LOOKING_FOR_PLAYER": { pl: "Szukam zawodnika", en: "Looking for player" },
  "transferType.FREE_AGENT": { pl: "Wolny agent", en: "Free agent" },

  // Transfer status
  "transferStatus.ACTIVE": { pl: "Aktywne", en: "Active" },
  "transferStatus.CLOSED": { pl: "Zamknięte", en: "Closed" },

  // Recruitment stages
  "recruitmentStage.WATCHING": { pl: "Na radarze", en: "Watching" },
  "recruitmentStage.INVITED_TO_TRYOUT": { pl: "Zaproszony na testy", en: "Invited to tryout" },
  "recruitmentStage.AFTER_TRYOUT": { pl: "Po testach", en: "After tryout" },
  "recruitmentStage.OFFER_SENT": { pl: "Oferta wysłana", en: "Offer sent" },
  "recruitmentStage.SIGNED": { pl: "Podpisany", en: "Signed" },
  "recruitmentStage.REJECTED": { pl: "Odrzucony", en: "Rejected" },

  // Club post categories
  "clubPost.LOOKING_FOR_GOALKEEPER": { pl: "Szukamy bramkarza", en: "Looking for goalkeeper" },
  "clubPost.LOOKING_FOR_SPARRING": { pl: "Szukamy sparingpartnera", en: "Looking for sparring partner" },
  "clubPost.LOOKING_FOR_COACH": { pl: "Szukamy trenera", en: "Looking for coach" },
  "clubPost.GENERAL_NEWS": { pl: "Aktualność", en: "News" },
  "clubPost.MATCH_RESULT": { pl: "Wynik meczu", en: "Match result" },
  "clubPost.INTERNAL": { pl: "Wewnętrzne", en: "Internal" },

  // Coach specializations
  "coachSpec.YOUTH": { pl: "Trener młodzieży", en: "Youth Coach" },
  "coachSpec.GOALKEEPER": { pl: "Trener bramkarzy", en: "Goalkeeper Coach" },
  "coachSpec.FITNESS": { pl: "Trener przygotowania fizycznego", en: "Fitness Coach" },
  "coachSpec.TACTICAL": { pl: "Trener taktyki", en: "Tactical Coach" },
  "coachSpec.INDIVIDUAL": { pl: "Trener indywidualny", en: "Individual Coach" },
  "coachSpec.GENERAL": { pl: "Trener ogólny", en: "General Coach" },

  // Coach levels
  "coachLevel.UEFA_PRO": { pl: "UEFA Pro", en: "UEFA Pro" },
  "coachLevel.UEFA_A": { pl: "UEFA A", en: "UEFA A" },
  "coachLevel.UEFA_B": { pl: "UEFA B", en: "UEFA B" },
  "coachLevel.UEFA_C": { pl: "UEFA C", en: "UEFA C" },
  "coachLevel.UEFA_D": { pl: "UEFA D / Grassroots", en: "UEFA D / Grassroots" },
  "coachLevel.OTHER": { pl: "Inne", en: "Other" },

  // Event visibility
  "eventVisibility.PUBLIC": { pl: "Publiczne", en: "Public" },
  "eventVisibility.INTERNAL": { pl: "Tylko dla klubu", en: "Club only" },

  // Attendance
  "attendance.YES": { pl: "Tak", en: "Yes" },
  "attendance.NO": { pl: "Nie", en: "No" },
  "attendance.MAYBE": { pl: "Nie wiem", en: "Maybe" },

  // Tournament formats
  "tournamentFormat.GROUP_STAGE": { pl: "Faza grupowa", en: "Group Stage" },
  "tournamentFormat.KNOCKOUT": { pl: "Puchar", en: "Knockout" },
  "tournamentFormat.GROUP_AND_KNOCKOUT": { pl: "Grupa + Puchar", en: "Group + Knockout" },

  // Tournament status
  "tournamentStatus.REGISTRATION": { pl: "Rejestracja", en: "Registration" },
  "tournamentStatus.IN_PROGRESS": { pl: "W trakcie", en: "In Progress" },
  "tournamentStatus.COMPLETED": { pl: "Zakończony", en: "Completed" },
  "tournamentStatus.CANCELLED": { pl: "Anulowany", en: "Cancelled" },

  // Tournament phases
  "tournamentPhase.GROUP": { pl: "Faza grupowa", en: "Group Stage" },
  "tournamentPhase.ROUND_OF_16": { pl: "1/8 finału", en: "Round of 16" },
  "tournamentPhase.QUARTER_FINAL": { pl: "Ćwierćfinał", en: "Quarter-final" },
  "tournamentPhase.SEMI_FINAL": { pl: "Półfinał", en: "Semi-final" },
  "tournamentPhase.THIRD_PLACE": { pl: "O 3. miejsce", en: "Third Place" },
  "tournamentPhase.FINAL": { pl: "Finał", en: "Final" },

  // Common
  "common.unknownUser": { pl: "Nieznany użytkownik", en: "Unknown user" },
} as const;

export type TranslationKey = keyof typeof translations;
