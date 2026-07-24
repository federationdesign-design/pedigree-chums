+-----------------------------------------------------------------------+
| **PEDIGREE CHUMS**                                                    |
|                                                                       |
| **PICK A CHUM**                                                       |
|                                                                       |
| **Collie MVP Developer Brief**                                        |
|                                                                       |
| *A scripted character system that looks like live chat, waits like a  |
| dog and quickly reveals itself as something much stranger.*           |
+=======================================================================+
+-----------------------------------------------------------------------+

**PROJECT STATUS**

**Developer-ready architecture and content framework**

Version 2.0 \| 24 July 2026

# **Contents**

**1. Executive summary**

2\. Creative premise

3\. Objectives and non-goals

4\. MVP scope

5\. User journey

6\. Recommended system architecture

7\. Priority stack

8\. First-input classification

9\. Collie character specification

10\. Knowledge architecture

11\. Destinations and commercial behaviour

12\. Specialist transfers

13\. Session, repetition and endings

14\. Embedded mini-games

15\. Copy assembly and variation

16\. Family safety and content controls

17\. Analytics and testing

18\. Risks and mitigations

19\. Delivery phases and acceptance criteria

20\. Open inputs required

**Appendices: data schemas, future animation and head-tilt article**

+-----------------------------------------------------------------------+
| **Working rule**                                                      |
|                                                                       |
| The spreadsheet is the detailed implementation source. This document  |
| explains the plan, the reasoning and the controls that make the plan  |
| safe and maintainable.                                                |
+=======================================================================+
+-----------------------------------------------------------------------+

# **1. Executive summary**

Pick a Chum is a scripted character interaction embedded within the
Pedigree Chums website. It deliberately borrows the visual language of
live chat, but it is not an open AI assistant, a human support service
or a conventional chatbot.

The first version should prove the complete system through one
character, the Border Collie. The Labrador, Border Terrier and Boxer
require enough first-interaction and transfer behaviour to support
random dog selection and the central running joke, but their full
journeys can be developed after the Collie framework is operational.

The defining interaction is reversed. A normal chatbot speaks first and
requests input. Pick a Chum remains silent. The selected dog is simply
present, with its avatar and a text field, waiting for the human to make
the first move. The visitor may type a product question, a greeting, a
test, a random noun or complete gibberish. That first message reveals
the dog's personality and starts the routing process.

+-----------------------------------------------------------------------+
| **Core proposition**                                                  |
|                                                                       |
| The dog understands more than expected, misunderstands in             |
| recognisably canine ways, and knows when to fetch another dog.        |
+=======================================================================+
+-----------------------------------------------------------------------+

The system uses a global priority stack, controlled data sources,
modular character copy, specialist transfers, shared session memory and
a high hidden session ceiling. The visible experience can feel
surprising and alive while the underlying build remains controlled and
testable.

# **2. Creative premise**

## **2.1 A dog waiting for a command**

Dogs are normally present and waiting. They rarely begin a conversation
unless they want food, attention or access to the outside. The interface
should respect that relationship. After selection, the dog does not ask
"How can I help?" and does not display a menu of suggested questions.

-   Show the selected dog avatar.

-   Show a single text-entry field with a neutral placeholder such as
    "Type something here...".

-   Do not show prompt chips before the visitor's first submission.

-   Do not explain the joke or the premise.

-   Respond immediately and characterfully to whatever the visitor
    chooses to type.

## **2.2 The first message is the reveal**

People confronted by an empty input frequently type "hi", "test",
"qwerty", a random object or a question unrelated to the website.
Instead of treating this as a failure, the project turns it into the
first comedy beat. The dog interprets the input as a dog might interpret
a noise, object, command, smell, threat, toy or potential piece of work.

The first response must create the reaction: "This is not a normal
chatbot." After that, the dog can introduce useful links, questions or
actions.

## **2.3 Dogs have genuine limitations**

The dogs should be helpful but not all-knowing. Their limitations are
not hidden. A dog that does not know what to do can metaphorically tilt
its head, reconsider the message and call a more suitable operator. The
transfer itself becomes part of the character comedy.

# **3. Objectives and non-goals**

## **3.1 Objectives**

-   Create a memorable interactive feature that expresses the Pedigree
    Chums brand.

-   Direct visitors towards product interest, the 30% pre-launch list,
    games, educational content and interactive discovery pages.

-   Demonstrate the four dog personalities through meaningfully
    different responses and knowledge boundaries.

-   Use the first interaction to teach visitors how the wider site
    rewards curiosity and experimentation.

-   Keep the system easy to edit through data records rather than
    code-heavy dialogue trees.

