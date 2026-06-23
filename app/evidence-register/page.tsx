import type { Metadata } from "next";
import Nav from "../../components/Nav/Nav";
import Footer from "../../components/Footer/Footer";
import styles from "../toy-safety/toy-safety.module.css";

export const metadata: Metadata = {
  title: "Evidence Register | Pedigree Chums",
  description:
    "Status of the supporting compliance evidence for the Pedigree Chums dog bingo card game Technical File.",
};

const rows: [string, string][] = [
  ["Technical File v0.3", "Complete draft"],
  ["Ricoh black toner SDS", "Received"],
  ["Ricoh yellow toner SDS", "Received"],
  ["Ricoh magenta toner SDS", "Received"],
  ["Ricoh cyan toner SDS", "Received"],
  ["Benchmark no-extra-finish confirmation", "Received"],
  ["Card stock details", "Received, but supplier spec still useful"],
  ["Boxboard details", "Received, but supplier spec still useful"],
  ["EN 71-1 report", "Pending"],
  ["EN 71-2 report", "Pending"],
  ["EN 71-3 report", "Pending"],
  ["Barcode/GTIN", "Pending"],
  ["Trademark/name", "Pending"],
  ["Final artwork approval", "Pending"],
  ["Declaration of Conformity", "Draft only"],
];

export default function EvidenceRegisterPage() {
  return (
    <>
      <Nav />
      <main className={styles.wrap}>
        <div className={styles.doc}>
          <h1>Evidence Register</h1>
          <p className={styles.sub}>Pedigree Chums, dog bingo game. Status of supporting compliance evidence.</p>

          <div className={styles.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th scope="col">Evidence</th>
                  <th scope="col" style={{ textAlign: "right" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(([evidence, status]) => (
                  <tr key={evidence}>
                    <td>{evidence}</td>
                    <td style={{ textAlign: "right" }}>{status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <Footer tradeLinks />
    </>
  );
}
