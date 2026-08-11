// The four Dogs at Work payslips (brief v3.0 section 13), keyed by article slug.
// The Job Title, Department and the medical Human Values are the supplied,
// locked strings (sentence-cased). The differentiation values (Shift Pattern 3,
// Official Duties, Paid In, Retirement, and Human Value 3) were proposed at the
// checkpoint 6 halt and approved by Steve field by field on 11 August 2026; they
// are applied here. Human Value on articles 1, 2 and 4 stays as supplied, per the
// medical guardrail.

import type { PayslipData } from "../../../components/Payslip/Payslip";

export const PAYSLIPS: Record<string, PayslipData> = {
  // Article 1
  "the-dogs-teaching-medicine-how-to-smell-disease": {
    jobTitle: "Disease sniffers",
    department: "Bio-detection",
    shiftPattern: "9-5 mon/fri",
    officialDuties: "Sniffing samples",
    humanValue: "Medical innovation",
    paidIn: "Biscuits and praise",
    retirement: "A warm basket",
  },
  // Article 2 (replaces the earlier nine-field payslip on this page)
  "the-colleague-who-never-clocks-off": {
    jobTitle: "Blood-sugar bodyguard",
    department: "Human help",
    shiftPattern: "24/7",
    officialDuties: "Alerting",
    humanValue: "Saving lives",
    paidIn: "Dinner and stolen sausages",
    // Names nobody: Sarah is an unconfirmed illustrative placeholder, so the
    // proposed "Sarah's sofa" was rejected in favour of this.
    retirement: "The sofa, on duty",
  },
  // Article 3 (slug unchanged after the retitle)
  "the-electronic-nose": {
    jobTitle: "Computer trainer",
    department: "Bio-detection",
    shiftPattern: "9-5, fixed term",
    officialDuties: "Collecting data",
    humanValue: "Training the machines",
    paidIn: "One well-earned biscuit",
    retirement: "A quiet corner",
  },
  // Article 4 (page built at checkpoint 7; data ready)
  "the-farm-worker-with-four-legs": {
    jobTitle: "Herder",
    department: "Sheep consolidation",
    shiftPattern: "5am-3pm mon-sat",
    officialDuties: "Herding",
    humanValue: "Optimising processing",
    paidIn: "A tennis ball, thrown far",
    retirement: "By the farmhouse fire",
  },
  // Article 5 (search and rescue). Trimmed values from the supplied copy, sentence
  // cased; the longer originals recorded in the copy are not used (they overflow
  // the card).
  "the-dog-that-finds-you-when-nobody-else-can": {
    jobTitle: "Missing person finder",
    department: "Emergency search",
    shiftPattern: "Whenever somebody goes missing",
    officialDuties: "Search, locate, alert",
    humanValue: "Search area reduced, people found",
    paidIn: "Favourite toy and another go",
    retirement: "Sofa, with garden inspections",
  },
  // Article 6 (guide dogs). Trimmed values from the supplied copy, sentence cased;
  // the longer originals in the copy are not used (they overflow the card).
  "the-dog-that-gives-you-your-world-back": {
    jobTitle: "Obstacle avoidance officer",
    department: "Independence",
    shiftPattern: "Harness on",
    officialDuties: "Kerbs, obstacles, ignoring pigeons",
    humanValue: "Mobility, confidence, independence",
    paidIn: "Praise, treats, the free run after",
    retirement: "Sofas, walks, nobody's commute",
  },
};