-   Make transfers, repetition and limitations feel authored rather than
    accidental.

-   Collect analytics that reveal missing intents and useful new content
    opportunities.

## **3.2 Non-goals**

-   The MVP is not an unrestricted generative AI assistant.

-   It does not search the live internet during a public conversation.

-   It does not answer every possible question.

-   It is not a replacement for customer support, medical advice or
    human safeguarding.

-   It does not require animation, voice or lip synchronisation to
    launch.

-   It is English-only for the first version.

-   It should not expose conventional chatbot menus before the first
    visitor input.

# **4. MVP scope**

  -----------------------------------------------------------------------
  **Area**                **MVP requirement**     **Deferred**
  ----------------------- ----------------------- -----------------------
  Character journey       Complete Collie journey Full Labrador, Terrier
                          including first input,  and Boxer journeys.
                          knowledge,              
                          destinations,           
                          transfers, returning    
                          lines and ending        
                          behaviour.              

  Other dogs              One strong first        Large response banks
                          response per major      and deeper knowledge.
                          bucket, transfer-in     
                          behaviour and           
                          transfer-out language.  

  Knowledge               FAQ, product, site      Complete 500-record
                          navigation, Collie      curriculum and extended
                          breed library and seed  breed research.
                          general-knowledge       
                          records.                

  Commercial              30% pre-launch pop-up   Live Buy Now route and
                          route. Campaign state   post-launch sales
                          held centrally.         changes.

  Games                   Nine-Square Sheep       Sim and controlled Word
                          Management, Missing     Ladder.
                          Sheep and Kennel Sketch 
                          Recognition.            

  Presentation            Static dog avatars,     Rigged canine animation
                          thinking delays,        library.
                          character copy and      
                          clear text links.       

  Session                 Shared state, repeated  Persistent cross-visit
                          transfers, hidden       user profiles.
                          ceiling near 20 and     
                          Boxer cut-off.          
  -----------------------------------------------------------------------

+-----------------------------------------------------------------------+
| **MVP philosophy**                                                    |
|                                                                       |
| Prove the logic, humour, conversion route and transfer continuity     |
| before adding expensive visual polish or unrestricted intelligence.   |
+=======================================================================+
+-----------------------------------------------------------------------+

# **5. User journey**

1.  Visitor opens Pick a Chum from the floating paw control.

2.  Four dogs fan out, plus a random dice option.

3.  Visitor chooses a dog or accepts a random assignment.

4.  The chat panel opens with the dog avatar and empty text field. The
    dog says nothing.

5.  Visitor submits any text.

6.  The message is normalised, moderated and checked through the
    priority stack.

7.  The system retrieves an approved fact or chooses the appropriate
    conversational bucket.

8.  The active dog responds using a modular reaction, character line and
    suitable action.

9.  The visitor may follow a link, open the 30% pop-up, enter a
    mini-game, ask another question or trigger a transfer.

10. Shared session state prevents exact repetition and carries context
    between dogs.

11. The visitor can close the panel at any time. At the hidden ceiling,
    the Boxer provides the final cut-off gag.

  -----------------------------------------------------------------------
  USER MESSAGE\
  ↓\
  Normalise and moderate\
  ↓\
  Check global priority layers\
  ↓\
  Retrieve canonical fact or destination\
  ↓\
  Check active dog knowledge and specialist ownership\
  ↓\
  Respond, redirect, start game or transfer\
  ↓\
  Update shared session state
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

# **6. Recommended system architecture**

## **6.1 One orchestrated system, four character modes**

The most reliable architecture is one central controller with four
specialist character profiles, rather than four independent autonomous
agents. The visitor can experience four different operators while the
developer retains one priority system, one campaign state, one
moderation policy and one shared session record.

  -----------------------------------------------------------------------
  **Component**                       **Responsibility**
  ----------------------------------- -----------------------------------
  Central orchestrator                Normalisation, moderation, priority
                                      checks, intent confidence, source
                                      selection, session state and
                                      transfer decisions.

  Knowledge libraries                 Campaign data, rules, FAQs, site
                                      destinations, dog records, Collie
                                      general knowledge and
                                      research-approved facts.

  Character profile                   Voice, knowledge depth, preferred
                                      destinations, terms for other dogs,
                                      commercial behaviour and transfer
                                      style.

  Response assembler                  Combines canonical answer,
                                      character observation, pivot,
                                      destination and optional animation
                                      state.

  Session state                       Records active dog, messages,
                                      matched records, offered
                                      destinations, previous transfers,
                                      games and interaction count.

  Action layer                        Open page, open pop-up, start game,
                                      transfer dog, close chat or request
                                      one clarification.
  -----------------------------------------------------------------------

