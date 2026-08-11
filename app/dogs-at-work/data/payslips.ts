// The four Dogs at Work payslips (brief v3.0 section 13), keyed by article slug.
// The values are supplied and locked: shipped as written, with sentence case
// applied consistently within each field (the only change permitted, logged in
// the checkpoint 6 copy change log). None of these is reworded, shortened or
// improved here. The differentiation proposals are a separate, proposal-only
// task and are NOT applied in this file.

import type { PayslipData } from "../../../components/Payslip/Payslip";

export const PAYSLIPS: Record<string, PayslipData> = {
  // Article 1
  "the-dogs-teaching-medicine-how-to-smell-disease": {
    jobTitle: "Disease sniffers",
    department: "Bio-detection",
    shiftPattern: "9-5 mon/fri",
    officialDuties: "Sniffing",
    humanValue: "Medical innovation",
    paidIn: "Head strokes, dog biscuits",
    retirement: "Sofa, blanket",
  },
  // Article 2 (replaces the earlier nine-field payslip on this page)
  "the-colleague-who-never-clocks-off": {
    jobTitle: "Blood-sugar bodyguard",
    department: "Human help",
    shiftPattern: "24/7",
    officialDuties: "Sniffing",
    humanValue: "Saving lives",
    paidIn: "Head strokes, dog biscuits",
    retirement: "Sofa, blanket",
  },
  // Article 3 (slug unchanged after the retitle)
  "the-electronic-nose": {
    jobTitle: "Computer trainer",
    department: "Bio-detection",
    shiftPattern: "9-5 mon/fri",
    officialDuties: "Sniffing",
    humanValue: "Medical innovation",
    paidIn: "Head strokes, dog biscuits",
    retirement: "Sofa, blanket",
  },
  // Article 4 (page built at checkpoint 7; data ready)
  "the-farm-worker-with-four-legs": {
    jobTitle: "Herder",
    department: "Sheep consolidation",
    shiftPattern: "5am-3pm mon-sat",
    officialDuties: "Herding",
    humanValue: "Optimising processing",
    paidIn: "Head strokes, dog biscuits",
    retirement: "Sofa, blanket",
  },
};
