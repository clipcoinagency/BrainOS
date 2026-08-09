import { redirect } from "next/navigation";

/**
 * The root route redirects into the app shell. When authentication is added,
 * this is where you would branch to a marketing/landing page for signed-out
 * visitors and to `/dashboard` for signed-in users.
 */
export default function RootPage() {
  redirect("/dashboard");
}
