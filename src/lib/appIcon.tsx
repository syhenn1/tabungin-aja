import { ImageResponse } from "next/og";

// Kepala PatRot: satu sumber untuk favicon, ikon iPhone, dan ikon PWA.
const PARROT = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="8 2 50 58"><ellipse cx="22" cy="14" rx="3.5" ry="9" transform="rotate(-25 22 14)" fill="#49a4bb"/><ellipse cx="29" cy="12" rx="3.5" ry="10" transform="rotate(-5 29 12)" fill="#15d8b3"/><ellipse cx="30" cy="38" rx="18" ry="20" fill="#15d8b3"/><ellipse cx="22" cy="42" rx="7" ry="13" transform="rotate(12 22 42)" fill="#2e6fa0"/><ellipse cx="37" cy="30" rx="8" ry="7.5" fill="#fff"/><circle cx="38" cy="30" r="3.5" fill="#101a44"/><circle cx="39.3" cy="28.6" r="1.3" fill="#fff"/><path d="M45 31 Q56 30 54 40 Q50 36 45 37 Z" fill="#ffb830"/></svg>`;
const SRC = `data:image/svg+xml;base64,${Buffer.from(PARROT).toString("base64")}`;

/** PNG persegi berlatar navy. scale kecil = ruang aman untuk ikon "maskable" Android. */
export function appIcon(size: number, { radius = 0, scale = 0.72 } = {}) {
  const art = Math.round(size * scale);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#2f39a9", borderRadius: radius }}>
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
        <img src={SRC} width={art} height={Math.round(art * 1.16)} />
      </div>
    ),
    { width: size, height: size },
  );
}
