-- SparingOffer cost fields
ALTER TABLE "sparing_offers" ADD COLUMN "cost_per_team" INT;
ALTER TABLE "sparing_offers" ADD COLUMN "cost_paid_home" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "sparing_offers" ADD COLUMN "cost_paid_away" BOOLEAN NOT NULL DEFAULT false;

-- Event cost field
ALTER TABLE "events" ADD COLUMN "cost_per_person" INT;

-- Tournament cost field
ALTER TABLE "tournaments" ADD COLUMN "cost_per_team" INT;

-- TournamentTeam cost paid field
ALTER TABLE "tournament_teams" ADD COLUMN "cost_paid" BOOLEAN NOT NULL DEFAULT false;
