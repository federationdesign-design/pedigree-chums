// Placeholder launcher mark (runbook rule 3: the robot head is the approved
// placeholder, implemented as a single easily replaced asset). Kept tiny and
// dependency-free so the closed launcher stays lightweight.
export default function PickAChumIcon() {
  return (
    <svg viewBox="0 0 48 48" width="60%" height="60%" aria-hidden="true" focusable="false">
      <rect x="12" y="16" width="24" height="18" rx="5" fill="#ffffff" />
      <circle cx="19" cy="25" r="3" fill="#00A9EF" />
      <circle cx="29" cy="25" r="3" fill="#00A9EF" />
      <rect x="22" y="9" width="4" height="6" rx="2" fill="#ffffff" />
      <circle cx="24" cy="8" r="2.5" fill="#ffffff" />
      <rect x="7" y="22" width="4" height="8" rx="2" fill="#ffffff" />
      <rect x="37" y="22" width="4" height="8" rx="2" fill="#ffffff" />
    </svg>
  );
}
