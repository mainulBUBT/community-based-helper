"use client";

import { useEffect, useState } from "react";
import { clockAt, type Clock } from "@/utils/hours";

export function useClock(): Clock {
  const [clock, setClock] = useState(clockAt);

  useEffect(() => {
    const id = setInterval(() => setClock(clockAt()), 60_000);
    return () => clearInterval(id);
  }, []);

  return clock;
}
