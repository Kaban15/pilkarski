"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { api } from "@/lib/trpc-react";
import { registerSchema } from "@/lib/validators/auth";
import { getFieldErrors, type FieldErrors } from "@/lib/form-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Shield, Users, UserPlus, GraduationCap } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [role, setRole] = useState<"CLUB" | "PLAYER" | "COACH">("CLUB");
  const credentialsRef = useRef<{ email: string; password: string } | null>(null);

  const registerMut = api.auth.register.useMutation({
    onSuccess: async () => {
      toast.success("Rejestracja udana! Logowanie...");
      const creds = credentialsRef.current;
      if (creds) {
        const result = await signIn("credentials", {
          email: creds.email,
          password: creds.password,
          redirect: false,
        });
        if (result?.ok) {
          router.push("/feed");
          return;
        }
      }
      // Fallback if auto-login fails
      router.push("/login?registered=true");
    },
    onError: (err) => {
      setError(err.message || "Wystąpił błąd podczas rejestracji");
    },
  });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    const formData = new FormData(e.currentTarget);
    const data = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      role,
      clubName: (formData.get("clubName") as string) || undefined,
      firstName: (formData.get("firstName") as string) || undefined,
      lastName: (formData.get("lastName") as string) || undefined,
    };

    const result = registerSchema.safeParse(data);
    if (!result.success) {
      setFieldErrors(getFieldErrors(result.error));
      return;
    }

    credentialsRef.current = { email: data.email, password: data.password };
    registerMut.mutate(data);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-primary/5 via-background to-background p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-base font-bold text-primary-foreground">
              PS
            </div>
            <span className="text-2xl font-bold tracking-tight">PilkaSport</span>
          </Link>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Dołącz do PilkaSport</CardTitle>
            <CardDescription>Wybierz typ konta i zarejestruj się</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Role selector */}
            <div className="mb-6 grid grid-cols-3 gap-3">
              {([
                { value: "CLUB" as const, Icon: Shield, label: "Klub" },
                { value: "PLAYER" as const, Icon: Users, label: "Zawodnik" },
                { value: "COACH" as const, Icon: GraduationCap, label: "Trener" },
              ]).map(({ value, Icon, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRole(value)}
                  className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition ${
                    role === value
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border hover:border-primary/30 hover:bg-muted"
                  }`}
                >
                  <Icon className={`h-6 w-6 ${role === value ? "text-primary" : "text-muted-foreground"}`} />
                  <span className="text-sm font-semibold">{label}</span>
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="twoj@email.pl"
                  autoComplete="email"
                  className={fieldErrors.email ? "border-destructive" : ""}
                />
                {fieldErrors.email && (
                  <p className="text-xs text-destructive">{fieldErrors.email}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Hasło</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="Minimum 8 znaków"
                  autoComplete="new-password"
                  className={fieldErrors.password ? "border-destructive" : ""}
                />
                {fieldErrors.password && (
                  <p className="text-xs text-destructive">{fieldErrors.password}</p>
                )}
              </div>

              {role === "CLUB" && (
                <div className="space-y-2">
                  <Label htmlFor="clubName">Nazwa klubu</Label>
                  <Input
                    id="clubName"
                    name="clubName"
                    placeholder="np. KS Orlik Poznań"
                    required
                    className={fieldErrors.clubName ? "border-destructive" : ""}
                  />
                  {fieldErrors.clubName && (
                    <p className="text-xs text-destructive">{fieldErrors.clubName}</p>
                  )}
                </div>
              )}

              {(role === "PLAYER" || role === "COACH") && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Imię</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      placeholder="Jan"
                      required
                      className={fieldErrors.firstName ? "border-destructive" : ""}
                    />
                    {fieldErrors.firstName && (
                      <p className="text-xs text-destructive">{fieldErrors.firstName}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Nazwisko</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      placeholder="Kowalski"
                      required
                      className={fieldErrors.lastName ? "border-destructive" : ""}
                    />
                    {fieldErrors.lastName && (
                      <p className="text-xs text-destructive">{fieldErrors.lastName}</p>
                    )}
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded-lg bg-destructive/10 p-3 text-center text-sm font-medium text-destructive">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full gap-2" disabled={registerMut.isPending}>
                <UserPlus className="h-4 w-4" />
                {registerMut.isPending ? "Rejestracja..." : "Zarejestruj się"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Masz już konto?{" "}
              <Link href="/login" className="font-semibold text-primary hover:underline">
                Zaloguj się
              </Link>
            </p>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} PilkaSport
        </p>
      </div>
    </div>
  );
}
