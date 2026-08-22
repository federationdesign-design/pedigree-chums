"use client";

import type { ReactNode, CSSProperties } from "react";
import { useLeaveDialog } from "./LeaveDialogProvider";

/* Drop-in replacement for an outbound <a target="_blank">. Renders a REAL anchor
   (so SSR emits a working, crawlable link and it still navigates with JS off), but
   intercepts a plain left-click to raise the sitewide leave dialogue instead of
   navigating straight out. Modifier / middle clicks (open-in-new-tab, etc.) are
   left to the browser. Pass-through: className, style, children, aria-*, title. */
type Props = {
  href: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  "aria-label"?: string;
  title?: string;
};

export default function OutboundLink({ href, children, className, style, ...rest }: Props) {
  const { confirmLeave } = useLeaveDialog();
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      style={style}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        confirmLeave(href);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
