# Hidden Games: campaign message timings

Timings for every campaign message a visitor can see. Values read from the code;
file and line given for each. Updated for the Task B timing change and collision
guard (25 August 2026).

All of these messages are rendered by two components mounted once in the root
layout (`app/layout.tsx:239` the counter, `app/layout.tsx:242` the toast), so they
are live on **every page**. The engine is a single browser singleton
(`lib/hiddenGames/browserEngine.ts:41`) that survives client-side navigation,
which is why page tallies and once-only flags carry from page to page within a
visit.

Shared gating facts used throughout:

- Persisted state lives in one localStorage key,
  `pedigree_hidden_games:HIDDEN_GAMES_2026_01` (`registry.ts:169`): `prelude_seen`,
  `intro_seen`, `completion_seen`, `completed_game_ids` (completion is derived),
  and `page_views`. A record expires 90 days after its `updated_at`
  (`registry.ts:172-173`), after which every seen-flag resets.
- The lifecycle status is build-time only, from
  `NEXT_PUBLIC_HIDDEN_GAMES_STATUS` (`lifecycle.ts:31-33`). Production ships
  `OPEN`. `DRAFT` and `ARCHIVED` render nothing.
- Desktop vs mobile: **no timing value differs between platforms.** The only
  behavioural platform gate is `hideForChat`
  (`HiddenGamesCounter.tsx:hideForChat effect`): on `max-width: 480px` **and** an
  accessibility scheme **and** the chat open, the whole counter component returns
  null. The toast is separate and unaffected. Mobile media queries otherwise only
  change size/position. Reduced motion removes entrance animations, no delays.

---

## Collision guard (Task B) and the cause of the overlap

### What was actually overlapping

The reported symptom was "the prelude and the introduction on screen together,
despite the rule that they never share a page." Reproduced against the running
app (soft navigation, prelude left open), **the two cards never overlap**: on any
client-side navigation the counter's reveal effect resets its single `phase`
state, so a prelude that is still up is hidden the instant you navigate, and the
introduction then appears alone. The "never share a page" rule holds.

The overlap comes from a **different** campaign surface: the **discovery toast**.
It is a separate component (`HiddenGamesToast`) that had no knowledge of the
counter's cards, and nothing coordinated the two. The mechanism:

1. A first-time visitor earns a find while a game is open (for example the Main
   Pit on the home route, `G01`). The engine awards it, but the toast **defers**
   itself while a game is in play so it does not cover the game
   (`HiddenGamesToast.tsx` `gameInPlay` / `deferredRef`).
2. When the visitor leaves that page, the pit unmounts and the deferred toast
   **flushes onto the very next page** (a `MutationObserver` on the body flags).
3. That next page is exactly where the prelude/introduction is timed to appear.
   So the card (bottom-left) and the toast (bottom-right) land together.

The old exclusivity was therefore *emergent, not enforced*: it rested on a single
`phase` variable plus an if/else precedence inside one component, which only ever
governed the two cards relative to each other. The toast (and, at completion, the
celebration) sat entirely outside it. There was no object representing "a campaign
message is currently on screen."

### The guard

`lib/hiddenGames/surfaceLock.ts` is a single, shared **occupancy slot**. Every
campaign surface (the prelude, the introduction, the completion celebration, and
the discovery toast) must `claimSurface(...)` before it shows and
`releaseSurface(...)` when dismissed. If the slot is taken, the surface **waits**
and is shown when the slot frees (`subscribeSurfaceFree`). This makes
single-occupancy structural rather than a matter of ordering: at most one campaign
message is on screen, and a second one queues.

- The counter's cards claim under one id, `CARD_SURFACE`; the toast claims
  `TOAST_SURFACE` (`surfaceLock.ts:20-21`). Within the counter the cards are still
  serialised by `phase`; the lock serialises the counter against the toast.
- Counter wiring: `showCard` / `releaseCard` / `dismissCard`
  (`HiddenGamesCounter.tsx:193-230`), the slot-free retry
  (`HiddenGamesCounter.tsx:314-337`), and navigation releases the slot at the top
  of the reveal effect (`HiddenGamesCounter.tsx:239`).
- Toast wiring: `attemptShow` claims or waits
  (`HiddenGamesToast.tsx:65-74`), the slot-free retry
  (`HiddenGamesToast.tsx:110-114`), and `close` releases
  (`HiddenGamesToast.tsx:127-129`).

**Release on navigation (both surfaces).** A held surface is cleared on every
client-side navigation, so it can never block across pages. The counter's cards
do this at the top of the reveal effect (`releaseCard`,
`HiddenGamesCounter.tsx:239`); the toast does the same in a pathname effect that
frees the slot and hides the toast (`HiddenGamesToast.tsx:116-125`). The
deferred-find flush is untouched: a find made during a game still shows 2s into
the next page.

