import styles from "./Payslip.module.css";

// The Dogs at Work payslip: a reusable visual signature (brief v3.0 Appendix C),
// not a table. Seven fields in a fixed order (section 13). Field labels are bold,
// values regular. Every row carries a tick box; six are ticked and the last, which
// binds to the Retirement field, is empty. That is the joke: the dog has not
// retired yet. The empty box binds to the field, never to a row index.

export interface PayslipData {
  jobTitle: string;
  department: string;
  shiftPattern: string;
  officialDuties: string;
  humanValue: string;
  paidIn: string;
  retirement: string;
}

const ROWS: { key: keyof PayslipData; label: string }[] = [
  { key: "jobTitle", label: "Job Title" },
  { key: "department", label: "Department" },
  { key: "shiftPattern", label: "Shift Pattern" },
  { key: "officialDuties", label: "Official Duties" },
  { key: "humanValue", label: "Human Value" },
  { key: "paidIn", label: "Paid In" },
  { key: "retirement", label: "Retirement" },
];

function Tick() {
  return (
    <svg className={styles.tick} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M4 12l5.5 6L20 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Payslip({ data }: { data: PayslipData }) {
  return (
    <div className={styles.payslip}>
      <p className={styles.heading}>Dog Payslip</p>
      <div className={styles.rows}>
        {ROWS.map(({ key, label }) => {
          // Bind the empty box to the Retirement field, not to the last index.
          const ticked = key !== "retirement";
          return (
            <div className={styles.row} key={key}>
              <span className={styles.label}>{label}</span>
              <span className={styles.value}>{data[key]}</span>
              <span className={styles.box} aria-hidden="true">
                {ticked ? <Tick /> : null}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
