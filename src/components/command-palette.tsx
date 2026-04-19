"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/trpc-react";
import { useI18n } from "@/lib/i18n";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Swords,
  Trophy,
  Users,
  Calendar,
  Target,
  UserCircle,
  Plus,
  ArrowRight,
} from "lucide-react";

type Item = {
  id: string;
  label: string;
  hint?: string;
  href: string;
  icon: typeof Swords;
  tone: "violet" | "sky" | "emerald" | "orange" | "amber";
};

const TONE_CLASSES: Record<Item["tone"], string> = {
  violet: "text-violet-400",
  sky: "text-sky-400",
  emerald: "text-emerald-400",
  orange: "text-orange-400",
  amber: "text-amber-400",
};

export function CommandPalette() {
  const { t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(query.trim()), 250);
    return () => clearTimeout(id);
  }, [query]);

  useEffect(() => {
    if (open) {
      // Reset palette state when it opens — intentional side effect on external trigger.
      /* eslint-disable react-hooks/set-state-in-effect */
      setQuery("");
      setDebounced("");
      setActiveIdx(0);
      /* eslint-enable react-hooks/set-state-in-effect */
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [open]);

  const { data, isFetching } = api.search.global.useQuery(
    { query: debounced, limit: 5 },
    { enabled: debounced.length >= 2, staleTime: 30_000 },
  );

  const staticCommands: Item[] = useMemo(
    () => [
      { id: "cmd-new-sparing", label: t("Dodaj sparing"), href: "/sparings/new", icon: Plus, tone: "violet" },
      { id: "cmd-new-event", label: t("Dodaj wydarzenie"), href: "/events/new", icon: Plus, tone: "sky" },
      { id: "cmd-profile", label: t("Mój profil"), href: "/profile", icon: UserCircle, tone: "amber" },
      { id: "cmd-search", label: t("Szukaj rywala"), href: "/search", icon: Search, tone: "emerald" },
      { id: "cmd-calendar", label: t("Kalendarz"), href: "/calendar", icon: Calendar, tone: "violet" },
    ],
    [t],
  );

  const searchItems: Item[] = useMemo(() => {
    if (!data) return [];
    return [
      ...data.clubs.map((c) => ({
        id: `club-${c.id}`,
        label: c.name,
        hint: [c.city, c.region?.name].filter(Boolean).join(" · ") || undefined,
        href: `/clubs/${c.id}`,
        icon: Trophy,
        tone: "sky" as const,
      })),
      ...data.players.map((p) => ({
        id: `player-${p.id}`,
        label: `${p.firstName} ${p.lastName}`,
        hint: [p.city, p.region?.name].filter(Boolean).join(" · ") || undefined,
        href: `/players/${p.id}`,
        icon: Users,
        tone: "orange" as const,
      })),
      ...data.sparings.map((s) => ({
        id: `sparing-${s.id}`,
        label: s.title,
        hint: [s.club.name, s.location].filter(Boolean).join(" · ") || undefined,
        href: `/sparings/${s.id}`,
        icon: Swords,
        tone: "violet" as const,
      })),
      ...data.events.map((e) => ({
        id: `event-${e.id}`,
        label: e.title,
        hint: [e.club?.name, e.location].filter(Boolean).join(" · ") || undefined,
        href: `/events/${e.id}`,
        icon: Target,
        tone: "emerald" as const,
      })),
    ];
  }, [data]);

  const filteredStatic = useMemo(() => {
    if (!query) return staticCommands;
    const q = query.toLowerCase();
    return staticCommands.filter((c) => c.label.toLowerCase().includes(q));
  }, [query, staticCommands]);

  const allItems: Item[] = useMemo(
    () => [...filteredStatic, ...searchItems],
    [filteredStatic, searchItems],
  );

  useEffect(() => {
    // Reset selection when search results change.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveIdx(0);
  }, [debounced, query]);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, allItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = allItems[activeIdx];
      if (item) go(item.href);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-xl overflow-hidden p-0" showCloseButton={false}>
        <DialogHeader className="sr-only">
          <DialogTitle>{t("Szybkie wyszukiwanie")}</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t("Szukaj klubu, zawodnika, sparingu…")}
            className="flex-1 bg-transparent text-[14px] outline-none placeholder:text-muted-foreground"
          />
          <kbd className="hidden rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground sm:inline">
            ESC
          </kbd>
        </div>

        <div className="max-h-[420px] overflow-y-auto py-2">
          {filteredStatic.length > 0 && (
            <Group label={t("Akcje")}>
              {filteredStatic.map((item, i) => (
                <Row
                  key={item.id}
                  item={item}
                  active={i === activeIdx}
                  onClick={() => go(item.href)}
                  onHover={() => setActiveIdx(i)}
                />
              ))}
            </Group>
          )}

          {debounced.length >= 2 && (
            <Group label={t("Wyniki")}>
              {isFetching && searchItems.length === 0 && (
                <p className="px-4 py-6 text-center text-[12px] text-muted-foreground">
                  {t("Szukam…")}
                </p>
              )}
              {!isFetching && searchItems.length === 0 && debounced.length >= 2 && (
                <p className="px-4 py-6 text-center text-[12px] text-muted-foreground">
                  {t("Brak wyników dla")} „{debounced}”
                </p>
              )}
              {searchItems.map((item, i) => {
                const idx = filteredStatic.length + i;
                return (
                  <Row
                    key={item.id}
                    item={item}
                    active={idx === activeIdx}
                    onClick={() => go(item.href)}
                    onHover={() => setActiveIdx(idx)}
                  />
                );
              })}
            </Group>
          )}

          {debounced.length < 2 && filteredStatic.length === 0 && (
            <p className="px-4 py-8 text-center text-[12px] text-muted-foreground">
              {t("Wpisz co najmniej 2 znaki, aby wyszukać")}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono">↑↓</kbd>{" "}
              {t("nawigacja")}
            </span>
            <span>
              <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono">↵</kbd>{" "}
              {t("otwórz")}
            </span>
          </div>
          <span>{t("⌘K / Ctrl+K")}</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-1">
      <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
        {label}
      </p>
      {children}
    </div>
  );
}

function Row({
  item,
  active,
  onClick,
  onHover,
}: {
  item: Item;
  active: boolean;
  onClick: () => void;
  onHover: () => void;
}) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onHover}
      className={`flex w-full items-center gap-3 px-4 py-2 text-left transition-colors ${
        active ? "bg-accent" : "hover:bg-accent/60"
      }`}
    >
      <Icon className={`h-4 w-4 shrink-0 ${TONE_CLASSES[item.tone]}`} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-foreground">{item.label}</p>
        {item.hint && (
          <p className="truncate text-[11px] text-muted-foreground">{item.hint}</p>
        )}
      </div>
      {active && <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />}
    </button>
  );
}

export function CommandPaletteTrigger() {
  const { t } = useI18n();

  function fire() {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }));
  }

  return (
    <button
      type="button"
      onClick={fire}
      className="hidden w-full items-center gap-2 rounded-md border border-border bg-muted/40 px-2.5 py-1.5 text-[12px] text-muted-foreground transition hover:border-primary/30 hover:text-foreground md:flex"
    >
      <Search className="h-3.5 w-3.5" />
      <span className="flex-1 text-left">{t("Szukaj")}…</span>
      <kbd className="rounded border border-border bg-background px-1 py-0.5 text-[10px] font-mono">
        ⌘K
      </kbd>
    </button>
  );
}
