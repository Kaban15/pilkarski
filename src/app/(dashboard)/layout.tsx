import { auth } from "@/server/auth/config";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { OfflineBanner } from "@/components/offline-banner";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-background">
      <OfflineBanner />
      <Sidebar user={session.user} />
      <main className="pb-20 md:pb-0 md:ml-60">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
