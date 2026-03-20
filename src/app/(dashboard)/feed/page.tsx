import { auth } from "@/server/auth/config";

export default async function FeedPage() {
  const session = await auth();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">
        Witaj, {session?.user?.name || session?.user?.email}!
      </h1>
      <p className="text-gray-600">
        Feed z aktywnościami z Twojego regionu pojawi się w Fazie 6.
      </p>
    </div>
  );
}