**Consequence to note:** the introduction, the completion celebration and the
toast stay until closed (no auto-dismiss). Because only one surface shows at a
time and a second waits, a surface left unclosed defers the others *for as long as
it is on that page*. Navigation clears it (above), so the blocking is bounded to a
single page and never carries across pages. The prelude also auto-dismisses at
10s. This is the intended "second one waits" behaviour.

---

## 1. Prelude card ("Warning: This website may contain games")

- **Trigger:** a registered page view whose number is `>= PRELUDE_FROM_PAGE` (2)
  while `prelude_seen` is false (`HiddenGamesCounter.tsx:257`, `:63`).
- **Delay after trigger:** `PRELUDE_AT = 0` ms, i.e. it appears immediately as the
  page loads (`HiddenGamesCounter.tsx:59`; timer at `:267`).
- **How long it stays / what dismisses it:** it **auto-dismisses after
  `PRELUDE_DISMISS_MS = 10000` ms** (`HiddenGamesCounter.tsx:60`; armed in
  `showCard` at `:216-221`), **or** immediately when the visitor clicks its close
  X (`:427`). Marked seen the moment it appears (`markPreludeSeen`, passed into
  `showCard` at `:266`), so once-only even if it auto-dismisses.
- **Pages:** any page from the 2nd page view onward, once only. Never shares a
  page with the introduction (prelude checked first, `:257` before `:270`).
- **Suppressed / deferred:** `prelude_seen` true suppresses it permanently. If it
  is due while the Main Pit is being played (`pitInPlay()`,
  `HiddenGamesCounter.tsx:pitInPlay`), it is held and stays due for a later, not-
  in-pit page (`:259-264`). It must also claim the campaign slot; if the toast
  holds it, the prelude waits (`showCard`, `:206-209`). A lifecycle view or
  completion takes precedence (`:243-245`, render order).
- **Desktop vs mobile:** identical timing; mobile rescales the card only. Copy at
  `copy.ts:36-37`.

## 2. Introduction card ("There are hidden games across the website / Find them all")

- **Trigger:** a registered page view `>= INTRO_FROM_PAGE` (3) while `intro_seen`
  is false and the prelude is no longer due (`HiddenGamesCounter.tsx:270`, `:64`).
- **Delay after trigger:** `INTRO_AT = 10000` ms, i.e. 10s into the page
  (`HiddenGamesCounter.tsx:61`; timer at `:278`).
- **How long it stays / what dismisses it:** it **stays until the visitor clicks
  its close X** (`:443`); no auto-dismiss. Marked seen the moment it appears
  (`markIntroSeen`, passed into `showCard` at `:277`), so once-only.
- **Pages:** any page from the 3rd page view onward, once only. Never shares a
  page with the prelude.
- **Suppressed / deferred:** `intro_seen` true suppresses it. Same `pitInPlay()`
  hold (`:271-276`) and same slot claim/wait as the prelude. Lifecycle/completion
  take precedence.
- **Desktop vs mobile:** identical timing; mobile rescales the card. Copy at
  `copy.ts:23-26`.

## 3. Discovery toast ("Nice one! You found a hidden game. N more to find.")

- **Trigger:** a non-final find. The engine fires `subscribeDiscovery` on any
  awarded, non-duplicate, known-id find that does not complete the set
  (`engine.ts:248-253`); the toast subscribes at `HiddenGamesToast.tsx:80-87`.
- **Delay after trigger:** `TOAST_DELAY_MS = 2000` ms after the find
  (`HiddenGamesToast.tsx:33`; scheduled at `:84`). If a game is in play the toast
  is **deferred** until the visitor leaves, and the 2s delay then applies from
  that moment (`:79-84`, `:90-98`). It also claims the campaign slot; if a card
  holds it, the toast waits and shows when the slot frees (`attemptShow`,
  `:64-73`; slot-free retry `:108-112`). Entrance animation `hgToastIn 300ms`
  (`HiddenGamesToast.module.css:26`).
- **How long it stays / what dismisses it:** it **stays until the visitor clicks
  its close control** (`close`, `HiddenGamesToast.tsx:116-118`; the X button in
  the render). **No auto-dismiss** (the previous 7s timer is removed). A further
  find while it is up re-claims the slot (same id) and refreshes the count in
  place.
- **Pages:** any page; positioned bottom-right on the live campaign styling
  (`HiddenGamesToast.module.css:79-84`). It is cleared on client-side navigation
  (`HiddenGamesToast.tsx:116-125`), so it holds the slot only for the page it
  appears on and never blocks a card on the next page.
- **Suppressed / deferred:** the completing (final) find shows no toast
  (`engine.ts:240-247`; the toast also guards `remaining <= 0`,
  `HiddenGamesToast.tsx:66`). Duplicate/unknown finds never fire it. Hat finds in
  a protected session are suppressed upstream (`browserEngine.ts:71-79`).
- **Desktop vs mobile:** identical timing. Mobile (`max-width: 768px`) shrinks the
  chip and its close control (`HiddenGamesToast.module.css:85-93`, `:118-128`).
  Copy at `copy.ts:42-44`.

