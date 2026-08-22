"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CheckSession({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("http://localhost:8080/check_session", {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) {
          router.push("/");
          return;
        }

        const data = await res.json();

        if (!data.authenticated) {
          router.push("/");
        }
      } catch (err) {
        console.error("Error checking session:", err);
        router.push("/");
      }
    };

    checkSession();
  }, [router]);

  return <>{children}</>;
}
