"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { api } from "@/lib/trpc-react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ImageUpload } from "@/components/image-upload";
import { RegionLogo } from "@/components/region-logo";
import { Pencil, Check, X, Trophy, MapPin } from "lucide-react";

interface ClubProfileFormProps {
  club: {
    id: string;
    name: string;
    logoUrl: string | null;
    coverUrl: string | null;
    description: string | null;
    city: string | null;
    regionId: number | null;
    leagueGroupId: number | null;
    leagueGroup: { id: number; name: string; leagueLevel: { id: number; name: string } } | null;
    contactEmail: string | null;
    contactPhone: string | null;
    website: string | null;
    facebookUrl: string | null;
    instagramUrl: string | null;
  };
  regions: { id: number; name: string; slug: string }[];
}

/* ── Inline editable field ── */
function EditableField({
  label,
  value,
  placeholder,
  type = "text",
  onSave,
  isPending,
}: {
  label: string;
  value: string;
  placeholder?: string;
  type?: string;
  onSave: (v: string) => void;
  isPending: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  function save() {
    onSave(draft);
    setEditing(false);
  }

  function cancel() {
    setDraft(value);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="space-y-1.5">
        <Label>{label}</Label>
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            type={type}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); save(); }
              if (e.key === "Escape") cancel();
            }}
            className="flex-1"
          />
          <button
            onClick={save}
            disabled={isPending}
            className="shrink-0 rounded-md p-1.5 text-emerald-500 hover:bg-emerald-500/10"
          >
            <Check className="h-4 w-4" />
          </button>
          <button
            onClick={cancel}
            className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-muted-foreground">{label}</Label>
      <div className="group flex items-center gap-2 px-3 py-2">
        <span className={value ? "flex-1 text-sm" : "flex-1 text-sm text-muted-foreground"}>
          {value || placeholder || "—"}
        </span>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="shrink-0 rounded-md p-1 text-muted-foreground/0 transition hover:bg-muted hover:text-muted-foreground group-hover:text-muted-foreground/60"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