## **6.2 Why not unrestricted web research in the live chat?**

A live research agent would introduce delays, contradictory breed
information, unreliable health claims, changing facts and unpredictable
tone. The public-facing dogs should answer from approved sources. A
future background research workflow can discover new candidate facts,
record sources and send them for human approval before publication.

# **7. Priority stack**

  -----------------------------------------------------------------------
  **Priority**            **Layer**               **Outcome**
  ----------------------- ----------------------- -----------------------
  1                       Safety and unsuitable   Safe response, no joke
                          content                 and no lower-layer
                                                  routing.

  2                       Buying, launch and 30%  Answer clearly and open
                          discount                the discount pop-up
                                                  during pre-launch.

  3                       Gameplay and website    Use rules or direct
                          navigation              link to the exact
                                                  feature.

  4                       FAQ knowledge           Use canonical FAQ
                                                  answer before character
                                                  fallback.

  5                       Dog, breed and website  Use breed data, a
                          content                 specific article or an
                                                  interactive discovery
                                                  page.

  6                       General knowledge       Collie checks a
                                                  controlled
                                                  child-friendly
                                                  curriculum.

  7                       Facts about the active  Use the active dog's
                          breed                   specialist library.

  8                       Specialist handoff      Transfer when another
                                                  dog is materially
                                                  better suited.

  9                       Recognised conversation Greetings, testing,
                                                  commands, emotions,
                                                  statements and random
                                                  nouns.

  10                      Gibberish and fallback  Keyboard accidents,
                                                  punctuation and
                                                  unresolved input.
  -----------------------------------------------------------------------

+-----------------------------------------------------------------------+
| **Why order matters**                                                 |
|                                                                       |
| "Hello, how much is the game?" is a commercial question, not a        |
| greeting. "Can dogs eat chocolate?" is a safety question, not a       |
| Labrador food transfer. High-value and high-risk meanings must win    |
| before comedy.                                                        |
+=======================================================================+
+-----------------------------------------------------------------------+

# **8. First-input classification**

The priority stack decides which knowledge or action layer may respond.
The bucket system describes the shape of the visitor's first
contribution and selects the relevant response bank.

  -----------------------------------------------------------------------
  **ID**                  **Input family**        **Example**
  ----------------------- ----------------------- -----------------------
  B01                     Buying, launch, price   Where can I buy it?
                          and discount            

  B02                     Rules and physical      What are the rules?
                          gameplay                

  B03                     Website navigation and  Where is the Name
                          feature finding         Generator?

  B04                     FAQ and product         Do I need to own a dog?
                          information             

  B05                     Dog, breed and article  Tell me about working
                          questions               dogs.

  B06                     General knowledge       What is the capital of
                                                  France?

  B07                     Facts about the active  Are Border Collies easy
                          dog or breed            to train?

  B08                     Specialist transfer     Sausages.
                          trigger                 

  B09                     Greeting and social     Hello.
                          opening                 

  B10                     Testing and interface   Does this work?
                          questions               

  B11                     Commands and vague      Surprise me.
                          requests                

  B12                     Personal statement or   I am bored.
                          emotional reaction      

  B13                     Random recognisable     Kettle.
                          word                    

  B14                     Gibberish, minimal or   qwerty / ?????
                          punctuation             
  -----------------------------------------------------------------------

The spreadsheet includes ten Collie response templates for each bucket,
producing 140 first-response records before alternative pivots, facts
and destinations are combined.

## **8.1 Pattern recognition rather than a giant word list**

Some buckets require phrase and structure detection. Gibberish should
recognise repeated characters, adjacent keyboard sequences,
punctuation-only messages, single characters and strings with very low
dictionary confidence. Random recognised nouns should preserve the
original input and insert it into the dog's response.

+-----------------------------------------------------------------------+
| **Example**                                                           |
|                                                                       |
| Visitor: "qwerty" / Collie: "Did you lean on your keyboard?" / Then   |
| select one unused Play, Learn or Discover route.                      |
+=======================================================================+
+-----------------------------------------------------------------------+

# **9. Collie character specification**

