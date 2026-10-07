import { appIcon } from "@/lib/appIcon";

// Ikon layar utama iPhone. iOS membulatkan sudutnya sendiri.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return appIcon(180);
}
