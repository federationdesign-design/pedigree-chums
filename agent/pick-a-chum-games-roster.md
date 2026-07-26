# Pick a Chum: games roster (PARKED, not Phase 1)

Status: PARKED. None of these is in Phase 1. This is the roster of intended
mini-games plus the standing open decision and the current faults on the game
surface (routing, not games). Nothing here ships until Steve approves a games
phase.

## The six games

### Collie: three embedded visual boards inside the chat
1. Nine-Square Sheep Management.
2. Missing Sheep.
3. Kennel Sketch Recognition.

These three were specced as embedded visual boards rendered inside the chat
window (not separate pages). See the open decision below.

### Labrador: one, pure typed dialogue
The game IS the conversation: no board, no buttons, just typed exchange.

### Border Terrier: one, the Missing Biscuit
Questioning suspects and accusing. Text buttons plus typed equivalents (both
routes reach the same moves, so a visitor can click or type).

### Boxer: one, a control panel whose consequences escape into the page itself
A control-panel game whose effects break out of the chat and act on the page
around it.

### Plus: ChumDrop
Not an embedded game: a separate page the chat points at (a link out, not a
board inside the chat).

## Open decision (NOT for tonight)

The Collie's three (Nine-Square Sheep Management, Missing Sheep, Kennel Sketch
Recognition) were specced as EMBEDDED visual boards before the bark game
established a conversation-native house style (play that lives inside the typed
exchange). Whether the Collie's three stay embedded boards, or are rebuilt
conversation-native, is the difference between roughly 6-8% of project time EACH
and roughly 1-2% EACH. This is a deliberate decision to take with Steve, not
tonight.

## Game surface: open faults (from tonight's game sweep)

Source: `~/Downloads/game-sweep.csv` (31 single-turn inputs, fresh session each,
current build). These are ROUTING faults on the game/rules surface, not game
bugs (no games exist yet). Recorded so a games phase starts from a known state.

1. Play requests all return "games are not ready" (fun_tease, B17), then "woof"
   plays the bark game. The play-intent inputs "can I play something", "lets
   play", "play a game", "I want to play", "can I play online" (and "can I play
   on my own") all resolve to the FUN-TEASE holding line; only "woof" reaches an
   actual playable thing (the bark game, action `bark`).
2. "whats the bark game" returns the age-rating FAQ (B04-FAQ002), not an answer
   about the bark game.
3. The age FAQ (FAQ002) over-matches on the bare word "game": five inputs that
   contain "game" land on it ("whats the game", "tell me about the game", "how
   long does a game take", "whats the bark game", "is there a game on the
   website"), while the actual age question "what age is it for" MISSES entirely
   and falls to `gk_unknown`.
4. The B02 rules answer returns one blurb (B02-R01) for every rules-shaped input
   regardless of what was asked: "how do you play", "how do I play", "explain the
   rules", "what are the rules", "how do you win", "who wins", "how many cards",
   "how do I play the bark game" all get the same text (eight inputs, seven-plus
   distinct questions, one answer).
5. "what is pedigree chums" returns `gk_unknown`: the product-identity question is
   refused as unknown knowledge rather than answered.
6. Missing routes (currently fallback or gk_unknown, should be handled): "rules"
   (bare word -> fallback), "how many players" -> gk_unknown, "is it for kids" ->
   fallback (should be the age FAQ), "do you have any games" -> fallback, "what
   games are there" -> gk_unknown.

For contrast, the inputs that DO route correctly today: "how many people can
play" -> FAQ001, "whats in the pack" -> FAQ004, "whats the name generator" ->
the Name Generator link (B03). Everything else on the list is one of the faults
above.