## 4. Completion celebration ("You found every hidden game!")

- **Trigger:** the find that reaches the target (10). `state.completed` true while
  `completion_seen` is false; the engine fires `subscribeCompletion` once on that
  transition (`engine.ts:240-247`), which also drives the confetti.
- **Delay after trigger:** `COMPLETION_AT = 2000` ms after completing
  (`HiddenGamesCounter.tsx:62`; effect at `:295-309`). It then claims the campaign
  slot (or waits) and shows (`completionVisible`, `:389`). Scale-in animation
  `hgComplete 720ms` (`HiddenGamesCounter.module.css`).
- **How long it stays / what dismisses it:** it **stays until the visitor clicks
  its dismiss button** (`collapseCompletion`, `:283-291`); **no auto-collapse**
  (the previous 10s timer is removed). Dismissing frees the slot and shows the
  persistent completed chip.
- **Pages:** any page. Shown only on the live completion transition, never on
  restore of an already-complete record (`engine.ts:227,244`), so a returning
  finished visitor sees the chip, not the celebration.
- **Suppressed / deferred:** `completion_seen` true suppresses it. During the 2s
  delay (and while waiting for the slot) the completed chip shows instead. Takes
  precedence over the prelude/intro cards in render order.
- **Desktop vs mobile:** identical timing; mobile caps width. Copy at
  `copy.ts:30-32`.

## 5. Completed chip ("10/10 games found")

- **Trigger:** `state.completed` true and the celebration has been dismissed or is
  not yet visible (`HiddenGamesCounter.tsx:388-394`, the else branch).
- **Delay / lifetime:** none; it is the resting state before and after the
  celebration. Persistent until the record expires (90 days).
- **Pages:** any page. **Suppressed** only by the celebration being on screen, by
  the lifecycle notices, or by `hideForChat`. Label from `counterLabel`
  (`record.ts:236-238`).

## 6. Storage-blocked notice ("Your browser is blocking game progress...")

- **Trigger:** `state.storageBlocked` becomes true, set the first time a find
  cannot be persisted (`engine.ts:229-236`). Rendered at
  `HiddenGamesCounter.tsx:blocked branch`.
- **Delay / lifetime:** none, but it renders **only inside the expanded counter**,
  so it appears the next time the visitor opens the counter after a write is
  refused. Stays until the visitor clicks its dismiss button; no auto-dismiss. Not
  in the campaign slot (it is attached to the counter, not a popup surface).
- **Pages:** any page with the nav logo where the counter is expanded.
- **Desktop vs mobile:** identical; mobile caps width. Copy at `copy.ts:7-8`.

## 7. Lifecycle messages (suspended / closed)

Render only under non-OPEN build statuses; production is OPEN, so a visitor does
not see them today. Both render immediately, no timer, no auto-dismiss, on every
page.

- **Suspended** (`state.view === "suspended"`, build status `SUSPENDED`): copy at
  `copy.ts:11-12`.
- **Closed** (`state.view === "closed"`, build status `CLOSED`): count/total from
  the live record (`copy.ts:17-19`).
- **DRAFT / ARCHIVED:** render nothing (`lifecycle.ts:52,61`).
- The reveal effect defers to these: `view !== "counter"` early-returns to the
  counter phase and skips all card timers (`HiddenGamesCounter.tsx:242-246`).

---

## Timeline: a first-time visitor's first four page views

Fresh browser (no record: `page_views = 0`, all flags false), build status OPEN,
each page stayed on long enough, not inside the Main Pit when a card is due. Times
measured from each page's load.

**Page 1** (`page_views` → 1)
- No prelude (needs page ≥ 2), no intro (needs page ≥ 3). Phase → counter.
- Visible: the resting "0/10" counter pill (on logo pages). Nothing timed.

**Page 2** (`page_views` → 2)
- **Immediately (0s): the prelude card** appears ("Warning: This website may
  contain games"), marked seen on appearance.
- **At 10s: the prelude auto-dismisses**, or sooner if the visitor clicks its X.
  The counter returns.

**Page 3** (`page_views` → 3)
- Prelude seen, so the introduction is eligible.
- 0 to 10s: counter only (no card yet).
- **At 10s: the introduction card** appears ("There are hidden games across the
  website / Find them all"). It stays until the visitor closes it.

**Page 4** (`page_views` → 4)
- Both cards seen. No card due: counter only.

Interleaved on any of these pages, independent of the sequence, and now governed
by the single campaign slot:
- A non-final find raises the **discovery toast** 2s later (bottom-right), which
  stays until closed. If a card holds the slot the toast waits until the card is
  dismissed; if the toast is up, a due card waits for the toast to be closed.
  Whichever is second queues, so a card and the toast are never on screen at once.
- The **completion celebration** appears 2s after the 10th find and stays until
  closed, then collapses to the persistent completed chip.
