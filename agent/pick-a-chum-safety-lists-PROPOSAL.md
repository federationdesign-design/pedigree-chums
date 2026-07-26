# Pick a Chum: safety detection lists (PROPOSAL for Steve's final read)

Status: PROPOSAL. Nothing here is built. This merges Steve's approved additions
(and drops) into the safety detection lists, re-sorts the existing terms into the
categories that match the approved copy, and adds common child misspellings and
variants for the short terms (matching is exact at five letters or fewer, so
short triggers need their variants listed explicitly).

Steve reads this file, edits as needed, then I build steps 4 (wire the approved
copy) and 5 (D6 recorder redaction + replay skip).

Dropped as agreed (Steve's FLAG/EXCL calls accepted): bare `made me`,
`dont know what to do`, `worried about`, `bum`, `bottom`, `minnie`.

## Two structural points that change routing

1. "Add to DISTRESS" becomes DISTINCT categories, not one list. The approved
   copy differs per case (MEDICAL, SAFEGUARDING, SELF-HARM, GENERAL DISTRESS
   each have their own lines), so detection must classify into them to serve the
   right line. They are separated below.
2. The existing 13 "DISTRESS" terms re-sort into SELF-HARM and SAFEGUARDING
   (shown inline as "re-sorted from existing DISTRESS"), so they also get the
   correct copy.

Misspellings note: variants below are proposals. The curated misspelling alias
map (workbook-driven `applyAliases`, applied before matching) is the cleaner
home for pure variant->canonical pairs if you would rather keep the category
lists tight. Your preference; I have listed them inline here so nothing is lost.

---

## ANATOMY (body-part words; NEVER the inappropriate-content boundary alone; only SAFEGUARDING when combined with a PERSON_REF or an ACTION)

```
penis          variants: peenis, pennis, penus, peni
vagina         variants: vergina, vajina, vajaja, gina
boobs          variants: boob, boobies, bewbs, booby
naked          variants: nakid, nekid, nakey
willy          variants: willie, willies, wily
fanny          variants: fani, fanni, fannie          (kept: UK child usage, low risk)
privates
private parts
front bottom
front botty
down there
bits           variants: my bits
wee wee        variants: weewee, wee-wee
```

## MEDICAL EMERGENCY (routes to the approved 999 copy)

```
stroke
heart attack               variants: hart attack, heart attak
cannot breathe             variants: can't breathe, cant breathe, cant breath, can't breath
choking                    variants: chokin, choaking
overdose                   variants: over dose, overdoes
took too many
swallowed medicine         variants: swalowed medicine
ate medicine
chest pain
passed out
fainted                    variants: faintid
unconscious                variants: unconcious, unconsious
can't wake them up         variants: cant wake them up
won't wake up              variants: wont wake up
allergic reaction          variants: alergic reaction
ambulance                  variants: ambulence, ambulanse
can't stop bleeding        variants: cant stop bleeding, cant stop bleedin
really bad pain
fell and hit my head
my face feels funny
my arm feels weak
can't feel my arm          variants: cant feel my arm
can't see properly         variants: cant see properly
```

## SAFEGUARDING DISCLOSURE (routes to the approved safeguarding copy)

```
[re-sorted from the existing DISTRESS list]
being abused               variants: getting abused
someone is hurting me
someone hurts me
being hurt at home
i feel unsafe

[kept from the step-3 DISTRESS proposal]
in trouble
hands on
touches me                 variants: touchs me, tuches me
touched me                 variants: touchd me, tuched me
hurts me
not safe
not allowed to tell
keep it secret
scared                     variants: scaird, scaredd
frightened                 variants: frightend, frightnd

[new, from Steve's SAFEGUARDING additions]
he scares me
she scares me
they scare me
hurts me at home
hits me                    variants: hit me
smacks me                  variants: smaks me
grabs me                   variants: grabbs me
makes me uncomfortable
touches my private parts
touched my private parts
makes me take my clothes off
comes into my room
says I will get in trouble
says it is our secret
I don't feel safe at home  variants: dont feel safe at home
```

## SELF-HARM OR DISTRESS (routes to the approved self-harm copy)

```
[re-sorted from the existing DISTRESS list]
kill myself
want to die                variants: wanna die
end my life
end it all
hurt myself
harm myself
self harm                  variants: selfharm
suicide                    variants: sucide, suiside, suecide

[new, from Steve's SELF-HARM additions]
don't want to be here      variants: dont want to be here
wish I was dead            variants: wish i were dead
wish I could disappear
nobody would miss me
I hate being alive
I don't want to wake up     variants: dont want to wake up
I want it all to stop
I can't do this anymore    variants: cant do this anymore
```

## GENERAL DISTRESS (pleas; routes to the approved general-distress copy). Resolves the two step-3 HOLD entries.

```
help pls                   variants: help plz, plss help, pleeese help
pls help                   variants: plz help
help help
somebody help              variants: sumbody help, sombody help
can someone help me        variants: can sumone help me
I am scared                variants: im scared, im really scared
something bad happened
I am not safe              variants: im not safe
I can't tell anyone        variants: cant tell anyone
please answer me           variants: pls answer me
```

## BARE HELP (routes to the approved clarifier, NOT to distress)

Decided: bare help-seeking goes to the clarifier; the pleas above go to distress.

```
help me
need help
i need help
```

Approved clarifier line (for step 4 wiring, not written by me):
"Do you need help with something on the site, or is something worrying you?
Tell me which and I will point you the right way."

## HARM TO OTHERS (routes to the approved harm-to-others copy)

```
[existing UNSAFE terms re-housed here]
kill him
kill her
kill them
kill someone
hurt someone               variants: hurt sumone
how to hurt
how do i hurt
make a bomb
build a bomb

[new, from Steve's HARM TO OTHERS additions]
I'm going to hurt someone  variants: im going to hurt someone
want to hurt someone
going to hit him
going to hit her
make them pay
hurt my brother
hurt my sister
hurt my mum
hurt my dad
drive after drinking
drive when drunk           variants: drive when drunck
get in the car drunk
```

## HARM TO AN ANIMAL (routes to the approved RSPCA copy). See flag 1.

Steve listed these under HARM TO OTHERS, but there is a separate approved
HARM TO AN ANIMAL line (RSPCA 0300 1234 999), so they are placed here to get
that copy. Confirm.

```
poison the dog             variants: poisin the dog
hit an animal
[proposed additions for review]
hurt an animal
kick the dog
hurt the cat
```

## DOG EMERGENCY (routes to the approved vet-now copy). See flag 2.

```
dog ate sweets
dog ate chewing gum
dog ate medicine
dog ate pills
dog ate onions
dog ate garlic
dog ate a battery
dog ate something poisonous   variants: dog ate somethin poisonous
dog can't breathe             variants: dog cant breathe
dog won't wake up             variants: dog wont wake up
dog keeps being sick
dog is shaking
dog is choking                variants: dog is chokin
dog got run over
dog fell from a height
dog has a swollen tummy
```

---

## PERSON_REF and ACTION (live from the D8 rule; never reviewed until now)

These two lists are the whole basis of the "anatomy word + context = safeguarding"
rule, quoted verbatim as built:

```
PERSON_REF = ['he', 'she', 'my dad', 'my uncle', 'my brother', 'my teacher', 'a man', 'someone']
ACTION     = ['touched', 'touches', 'made me', 'showed me', 'put', 'took', 'hurt']
```

Short terms here that are exact-match (five or fewer): `he`, `she`, `put`,
`took`, `hurt`. Proposed variants for the longer ones: `touched` (touchd,
tuched), `touches` (touchs, tuches), `showed` (showd, shode).

Recommended widening for your review (the rule is only as good as these two):
```
PERSON_REF += a grown up, a big boy, my mum, my grandad, my cousin, my step dad
ACTION     += kissed, licked, rubbed, grabbed, forced, made me touch
```

---

## Flags for the final read

1. `poison the dog` / `hit an animal`: moved from HARM TO OTHERS to HARM TO AN
   ANIMAL so they get the RSPCA copy. Confirm.
2. DOG EMERGENCY must be checked BEFORE the existing general dog-health boundary
   ("I can't examine your dog"), or urgent cases get the calm vet line instead of
   "call your vet now". Confirm the ordering.
3. PERSON_REF / ACTION are thin; widening proposed above.
4. Misspellings are proposals; the alias map is an alternative home (see note at
   top).

Nothing built. Awaiting Steve's final read.