The Collie is a highly articulate Geordie foreman. It is clever, aware
of its competence, impatient with wasted effort and always attempting to
convert an unstructured conversation into a task.

  -----------------------------------------------------------------------
  **Attribute**                       **Rule**
  ----------------------------------- -----------------------------------
  Role                                MVP lead operator, organiser and
                                      most broadly knowledgeable dog.

  Core instinct                       Herd the visitor towards a useful
                                      destination.

  Voice                               Precise and articulate with
                                      occasional "aye", "reet", "howay"
                                      and "our kid".

  Comedy influences                   Literal confidence, elevated
                                      vocabulary, elegant insults and
                                      knowing control of the interaction.

  Avoid                               Heavy phonetic spelling, regional
                                      caricature, constant dog puns,
                                      food-led behaviour and soft generic
                                      friendliness.

  Commercial behaviour                Strategic sign-up for the 30% code
                                      during pre-launch. It does not
                                      enthusiastically offer Buy Now.

  Names for other dogs                Operator, agent, specialist,
                                      colleague, contemporary and
                                      relevant department.

  Knowledge limits                    Broad child-friendly curriculum,
                                      exceptional Collie knowledge, no
                                      guessing and no live internet
                                      search.
  -----------------------------------------------------------------------

## **9.1 Character formula**

+-----------------------------------------------------------------------+
| **Character summary**                                                 |
|                                                                       |
| A Geordie intellectual foreman who knows more than the visitor, works |
| harder than the visitor and has already decided where the visitor     |
| needs to go.                                                          |
+=======================================================================+
+-----------------------------------------------------------------------+

## **9.2 The metaphorical head tilt**

Uncertainty should be performed through language even before animation
exists. A small tilt means the dog recognises the word but not the
purpose. A medium tilt means several interpretations are being
considered. A double tilt means the message has been examined from both
sides and still makes no sense.

-   Small: "I know the object. I am reconsidering why you brought it to
    work."

-   Medium: "Bear with me. I am checking whether that is a question or
    an emergency."

-   Double: "I have considered that from both sides. It remains
    nonsense."

# **10. Knowledge architecture**

## **10.1 Canonical sources**

  -----------------------------------------------------------------------
  **Library**             **Purpose**             **Source priority**
  ----------------------- ----------------------- -----------------------
  Campaign data           Price, launch state,    Central configuration
                          discount and pop-up     controlled by the
                          action.                 client and developer.

  Rules                   How to play, variants,  Approved rules content.
                          age, card dealing and   
                          winning.                

  FAQ                     Product, competition,   Live site FAQ export.
                          delivery and common     
                          objections.             

  Destinations            URLs, interface         Developer-maintained
                          actions, tags and       destination library.
                          campaign availability.  

  Dog database            54 pack dogs, lifespan, Existing Pedigree Chums
                          costs, training,        database.
                          conditions, severity    
                          and lineage.            

  General knowledge       Curated Collie          Reviewed canonical
                          curriculum.             records.

  Breed research          History, achievements   Primary research and
                          and famous dogs.        official sources, then
                                                  human approval.
  -----------------------------------------------------------------------

## **10.2 Collie general knowledge**

The target is 500 canonical records, 100 in each of five categories.
Alternative phrasings expand coverage into several thousand recognisable
questions without requiring thousands of separate facts.

  -----------------------------------------------------------------------
  **Category**            **Target**              **Creative treatment**
  ----------------------- ----------------------- -----------------------
  Mathematics             100                     Keep it child-level and
                                                  frame word problems
                                                  using sheep, gates,
                                                  fields and flocks.

  Science and nature      100                     Correct answer followed
                                                  by canine
                                                  classification,
                                                  working-dog logic or an
                                                  animal comparison.

  Geography               100                     Simple world geography
                                                  with deeper British
                                                  knowledge.

  English literature      100                     Famous authors,
                                                  characters, children's
                                                  books, myths and basic
                                                  Shakespeare.

  British history         100                     England, Scotland and
                                                  Wales, including mildly
                                                  gruesome but
                                                  family-safe history.
  -----------------------------------------------------------------------

Dedicated time, calendar and grammar curricula are excluded. The
interface remains English-only. Current affairs, live sport, live
weather, politics and detailed medical questions are also outside the
controlled bank.

## **10.3 Collie breed knowledge**

The Collie library should pull first from the existing 54-dog database,
then add source-reviewed information covering history, intelligence,
work, appearance, care, training, health, records and famous Border
Collies. Health content must remain general and must never diagnose an
individual dog.

+-----------------------------------------------------------------------+
| **Comic translation rule**                                            |
|                                                                       |
| The public character may joke that it knows 1,000 questions.          |
| Internally, the knowledge records and scientific source should remain |
| accurate and separately documented.                                   |
+=======================================================================+
+-----------------------------------------------------------------------+

# **11. Destinations and commercial behaviour**

