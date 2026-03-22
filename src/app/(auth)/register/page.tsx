"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<"CLUB" | "PLAYER">("CLUB");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setLoading(true);

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
      setLoading(false);
      return;
    }

    try {
      await trpc.auth.register.mutate(data);
      toast.success("Rejestracja udana! Zaloguj się.");
      router.push("/login?registered=true");
    } catch (err: any) {
      setError(err.message || "Wystąpił błąd podczas rejestracji");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Rejestracja</CardTitle>
          <CardDescription>Dołącz do PilkaSport</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={role} onValueChange={(v) => setRole(v as "CLUB" | "PLAYER")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="CLUB">Klub</TabsTrigger>
              <TabsTrigger value="PLAYER">Zawodnik</TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="twoj@email.pl"
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
                  className={fieldErrors.password ? "border-destructive" : ""}
                />
                {fieldErrors.password && (
                  <p className="text-xs text-destructive">{fieldErrors.password}</p>
                )}
              </div>

              <TabsContent value="CLUB" className="mt-0 space-y-2">
                <Label htmlFor="clubName">Nazwa klubu</Label>
                <Input
                  id="clubName"
                  name="clubName"
                  placeholder="np. KS Orlik Poznań"
                  required={role === "CLUB"}
                  className={fieldErrors.clubName ? "border-destructive" : ""}
                />
                {fieldErrors.clubName && (
                  <p className="text-xs text-destructive">{fieldErrors.clubName}</p>
                )}
              </TabsContent>

              <TabsContent value="PLAYER" className="mt-0 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Imię</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    placeholder="Jan"
                    required={role === "PLAYER"}
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
                    required={role === "PLAYER"}
                    className={fieldErrors.lastName ? "border-destructive" : ""}
                  />
                  {fieldErrors.lastName && (
                    <p className="text-xs text-destructive">{fieldErrors.lastName}</p>
                  )}
                </div>
              </TabsContent>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Rejestracja..." : "Zarejestruj się"}
              </Button>
            </form>
          </Tabs>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Masz już konto?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Zaloguj się
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