/* ── Editable textarea ── */
function EditableTextarea({
  label,
  value,
  placeholder,
  onSave,
  isPending,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onSave: (v: string) => void;
  isPending: boolean;
}) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  function save() {
    onSave(draft);
    setEditing(false);
  }

  function cancel() {
    setDraft(value);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="space-y-1.5">
        <Label>{label}</Label>
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={4}
          autoFocus
        />
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" className="gap-1 text-xs text-emerald-500" onClick={save} disabled={isPending}>
            <Check className="h-3.5 w-3.5" /> {t("Zapisz")}
          </Button>
          <Button size="sm" variant="ghost" className="gap-1 text-xs text-muted-foreground" onClick={cancel}>
            <X className="h-3.5 w-3.5" /> {t("Anuluj")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-muted-foreground">{label}</Label>
      <div className="group flex items-start gap-2 px-3 py-2">
        <span className={value ? "flex-1 whitespace-pre-wrap text-sm" : "flex-1 text-sm text-muted-foreground"}>
          {value || placeholder || "—"}
        </span>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mt-0.5 shrink-0 rounded-md p-1 text-muted-foreground/0 transition hover:bg-muted hover:text-muted-foreground group-hover:text-muted-foreground/60"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

/* ── Main component ── */
export function ClubProfileForm({ club, regions }: ClubProfileFormProps) {
  const { t } = useI18n();
  const [logoUrl, setLogoUrl] = useState<string | null>(club.logoUrl);
  const [coverUrl, setCoverUrl] = useState<string | null>(club.coverUrl);

  // Field values (kept in sync after save)
  const [name, setName] = useState(club.name);
  const [city, setCity] = useState(club.city ?? "");
  const [contactEmail, setContactEmail] = useState(club.contactEmail ?? "");
  const [contactPhone, setContactPhone] = useState(club.contactPhone ?? "");
  const [website, setWebsite] = useState(club.website ?? "");
  const [facebookUrl, setFacebookUrl] = useState(club.facebookUrl ?? "");
  const [instagramUrl, setInstagramUrl] = useState(club.instagramUrl ?? "");
  const [description, setDescription] = useState(club.description ?? "");

  // Region / league state
  const [regionId, setRegionId] = useState<number | null>(club.regionId);
  const [leagueLevelId, setLeagueLevelId] = useState<number | null>(
    club.leagueGroup?.leagueLevel.id ?? null
  );
  const [leagueGroupId, setLeagueGroupId] = useState<number | null>(club.leagueGroupId);
  const [editingLeague, setEditingLeague] = useState(false);
  const [savedRegionId, setSavedRegionId] = useState(regionId);
  const [savedLevelId, setSavedLevelId] = useState(leagueLevelId);
  const [savedGroupId, setSavedGroupId] = useState(leagueGroupId);

  const { data: hierarchy = [] } = api.region.hierarchy.useQuery(
    { regionId: regionId! },
    { enabled: !!regionId }
  );

  useEffect(() => {
    if (!regionId) {
      setLeagueLevelId(null);
      setLeagueGroupId(null);
    }
  }, [regionId]);

  const selectedLevel = hierarchy.find((l) => l.id === leagueLevelId);
  const currentRegion = regions.find((r) => r.id === regionId);
  const currentLevelName =
    hierarchy.find((l) => l.id === leagueLevelId)?.name ??
    club.leagueGroup?.leagueLevel.name;
  const currentGroupName =
    (selectedLevel?.groups ?? []).find((g) => g.id === leagueGroupId)?.name ??
    club.leagueGroup?.name;

  const updateMut = api.club.update.useMutation({
    onSuccess: () => toast.success(t("Zapisano")),
    onError: (err) => toast.error(err.message || t("Nie udało się zapisać")),
  });

  /** Save all current values */
  function save(overrides: Record<string, unknown> = {}) {
    updateMut.mutate({
      name,
      logoUrl: logoUrl ?? undefined,
      coverUrl: coverUrl ?? undefined,
      description: description || undefined,
      city: city || undefined,
      regionId: regionId ?? undefined,
      leagueGroupId: leagueGroupId ?? undefined,
      contactEmail: contactEmail || undefined,
      contactPhone: contactPhone || undefined,
      website: website || undefined,
      facebookUrl: facebookUrl || undefined,
      instagramUrl: instagramUrl || undefined,
      ...overrides,
    });
  }

  function startEditLeague() {
    setSavedRegionId(regionId);
    setSavedLevelId(leagueLevelId);
    setSavedGroupId(leagueGroupId);
    setEditingLeague(true);
  }

  function cancelEditLeague() {
    setRegionId(savedRegionId);
    setLeagueLevelId(savedLevelId);
    setLeagueGroupId(savedGroupId);
    setEditingLeague(false);
  }

  function confirmEditLeague() {
    setEditingLeague(false);
    save({
      regionId: regionId ?? undefined,
      leagueGroupId: leagueGroupId ?? undefined,
    });
  }

  // Progress
  const profileFields = [
    { key: "regionId", label: t("Region"), filled: !!regionId },
    { key: "city", label: t("Miasto"), filled: !!city },
    { key: "logoUrl", label: t("Logo"), filled: !!logoUrl },
    { key: "description", label: t("Opis"), filled: !!description },
    { key: "contactEmail", label: t("E-mail kontaktowy"), filled: !!contactEmail },
    { key: "leagueGroupId", label: t("Liga"), filled: !!leagueGroupId },
  ];
  const filledCount = profileFields.filter((f) => f.filled).length;
  const progress = Math.round((filledCount / profileFields.length) * 100);

  return (
    <>
      {progress < 100 && (
        <Card className="mb-6 border-primary/20">
          <CardContent className="py-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium">{t("Profil uzupełniony w")} {progress}%</p>
              <p className="text-xs text-muted-foreground">{filledCount} z {profileFields.length}</p>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {profileFields.filter((f) => !f.filled).map((f) => (
                <span key={f.key} className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                  {f.label}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Region & League ── */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            {t("Region i liga")}
          </CardTitle>
          {!editingLeague ? (
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={startEditLeague}>
              <Pencil className="h-3.5 w-3.5" /> {t("Edytuj")}
            </Button>
          ) : (
            <div className="flex gap-1.5">
              <Button variant="ghost" size="sm" className="gap-1 text-xs text-emerald-600" onClick={confirmEditLeague}>
                <Check className="h-3.5 w-3.5" /> {t("Zapisz")}
              </Button>
              <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground" onClick={cancelEditLeague}>
                <X className="h-3.5 w-3.5" /> {t("Anuluj")}
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {!editingLeague ? (
            <div className="flex items-center gap-4">
              {currentRegion ? (
                <RegionLogo slug={currentRegion.slug} name={currentRegion.name} size={48} />
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                {currentRegion ? (
                  <>
                    <p className="text-sm font-semibold">{currentRegion.name}</p>
                    {currentLevelName ? (
                      <p className="text-[13px] text-muted-foreground">
                        {currentLevelName}{currentGroupName && ` — ${currentGroupName}`}
                      </p>
                    ) : (
                      <p className="text-[12px] text-muted-foreground">{t("Szczebel ligowy nie ustawiony")}</p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">{t("Brak regionu")}</p>
                    <p className="text-[12px] text-muted-foreground">{t('Kliknij „Edytuj", aby ustawić region i ligę')}</p>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>{t("Region (ZPN)")}</Label>
                <select
                  value={regionId ?? ""}
                  onChange={(e) => {
                    const val = e.target.value ? Number(e.target.value) : null;
                    setRegionId(val);
                    setLeagueLevelId(null);
                    setLeagueGroupId(null);
                  }}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">{t("Wybierz region")}</option>
                  {regions.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              {regionId && hierarchy.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>{t("Szczebel ligowy")}</Label>
                    <select
                      value={leagueLevelId ?? ""}
                      onChange={(e) => {
                        const val = e.target.value ? Number(e.target.value) : null;
                        setLeagueLevelId(val);
                        setLeagueGroupId(null);
                      }}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">{t("Wybierz szczebel")}</option>
                      {hierarchy.map((l) => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                      ))}
                    </select>
                  </div>
                  {selectedLevel && selectedLevel.groups.length > 0 && (
                    <div className="space-y-1.5">
                      <Label>{t("Grupa")}</Label>
                      <select
                        value={leagueGroupId ?? ""}
                        onChange={(e) => setLeagueGroupId(e.target.value ? Number(e.target.value) : null)}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="">{t("Wybierz grupę")}</option>
                        {selectedLevel.groups.map((g) => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Club Profile ── */}
      <Card>
        <CardHeader>
          <CardTitle>{t("Profil klubu")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-muted-foreground">{t("Zdjęcie tła")}</Label>
            <ImageUpload
              variant="cover"
              currentUrl={coverUrl}
              folder="clubs-covers"
              entityId={club.id}
              onUploaded={(url) => {
                setCoverUrl(url);
                save({ coverUrl: url });
              }}
            />
          </div>

          <ImageUpload
            currentUrl={logoUrl}
            folder="clubs"
            entityId={club.id}
            onUploaded={(url) => {
              setLogoUrl(url);
              save({ logoUrl: url });
            }}
          />

          <div className="grid gap-x-6 gap-y-1 md:grid-cols-2">
            <EditableField
              label={t("Nazwa klubu")}
              value={name}
              onSave={(v) => { setName(v); save({ name: v }); }}
              isPending={updateMut.isPending}
            />
            <EditableField
              label={t("Miasto")}
              value={city}
              placeholder="np. Poznań"
              onSave={(v) => { setCity(v); save({ city: v || undefined }); }}
              isPending={updateMut.isPending}
            />
            <EditableField
              label={t("E-mail kontaktowy")}
              value={contactEmail}
              type="email"
              placeholder="email@klub.pl"
              onSave={(v) => { setContactEmail(v); save({ contactEmail: v || undefined }); }}
              isPending={updateMut.isPending}
            />
            <EditableField
              label={t("Telefon")}
              value={contactPhone}
              placeholder="np. 600 100 200"
              onSave={(v) => { setContactPhone(v); save({ contactPhone: v || undefined }); }}
              isPending={updateMut.isPending}
            />
            <EditableField
              label={t("Strona www")}
              value={website}
              placeholder="https://..."
              onSave={(v) => { setWebsite(v); save({ website: v || undefined }); }}
              isPending={updateMut.isPending}
            />
            <EditableField
              label="Facebook"
              value={facebookUrl}
              placeholder="https://facebook.com/..."
              onSave={(v) => { setFacebookUrl(v); save({ facebookUrl: v || undefined }); }}
              isPending={updateMut.isPending}
            />
            <EditableField
              label="Instagram"
              value={instagramUrl}
              placeholder="https://instagram.com/..."
              onSave={(v) => { setInstagramUrl(v); save({ instagramUrl: v || undefined }); }}
              isPending={updateMut.isPending}
            />
          </div>

          <EditableTextarea
            label={t("Opis")}
            value={description}
            placeholder="Opisz swój klub..."
            onSave={(v) => { setDescription(v); save({ description: v || undefined }); }}
            isPending={updateMut.isPending}
          />
        </CardContent>
      </Card>
    </>
  );
}