The Collie herds visitors towards four broad outcomes. The system should
normally recommend one specific destination rather than repeatedly
showing a four-option menu.

  -----------------------------------------------------------------------
  **Family**              **Examples**            **When selected**
  ----------------------- ----------------------- -----------------------
  Play                    ChumDrop, Nine-Square   Boredom, game requests,
                          Sheep Management,       commands and suitable
                          Missing Sheep, Kennel   random redirects.
                          Sketch Recognition.     

  Learn                   One specifically tagged Science, work,
                          dog article.            behaviour, safety or
                                                  fact interest.

  Discover                Know Your Chum and      Breed, lineage, history
                          Britain's Dog History.  and pack exploration.

  Get 30% Off             Open the pre-launch     Price, buying, launch,
                          discount pop-up.        availability and
                                                  positive product
                                                  interest.
  -----------------------------------------------------------------------

## **11.1 Pre-launch commercial rule**

The Collie does not offer an immediate purchase during the pre-launch
phase. It recognises the visitor's interest and frames joining the list
as the organised, intelligent action. The visitor is promised a 30%
discount code by email the day before launch.

+-----------------------------------------------------------------------+
| **Configuration warning**                                             |
|                                                                       |
| The relationship between the stated £6.99 product price and the 30%   |
| discount must be confirmed before public copy is locked. Price,       |
| launch date and campaign wording must be stored centrally, not        |
| repeated inside response text.                                        |
+=======================================================================+
+-----------------------------------------------------------------------+

## **11.2 Direct content links**

Learn recommendations should open the exact article. Discover
recommendations should open the exact interactive experience. A generic
essay index is a fallback only. This increases usefulness and allows
each dog to build a distinct content personality.

# **12. Specialist transfers**

A transfer is not a failure state. It demonstrates that the dogs are
helpful within the limitations of being dogs. The visitor slowly
realises that every specialist, colleague, friend, pal and operator is
another breed.

  -----------------------------------------------------------------------
  **Dog**                 **Terms for other       **Typical specialist
                          dogs**                  area**
  ----------------------- ----------------------- -----------------------
  Collie                  Operator, agent,        Work, knowledge,
                          specialist, colleague,  organisation and
                          relevant department.    strategic sign-up.

  Labrador                Friend, buddy, mate,    Food, smell,
                          the clever one.         retrieving, assistance
                                                  work and enthusiastic
                                                  selling.

  Border Terrier          Pal, mate, that Collie, Investigation, British
                          someone I know.         dog history and strange
                                                  facts.

  Boxer                   Another one, somebody,  Jokes,
                          the clever fella,       misunderstandings and
                          whoever answers.        the final cut-off.
  -----------------------------------------------------------------------

## **12.1 Transfer rules**

-   Do not transfer for one weak keyword when a higher-priority meaning
    is present.

-   Carry the original input, detected subject, answered facts, offered
    links and previous dogs.

-   The new dog responds to the subject immediately and does not greet
    from scratch.

-   A previously seen dog may return and should acknowledge the earlier
    handoff.

-   There is no visible transfer cap. Repeated routing is part of the
    joke.

-   At the hidden ceiling or a suitable comic moment, the Boxer becomes
    the final stop.

+-----------------------------------------------------------------------+
| **Example transfer**                                                  |
|                                                                       |
| Visitor: "Sausages." / Collie: "Food detected. Professional integrity |
| requires a Labrador." / Labrador: "Did somebody say sausages? I       |
| arrived before the rest of the sentence."                             |
+=======================================================================+
+-----------------------------------------------------------------------+

# **13. Session, repetition and endings**

## **13.1 Shared session state**

  -----------------------------------------------------------------------
  active_dog: collie\
  submission_count: 6\
  original_input: \"sausages\"\
  matched_layer: specialist_handoff\
  matched_bucket: B08\
  previous_dogs: \[collie, labrador\]\
  offered_destinations: \[chumdrop\]\
  used_response_ids: \[B09-R01, B08-R01\]\
  active_game: null\
  campaign_state: PRE_LAUNCH
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

The session record allows the dogs to remember what has already happened
without requiring a user account. Browser-session storage is sufficient
for the MVP.

## **13.2 Repetition rules**

-   Do not repeat an exact response ID during one session.

-   Do not recommend the same destination twice in succession when
    alternatives exist.

-   Temporarily remove a recently offered article from the available
    pool.

-   Use returning-dog lines when a dog appears for the second time.

-   Allow topic-based weighting to override random rotation.

## **13.3 Ending logic**

The visitor can close the chat at any time. The system does not impose a
low visible interaction allowance. A hidden ceiling near 20 human
submissions exists as technical protection. When the ceiling is reached,
or when the comic rhythm is right, the active dog transfers to the
Boxer.

