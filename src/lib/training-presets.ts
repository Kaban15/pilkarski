export interface TrainingPreset {
  id: string;
  name: string;
  type: "INDIVIDUAL_TRAINING" | "GROUP_TRAINING";
  description: string;
  targetPosition?: string;
  targetLevel?: string;
  maxParticipants?: number;
  priceInfo?: string;
}

export const TRAINING_PRESETS: TrainingPreset[] = [
  {
    id: "tech-u15",
    name: "Trening techniczny U15",
    type: "INDIVIDUAL_TRAINING",
    description: "Indywidualny trening techniczny dla młodzieży U15. Skupienie na kontroli piłki, podaniach i przyjęciach. 60 minut z trenerem.",
    targetLevel: "YOUTH",
    maxParticipants: 1,
    priceInfo: "120 zł / sesja",
  },
  {
    id: "shooting-st",
    name: "Trening strzelecki — napastnicy",
    type: "INDIVIDUAL_TRAINING",
    description: "Trening wykończenia akcji. Strzały z różnych pozycji, gra 1v1 z bramkarzem, sytuacje pod presją. 75 minut.",
    targetPosition: "ST",
    maxParticipants: 3,
    priceInfo: "150 zł / sesja",
  },
  {
    id: "gk-1v1",
    name: "Trening bramkarski 1v1",
    type: "INDIVIDUAL_TRAINING",
    description: "Indywidualny trening bramkarza. Reakcja, ustawianie, gra nogami, wyjścia 1v1. 60 minut z trenerem bramkarzy.",
    targetPosition: "GK",
    maxParticipants: 1,
    priceInfo: "130 zł / sesja",
  },
  {
    id: "fitness-group",
    name: "Trening motoryczny grupowy",
    type: "GROUP_TRAINING",
    description: "Grupowy trening przygotowania fizycznego. Szybkość, koordynacja, wytrzymałość. Grupa 8-12 osób. 90 minut.",
    maxParticipants: 12,
    priceInfo: "60 zł / osoba",
  },
  {
    id: "tactics-midfield",
    name: "Taktyka gry — pomocnicy",
    type: "GROUP_TRAINING",
    description: "Trening taktyczny dla pomocników. Budowanie akcji, pressing, zmiana pozycji. Analiza wideo + ćwiczenia na boisku. 90 minut.",
    targetPosition: "CM",
    maxParticipants: 8,
    priceInfo: "80 zł / osoba",
  },
  {
    id: "defender-1v1",
    name: "Obrona 1v1 — obrońcy",
    type: "INDIVIDUAL_TRAINING",
    description: "Trening indywidualny dla obrońców. Ustawienie, tackle, gra głową, wyprowadzenie piłki. 60 minut.",
    targetPosition: "CB",
    maxParticipants: 2,
    priceInfo: "120 zł / sesja",
  },
];
