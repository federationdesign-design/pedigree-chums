# Dogs at Work: taxonomy and forward register

The single reference for the Dogs at Work families, pill colours, sub-label
rule, the corrected labels for the removed grid subjects, and the v2 project
document's twelve-article plan mapped onto the current taxonomy.

Brief v3.0 section 11 is definitive. Where the live page, the concept artwork
or the v2 project document disagree with it, section 11 wins and the
discrepancy is recorded here rather than silently resolved. (The brief calls
this file `agent/reference/dogs_at_work_taxonomy.md`; the `agent/` path is
redirected to `docs/dogs-at-work/` in this repo, as with NEEDS_STEVE.md.)

No em dashes in this file: it is documentation, not article or blue-panel
editorial copy, so the em-dash carve-out does not apply here.

## 1. The six families

Every article carries two labels: a **family**, one of the six below, which is
navigational; and a **sub-label**, which names the kind of working dog.

| Family | Pill label | Pill fill | Text token | Contrast (vs text) |
|---|---|---|---|---|
| Medical | Medical | `#17C138` | `--navy` | 4.97 |
| Security | Security | `#000000` | `--cream` | 21.0 |
| Emergency | Emergency | `#D71F6C` | `--cream` | 4.88 |
| People | People | `#2B7095` | `--cream` | 5.45 |
| Rural and Traditional | Rural | `#97AA31` | `--navy` | 4.62 |
| Science | Science | `#10D1B7` | `--navy` | 6.17 |

Tokens are named by family, not by colour: `--family-medical`,
`--family-security`, `--family-emergency`, `--family-people`, `--family-rural`,
`--family-science` (in `app/globals.css`). Contrast figures are computed with
`--cream` set to `#FFFFFF` (the v3.0 token change). All six pass 4.5.

Notes carried from section 10:
- **Emergency** was `#E02574`, darkened so cream text reaches 4.5 (original 4.23).
- **Rural** was `#84952B`, lightened so navy text reaches 4.5 (original failed
  against either text colour).
- **Science** was `#10D187`, shifted from green towards teal because at pill size
  it was indistinguishable from Medical, which appears on three of four launch
  articles. Hue and lightness only.
- Every pill carries a one pixel `--cream` outline, so Security, People and
  Emergency stay distinguishable where their fills sit close to `--navy`.

Two label sets are retired: the live page's set (Public service, Rural,
Emergency, Science, Wildcard, Independence) and the concept artwork's set
(Rural, Emergency, People, Science, plus the erroneous "Headering dogs"). Both
are replaced by the six families above. "Rural" is the pill label; the family is
named "Rural and Traditional" in the data and in documentation.

### The sub-label rule

The sub-label names a **kind of working dog** (a real dog type), never an
editorial phrase. This is why launch article 3's sub-label was corrected from
"The machine the dogs built" to "Bio-detection dogs". Any family added later
follows the same contrast rule: a light pill takes `--navy` text, a dark pill
takes `--cream` text, and every new pill must reach 4.5 against its text.

## 2. The launch set (four articles)

| # | Article | Family | Sub-label |
|---|---|---|---|
| 1 | The Dogs Teaching Medicine How to Smell Disease | Medical | Bio-detection dogs |
| 2 | The Colleague Who Never Clocks Off | Medical | Medical alert dogs |
| 3 | The Machine That May Owe Dogs a Biscuit | Medical | Bio-detection dogs |
| 4 | The Farm Worker With Four Legs | Rural and Traditional | Sheepdogs |

Medical is a full family, not a featured exception: three of the four launch
articles are Medical.

## 3. Forward register: the six removed grid subjects

The "Coming to the workforce" grid was removed and its fourth subject
(Sheepdogs) promoted into the launch set. The other five are deferred to a later
series. Roughly half the known label faults sat on these cards; recording the
correction is the point of this register. The corrections are **not** applied to
live content (the cards are gone), only recorded here.

| Subject | Label as shipped | Correct family | Correct sub-label | Status |
|---|---|---|---|---|
| Police and Border Force dogs | Public service / Rural, Sniffing dogs | Security | Police dogs | Deferred |
| Sheepdogs | Rural, Headering dogs | Rural and Traditional | Sheepdogs | Promoted to launch article 4 |
| Search and rescue dogs | Emergency, Rescue dogs | Emergency | Search and rescue dogs | Deferred |
| Conservation detection dogs | Science, Detection dogs | Science | Conservation dogs | Deferred |
| Water-leak detection dogs | Emergency, Headering dogs | Science | Detection dogs | Deferred |
| Assistance and guide dogs | People, Independence dogs | People | Guide dogs | Deferred |

Conservation detection and water-leak detection both sit under **Science**,
which is why Science exists as a family. "Headering dogs" was an erroneous label
that appeared twice (on Sheepdogs and Water-leak) and is retired.

## 4. The v2 project document's twelve-article plan, mapped onto the six families

The v2 project document (`dogs_at_work_project_document_v2.docx`) proposed a
launch of **four families of three**. It predates the current taxonomy: it has
no Medical family (it treats the medical detection stories as a featured opener,
not a pill family) and no Science family. Section 11 wins; this table maps the
v2 plan onto the six families so the next person adding an article has one place
to look.

| # | v2 subject | v2 headline | v2 family | Family under section 11 |
|---|---|---|---|---|
| 1 | Police Patrol Dogs | The Officer With Four Legs | Security | Security |
| 2 | Police Sniffer Dogs | The Nose That Finds What People Hide | Security | Security |
| 3 | Digital Detection Dogs | The Dog That Can Find a USB Stick | Security | Security |
| 4 | Search and Rescue Dogs | The Nose Working Against the Clock | Emergency | Emergency |
| 5 | Fire Investigation Dogs | The Dog That Can Smell How a Fire Started | Emergency | Emergency |
| 6 | Military and Service Dogs | The Soldier Who Does Not Know There Is a War | Emergency | Emergency |
| 7 | Guide Dogs | The Dog Making a Thousand Small Decisions | People | People |
| 8 | Assistance Dogs | The Colleague Who Gives You Your Life Back | People | People |
| 9 | Therapy and Wellbeing Dogs | The Job Where Doing Almost Nothing Can Change Everything | People | People |
| 10 | Sheepdogs | The Farm Worker With Four Legs | Rural and Traditional | Rural and Traditional (now launch article 4) |
| 11 | Gundogs and Retrievers | The Dog That Brings the Job Back | Rural and Traditional | Rural and Traditional |
| 12 | Ratting and Vermin Dogs | The Small Dog With a Very Big Job | Rural and Traditional | Rural and Traditional |

Mapping notes:
- v2's four families map one-to-one onto Security, Emergency, People and Rural
  and Traditional. No v2 subject changes family under section 11.
- **Medical** and **Science** are the two families v2 lacks. Medical is
  populated by the live launch trilogy (articles 1 to 3), which v2 kept as a
  separate featured opener. Science is populated from the forward register above
  (Conservation dogs, Detection/water-leak dogs), which are absent from v2's
  twelve.
- Sheepdogs (v2 #10) is already built as launch article 4; the other eleven v2
  subjects are unbuilt and available for future series.

## 5. Deferred: the Outrun, Lift, Fetch, Drive diagram

The four-stage Outrun, Lift, Fetch, Drive diagram for the Sheepdogs article
(article 4) is deferred and is **not** part of the current build. Per brief
section 15 it was deliberately not created, stubbed, or given a placeholder slot
in the layout. It is recorded here so it is not lost: a future build of the
Sheepdogs article may add it as a sidebar module illustrating the four stages of
a sheepdog gather.