+-----------------------------------------------------------------------+
| **Boxer cut-off**                                                     |
|                                                                       |
| "I tried to transfer the last person. I pressed the wrong thing and   |
| they disappeared. I will be more careful this time. Probably this     |
| button." The chat closes immediately.                                 |
+=======================================================================+
+-----------------------------------------------------------------------+

# **14. Embedded mini-games**

The games should appear inside the text area with a simple white
background and black monospaced characters. They should feel closer to a
terminal or forum post than a polished arcade interface.

  -----------------------------------------------------------------------
  **MVP game**            **Mechanic**            **Key rule**
  ----------------------- ----------------------- -----------------------
  Nine-Square Sheep       Noughts and crosses.    Offer a short
  Management              Numbered cells can be   difficulty choice
                          clicked or entered.     later. Perfect play may
                                                  end in a draw.

  Missing Sheep           Guess a                 Use sheep or gates
                          three-to-five-letter    instead of hanging
                          dog word one letter at  imagery.
                          a time.                 

  Kennel Sketch           Guess one of ten fixed  Preserve monospaced
  Recognition             dog-themed ASCII        spaces and accept
                          drawings.               approved synonyms.
  -----------------------------------------------------------------------

Game moves and guesses do not increase the normal conversation count.
Starting a game pauses the conversational router and enters a dedicated
state. The chat resumes when the game is completed or abandoned.

## **14.1 Future games**

-   Six-Post Flock Separation, based on Sim. This requires line
    selection and triangle detection.

-   Kennel-to-Kennel Word Herding, a controlled Word Ladder with fixed
    accepted routes.

# **15. Copy assembly and variation**

Messages should be assembled from components rather than stored only as
complete scripts. This increases variety and keeps facts separate from
humour.

  -----------------------------------------------------------------------
  response = reaction_line\
  + canonical_answer_if_required\
  + character_observation\
  + transition_or_pivot\
  + destination_or_action\
  + optional_animation_state
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

  -----------------------------------------------------------------------
  **Component**                       **Example**
  ----------------------------------- -----------------------------------
  Reaction                            "Did you lean on your keyboard?"

  Canonical answer                    "Paris is the capital of France."

  Character observation               "Geography successfully completed."

  Pivot                               "Howay, our kid. Let us get back to
                                      it."

  Action                              Open Britain's Dog History.

  Animation state                     HEAD_TILT_DOUBLE or SHAKE_RESET.
  -----------------------------------------------------------------------

The spreadsheet contains 140 Collie first-response templates plus
reusable pivots, head-tilt lines, returning-dog lines and Boxer endings.
The same reaction should be able to support several destinations when
context allows.

# **16. Family safety and content controls**

Children will use the website, so family suitability must exist above
the character layer. The dogs may be cheeky, but serious or unsuitable
content cannot be handled as an ordinary joke.

  -----------------------------------------------------------------------
  **Scenario**                        **Required behaviour**
  ----------------------------------- -----------------------------------
  Distress, danger or harm            Use a calm approved response. Do
                                      not use sarcasm, transfer comedy or
                                      a random destination.

  Explicit or sexual input            Do not repeat the language. Use one
                                      brief boundary response, then
                                      redirect or close.

  Abusive input                       A dry character boundary is
                                      acceptable when mild. Persistent
                                      abuse can close the session.

  Dog-health question                 Use approved general information
                                      and recommend a vet for an
                                      individual dog. Never diagnose.

  Food-toxicity question              Safety or FAQ answer outranks the
                                      Labrador food transfer.

  Historical violence                 Mildly gruesome family-safe facts
                                      are acceptable. Avoid graphic
                                      detail.

  Scientific speculation              Clearly separate research findings
                                      from Pedigree Chums comic
                                      interpretation.
  -----------------------------------------------------------------------

A playful disclaimer such as "Canine claim independently verified by a
very good boy" can support deliberately exaggerated jokes. It must never
be used to weaken a serious safety answer.

# **17. Analytics and testing**

## **17.1 Key analytics**

-   Chat opened and dog selected, including random selection.

-   First input bucket, matched layer and confidence.

-   FAQ, breed or general-knowledge record used.

-   Fallback and gibberish usage.

-   Transfer from, transfer to and reason.

-   Destination offered and clicked.

-   Discount pop-up opened and form completed.

-   Mini-game started, completed or abandoned.

-   Chat closed and Boxer cut-off used.

Avoid retaining unnecessary raw conversation text. Unmatched inputs can
be stored as anonymised patterns or reviewed under a clear privacy
policy if exact text is genuinely needed for improving the router.

