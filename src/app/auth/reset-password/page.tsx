// Server-component wrapper so the route-segment config actually takes effect.
// The recovery flow arrives with tokens in the URL hash; caching the HTML
// would hand every user the same stale chunk references.
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import ResetPasswordClient from "./reset-password-client";

export default function ResetPasswordPage() {
  return <ResetPasswordClient />;
}
