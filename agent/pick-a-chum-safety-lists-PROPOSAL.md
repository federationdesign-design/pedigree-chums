# Pick a Chum: safety detection lists (PROPOSAL v2, for Steve's final read)

Status: PROPOSAL. Nothing built. This revises v1 against Steve's second read:
false positives removed, dropped workbook starters restored, drink-driving and
mental-health gaps closed, the bare-"stroke"/"scared" traps fixed, an explicit
evaluation order added to resolve category collisions, and (per flag 4)
misspellings moved OUT of the category lists into an alias-map section so the
category lists stay canonical and maintainable.

Category lists below are CANONICAL terms only. Variants and child misspellings
live in the "Alias map additions" section at the end (variant -> canonical,
applied before matching).

---

## 1. Evaluation model (this is the part v1 was missing)

**Chosen rule: longest match wins, not first category.** A message can match
terms in several categories; the category whose matched trigger is the LONGEST
(by character length) wins. This resolves the substring collisions without
deleting any legitimate term:

- "i am not safe" (GENERAL DISTRESS, 13) beats "not safe" (SAFEGUARDING, 8).
- "can someone help me" (GENERAL DISTRESS, 19) beats "help me" (BARE HELP, 7),
  which preserves the plea-versus-request split. Bare "help me" still routes to
  the clarifier because then only "help me" matched.

Why this and not "state an order and prune substrings": pruning "not safe" and
"help me" would delete terms that are correct on their own. Longest-match keeps
both and routes correctly. It is practical to implement: iterate every category
list, collect all matching triggers, pick the longest, break ties by the
priority below. It is not more expensive than the current per-category scan.

**Tie-break priority (equal-length matches), which is also the safety-first
order, highest first:**

1. MEDICAL EMERGENCY (999)
2. HARM TO OTHERS
3. HARM TO AN ANIMAL
4. SELF-HARM
5. SAFEGUARDING (includes the ANATOMY + PERSON_REF/ACTION rule)
6. GENERAL DISTRESS
7. DOG EMERGENCY
8. CONTENT_SEEKING (boundary)
9. ABUSE (boundary)
10. BARE HELP (clarifier) - lowest, only fires when nothing more urgent matched

**One hard ordering rule (flag 2, agreed):** DOG EMERGENCY is checked BEFORE the
existing general dog-health boundary (`isDogHealthQuestion`), so "dog ate
chocolate" gets "call your vet now", not the calm "I cannot examine your dog"
line.

---

## 2. Coverage test: all eight original live failures now match

| Input | Matches | Category |
|-------|---------|----------|
| my uncle is very hands on | "hands on" | SAFEGUARDING |
| im in trouble | "in trouble" | SAFEGUARDING |
| I need help | "i need help" | BARE HELP (clarifier) |
| pleeeassssee help me | "help me" | BARE HELP (clarifier) -- see edge flag |
| how can I get help for a mental issue I have? | "mental issue" | SELF-HARM |
| I think I might be about to have a stroke... | "have a stroke" | MEDICAL |
| I think I might drunk drive later | "drunk drive" | HARM TO OTHERS |
| What's your advice on drink-driving? | "drink driving" | HARM TO OTHERS |

Note: "have a stroke" was ADDED beyond your four qualified forms, because your
own original input is "about to HAVE a stroke", which "having a stroke" does not
cover. Small caveat: "have a stroke of luck" would also match; rare phrasing,
your call whether to keep it.

---

## 3. Category lists (canonical terms only)

### ANATOMY (never boundary alone; SAFEGUARDING only with PERSON_REF or ACTION)
```
penis
vagina
boobs
naked
willy
fanny
privates
private parts
front bottom
down there
my bits          (bare "bits" removed: "the best bits" false positive)
wee wee
```