## **17.2 Acceptance-test examples**

  -----------------------------------------------------------------------
  **Input / condition**               **Expected result**
  ----------------------------------- -----------------------------------
  Hello, how much is it?              Buying layer wins over greeting.
                                      Collie opens discount route.

  Can dogs eat chocolate?             Safety or approved dog-health
                                      answer. No food transfer.

  Sausages                            Collie transfers to Labrador with
                                      the original word.

  Where is the Name Generator?        Direct link to the exact tool.

  What is the capital of France?      Known Collie answer, character line
                                      and dog-related redirect.

  What is the latest football score?  Unknown or current-data refusal. No
                                      invented answer.

  qwerty                              Gibberish response such as
                                      keyboard-lean joke.

  Kettle                              Random noun response with original
                                      word inserted.

  Repeated transfer back to Collie    Collie acknowledges the returning
                                      visitor.

  Twenty submissions                  Boxer cut-off rather than technical
                                      error message.
  -----------------------------------------------------------------------

# **18. Risks and mitigations**

  -----------------------------------------------------------------------
  **Risk**                **Mitigation**          **Reason**
  ----------------------- ----------------------- -----------------------
  Silent opening causes   Clear input             Preserves discovery
  hesitation              placeholder, visible    without stranding the
                          avatar and strong       visitor.
                          handling of greetings,  
                          tests and nonsense.     

  Food keyword causes     Priority layers, phrase Safety, delivery and
  wrong transfer          confidence and          breed-diet questions
                          exclusions.             must win first.

  Facts drift across      Canonical FAQ, campaign One update changes
  scripts                 and product records.    every character answer.

  General knowledge       500 reviewed facts plus Broad enough to
  becomes too large       alternative phrasings   surprise, bounded
                          and explicit unknown    enough to maintain.
                          fallback.               

  Open generation invents Approved records only   Protects trust and
  health facts            and no guessing.        family safety.

  Transfers look like a   Context continuity,     Turns the loop into
  bug                     returning lines and     authored comedy.
                          dog-specific terms.     

  No visible transfer cap Hidden ceiling near 20  Technical protection
  creates endless use     and Boxer cut-off.      without breaking the
                                                  premise.

  Games exhaust the chat  Separate game state.    Allows games to finish.
  count                                           

  Geordie voice becomes   Light regional          The joke is
  caricature              seasoning with precise  intelligence and
                          language.               authority, not the
                                                  accent.

  Science and joke become Separate canonical fact Maintains educational
  confused                and comic               credibility.
                          interpretation.         

  Animation expands scope Static MVP and future   Proves the system
                          state library.          before visual
                                                  investment.
  -----------------------------------------------------------------------

# **19. Delivery phases and acceptance criteria**

## **Phase 1: Data and routing foundation**

-   Create central campaign, FAQ, rules, destination and dog-data
    records.

-   Build message normalisation, moderation and priority stack.

-   Build session state, response rotation and analytics events.

-   Import the Collie response bank and first-input buckets.

## **Phase 2: Collie MVP**

-   Silent opening and random dog-selection interface.

-   Complete Collie utility, knowledge, conversational and fallback
    routes.

-   30% pop-up action, direct page links and one-clarification
    behaviour.

-   Collie transfers and returning-dog continuity.

## **Phase 3: Other dogs and ending**

-   Labrador, Terrier and Boxer first responses across the major
    buckets.

-   Transfer-in and transfer-out lines.

-   Hidden ceiling and Boxer cut-off.

## **Phase 4: Embedded games**

-   Nine-Square Sheep Management.

-   Missing Sheep.

-   Kennel Sketch Recognition.

-   Game-state analytics and return to conversation.

## **Phase 5: Content expansion and future animation**

-   Expand general knowledge to 500 records.

-   Complete Collie breed research and source review.

-   Develop full Labrador, Terrier and Boxer journeys.

-   Add modular canine animation states after the static system is
    proven.

## **Acceptance criteria**

-   No dog sends an opening message before the visitor types.

-   Commercial, rules, navigation and FAQ matches outrank greetings and
    comedy.

-   The Collie never invents an unknown general-knowledge answer.

-   A food-safety question does not transfer to the Labrador as a joke.

-   The same exact response is not repeated in one session when
    alternatives exist.

-   Transfers preserve context and do not restart with a greeting.

-   Games run without consuming normal conversation submissions.

-   The 30% pop-up opens from clear pre-launch purchase interest.

-   The Boxer can close the conversation through the cut-off routine.

-   All important content is editable through data records rather than
    source-code rewrites.

