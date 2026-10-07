/** Label versi rilis, mis. "Tabungin v0.1.0 (a1b2c3d)". Commit hanya ada di build Vercel. */
export function AppVersion({ className = "" }: { className?: string }) {
  const commit = process.env.NEXT_PUBLIC_APP_COMMIT;
  return <p className={`text-center text-xs ${className}`}>{`Tabungin v${process.env.NEXT_PUBLIC_APP_VERSION}${commit ? ` (${commit})` : ""}`}</p>;
}