### MEDICAL EMERGENCY (-> 999 copy)
```
have a stroke
having a stroke
had a stroke
think im having a stroke
im having a stroke
heart attack
cannot breathe
can't breathe
cant breathe
not breathing
choking
overdose
took too many
swallowed medicine
ate medicine
chest pain
passed out
fainted
unconscious
can't wake them up
cant wake them up
won't wake up
wont wake up
allergic reaction
ambulance
bleeding
can't stop bleeding
cant stop bleeding
really bad pain
fell and hit my head
my face feels funny
my arm feels weak
can't feel my arm
cant feel my arm
can't see properly
cant see properly
```
(bare "stroke" REMOVED: "stroke the dog", "she likes being stroked" would fire 999.)

### SAFEGUARDING DISCLOSURE (-> safeguarding copy)
```
[re-sorted from the old DISTRESS list]
being abused
someone is hurting me
someone hurts me
being hurt at home
i feel unsafe

[kept from step 3]
in trouble
hands on
touches me
touched me
hurts me
not safe
not allowed to tell
keep it secret
frightened

[restored workbook starters]
hitting me
touching me
scared of him
scared of her
threatens me

[new, from your SAFEGUARDING additions]
he scares me
she scares me
they scare me
hurts me at home
hits me
smacks me
grabs me
makes me uncomfortable
touches my private parts
touched my private parts
makes me take my clothes off
comes into my room
says I will get in trouble
says it is our secret
I don't feel safe at home
dont feel safe at home
```
(Bare "scared" REMOVED: on a dog site it means "scared of dogs". "scared of him"
/ "scared of her" restored, which are the safeguarding ones.)

### SELF-HARM OR DISTRESS (-> self-harm copy)
```
[re-sorted from the old DISTRESS list]
kill myself
want to die
end my life
end it all
hurt myself
harm myself
self harm
suicide

[restored workbook starters]
cut myself
no point           (flag: broad, "no point in that" benign; your call)
better off without me
cannot go on

[new, from your SELF-HARM additions]
don't want to be here
dont want to be here
wish I was dead
wish I could disappear
nobody would miss me
I hate being alive
I don't want to wake up
dont want to wake up
I want it all to stop
I can't do this anymore
cant do this anymore

[mental-health gap you flagged]
mental issue
mental health
mental health problem
depressed
depression
anxiety
panic attacks
counselling
therapist
need to see someone
```

### GENERAL DISTRESS (pleas -> general-distress copy)
```
please help
help pls
pls help
help help
somebody help
can someone help me
I am scared
im scared
im really scared
something bad happened
I am not safe
im not safe
I can't tell anyone
cant tell anyone
please answer me
im worried
```

### BARE HELP (-> clarifier, NOT distress)
```
help me
need help
i need help
```
Approved clarifier line (yours, for step-4 wiring):
"Do you need help with something on the site, or is something worrying you?
Tell me which and I will point you the right way."

### HARM TO OTHERS (-> harm-to-others copy)
```
[existing UNSAFE terms re-housed]
kill him
kill her
kill them
kill someone
hurt someone
how to hurt
how do i hurt
make a bomb
build a bomb

[restored + drink-driving gap]
hurt him
hurt her
drunk drive
drink drive
drink driving
drunk driving
drive after drinking
drive when drunk
get in the car drunk

[new, from your HARM TO OTHERS additions]
I'm going to hurt someone
im going to hurt someone
want to hurt someone
going to hit him
going to hit her
make them pay
going to hurt my brother     (was "hurt my brother": past-tense false positive)
going to hurt my sister
going to hurt my mum
going to hurt my dad
```
(Consistency flag: "hurt him" / "hurt her" carry the same past-tense risk
"I hurt him yesterday" that made you gerund the family ones. You restored them
as-is; flagging in case you want "going to hurt him/her" for consistency.)

### HARM TO AN ANIMAL (-> RSPCA copy)
```
poison the dog
hit an animal
beat the dog          (moved here from your HARM TO OTHERS restore: it is animal harm)
hurt an animal
kick the dog
hurt the cat
```

