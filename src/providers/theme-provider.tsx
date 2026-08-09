"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Wraps `next-themes` so theme configuration lives in one place.
 *
 * The app is dark-first: `defaultTheme` is `dark`, but users can switch to the
 * system preference or light mode via the theme toggle.
 */
export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
