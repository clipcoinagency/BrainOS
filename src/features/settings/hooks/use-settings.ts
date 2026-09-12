"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";

import { updateProfile } from "../actions";
import type { UpdateProfileInput } from "../schemas";

/**
 * Update the profile's display name. On success, calls `router.refresh()` —
 * the shell's sidebar/topbar name comes from a Server Component layout
 * (`getUser()`), which only refetches on a Next.js navigation/refresh, not
 * on a client-side mutation succeeding on its own.
 */
export function useUpdateProfile() {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: UpdateProfileInput) => updateProfile(input),
    onSuccess: (result) => {
      if ("data" in result) {
        router.refresh();
      }
    },
  });
}
