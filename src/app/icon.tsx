import { appIcon } from "@/lib/appIcon";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return appIcon(32, { radius: 8, scale: 0.8 });
}
