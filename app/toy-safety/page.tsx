import type { Metadata } from "next";
import Nav from "../../components/Nav/Nav";
import Footer from "../../components/Footer/Footer";
import styles from "./toy-safety.module.css";

export const metadata: Metadata = {
  title: "Toy Safety Technical File | Pedigree Chums",
  description:
    "Materials, bill of materials, safety assessment and production testing specification for the Pedigree Chums dog bingo card game.",
};

export default function ToySafetyPage() {
  return (
    <>
      <Nav />
      <main className={styles.wrap}>
        <div className={styles.doc}>
          <h1>Toy Safety Technical File</h1>
          <p className={styles.sub}>Pedigree Chums, dog bingo game. Last updated June 2026.</p>

          <h2>Product materials and manufacturing specification</h2>
          <div className={styles.tableWrap}>
            <table>
              <tbody>
                <tr><th scope="row">Product name</th><td>Pedigree Chums, dog bingo game</td></tr>
                <tr><th scope="row">Product type</th><td>Printed card game / dog bingo game</td></tr>
                <tr><th scope="row">Target age</th><td>6+</td></tr>
                <tr><th scope="row">Number of cards</th><td>54</td></tr>
                <tr><th scope="row">Printer / manufacturer</th><td>Benchmark Reprographics Ltd.</td></tr>
                <tr><th scope="row">Retail packaging</th><td>Standard playing-card cardboard box</td></tr>
                <tr><th scope="row">Plastic retail packaging</th><td>None</td></tr>
                <tr><th scope="row">Adhesive</th><td>None</td></tr>
                <tr><th scope="row">Accessories</th><td>None</td></tr>
                <tr><th scope="row">Retail unit supplied shrink-wrapped</th><td>No</td></tr>
                <tr><th scope="row">Pallet wrap</th><td>Pallet wrap may be used for delivery/logistics only. It is not part of the consumer retail toy unit.</td></tr>
              </tbody>
            </table>
          </div>

          <h3>Materials</h3>
          <div className={styles.tableWrap}>
            <table>
              <thead>
                <tr><th scope="col">Component</th><th scope="col">Material / specification</th><th scope="col">Notes</th></tr>
              </thead>
              <tbody>
                <tr><td>Playing cards</td><td>300gsm Novatech Silk, FSC approved</td><td>Final production card material</td></tr>
                <tr><td>Card finish</td><td>Printed card, finish TBC</td><td>Final ink/finish details to be confirmed</td></tr>
                <tr><td>Card edges</td><td>Rounded edges / rounded corners</td><td>Intended to reduce sharp-edge/corner risk</td></tr>
                <tr><td>Outer box</td><td>450gsm boxboard, FSC approved</td><td>Standard playing-card cardboard box</td></tr>
                <tr><td>Box finish</td><td>Production box will not be laminated</td><td>The sample box is laminated, but this is prototype/sample only and will not be used for the production run</td></tr>
                <tr><td>Adhesive</td><td>None</td><td>No adhesive used in the retail toy unit</td></tr>
                <tr><td>Plastic packaging</td><td>None</td><td>No shrink wrap and no plastic bag on retail unit</td></tr>
              </tbody>
            </table>
          </div>

          <h3>Prototype / sample note</h3>
          <p>
            A sample box has been produced with lamination. This laminated sample is not representative of the
            final production specification. The final production box will not be laminated.
          </p>
          <p>
            The laminated sample should not be used as the only basis for final toy-safety testing unless the final
            production run is also laminated. Final EN 71 testing and final Technical File evidence should be based on
            the production specification: 300gsm Novatech Silk FSC-approved cards, 450gsm FSC-approved boxboard, no
            lamination, no adhesive, no shrink wrap, no plastic retail packaging, and rounded card edges.
          </p>

          <h2>Bill of materials</h2>
          <div className={styles.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th scope="col">Item</th><th scope="col">Material</th><th scope="col">Supplier / manufacturer</th>
                  <th scope="col">Specification</th><th scope="col">Evidence required</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Playing cards</td><td>Card stock</td><td>Benchmark Reprographics Ltd. / TBC supply source</td><td>300gsm Novatech Silk, FSC approved</td><td>Material specification and FSC evidence</td></tr>
                <tr><td>Card printing inks</td><td>Printing ink</td><td>Benchmark Reprographics Ltd. / TBC ink supplier</td><td>TBC</td><td>Ink SDS and/or chemical declaration</td></tr>
                <tr><td>Card coating / finish</td><td>TBC</td><td>Benchmark Reprographics Ltd. / TBC supplier</td><td>TBC</td><td>Finish/coating details and SDS if applicable</td></tr>
                <tr><td>Card edges</td><td>Physical finish</td><td>Benchmark Reprographics Ltd.</td><td>Rounded edges / rounded corners</td><td>Production QC record</td></tr>
                <tr><td>Outer box</td><td>Boxboard</td><td>Benchmark Reprographics Ltd. / TBC supply source</td><td>450gsm boxboard, FSC approved</td><td>Material specification and FSC evidence</td></tr>
                <tr><td>Box printing inks</td><td>Printing ink</td><td>Benchmark Reprographics Ltd. / TBC ink supplier</td><td>TBC</td><td>Ink SDS and/or chemical declaration</td></tr>
                <tr><td>Box finish</td><td>No lamination in production</td><td>Benchmark Reprographics Ltd.</td><td>Non-laminated final production box</td><td>Production specification confirmation</td></tr>
                <tr><td>Adhesive</td><td>Not applicable</td><td>Not applicable</td><td>No adhesive used</td><td>Manufacturer confirmation</td></tr>
                <tr><td>Retail plastic packaging</td><td>Not applicable</td><td>Not applicable</td><td>No shrink wrap / no plastic bag</td><td>Manufacturer confirmation</td></tr>
                <tr><td>Pallet wrap</td><td>Logistics packaging only</td><td>TBC</td><td>Used only for pallet transport, if required</td><td>Not part of retail toy unit</td></tr>
              </tbody>
            </table>
          </div>

          <h2>Safety assessment notes</h2>

          <h3>Mechanical and physical safety</h3>
          <p>
            The product consists of 54 printed cards supplied in a cardboard playing-card box. There are no loose
            accessories, tokens, dice, counters, pencils, timers, batteries, magnets, or small additional components.
          </p>
          <p>
            The playing cards have rounded edges/corners. This is a design control intended to reduce the risk of sharp
            corners or uncomfortable handling during shuffling, dealing, and normal play.
          </p>
          <p>
            Mechanical and physical risk is considered low, subject to confirmation by EN 71-1 testing or assessment on
            final production samples.
          </p>

          <h3>Chemical safety</h3>
          <p>
            The product is made from printed card and printed boxboard. The relevant chemical risk comes mainly from
            printing inks and any print finish or coating used on the cards and box.
          </p>
          <p>
            The final production box will not be laminated. The laminated sample box is not representative of the final
            production specification and should not be relied upon as the basis for final chemical testing.
          </p>
          <p>
            Chemical compliance should be demonstrated using supplier material declarations, ink/finish Safety Data
            Sheets where available, and EN 71-3 migration testing on the final printed production materials.
          </p>

          <h3>Flammability</h3>
          <p>
            The product is made from paper/cardboard materials. There is no plastic retail packaging, no adhesive in the
            retail unit, and no laminated production box.
          </p>
          <p>
            Flammability risk is considered low for normal use, subject to EN 71-2 assessment/testing on the final
            production sample.
          </p>

          <h3>Packaging</h3>
          <p>
            The consumer retail unit is supplied in a cardboard playing-card box with no shrink wrap and no plastic bag.
            Pallet wrap may be used for delivery/logistics only and is not part of the consumer retail toy unit.
          </p>
          <p>
            No suffocation warning for retail plastic packaging is required unless plastic retail packaging is later
            added.
          </p>

          <h2>Testing instruction for laboratory</h2>
          <p>
            Please test/assess the final production specification of the product, not the laminated prototype sample.
          </p>
          <p>Product to be tested:</p>
          <ul>
            <li>Product name: Pedigree Chums, dog bingo game.</li>
            <li>Product type: printed card game / dog bingo game.</li>
            <li>Age grade: 6+.</li>
            <li>Contents: 54 printed cards in a standard printed cardboard playing-card box.</li>
            <li>Card material: 300gsm Novatech Silk, FSC approved.</li>
            <li>Box material: 450gsm boxboard, FSC approved.</li>
            <li>Production box: non-laminated.</li>
            <li>Accessories: none.</li>
            <li>Adhesive: none.</li>
            <li>Retail plastic packaging: none.</li>
            <li>Card edges: rounded.</li>
          </ul>
          <p>Required reports/evidence:</p>
          <ul>
            <li>EN 71-1 mechanical and physical properties.</li>
            <li>EN 71-2 flammability.</li>
            <li>EN 71-3 migration of certain elements.</li>
            <li>REACH/SVHC declaration or equivalent supplier chemical declarations for accessible materials.</li>
            <li>SDS or equivalent chemical information for inks and any coatings/finishes used.</li>
          </ul>
          <p>
            The test report should clearly identify the final production materials and should not describe the product as
            laminated unless the production product is actually laminated.
          </p>

          <h2>Change-control note</h2>
          <p>The following changes require review before further sale or production:</p>
          <div className={styles.tableWrap}>
            <table>
              <thead>
                <tr><th scope="col">Change</th><th scope="col">Required action</th></tr>
              </thead>
              <tbody>
                <tr><td>Change from non-laminated to laminated box</td><td>Chemical and mechanical review; likely retesting</td></tr>
                <tr><td>Change to card stock from 300gsm Novatech Silk</td><td>Material review; consider retesting</td></tr>
                <tr><td>Change to 450gsm boxboard</td><td>Material review; consider retesting</td></tr>
                <tr><td>Change to ink system or print finish</td><td>Obtain updated SDS/declarations; consider EN 71-3 retest</td></tr>
                <tr><td>Addition of adhesive</td><td>Obtain SDS and chemical declaration; review EN 71-3 impact</td></tr>
                <tr><td>Addition of shrink wrap or plastic bag</td><td>Review packaging/suffocation warning requirements</td></tr>
                <tr><td>Addition of tokens, dice, counters, or accessories</td><td>Reassess EN 71-1 small-parts and mechanical risks</td></tr>
                <tr><td>Removal of rounded card edges</td><td>Reassess sharp corner/edge risk</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
