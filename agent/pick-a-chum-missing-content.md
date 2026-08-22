# Pick a Chum: missing chat answers (copy pass pending)

Things a visitor plausibly types that have **no chat answer** today, so the dog
falls to "im a dog" (or a wrong route). Distinct from the false-positive audit
(`pick-a-chum-common-word-audit.md`), which maps words that misfire; this is the
opposite -- intents with nothing to serve. Each entry notes any existing
character material to draw the copy from.

Steve does the copy pass; agents add rows here rather than inventing lines.

| Subject | Example inputs | Current result | Material to draw from |
|---|---|---|---|
| **sticks** | "u like sticks?", "do you like sticks" | "im a dog" | No chat answer exists (unlike balls -> COL-B52-MISC-09 "Tennis balls?" + clip). Treat Trail STICK clues are ready material: "it comes off a tree", "i carry it on walks, although humans are not meant to encourage this behaviour", "free ones everywhere in the park". A new B52-style answer, same shape as the ball line. |

## How to add a row

Add the subject, a couple of real example inputs, what happens now, and any
existing lines (game clues, bios, related answers) that could seed the copy.
Once Steve writes the answer, wire it (a workbook row + trigger, like the ball
answer) and delete the row here.
