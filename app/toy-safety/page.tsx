import type { Metadata } from "next";
import Nav from "../../components/Nav/Nav";
import Footer from "../../components/Footer/Footer";
import styles from "./toy-safety.module.css";

export const metadata: Metadata = {
  title: "Toy Safety Technical File | Pedigree Chums",
  description:
    "Working draft Toy Safety Technical File for the Pedigree Chums dog bingo card game: product specification, bill of materials, chemical evidence, safety assessment and testing plan.",
};

export default function ToySafetyPage() {
  return (
    <>
      <Nav tradeLinks />
      <main className={styles.wrap}>
        <div className={styles.doc}>
          <h1>Toy Safety Technical File</h1>
          <p className={styles.sub}>Pedigree Chums, dog bingo game. Working title, name/trademark clearance pending.</p>

          <div className={styles.tableWrap}>
            <table>
              <thead><tr><th scope="col">Field</th><th scope="col">Current entry</th></tr></thead>
              <tbody>
                <tr><th scope="row">Document version</th><td>Draft v0.3</td></tr>
                <tr><th scope="row">Date prepared</th><td>23 June 2026</td></tr>
                <tr><th scope="row">Prepared for</th><td>Federation Design / brand owner, legal entity and address TBC</td></tr>
                <tr><th scope="row">Printer / production supplier</th><td>Benchmark Reprographics Ltd.</td></tr>
                <tr><th scope="row">Product type</th><td>Printed dog bingo / card game</td></tr>
                <tr><th scope="row">Target age</th><td>6+</td></tr>
                <tr><th scope="row">Intended market</th><td>UK product; GB / NI / EU route to be confirmed before final marking</td></tr>
                <tr><th scope="row">Status</th><td>Pre-production technical documentation pack. Lab reports, final declaration, barcode and final legal details pending.</td></tr>
              </tbody>
            </table>
          </div>

          <div className={styles.note}>
            <p>Important: this is a working Technical File draft. It is not a final legal sign-off or safety certification. The final file should be completed after final production samples, EN 71 reports, supplier declarations, final artwork, product name, barcode and conformity marking decision are confirmed.</p>
          </div>

          <h2>Contents</h2>
          <ol>
            <li>Document control and open items</li>
            <li>Product identification</li>
            <li>Product classification and scope</li>
            <li>Economic operators and traceability</li>
            <li>Product description and final production specification</li>
            <li>Bill of Materials</li>
            <li>Chemical and finishing evidence</li>
            <li>Applicable requirements and standards</li>
            <li>Safety assessment</li>
            <li>Age grading rationale</li>
            <li>Testing and evidence plan</li>
            <li>Labelling and artwork checklist</li>
            <li>Production control and quality checks</li>
            <li>Change control</li>
            <li>Post-market monitoring</li>
            <li>Compliance tracker</li>
            <li>Draft UK Declaration of Conformity</li>
            <li>Appendix A - Lab brief</li>
            <li>Appendix B - Supplier evidence checklist</li>
            <li>Appendix C - Product liability / insurance summary</li>
            <li>Appendix D - Evidence index</li>
          </ol>

          <h2>1. Document control and open items</h2>
          <div className={styles.tableWrap}>
            <table>
              <thead><tr><th scope="col">Item</th><th scope="col">Current position</th></tr></thead>
              <tbody>
                <tr><th scope="row">Document status</th><td>Working draft v0.3. Suitable for organising evidence and briefing lab/suppliers; not ready for final signing.</td></tr>
                <tr><th scope="row">Product name</th><td>Pedigree Chums, dog bingo game is the current working title. Name/trademark clearance is pending and name may change.</td></tr>
                <tr><th scope="row">Stable internal product code</th><td>Recommended: FDB-DOGBINGO-54-6PLUS-V1. Use a stable code that does not depend on the final product name.</td></tr>
                <tr><th scope="row">Barcode / GTIN</th><td>In progress. Product data to be aligned with final name, final SKU and final packaging.</td></tr>
                <tr><th scope="row">Legal manufacturer / brand owner</th><td>TBC. Full legal entity and postal address required before final declaration and packaging approval.</td></tr>
                <tr><th scope="row">Conformity marking</th><td>UKCA / CE route pending. Decide before final packaging print.</td></tr>
                <tr><th scope="row">Lab reports</th><td>EN 71-1, EN 71-2 and EN 71-3 pending.</td></tr>
              </tbody>
            </table>
          </div>

          <h2>2. Product identification</h2>
          <div className={styles.tableWrap}>
            <table>
              <thead><tr><th scope="col">Field</th><th scope="col">Entry</th></tr></thead>
              <tbody>
                <tr><th scope="row">Working product name</th><td>Pedigree Chums, dog bingo game</td></tr>
                <tr><th scope="row">Product type</th><td>Printed dog bingo / card game</td></tr>
                <tr><th scope="row">Intended age</th><td>6+</td></tr>
                <tr><th scope="row">Number of cards</th><td>54</td></tr>
                <tr><th scope="row">Accessories</th><td>None</td></tr>
                <tr><th scope="row">Box type</th><td>Standard playing-card cardboard box</td></tr>
                <tr><th scope="row">Plastic retail packaging</th><td>None, no shrink wrap and no plastic bag on the retail unit</td></tr>
                <tr><th scope="row">Language</th><td>English UK</td></tr>
                <tr><th scope="row">Market</th><td>UK product; specific GB / NI / EU sales route to be confirmed</td></tr>
                <tr><th scope="row">Packaging artwork</th><td>Available; final version pending name/trademark outcome, barcode and conformity marking</td></tr>
                <tr><th scope="row">Branding and characters</th><td>Expected to remain even if product name changes</td></tr>
              </tbody>
            </table>
          </div>

          <h2>3. Product classification and scope</h2>
          <p><strong>Classification:</strong> The product is treated as a toy/game because it is intended for use in play by children aged 6 years and above and family users.</p>
          <p><strong>Scope:</strong> This Technical File covers the printed card game only: 54 printed cards and one printed cardboard playing-card box. It does not cover any future accessory, token, dice, plastic wrap, electronic component, battery, magnet, scent, liquid, food-contact part, cosmetic, slime, putty or other added item.</p>
          <div className={styles.note}>
            <p>If the final product name changes for trademark reasons, the Technical File should be updated, but the physical safety evidence may remain applicable if the materials, construction, age grade, contents, instructions and warnings remain unchanged.</p>
          </div>

          <h2>4. Economic operators and traceability</h2>
          <div className={styles.tableWrap}>
            <table>
              <thead><tr><th scope="col">Role</th><th scope="col">Details</th><th scope="col">Status</th></tr></thead>
              <tbody>
                <tr><td>Brand owner / manufacturer for compliance purposes</td><td>TBC, legal entity and postal address required</td><td>Pending</td></tr>
                <tr><td>Printer / production supplier</td><td>Benchmark Reprographics Ltd.</td><td>Identified</td></tr>
                <tr><td>Importer</td><td>TBC / not applicable if made and sold in the UK by UK entity</td><td>Pending</td></tr>
                <tr><td>Authorised representative</td><td>TBC / only if required by chosen market route</td><td>Pending</td></tr>
                <tr><td>Batch code / SKU</td><td>TBC. Recommended: use stable internal code and production batch reference</td><td>Pending</td></tr>
                <tr><td>Barcode / GTIN</td><td>In progress</td><td>Pending</td></tr>
              </tbody>
            </table>
          </div>

          <h2>5. Product description and final production specification</h2>
          <div className={styles.tableWrap}>
            <table>
              <thead><tr><th scope="col">Feature</th><th scope="col">Final production specification</th></tr></thead>
              <tbody>
                <tr><th scope="row">Contents</th><td>54 printed cards in one standard cardboard playing-card box</td></tr>
                <tr><th scope="row">Cards</th><td>300gsm Novatech Silk, FSC approved</td></tr>
                <tr><th scope="row">Box</th><td>450gsm boxboard, FSC approved</td></tr>
                <tr><th scope="row">Card edges</th><td>Rounded edges / rounded corners</td></tr>
                <tr><th scope="row">Printing system</th><td>Ricoh Color LP Print Cartridge Type 260 CMYK toner set</td></tr>
                <tr><th scope="row">Lamination</th><td>None in final production. Sample box was laminated but this is prototype only.</td></tr>
                <tr><th scope="row">Coating / varnish / primer / sealant</th><td>None, per printer written confirmation</td></tr>
                <tr><th scope="row">Adhesive</th><td>None, per printer written confirmation</td></tr>
                <tr><th scope="row">Retail shrink wrap / plastic bag</th><td>None</td></tr>
                <tr><th scope="row">Pallet wrap</th><td>May be used for delivery/logistics only; not part of the consumer retail toy unit</td></tr>
                <tr><th scope="row">Electronics / batteries / magnets</th><td>None</td></tr>
                <tr><th scope="row">Scented / food-contact / liquid / cosmetic / slime / putty components</th><td>None</td></tr>
              </tbody>
            </table>
          </div>

          <h2>6. Bill of Materials</h2>
          <div className={styles.tableWrap}>
            <table>
              <thead><tr><th scope="col">Item</th><th scope="col">Material / specification</th><th scope="col">Evidence status</th></tr></thead>
              <tbody>
                <tr><td>Playing cards</td><td>300gsm Novatech Silk, FSC approved</td><td>Specification provided by printer; supplier declaration/FSC claim evidence to retain</td></tr>
                <tr><td>Outer box</td><td>450gsm boxboard, FSC approved</td><td>Specification provided by printer; supplier declaration/FSC claim evidence to retain</td></tr>
                <tr><td>Black toner</td><td>Ricoh Color LP Print Cartridge Type 260 Black, SDS 888446</td><td>SDS received</td></tr>
                <tr><td>Yellow toner</td><td>Ricoh Color LP Print Cartridge Type 260 Yellow, SDS 888447</td><td>SDS received; duplicate uploads received</td></tr>
                <tr><td>Magenta toner</td><td>Ricoh Color LP Print Cartridge Type 260 Magenta, SDS 888448</td><td>SDS received; duplicate uploads received</td></tr>
                <tr><td>Cyan toner</td><td>Ricoh Color LP Print Cartridge Type 260 Cyan, SDS 888449</td><td>SDS received</td></tr>
                <tr><td>Coating / varnish / laminate / primer / sealant</td><td>None used in final production</td><td>Printer written confirmation received</td></tr>
                <tr><td>Adhesive</td><td>None used in final production</td><td>Printer written confirmation received</td></tr>
                <tr><td>Retail plastic packaging</td><td>None</td><td>Confirmed by product specification</td></tr>
                <tr><td>Accessories</td><td>None</td><td>Confirmed by product specification</td></tr>
              </tbody>
            </table>
          </div>

          <h2>7. Chemical and finishing evidence</h2>
          <p><strong>Summary:</strong> The printer has provided SDS documents for the CMYK toner set and written confirmation that these are the only toners/inks used on the final production cards and box. The printer has also confirmed that no additional coating, varnish, laminate, primer, sealant, adhesive or finishing chemical will be used on the production run.</p>
          <div className={styles.tableWrap}>
            <table>
              <thead><tr><th scope="col">Colour</th><th scope="col">Product</th><th scope="col">SDS no.</th><th scope="col">Issue date</th></tr></thead>
              <tbody>
                <tr><td>Black</td><td>Ricoh Color LP Print Cartridge Type 260 Black toner</td><td>888446</td><td>04 July 2023</td></tr>
                <tr><td>Yellow</td><td>Ricoh Color LP Print Cartridge Type 260 Yellow toner</td><td>888447</td><td>13 July 2023</td></tr>
                <tr><td>Magenta</td><td>Ricoh Color LP Print Cartridge Type 260 Magenta toner</td><td>888448</td><td>05 July 2023</td></tr>
                <tr><td>Cyan</td><td>Ricoh Color LP Print Cartridge Type 260 Cyan toner</td><td>888449</td><td>05 July 2023</td></tr>
              </tbody>
            </table>
          </div>
          <p>The SDS sheets are supporting supplier chemical evidence. They do not replace EN 71-3 testing. EN 71-3 should be performed on the final printed cards and printed box, using the non-laminated production specification.</p>
          <p><strong>Known SDS points to retain in file:</strong> The uploaded SDS documents identify the toner products, supplier/importer Ricoh UK Ltd., manufacturer Ricoh Co., Ltd., issue dates and SDS numbers. The SDS sheets state that the mixtures do not meet the criteria for classification under the referenced CLP classification section. They include composition information such as polyester resin, pigments, silica, wax and titanium dioxide at less than 1%; the black toner also includes carbon black. The SDS sheets also include a statement that specified RoHS substances and SVHC substances are not present as ingredients.</p>

          <h2>8. Applicable requirements and standards</h2>
          <div className={styles.tableWrap}>
            <table>
              <thead><tr><th scope="col">Area</th><th scope="col">Applies?</th><th scope="col">Evidence / action</th></tr></thead>
              <tbody>
                <tr><td>UK toy safety requirements</td><td>Yes</td><td>Complete Technical File, safety assessment, testing evidence, Declaration of Conformity and correct marking route.</td></tr>
                <tr><td>EN 71-1 mechanical and physical properties</td><td>Yes</td><td>Test/assess final production sample: rounded cards, box, physical safety, age grade and warnings.</td></tr>
                <tr><td>EN 71-2 flammability</td><td>Yes</td><td>Test/assess final production sample made from paper/cardboard materials.</td></tr>
                <tr><td>EN 71-3 migration of certain elements</td><td>Yes</td><td>Test final printed cards and box. Main relevance: toner/printed surfaces and any material constituents.</td></tr>
                <tr><td>UK REACH / chemical restrictions</td><td>Relevant</td><td>Retain SDS, SVHC/REACH declarations and EN 71-3 report.</td></tr>
                <tr><td>Packaging rules / EPR</td><td>May apply</td><td>Check business thresholds and supply route. Cardboard retail packaging is present.</td></tr>
                <tr><td>FSC / environmental claims</td><td>Only if claimed</td><td>Use only approved FSC wording/logo where supported by chain-of-custody/claim evidence.</td></tr>
                <tr><td>Electronics / WEEE / battery rules</td><td>No</td><td>No electronics or batteries.</td></tr>
                <tr><td>Food-contact / cosmetics / liquids / slime</td><td>No</td><td>No such components.</td></tr>
              </tbody>
            </table>
          </div>

          <h2>9. Safety assessment</h2>
          <h3>9.1 Intended and foreseeable use</h3>
          <p>Intended use: family/children's dog bingo/card game for players aged 6+.</p>
          <p>Foreseeable normal use: handling, sorting, shuffling, dealing, reading/recognising cards, storing cards in the box.</p>
          <p>Foreseeable misuse: younger children handling or mouthing cards, cards being bent/torn/chewed, box being torn, cards used near flame or heat source, loss of instructions.</p>
          <h3>9.2 Risk assessment table</h3>
          <div className={styles.tableWrap}>
            <table>
              <thead><tr><th scope="col">Hazard</th><th scope="col">Initial risk</th><th scope="col">Controls</th><th scope="col">Residual position</th></tr></thead>
              <tbody>
                <tr><td>Sharp corners / edges</td><td>Low to medium</td><td>Rounded card edges; clean cutting; production QC; EN 71-1 assessment</td><td>Low if production and EN 71-1 acceptable</td></tr>
                <tr><td>Paper/card cuts</td><td>Low</td><td>300gsm card stock; rounded corners; QC for poor cuts or burrs</td><td>Low</td></tr>
                <tr><td>Choking from small accessories</td><td>Low</td><td>No tokens, dice, counters, pencils, timers or accessories</td><td>Low</td></tr>
                <tr><td>Torn card pieces</td><td>Low</td><td>Age 6+; normal card-game use; QC on material quality</td><td>Low</td></tr>
                <tr><td>Packaging film suffocation</td><td>Not applicable</td><td>No retail shrink wrap or plastic bag</td><td>Not applicable</td></tr>
                <tr><td>Chemical migration from toners/print</td><td>Medium</td><td>CMYK toner SDS retained; no extra coating/finish; EN 71-3 test on finished cards/box</td><td>Low if EN 71-3 passes</td></tr>
                <tr><td>Chemical migration from coating/varnish/laminate</td><td>Not applicable for final production</td><td>Printer confirms no coating, varnish, laminate, primer, sealant or finishing chemical</td><td>Not applicable unless design changes</td></tr>
                <tr><td>Adhesive chemical risk</td><td>Not applicable</td><td>Printer confirms no adhesive in final retail toy unit</td><td>Not applicable</td></tr>
                <tr><td>Flammability of paper/cardboard</td><td>Low to medium</td><td>No highly flammable accessories; EN 71-2 assessment/test</td><td>Low if EN 71-2 acceptable</td></tr>
                <tr><td>Hygiene / contamination</td><td>Low</td><td>Dry storage; clean production and packing environment; QC checks</td><td>Low</td></tr>
                <tr><td>Electrical, battery or magnet hazards</td><td>Not applicable</td><td>No such components</td><td>Not applicable</td></tr>
              </tbody>
            </table>
          </div>
          <h3>9.3 Safety assessment conclusion</h3>
          <p><strong>Draft conclusion:</strong> Based on the current specification, the product appears to be a low-complexity printed card toy/game. The main safety evidence still required is EN 71-1, EN 71-2 and EN 71-3 testing/assessment on a final non-laminated production sample. The supplied CMYK toner SDS and printer written confirmation reduce uncertainty around inks/coatings/finishes, but finished-product testing remains required before final declaration.</p>

          <h2>10. Age grading rationale</h2>
          <div className={styles.tableWrap}>
            <table>
              <thead><tr><th scope="col">Age grade</th><th scope="col">Rationale</th></tr></thead>
              <tbody>
                <tr><td>6+</td><td>The game is intended for family/children's play and is expected to require recognition, matching, turn-taking, rule-following and/or reading ability. The product is not intended for children under 36 months and is not designed for mouthing. No small accessories are included.</td></tr>
              </tbody>
            </table>
          </div>
          <p>Do not automatically add "Not suitable for children under 36 months. Small parts." unless the final EN 71-1 assessment identifies a specific hazard that justifies it. A cards-only product with no small accessories may not need a small-parts warning, but the lab should confirm the final warning position.</p>

          <h2>11. Testing and evidence plan</h2>
          <div className={styles.tableWrap}>
            <table>
              <thead><tr><th scope="col">Test / evidence</th><th scope="col">Sample / scope</th><th scope="col">Status</th></tr></thead>
              <tbody>
                <tr><td>EN 71-1</td><td>Final non-laminated production sample; cards and box; age grade and warnings</td><td>Pending</td></tr>
                <tr><td>EN 71-2</td><td>Final non-laminated production sample; paper/cardboard materials</td><td>Pending</td></tr>
                <tr><td>EN 71-3</td><td>Final printed cards and box using Ricoh CMYK toner set</td><td>Pending</td></tr>
                <tr><td>REACH/SVHC declarations</td><td>Toners, card stock, boxboard and any other accessible materials</td><td>Partly supported by SDS; stock declarations still to retain</td></tr>
                <tr><td>CMYK toner SDS</td><td>Ricoh Type 260 Black, Yellow, Magenta, Cyan</td><td>Received</td></tr>
                <tr><td>Printer no-finish/no-adhesive confirmation</td><td>No coating, varnish, laminate, primer, sealant, adhesive or finishing chemical</td><td>Received</td></tr>
                <tr><td>FSC evidence</td><td>Card stock and boxboard claim evidence / permitted wording</td><td>To retain</td></tr>
                <tr><td>Final artwork review</td><td>Packaging, instructions, age grade, warnings, mark, address, batch code, barcode</td><td>Pending</td></tr>
              </tbody>
            </table>
          </div>

          <h2>12. Labelling and artwork checklist</h2>
          <div className={styles.tableWrap}>
            <table>
              <thead><tr><th scope="col">Artwork item</th><th scope="col">Status</th><th scope="col">Notes</th></tr></thead>
              <tbody>
                <tr><td>Final product name</td><td>Pending</td><td>Current working title may change after trademark review.</td></tr>
                <tr><td>Age grade</td><td>Required</td><td>Use 6+.</td></tr>
                <tr><td>Contents statement</td><td>Required</td><td>Contents: 54 cards.</td></tr>
                <tr><td>Manufacturer legal name and postal address</td><td>Pending</td><td>Must be added before final print.</td></tr>
                <tr><td>Batch / type / SKU / model identifier</td><td>Pending</td><td>Use stable internal product code plus batch reference.</td></tr>
                <tr><td>Barcode / GTIN</td><td>Pending</td><td>In progress. Add once confirmed.</td></tr>
                <tr><td>UKCA / CE mark</td><td>Pending</td><td>Decision required before final artwork.</td></tr>
                <tr><td>Warnings</td><td>Pending</td><td>Only include warnings justified by final safety assessment and lab review.</td></tr>
                <tr><td>Instructions / rules</td><td>Required</td><td>Must be clear in English UK.</td></tr>
                <tr><td>Plastic packaging warning</td><td>Not applicable</td><td>No retail plastic bag or shrink wrap.</td></tr>
                <tr><td>FSC claim / logo</td><td>Pending</td><td>Use only if Benchmark/supply chain confirms approved claim/chain-of-custody use.</td></tr>
              </tbody>
            </table>
          </div>

          <h2>13. Production control and quality checks</h2>
          <div className={styles.tableWrap}>
            <table>
              <thead><tr><th scope="col">Control</th><th scope="col">Method</th><th scope="col">Record</th></tr></thead>
              <tbody>
                <tr><td>Approved supplier</td><td>Use Benchmark Reprographics Ltd. or approved alternative only</td><td>Supplier record</td></tr>
                <tr><td>Material confirmation</td><td>Confirm 300gsm Novatech Silk cards and 450gsm boxboard before production</td><td>Material/spec sheet</td></tr>
                <tr><td>No lamination / no coating / no adhesive</td><td>Confirm production matches written sign-off</td><td>Production approval record</td></tr>
                <tr><td>Artwork approval</td><td>Approve final print-ready artwork after name, barcode and mark decisions</td><td>Signed proof / artwork version</td></tr>
                <tr><td>Card count</td><td>Check each unit contains 54 cards</td><td>QC checklist</td></tr>
                <tr><td>Rounded edges</td><td>Check card edges/corners are rounded and clean</td><td>QC checklist</td></tr>
                <tr><td>Box check</td><td>Check print, construction, batch code, address, mark, contents statement</td><td>QC checklist</td></tr>
                <tr><td>Batch traceability</td><td>Apply batch/SKU/model code consistently</td><td>Batch log</td></tr>
                <tr><td>Non-conforming product</td><td>Quarantine, record issue, corrective action before sale</td><td>NCR log</td></tr>
              </tbody>
            </table>
          </div>

          <h2>14. Change control</h2>
          <div className={styles.tableWrap}>
            <table>
              <thead><tr><th scope="col">Change</th><th scope="col">Required action</th></tr></thead>
              <tbody>
                <tr><td>Product name change only</td><td>Update artwork, Technical File, Declaration of Conformity, barcode/product listings and evidence index. Retesting may not be needed if physical specification unchanged.</td></tr>
                <tr><td>Character/branding artwork change</td><td>Review whether ink coverage, warnings, instructions or age positioning changes. Retesting normally not needed unless materials/process change materially.</td></tr>
                <tr><td>Change from non-laminated to laminated</td><td>Chemical and mechanical review; likely EN 71-3 retest and updated finishing evidence.</td></tr>
                <tr><td>Change to card stock</td><td>Review material evidence; consider EN 71 retest.</td></tr>
                <tr><td>Change to boxboard</td><td>Review material evidence; consider EN 71 retest.</td></tr>
                <tr><td>Change to toner/ink system</td><td>Obtain new SDS/declarations; likely EN 71-3 retest.</td></tr>
                <tr><td>Addition of coating/varnish/primer/sealant</td><td>Obtain SDS/declarations; likely EN 71-3 retest.</td></tr>
                <tr><td>Addition of adhesive</td><td>Obtain SDS/declarations; review EN 71-3 implications.</td></tr>
                <tr><td>Addition of retail plastic wrap/bag</td><td>Review suffocation warnings and packaging compliance.</td></tr>
                <tr><td>Addition of tokens/dice/counters/accessories</td><td>Reassess small-parts, mechanical and chemical risks; likely additional EN 71-1/3 testing.</td></tr>
                <tr><td>Removal of rounded card edges</td><td>Reassess edge/corner safety and EN 71-1 implications.</td></tr>
                <tr><td>Age-grade change</td><td>Update safety assessment, warnings, artwork and lab review.</td></tr>
              </tbody>
            </table>
          </div>

          <h2>15. Post-market monitoring</h2>
          <ul>
            <li>Maintain a complaints log for safety and quality issues.</li>
            <li>Record any injury, near miss, choking concern, sharp edge complaint, chemical odour, ink transfer, allergic reaction or other safety feedback.</li>
            <li>Track batch numbers and production dates for any issue reported.</li>
            <li>Review retailer feedback, returns and online reviews for safety signals.</li>
            <li>Maintain a corrective-action process for withdrawals or recalls if required.</li>
            <li>Keep Technical File, Declaration of Conformity, lab reports, supplier declarations and production/QC records for the required retention period.</li>
          </ul>

          <h2>16. Compliance tracker</h2>
          <div className={styles.tableWrap}>
            <table>
              <thead><tr><th scope="col">Item</th><th scope="col">Status</th><th scope="col">Notes</th></tr></thead>
              <tbody>
                <tr><td>Product specification</td><td>Mostly complete</td><td>Final name, SKU, barcode and legal manufacturer address pending.</td></tr>
                <tr><td>Printer identified</td><td>Complete</td><td>Benchmark Reprographics Ltd.</td></tr>
                <tr><td>Card material</td><td>Complete / evidence to retain</td><td>300gsm Novatech Silk FSC approved. Retain material/FSC evidence.</td></tr>
                <tr><td>Box material</td><td>Complete / evidence to retain</td><td>450gsm boxboard FSC approved. Retain material/FSC evidence.</td></tr>
                <tr><td>CMYK toner SDS</td><td>Complete</td><td>Black, Yellow, Magenta and Cyan SDS received.</td></tr>
                <tr><td>No extra finish/adhesive confirmation</td><td>Complete</td><td>Printer written confirmation received.</td></tr>
                <tr><td>EN 71-1</td><td>Pending</td><td>Send final non-laminated production sample to lab.</td></tr>
                <tr><td>EN 71-2</td><td>Pending</td><td>Send final non-laminated production sample to lab.</td></tr>
                <tr><td>EN 71-3</td><td>Pending</td><td>Send final printed cards and box to lab.</td></tr>
                <tr><td>UKCA / CE route</td><td>Pending</td><td>Decide based on sales territory.</td></tr>
                <tr><td>Final artwork review</td><td>Pending</td><td>Wait for name, barcode, mark and lab warning advice.</td></tr>
                <tr><td>Declaration of Conformity</td><td>Draft only</td><td>Can be finalised after testing and marking route.</td></tr>
                <tr><td>Product liability insurance</td><td>Recommended</td><td>Insurance is separate from lab testing.</td></tr>
              </tbody>
            </table>
          </div>

          <h2>17. Draft UK Declaration of Conformity</h2>
          <p>Draft only, do not sign until final lab reports, final product name/SKU, legal manufacturer details and marking route are confirmed.</p>
          <p><strong>Product:</strong> Pedigree Chums, dog bingo game / final name TBC</p>
          <p><strong>Product type:</strong> Printed dog bingo / card game</p>
          <p><strong>SKU / model / internal product code:</strong> FDB-DOGBINGO-54-6PLUS-V1 or final code TBC</p>
          <p><strong>Batch identification:</strong> TBC</p>
          <p><strong>Manufacturer / brand owner:</strong> TBC, legal name and full postal address required</p>
          <p><strong>Object of declaration:</strong> Printed card game for children aged 6+ consisting of 54 printed cards supplied in a standard playing-card cardboard box. No accessories, no retail plastic packaging, no adhesive, no lamination, no electronics, no batteries, no magnets.</p>
          <p><strong>Applicable legislation:</strong> Toys (Safety) Regulations 2011, as applicable in Great Britain; UK REACH / chemical restrictions where applicable.</p>
          <p><strong>Standards / evidence:</strong> EN 71-1, EN 71-2, EN 71-3 reports pending; CMYK toner SDS and supplier declarations retained.</p>
          <p><strong>Approved body:</strong> TBC / not applicable if self-declaration using applicable designated standards is confirmed.</p>
          <p><strong>Signed by:</strong> TBC</p>
          <p><strong>Date and place:</strong> TBC</p>

          <h2>Appendix A - Lab brief</h2>
          <p><strong>Purpose:</strong> Use this text when requesting a quote or test scope from a toy testing laboratory.</p>
          <p>Please test/assess the final production specification, not the laminated prototype sample.</p>
          <p>We need toy safety testing for a UK children's/family card game, age 6+. The product contains 54 rounded-edge printed cards in a standard cardboard playing-card box.</p>
          <p>There are no accessories, no tokens, no dice, no counters, no pencils, no timer, no pouch, no adhesive, no retail shrink wrap, no plastic bag, no electronics, no batteries and no magnets.</p>
          <p>Cards: 300gsm Novatech Silk FSC approved. Box: 450gsm boxboard FSC approved. Production box is non-laminated. A laminated sample box exists but is prototype-only and is not the final production specification.</p>
          <p>Printing: Ricoh Color LP Print Cartridge Type 260 CMYK toner set only. Printer confirms no additional coating, varnish, laminate, primer, sealant, adhesive or finishing chemical will be used.</p>
          <p>Please quote for EN 71-1, EN 71-2 and EN 71-3 testing and advise any REACH/SVHC, material declaration, age-grade or warning requirements for the Technical File and final packaging artwork.</p>

          <h2>Appendix B - Supplier evidence checklist</h2>
          <div className={styles.tableWrap}>
            <table>
              <thead><tr><th scope="col">Evidence</th><th scope="col">Status</th><th scope="col">Notes</th></tr></thead>
              <tbody>
                <tr><td>CMYK toner SDS</td><td>Received</td><td>Ricoh Type 260 Black, Yellow, Magenta, Cyan.</td></tr>
                <tr><td>Written confirmation that no other toner/ink is used</td><td>Received</td><td>Keep original email/PDF/letter in file.</td></tr>
                <tr><td>Written confirmation of no coating, varnish, laminate, primer, sealant, adhesive or finishing chemical</td><td>Received</td><td>Keep original sign-off in file.</td></tr>
                <tr><td>300gsm Novatech Silk material specification</td><td>To retain</td><td>Request supplier or printer spec sheet.</td></tr>
                <tr><td>450gsm boxboard material specification</td><td>To retain</td><td>Request supplier or printer spec sheet.</td></tr>
                <tr><td>FSC claim evidence and approved wording/logo use</td><td>To retain</td><td>Only use FSC claim if properly supported.</td></tr>
                <tr><td>Final production sample</td><td>Needed</td><td>For lab and internal QC file.</td></tr>
                <tr><td>Batch coding method</td><td>Needed</td><td>Agree with Benchmark and add to artwork/packaging.</td></tr>
              </tbody>
            </table>
          </div>

          <h2>Appendix C - Product liability / insurance summary</h2>
          <div className={styles.tableWrap}>
            <table>
              <thead><tr><th scope="col">Field</th><th scope="col">Current entry</th></tr></thead>
              <tbody>
                <tr><th scope="row">Product</th><td>Pedigree Chums, dog bingo game / final name TBC</td></tr>
                <tr><th scope="row">Product type</th><td>Printed family/children's card game</td></tr>
                <tr><th scope="row">Age grade</th><td>6+</td></tr>
                <tr><th scope="row">Contents</th><td>54 printed cards in one cardboard playing-card box</td></tr>
                <tr><th scope="row">Materials</th><td>300gsm Novatech Silk FSC card; 450gsm FSC boxboard; Ricoh CMYK toner</td></tr>
                <tr><th scope="row">Physical features</th><td>Rounded card edges; no accessories; no adhesive; no retail plastic packaging</td></tr>
                <tr><th scope="row">Chemical/finish features</th><td>No coating, varnish, laminate, primer, sealant, adhesive or finishing chemical</td></tr>
                <tr><th scope="row">Testing status</th><td>EN 71-1, EN 71-2 and EN 71-3 pending</td></tr>
                <tr><th scope="row">Sales territory</th><td>UK product; precise GB/NI/EU sales route TBC</td></tr>
              </tbody>
            </table>
          </div>

          <h2>Appendix D - Evidence index</h2>
          <div className={styles.tableWrap}>
            <table>
              <thead><tr><th scope="col">Evidence document</th><th scope="col">Reference</th><th scope="col">Date</th><th scope="col">Status</th></tr></thead>
              <tbody>
                <tr><td>SDS - Ricoh Color LP Print Cartridge Type 260 Black toner</td><td>SDS 888446 / Version 01</td><td>04 July 2023</td><td>Received</td></tr>
                <tr><td>SDS - Ricoh Color LP Print Cartridge Type 260 Yellow toner</td><td>SDS 888447 / Version 01</td><td>13 July 2023</td><td>Received</td></tr>
                <tr><td>SDS - Ricoh Color LP Print Cartridge Type 260 Magenta toner</td><td>SDS 888448 / Version 01</td><td>05 July 2023</td><td>Received</td></tr>
                <tr><td>SDS - Ricoh Color LP Print Cartridge Type 260 Cyan toner</td><td>SDS 888449 / Version 01</td><td>05 July 2023</td><td>Received</td></tr>
                <tr><td>Printer written confirmation - toners/inks and no additional finishes/chemicals</td><td>Benchmark Reprographics Ltd. sign-off</td><td>TBC</td><td>Received</td></tr>
                <tr><td>Card stock specification</td><td>300gsm Novatech Silk FSC approved</td><td>TBC</td><td>To retain</td></tr>
                <tr><td>Boxboard specification</td><td>450gsm boxboard FSC approved</td><td>TBC</td><td>To retain</td></tr>
                <tr><td>EN 71-1 report</td><td>TBC</td><td>TBC</td><td>Pending</td></tr>
                <tr><td>EN 71-2 report</td><td>TBC</td><td>TBC</td><td>Pending</td></tr>
                <tr><td>EN 71-3 report</td><td>TBC</td><td>TBC</td><td>Pending</td></tr>
                <tr><td>Final artwork proof</td><td>TBC</td><td>TBC</td><td>Pending</td></tr>
                <tr><td>Barcode / GTIN confirmation</td><td>TBC</td><td>TBC</td><td>Pending</td></tr>
                <tr><td>Final Declaration of Conformity</td><td>TBC</td><td>TBC</td><td>Draft only</td></tr>
              </tbody>
            </table>
          </div>

          <p className={styles.sub}>Draft v0.3, working compliance documentation, not final certification.</p>
        </div>
      </main>
      <Footer tradeLinks />
    </>
  );
}
