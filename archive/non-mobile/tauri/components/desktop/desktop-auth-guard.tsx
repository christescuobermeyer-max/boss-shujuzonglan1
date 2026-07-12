"use client";

import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { isDesktopLoggedIn } from "@/lib/desktop-auth";

export function DesktopAuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (isDesktopLoggedIn()) {
      setAllowed(true);
      return;
    }

    setAllowed(false);
    router.replace("/login");
  }, [router]);

  if (!allowed) {
    return null;
  }

  return <>{children}</>;
}