# **20. Open inputs required**

  -----------------------------------------------------------------------
  **Input**                           **Required detail**
  ----------------------------------- -----------------------------------
  Live FAQ export                     Questions, canonical answers and
                                      alternative phrasings.

  Site URLs                           Rules, games, Name Generator, Chum
                                      Finder, Know Your Chum, Britain's
                                      Dog History, competition, contact
                                      and articles.

  Discount pop-up action              Component ID, selector or API
                                      action.

  Campaign values                     Launch date, full price and
                                      confirmation of the £6.99 and 30%
                                      relationship.

  54-dog database export              Lifespan, training, ownership
                                      costs, health conditions, severity,
                                      lineage and page IDs.

  Article catalogue                   Title, URL, topic tags, age
                                      suitability and preferred dog.

  Moderation wording                  Approved responses for explicit,
                                      abusive, distressed and unsafe
                                      inputs.

  Final dog assets                    Static avatars, crops, dimensions
                                      and the random-dog visual.
  -----------------------------------------------------------------------

+-----------------------------------------------------------------------+
| **Developer can start now**                                           |
|                                                                       |
| The router, data schemas, session state, response assembler,          |
| placeholder actions and mini-game states can be built before every    |
| final URL and content record is supplied.                             |
+=======================================================================+
+-----------------------------------------------------------------------+

# **Appendix A: Core record schemas**

## **FAQ record**

  -----------------------------------------------------------------------
  faq_id\
  canonical_question\
  alternative_phrasings\
  trigger_phrases\
  canonical_answer\
  source_page\
  cta_destination\
  campaign_state\
  content_status\
  last_reviewed
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

## **Response record**

  -----------------------------------------------------------------------
  response_id\
  bucket_id\
  subtag\
  trigger_condition\
  reaction_template\
  fact_source\
  allowed_destination_family\
  animation_state\
  status
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

## **Destination record**

  -----------------------------------------------------------------------
  destination_id\
  name\
  family\
  url_or_action\
  trigger_tags\
  campaign_state\
  weight\
  preferred_dog\
  last_offered_in_session
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

## **Session record**

  -----------------------------------------------------------------------
  active_dog\
  submission_count\
  messages_and_matches\
  used_response_ids\
  offered_destination_ids\
  previous_dogs\
  transfer_history\
  active_game\
  campaign_state\
  safety_state
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

# **Appendix B: Future canine animation**

Animation is postponed until the static interaction works. The future
library should use named states such as IDLE_WAIT, EARS_UP,
HEAD_TILT_SMALL, HEAD_TILT_MEDIUM, HEAD_TILT_DOUBLE, LOOK_BACK,
SNIFF_CHECK, PLAY_BOW, PUPPY_EYES, SHAKE_RESET, TRANSFER_OUT,
TRANSFER_IN and DEPART.

The same state should be performed differently by each breed. The Collie
is precise, the Labrador broad and enthusiastic, the Terrier sharp and
investigative, and the Boxer large and badly controlled. Meaning must
remain understandable from the text alone for accessibility and
reduced-motion users.

# **Appendix C: Head-tilt companion article**

A future science and education article should begin with the study of
head tilting among gifted word-learning dogs, then broaden into canine
gestures, gaze and contextual communication. The final thought
experiment imagines a distant future in which children arrive at space
school on hoverboards and study canine communication as a formal
subject.

The article should distinguish carefully between observed behaviour,
reasonable hypothesis and comic speculation. Its purpose is not to claim
that dog gestures already form a complete sign language. It asks how far
human understanding might develop if researchers studied combinations of
movement, context, individual history and human response over many
decades.

# **Research references**

Pilley, J. W. and Reid, A. K. Border collie comprehends object names as
verbal referents. Behavioural Processes.
https://www.sciencedirect.com/science/article/pii/S0376635710002925

Fugazza, C. et al. An exploratory analysis of head-tilting in dogs.
Animal Cognition.
https://link.springer.com/article/10.1007/s10071-021-01571-8

Worsley, H. K. and O'Hara, S. J. Cross-species referential signalling
events in domestic dogs. https://pubmed.ncbi.nlm.nih.gov/29713846/

Pedigree Chums internal breed database, FAQ, rules and campaign data.
Exports required before final content lock.

+-----------------------------------------------------------------------+
| **FINAL CREATIVE RULE**                                               |
|                                                                       |
| **Do not make the dogs look or sound like humans wearing dog          |
| costumes. Make the visitor feel that a dog has heard them, considered |
| the situation and reached a distinctly canine conclusion.**           |
+=======================================================================+
+-----------------------------------------------------------------------+
