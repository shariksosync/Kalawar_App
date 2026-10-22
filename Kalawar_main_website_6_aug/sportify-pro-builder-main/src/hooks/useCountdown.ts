import { useEffect, useState } from "react";

export function useCountdown(target: string | Date) {
  const targetTime = new Date(target).getTime();
  // Start from the target time so SSR and the first client render match exactly.
  const [now, setNow] = useState(targetTime);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const diff = Math.max(targetTime - now, 0);
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff / 3600000) % 24),
    minutes: Math.floor((diff / 60000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    finished: diff === 0,
  };
}
