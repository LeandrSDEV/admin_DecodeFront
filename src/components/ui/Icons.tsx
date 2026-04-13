import React from "react";

type Props = React.SVGProps<SVGSVGElement> & { size?: number };

function baseProps(p: Props) {
  const { size = 18, ...rest } = p;
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    ...rest,
  } as React.SVGProps<SVGSVGElement>;
}

export function IconDashboard(p: Props) {
  return (
    <svg {...baseProps(p)}>
      <path
        d="M4 13h7V4H4v9Zm9 7h7V11h-7v9ZM4 20h7v-5H4v5Zm9-11h7V4h-7v5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconBuilding(p: Props) {
  return (
    <svg {...baseProps(p)}>
      <path
        d="M4 20V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v14"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path d="M2 20h20" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path
        d="M8 8h2M8 12h2M8 16h2M12 8h2M12 12h2M12 16h2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconMessage(p: Props) {
  return (
    <svg {...baseProps(p)}>
      <path
        d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M7.5 8.5h9M7.5 12h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function IconUsers(p: Props) {
  return (
    <svg {...baseProps(p)}>
      <path d="M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0Z" stroke="currentColor" strokeWidth="1.7" />
      <path d="M4 20a7 7 0 0 1 16 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function IconActivity(p: Props) {
  return (
    <svg {...baseProps(p)}>
      <path
        d="M4 12h3l2-6 4 12 2-6h3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M3 4v16M21 4v16" stroke="currentColor" strokeWidth="1.3" opacity="0.35" />
    </svg>
  );
}

export function IconSettings(p: Props) {
  return (
    <svg {...baseProps(p)}>
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M19.4 15a7.8 7.8 0 0 0 .1-1l2-1.2-2-3.4-2.3.6a7.9 7.9 0 0 0-1.7-1L15 6H9l-.5 2.9a7.9 7.9 0 0 0-1.7 1L4.5 9.4 2.5 12.8l2 1.2a7.8 7.8 0 0 0 .1 1L2.5 16.2l2 3.4 2.3-.6a7.9 7.9 0 0 0 1.7 1L9 22h6l.5-2.9a7.9 7.9 0 0 0 1.7-1l2.3.6 2-3.4-2-1.2Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
        opacity="0.8"
      />
    </svg>
  );
}

export function IconLogOut(p: Props) {
  return (
    <svg {...baseProps(p)}>
      <path
        d="M10 17l-1 3h-4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h4l1 3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path d="M15 12H7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path
        d="M15 12l-3-3M15 12l-3 3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M21 4v16" stroke="currentColor" strokeWidth="1.3" opacity="0.35" />
    </svg>
  );
}

export function IconChevronDown(p: Props) {
  return (
    <svg {...baseProps(p)}>
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconMenu(p: Props) {
  return (
    <svg {...baseProps(p)}>
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function IconEye(p: Props) {
  return (
    <svg {...baseProps(p)}>
      <path
        d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function IconEyeOff(p: Props) {
  return (
    <svg {...baseProps(p)}>
      <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M10.6 10.6a3 3 0 0 0 4.2 4.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path
        d="M7.1 7.1C4.4 9 2.5 12 2.5 12s3.5 7 9.5 7c1.8 0 3.3-.4 4.6-1"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M14.2 5.3c4.9 1.2 7.3 6.7 7.3 6.7s-1.2 2.4-3.5 4.3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconPlus(p: Props) {
  return (
    <svg {...baseProps(p)}>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function IconPencil(p: Props) {
  return (
    <svg {...baseProps(p)}>
      <path d="M12 20h9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path
        d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4L16.5 3.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconTrash(p: Props) {
  return (
    <svg {...baseProps(p)}>
      <path d="M4 7h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M6 7l1 14h10l1-14" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9 7V4h6v3" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

export function IconSearch(p: Props) {
  return (
    <svg {...baseProps(p)}>
      <path d="M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function IconDownload(p: Props) {
  return (
    <svg {...baseProps(p)}>
      <path d="M12 5v10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M8 12l4 4 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 17v2a1 1 0 001 1h14a1 1 0 001-1v-2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function IconRefresh(p: Props) {
  return (
    <svg {...baseProps(p)}>
      <path d="M4 12a8 8 0 0114.93-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M20 12a8 8 0 01-14.93 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M19 4v4h-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 20v-4h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconCheck(p: Props) {
  return (
    <svg {...baseProps(p)}>
      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconX(p: Props) {
  return (
    <svg {...baseProps(p)}>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function IconShield(p: Props) {
  return (
    <svg {...baseProps(p)}>
      <path
        d="M12 3l8 4v5c0 4.5-3.2 8.7-8 10-4.8-1.3-8-5.5-8-10V7l8-4Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconGlobe(p: Props) {
  return (
    <svg {...baseProps(p)}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 12h18" stroke="currentColor" strokeWidth="1.4" />
      <path d="M12 3a15 15 0 014 9 15 15 0 01-4 9 15 15 0 01-4-9 15 15 0 014-9Z" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

export function IconClock(p: Props) {
  return (
    <svg {...baseProps(p)}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconFilter(p: Props) {
  return (
    <svg {...baseProps(p)}>
      <path
        d="M3 4h18l-7 8.5V18l-4 2v-7.5L3 4Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconUser(p: Props) {
  return (
    <svg {...baseProps(p)}>
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.7" />
      <path d="M4 20a8 8 0 0116 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function IconMail(p: Props) {
  return (
    <svg {...baseProps(p)}>
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 7l9 6 9-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconPhone(p: Props) {
  return (
    <svg {...baseProps(p)}>
      <path
        d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 5a2 2 0 012-1Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconKey(p: Props) {
  return (
    <svg {...baseProps(p)}>
      <circle cx="8" cy="15" r="4" stroke="currentColor" strokeWidth="1.7" />
      <path d="M11 12l9-9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M17 6l3 3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function IconChevronLeft(p: Props) {
  return (
    <svg {...baseProps(p)}>
      <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconChevronRight(p: Props) {
  return (
    <svg {...baseProps(p)}>
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconPower(p: Props) {
  return (
    <svg {...baseProps(p)}>
      <path d="M12 3v9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M18.36 6.64A9 9 0 1 1 5.64 6.64" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