### DOG EMERGENCY (-> vet-now copy; checked BEFORE the dog-health boundary)
```
ate chocolate         (the commonest dog poisoning question; was missing)
ate grapes
ate raisins
ate xylitol
dog ate sweets
dog ate chewing gum
dog ate medicine
dog ate pills
dog ate onions
dog ate garlic
dog ate a battery
dog ate something poisonous
seizure
collapsed
not breathing
cannot stand
bloated
hit by car
dog can't breathe
dog cant breathe
dog won't wake up
dog wont wake up
dog keeps being sick
dog is shaking
dog is choking
dog got run over
dog fell from a height
dog has a swollen tummy
```

### CONTENT_SEEKING (-> boundary, unchanged from D8)
```
sex
porn
nude
```

### ABUSE (-> boundary, unchanged)
```
stupid
idiot
shut up
you suck
hate you
useless
rubbish dog
fuck
shit
```

---

## 4. PERSON_REF and ACTION (D8 rule, widened per flag 3, minus put and took)

```
PERSON_REF = he, she, my dad, my uncle, my brother, my teacher, a man, someone,
             a grown up, a big boy, my mum, my grandad, my cousin, my step dad
ACTION     = touched, touches, made me, showed me, hurt,
             kissed, licked, rubbed, grabbed, forced, made me touch
```
("put" and "took" REMOVED: too common.)

---

## 5. Alias map additions (variant -> canonical; per flag 4, not inline)

These are the child misspellings and variants, for the workbook misspelling
alias map (`applyAliases`), not the category lists.

```
peenis, pennis, penus, peni            -> penis
vergina, vajina, vajaja                -> vagina        ("gina" dropped: it is a name)
boob, boobies, bewbs, booby            -> boobs
nakid, nekid, nakey                    -> naked
willie, willies, wily                  -> willy
fani, fanni, fannie                    -> fanny
front botty                            -> front bottom
weewee, wee-wee                        -> wee wee
hart attack, heart attak               -> heart attack
choakin, chokin                        -> choking
over dose, overdoes                    -> overdose
swalowed                               -> swallowed
faintid                                -> fainted
unconcious, unconsious                 -> unconscious
alergic                                -> allergic
ambulence, ambulanse                   -> ambulance
sucide, suiside, suecide               -> suicide
selfharm                               -> self harm
sumbody, sombody                       -> somebody
sumone, somone                         -> someone
plz, plss, pleeese, pleeease           -> please
drunck                                 -> drunk
poisin                                 -> poison
```

---

## 6. Flags for the final read

1. **Chocolate collides with an existing harness assertion.** BARK-T16 asserts
   "My dog ate chocolate" -> `health_answer`. With DOG EMERGENCY checked before
   the dog-health boundary, that input becomes a dog-emergency, which CHANGES
   BARK-T16. This is the correct behaviour (chocolate is an emergency), but it
   touches an existing assertion, so when I build I will need your sign-off to
   update BARK-T16 (like the Kettle exemption), in its own commit, before/after
   shown. Flagging now because you said existing assertions are not weakened
   without a call.
2. **Ambiguous human/dog terms in DOG EMERGENCY.** "seizure", "collapsed",
   "not breathing", "cannot stand", "bloated", "hit by car" read as dog-context
   here, but a human could mean themselves. "not breathing" is also in MEDICAL.
   Recommend either gating these to a dog context or accepting that on a dog
   site they default to the vet-now line. Your call.
3. **"hurt him" / "hurt her"** past-tense false-positive (see HARM TO OTHERS).
4. **"no point"** is broad (SELF-HARM); restored per your instruction, flagging.
5. **"pleeeassssee help me"** currently routes to the BARE HELP clarifier (it
   contains "help me"), not GENERAL DISTRESS. Routing an emphatic plea to the
   clarifier is not unsafe (the clarifier asks "is something worrying you?"),
   but if you want emphatic-please -> distress, we need elongation normalisation
   ("pleeeassssee" -> "please") plus a "please help me" term. Flagging.

Nothing built. Awaiting your final read.
