import type { SVGProps } from "react";

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
  "aria-hidden": true,
};

export function PinIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...p}>
      <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export function LightbulbIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...p}>
      <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3Z" />
    </svg>
  );
}

export function CheckIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12 2.5 2.5 4.5-5" />
    </svg>
  );
}

export function ArrowRightIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...p}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

export function PlusIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...p}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export function MenuIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...p}>
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="17" x2="20" y2="17" />
    </svg>
  );
}

export function CloseIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...p}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ───────────────────────────────────────────────────────────────
// AVI dimension icons
// ───────────────────────────────────────────────────────────────

export function UserIcon(p: SVGProps<SVGSVGElement>) {
  // Founder Credibility
  return (
    <svg {...base} {...p}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.5 3.1-6 7-6s7 2.5 7 6" />
    </svg>
  );
}

export function SearchIcon(p: SVGProps<SVGSVGElement>) {
  // Live AI Test
  return (
    <svg {...base} {...p}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <line x1="15.5" y1="15.5" x2="20" y2="20" />
    </svg>
  );
}

export function FingerprintIcon(p: SVGProps<SVGSVGElement>) {
  // Entity Clarity
  return (
    <svg {...base} {...p}>
      <path d="M5 12a7 7 0 0 1 14 0v2" />
      <path d="M8 12a4 4 0 0 1 8 0v3" />
      <path d="M11 12v4c0 1 .3 2 .8 2.8" />
      <path d="M14 15v2c0 .9-.2 1.8-.6 2.6" />
    </svg>
  );
}

export function LayersIcon(p: SVGProps<SVGSVGElement>) {
  // Methodology Depth
  return (
    <svg {...base} {...p}>
      <path d="M12 3 3 7.5 12 12l9-4.5L12 3Z" />
      <path d="M3 12.5 12 17l9-4.5" />
      <path d="M3 17 12 21.5 21 17" />
    </svg>
  );
}

export function CodeIcon(p: SVGProps<SVGSVGElement>) {
  // Structured Data
  return (
    <svg {...base} {...p}>
      <polyline points="8 7 3 12 8 17" />
      <polyline points="16 7 21 12 16 17" />
      <line x1="14" y1="5" x2="10" y2="19" />
    </svg>
  );
}

export function NetworkIcon(p: SVGProps<SVGSVGElement>) {
  // Agent + Citation Graph
  return (
    <svg {...base} {...p}>
      <circle cx="12" cy="5" r="2" />
      <circle cx="5" cy="18" r="2" />
      <circle cx="19" cy="18" r="2" />
      <circle cx="12" cy="13" r="2" />
      <line x1="12" y1="7" x2="12" y2="11" />
      <line x1="10.5" y1="14.5" x2="6.5" y2="16.5" />
      <line x1="13.5" y1="14.5" x2="17.5" y2="16.5" />
    </svg>
  );
}

const ICONS = {
  pin: PinIcon,
  lightbulb: LightbulbIcon,
  check: CheckIcon,
  user: UserIcon,
  search: SearchIcon,
  fingerprint: FingerprintIcon,
  layers: LayersIcon,
  code: CodeIcon,
  network: NetworkIcon,
} as const;

export type IconName = keyof typeof ICONS;

export function Icon({
  name,
  ...props
}: { name: IconName } & SVGProps<SVGSVGElement>) {
  const Cmp = ICONS[name];
  return <Cmp {...props} />;
}
