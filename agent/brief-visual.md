+-----------------------------------------------------------------------+
| **PEDIGREE CHUMS**                                                    |
|                                                                       |
| **PICK A CHUM**                                                       |
|                                                                       |
| **Visual Interface & Retro Dialogue Specification**                   |
|                                                                       |
| *A branded SNES-era dialogue system that initially resembles live     |
| chat, waits silently like a dog and then reveals itself as part of    |
| the game.*                                                            |
+=======================================================================+
+-----------------------------------------------------------------------+

**PROJECT STATUS**

**Developer-ready visual layer to be applied after the conversation
mechanics are stable**

Version 1.0 \| 24 July 2026

# Contents

1\. Executive instruction

2\. Creative objective

3\. Reference interpretation

4\. Non-negotiable visual rules

5\. Complete visual state flow

6\. Closed launcher and dog selector

7\. Selected-dog waiting state

8\. Dialogue HUD and response behaviour

9\. Retro visual system

10\. Links, choices and calls to action

11\. Transfers between dogs

12\. Embedded mini-game state

13\. Responsive behaviour

14\. Accessibility and reduced motion

15\. Assets and content dependencies

16\. Integration contract

17\. Acceptance criteria

18\. Delivery checklist

# 1. Executive instruction

Build the visual layer as a retro console role-playing-game dialogue
system, not as a conventional web chatbot. The supplied client mock-ups
define the placement, opening sequence and overall interaction. The
supplied game screenshots define the visual language: a fixed dialogue
panel, an integrated character portrait, a clear nameplate, short text
pages and a visible prompt to continue.

+-----------------------------------------------------------------------+
| **NON-NEGOTIABLE OPENING**                                            |
|                                                                       |
| When a dog is selected, it must not greet the visitor, ask a question |
| or display suggested prompts. The selected dog waits silently. The    |
| only invitation is the text-entry field. The visitor speaks first.    |
+=======================================================================+
+-----------------------------------------------------------------------+

This brief covers presentation and front-end behaviour only. It must sit
over the separate routing, content, session, transfer and mini-game
mechanics already specified. The visual implementation must consume
those mechanics rather than duplicating them.

# 2. Creative objective

The first impression should be familiar enough to resemble a floating
live-chat control. Within one interaction, it should reveal itself as
something closer to an old console game conversation. The comedy depends
on that change of expectation.

-   At rest, it looks like a small branded site utility.

-   When opened, four dog operators fan out from the launcher.

-   After selection, the chosen dog waits for a command like a real dog.

-   After the visitor types, the lower part of the screen behaves like
    an RPG dialogue HUD rather than a message thread.

-   Transfers feel like changing party members or speaking to another
    character, not being escalated through a call centre.

-   Mini-games run inside the same dialogue space, as though the dog has
    changed the mode of the console.

# 3. Reference interpretation

![](media/image1.png){width="6.8in" height="1.9308639545056867in"}

*Visual-language references supplied by the client. Borrow the dialogue
hierarchy, portrait treatment, nameplate and lower-screen anchoring. Do
not copy the games or their artwork.*

![](media/image2.png){width="6.45in" height="6.740977690288714in"}

*Client mock-ups defining the intended sequence. The response image is a
placement reference only; its automatic greeting is superseded by the
silent-opening rule in this brief.*

## What to take from the game references

-   A single fixed dialogue panel, normally attached to the lower edge
    of the viewport.

-   A character portrait that is part of the dialogue frame, not a
    detached customer-service avatar.

-   A small nameplate that identifies the active speaker.

-   Short pages of dialogue that advance, instead of an endless stack of
    chat bubbles.

-   A clear continue marker or command cursor once the current text has
    finished appearing.

-   Strong borders, inner highlights and simple graphic depth associated
    with 16-bit and 32-bit interface design.

## What not to copy

-   Do not pixelate, redraw or lower the quality of the existing
    Pedigree Chums dog illustrations.

-   Do not reproduce fantasy ornament, character costumes, backgrounds
    or proprietary game graphics.

-   Do not force the complete website into a pixel-art style. The retro
    treatment belongs to the Pick a Chum interface.

-   Do not use modern glass panels, translucent blur, messenger-style
    timestamps or typing-dot bubbles.

![](media/image3.png){width="6.65in" height="3.532812773403325in"}

*The interface should borrow the grammar of a retro game dialogue system
without becoming a literal imitation of any one title.*

# 4. Non-negotiable visual rules

  -----------------------------------------------------------------------
  **Rule**                            **Developer requirement**
  ----------------------------------- -----------------------------------
  Single active panel                 Show the current user line and
                                      current dog response only. Do not
                                      build a vertically scrolling
                                      transcript.

  Silent dog selection                Selection produces the portrait and
                                      input state, but no automatic dog
                                      text.

  No robot identity                   The robot icon in the mock-up is a
                                      placeholder. Replace it with the
                                      approved Pedigree Chums launcher
                                      mark, paw or Pick a Chum symbol.

  Brand artwork retained              Use the supplied dog portraits at
                                      full quality. Retro styling is
                                      created by the frame, typography,
                                      timing and interaction.

  Lower-screen HUD                    On desktop, anchor the active
                                      interface near the bottom of the
                                      viewport. It must feel attached to
                                      the screen rather than floating
                                      like a support widget.

  Clear close control                 The visitor can close the system at
                                      any point. Do not trap the visitor
                                      in the joke.

  No sound in MVP                     Do not add bleeps, music or voice.
                                      Leave sound as a future optional
                                      layer.

  No dog animation dependency         The first implementation uses
                                      static portraits. Animation states
                                      can be added later without changing
                                      the layout.
  -----------------------------------------------------------------------

# 5. Complete visual state flow

![](media/image4.png){width="6.7in" height="2.9033333333333333in"}

*The visual layer moves between explicit states. It does not behave like
a generic chat window that simply grows longer.*

**1.** Closed: a single launcher sits at the lower-right of the
viewport.

**2.** Choose: the launcher expands and the four dog portraits fan out
around it. A random selection control remains available.

**3.** Waiting: the chosen dog becomes active. The background remains
washed, the dog portrait is visible and the input is empty. No greeting
appears.

**4.** Submitted: the visitor's current line is retained in the command
bar while the dog processes it.

**5.** Response: the dog's framed dialogue panel appears and types or
reveals the response. Links or choices appear only when the response is
complete.

**6.** Continue: the input becomes active again, a link is selected, a
transfer begins or a mini-game starts.

**7.** End: the visitor closes the interface, follows a destination, the
Boxer performs the cut-off ending or the hidden session ceiling is
reached.

# 6. Closed launcher and dog selector

## Closed launcher

  -----------------------------------------------------------------------
  **Property**                        **Specification**
  ----------------------------------- -----------------------------------
  Position                            Fixed to the lower-right. Desktop
                                      offset: 24 px from right and 24 px
                                      from bottom. Mobile offset: 16 px.

  Size                                72 px desktop. 60 px mobile.

  Shape                               Circular, with a clear double-ring
                                      or console-button treatment. Avoid
                                      a generic support-chat bubble.

  Icon                                Approved Pedigree Chums paw, Pick a
                                      Chum emblem or equivalent brand
                                      symbol. Do not use a robot.

  Layer                               Always above normal page content,
                                      but below cookie or statutory
                                      consent interfaces if those are
                                      present.

  Interaction                         Click or tap expands the selector.
                                      Pressing Escape or clicking again
                                      collapses it.

  Label                               Accessible name: "Pick a Chum". A
                                      visible tooltip may appear on hover
                                      and keyboard focus.
  -----------------------------------------------------------------------

## Expanded selector

The four portraits fan out from the launcher using the radial
arrangement shown in the client mock-up. Retain a fixed order so
returning visitors learn where each dog lives. The centre control
changes to the random option or contains a clearly adjacent dice control
labelled "Pick for me".

-   Dog selector diameter: 60 to 66 px desktop; 50 to 56 px mobile.

-   Radial distance from centre: approximately 105 px desktop;
    approximately 78 px mobile.

-   Use simple white connector lines, 3 to 4 px thick, as shown in the
    mock-up.

-   On hover or keyboard focus, show the breed or character display
    name. Do not display four permanent labels over the page.

-   Selection is confirmed with a short scale or snap movement of 150 to
    220 ms. Honour reduced-motion settings.

-   Clicking outside the selector collapses it without selecting a dog.

-   The random control selects each of the four dogs with equal
    weighting unless the mechanics later supply another weighting.

# 7. Selected-dog waiting state

+-----------------------------------------------------------------------+
| **THIS IS THE HOOK**                                                  |
|                                                                       |
| The waiting state must feel slightly unusual. The visitor has chosen  |
| an operator, but the operator says nothing. The dog is present and    |
| ready. The human must issue the first command.                        |
+=======================================================================+
+-----------------------------------------------------------------------+

  -----------------------------------------------------------------------
  **Element**                         **Waiting-state behaviour**
  ----------------------------------- -----------------------------------
  Background                          Apply the focus wash across the
                                      viewport and lock background
                                      scrolling.

  Portrait                            Show the selected dog immediately.
                                      Use the same portrait asset that
                                      will identify the speaker during
                                      dialogue.

  Input                               Show a single-line field with the
                                      placeholder "Type something here".
                                      Keep the green "GO" action from the
                                      mock-up.

  Dog text                            None. Do not display "Hello", "How
                                      can I help?", choices, chips or
                                      examples.

  Focus                               Place keyboard focus in the field
                                      after the selection transition,
                                      unless doing so would unexpectedly
                                      open the mobile keyboard before the
                                      user taps.

  Close                               Show a visible close control at the
                                      top-right of the HUD or overlay
                                      safe area.
  -----------------------------------------------------------------------

# 8. Dialogue HUD and response behaviour

![](media/image5.png){width="6.7in" height="4.02in"}

*Recommended desktop anatomy. Exact measurements can scale responsively,
but the hierarchy and relationship between elements should not change.*

## Desktop frame

-   Maximum stage width: 880 px. Width: min(880 px, viewport width minus
    48 px).

-   Anchor the stage 24 to 32 px above the bottom safe edge.

-   Active portrait: approximately 128 to 144 px, overlapping the left
    edge of the dialogue frame as in the client mock-up.

-   The portrait may remain circular, but it must sit in a deliberate
    double-ring retro medallion. It must not resemble a detached
    live-chat profile photograph.

-   Dialogue panel minimum height: 112 px. It may grow for choices or a
    mini-game, subject to the maximum-height rules below.

-   User command bar: one compact field above the dog response, aligned
    to the right of the portrait.

## No transcript

Do not preserve every previous exchange as visible bubbles. The system
should behave like a game dialogue scene. During an exchange, show the
current human submission in the command bar and the current dog response
in the framed panel. When the next input begins, the command bar clears
and becomes editable again. Conversation history remains in application
state only.

## Text paging

-   Target short responses that fit in two to four lines.

-   When a response exceeds the available panel, split it at sentence
    boundaries into dialogue pages rather than adding an internal
    scrollbar.

-   Recommended maximum per page: 180 to 230 characters, adjusted for
    viewport width.

-   Show a small blinking triangle, paw or "A" style prompt marker at
    the lower-right when another page is available.

-   Clicking the panel, pressing Space, Enter or the visible prompt
    advances the page.

## Text reveal

-   Use a light type-on effect of approximately 16 to 24 ms per
    character.

-   A click, tap, Space or Enter while text is revealing displays the
    complete current page immediately.

-   Do not make the visitor wait longer than approximately 1.8 seconds
    for a complete short reply.

-   Under reduced motion, display the complete text immediately.

# 9. Retro visual system

## Colour tokens

  -----------------------------------------------------------------------
  **Token**               **Default**             **Use**
  ----------------------- ----------------------- -----------------------
  \--pc-ui-blue           #00A9EF                 Primary launcher,
                                                  portrait ring and
                                                  interface highlight.

  \--pc-ui-navy           #112242                 Dialogue-frame body,
                                                  main outline and dark
                                                  text.

  \--pc-ui-yellow         #FFE868                 Nameplates, highlights
                                                  and selected command
                                                  text.

  \--pc-ui-green          #00D23C                 GO action and confirmed
                                                  positive action.

  \--pc-ui-cream          #FAF9F4                 Light panel background
                                                  where required.

  \--pc-focus-wash        rgba(0,169,239,0.70)    Full-viewport focus
                                                  wash. No backdrop blur.
  -----------------------------------------------------------------------

These are implementation defaults taken from the supplied mock-up. If
the website already exposes official brand CSS variables, map these
tokens to the existing brand values rather than duplicating the palette.

## Frame construction

-   Use a 3 to 4 px dark outer stroke.

-   Add a 2 px pale or blue inner highlight, inset approximately 6 to 8
    px.

-   Use a simple hard drop shadow, not a blurred glass-card shadow.

-   Corner radius should remain restrained: approximately 8 to 14 px. Do
    not use full pill shapes for the main dialogue panel.

-   The input can retain a softer rounded shape, but its border and
    button should match the game HUD.

## Typography

-   Use the existing Pedigree Chums display typeface for nameplates and
    short interface labels where available.

-   Use the current website body typeface for dialogue. Readability is
    more important than literal pixel-font imitation.

-   Desktop dialogue: 19 to 22 px with generous line-height. Mobile
    dialogue: 16 to 18 px.

-   Nameplate: 14 to 16 px, bold, uppercase or the supplied character
    display name.

-   Do not use rasterised or deliberately jagged text. The interface
    should evoke retro games while remaining crisp on modern screens.

## Background focus wash

-   Cover the complete viewport with the brand-blue wash shown in the
    mock-up.

-   Do not blur the underlying page. It should remain recognisable but
    clearly inactive.

-   The overlay is dismissible through the close control and, in
    selector mode only, by clicking outside the selector.

-   Once a dog conversation is active, clicking the wash should not
    accidentally close the interface. Use the explicit close control.

# 10. Links, choices and calls to action

After the dog finishes speaking, links and choices should appear as game
commands inside the dialogue panel, not as modern suggestion chips or
detached rounded buttons.

  -----------------------------------------------------------------------
  **Situation**                       **Presentation**
  ----------------------------------- -----------------------------------
  Single destination                  Show one line beginning with a
                                      pointer: "\> Get the 30% discount
                                      code".

  Two or three choices                Stack commands vertically. Move the
                                      pointer on hover, focus or
                                      arrow-key selection.

  External page                       Open according to the site's normal
                                      navigation policy. Do not visually
                                      imitate a new chat message.

  Popup action                        Use the supplied action from the
                                      mechanics, for example opening the
                                      discount-code popup.

  Continue conversation               Include "\> Ask something else"
                                      only when the mechanics explicitly
                                      leave another turn open.

  Disabled action                     Do not show unavailable actions.
                                      Never display greyed-out commands
                                      that lead nowhere.
  -----------------------------------------------------------------------

-   Tab, arrow keys and Enter must operate the command list.

-   A visible focus indicator is required and may use the yellow
    highlight.

-   On touch devices, the full command row is tappable.

# 11. Transfers between dogs

Transfers are part of the joke and must feel continuous. The
conversation does not close and reopen as a new widget.

**1.** The active dog completes its transfer line.

**2.** The continue prompt appears, or the transfer begins automatically
after a short readable pause.

**3.** The current portrait leaves using a short slide, wipe or
scale-down transition of approximately 180 to 260 ms.

**4.** The new dog portrait enters from the opposite direction or
replaces the portrait in the same frame.

**5.** The nameplate updates before the next reply begins.

**6.** The new dog answers the original subject directly. It does not
greet the visitor or ask how it can help.

-   Keep the overlay, dialogue frame and current session open
    throughout.

-   Returning to a dog already seen should use the same portrait slot
    but may use a different entrance direction or a brief "back again"
    response supplied by the mechanics.

-   Do not add call-centre hold screens, progress spinners or
    "connecting to an agent" language unless it is part of the authored
    joke.

## Boxer cut-off ending

The Boxer may joke about accidentally cutting off a previous visitor and
then actually terminate the interface. After the punchline, close the
dialogue HUD abruptly. Do not show a conventional "chat ended"
confirmation. The closed launcher may return after a short delay so the
visitor can start again.

# 12. Embedded mini-game state

Mini-games remain inside the dialogue HUD and do not open a separate
polished game modal. Starting a game temporarily changes the panel from
conversation mode to game mode. Game moves do not consume conversation
turns.

  -----------------------------------------------------------------------
  **MVP game**                        **Visual treatment**
  ----------------------------------- -----------------------------------
  Nine-Square Sheep Management        Display a simple three-by-three
                                      text or lightweight grid. The
                                      command bar accepts a square number
                                      or a direct tap.

  Missing Sheep                       Display the short word, used
                                      letters and remaining sheep in a
                                      monospaced area. Accept letters by
                                      keyboard and tap.

  Kennel Sketch Recognition           Display fixed ASCII artwork in a
                                      preserved monospaced block. Accept
                                      one short text answer and
                                      recognised synonyms.
  -----------------------------------------------------------------------

-   The dialogue frame may expand to a maximum of 70% of viewport height
    on desktop and 62% on mobile.

-   Use \`white-space: pre\` or equivalent for ASCII art so spacing and
    line breaks cannot collapse.

-   Use a system monospace font for game boards and drawings.

-   Provide an explicit "Leave game" command that returns to the
    conversation without closing the whole Pick a Chum interface.

-   At game end, restore the normal dialogue frame and allow the active
    dog to deliver one result line.

# 13. Responsive behaviour

## Desktop and tablet

-   Use the lower-screen HUD composition shown in the anatomy diagram.

-   Keep the selector and launcher in the lower-right.

-   Prevent the HUD from covering critical cookie controls or fixed
    legal controls. Those retain priority.

## Mobile

-   Use a near-full-width lower HUD with 12 to 16 px side margins.

-   Reduce the active portrait to approximately 78 to 92 px and let it
    overlap the upper-left edge of the panel.

-   Place the input above the response panel or at its bottom according
    to available keyboard space, but keep the same no-transcript model.

-   The four-dog selector forms a tighter upward semicircle above the
    launcher. It must not extend beyond the safe viewport edge.

-   When the software keyboard opens, keep the active input and GO
    button visible using \`visualViewport\` or an equivalent
    keyboard-aware layout strategy.

-   Do not rely on hover for names or controls. Tap and focus states
    must be complete.

-   Allow portrait and frame sizes to scale down, but do not reduce
    dialogue below 16 px.

## Short-height screens

-   If viewport height is below approximately 620 px, reduce portrait
    size first, then panel padding. Do not shrink text below accessible
    sizes.

-   Game mode may use internal scrolling for the game area only when it
    cannot fit. Normal dialogue must continue to paginate rather than
    scroll.

# 14. Accessibility and reduced motion

  -----------------------------------------------------------------------
  **Area**                            **Requirement**
  ----------------------------------- -----------------------------------
  Keyboard                            Everything can be opened, selected,
                                      submitted, advanced and closed
                                      without a mouse.

  Focus order                         Launcher, dog choices, random
                                      choice, close, input, GO, dialogue
                                      commands.

  Screen reader                       Announce the selected dog and new
                                      dog dialogue through an
                                      \`aria-live=\"polite\"\` region. Do
                                      not announce character-by-character
                                      typing.

  Labels                              Every portrait button includes the
                                      full breed or character name.

  Contrast                            Dialogue text and controls meet
                                      WCAG AA contrast against their
                                      backgrounds.

  Reduced motion                      Disable radial movement, type-on
                                      animation and portrait transitions.
                                      Use instant state changes or a
                                      short fade.

  Zoom                                The HUD remains usable at 200%
                                      browser zoom without clipping
                                      controls.

  Escape                              Escape closes the selector or
                                      active interface, except while a
                                      destructive confirmation is
                                      intentionally required.
  -----------------------------------------------------------------------

# 15. Assets and content dependencies

## Required final assets

  -----------------------------------------------------------------------
  **Asset**                           **Specification**
  ----------------------------------- -----------------------------------
  Launcher icon                       One transparent SVG or
                                      high-resolution PNG. Use a Pedigree
                                      Chums mark, not a robot.

  Dog selector portraits              Four consistent 1:1 transparent
                                      images, minimum 512 x 512 px.

  Active dog portraits                The selector assets may be reused
                                      if resolution supports 144 px
                                      display. Otherwise supply 1024 x
                                      1024 px versions.

  Random icon                         A simple dice or shuffle symbol
                                      consistent with the brand.

  Close icon                          A clear X with a minimum 44 x 44 px
                                      touch target.

  Continue marker                     Small paw, triangle or
                                      console-style prompt marker.

  Font references                     Use the website's existing font
                                      files and licensing. Do not
                                      introduce an unlicensed retro font.
  -----------------------------------------------------------------------

## Content remains external

Do not hardcode dog names, responses, links, labels, popup identifiers,
mini-game words or transfer messages into the presentation component.
The visual layer receives them from the mechanics and displays the
supplied state.

# 16. Integration contract

The front end should expose named visual states and respond to events
from the conversation system. Equivalent naming is acceptable, but the
separation must remain.

  -----------------------------------------------------------------------
  **State**                           **Visible result**
  ----------------------------------- -----------------------------------
  CLOSED                              Launcher only.

  SELECTING_DOG                       Radial dog selector and random
                                      option.

  WAITING_FOR_INPUT                   Selected portrait, empty input, no
                                      dog message.

  SUBMITTED                           Current human line retained, input
                                      locked.

  REVEALING_RESPONSE                  Dog reply is appearing.

  AWAITING_CONTINUE                   Response complete; prompt, link or
                                      choices active.

  TRANSFERRING                        Portrait and nameplate changing.

  GAME_ACTIVE                         Dialogue counter paused; mini-game
                                      interaction active.

  ENDING                              Final dog line or Boxer cut-off.
  -----------------------------------------------------------------------

## Recommended front-end events

  -----------------------------------------------------------------------
  **Event**                           **Event**
  ----------------------------------- -----------------------------------
  pickachum:open                      pickachum:selector-open

  pickachum:dog-selected              pickachum:random-selected

  pickachum:message-submit            pickachum:response-start

  pickachum:response-complete         pickachum:command-selected

  pickachum:transfer-start            pickachum:transfer-complete

  pickachum:game-start                pickachum:game-end

  pickachum:close                     
  -----------------------------------------------------------------------

## Implementation requirements

-   Build the interface as reusable components rather than a
    page-specific block.

-   Use CSS custom properties for colour, dimensions and timing.

-   Use a portal or top-level fixed container so parent transforms and
    overflow rules cannot clip the HUD.

-   Lock background scroll only while the focus wash is active.

-   Preserve session state when page content changes only if the
    mechanics explicitly support it. Do not invent cross-page
    persistence in the visual layer.

-   Analytics events are emitted by the mechanics. The visual layer must
    not double-fire them.

# 17. Acceptance criteria

-   Closed state shows one branded launcher in the lower-right and no
    generic robot icon.

-   Clicking the launcher produces the four-dog radial selector and
    random option.

-   Selecting a dog opens a silent waiting state with no greeting,
    prompt chips or suggested questions.

-   The selected dog portrait is visibly part of the interface before
    the visitor submits the first message.

-   The interface shows one current user line and one current dog
    response, not a scrolling chat transcript.

-   The dialogue HUD is visually recognisable as a retro RPG
    conversation system while retaining the original high-quality dog
    artwork.

-   Long replies paginate at sentence boundaries and never create a tall
    stack of speech bubbles.

-   Type-on text can be skipped and is disabled when reduced motion is
    enabled.

-   Links and choices appear as game commands inside the panel and work
    with keyboard, mouse and touch.

-   Transfers replace the active portrait and continue the same
    conversation without a fresh greeting.

-   The three MVP mini-games run inside the panel and their moves do not
    affect the conversation turn count.

-   The Boxer ending can close the HUD abruptly without a conventional
    support-chat end screen.

-   The interface remains usable on desktop, tablet, mobile,
    short-height screens and at 200% zoom.

-   Closing the interface always restores page scrolling and returns
    focus to the launcher.

-   All dialogue, links, labels and actions are supplied by the
    mechanics rather than hardcoded into the UI.

# 18. Delivery checklist

+-----------------------------------------------------------------------+
| **FINAL DESIGN RULE**                                                 |
|                                                                       |
| The visitor should think "this looks like chat" when they see the     |
| launcher, "that dog is waiting for me" when they select a character,  |
| and "this is actually a game" as soon as the first response appears.  |
+=======================================================================+
+-----------------------------------------------------------------------+

  -----------------------------------------------------------------------
  **Delivery item**                   **Completion requirement**
  ----------------------------------- -----------------------------------
  Component build                     Launcher, selector, focus wash,
                                      input bar, portrait frame, dialogue
                                      panel, nameplate, command list and
                                      mini-game panel.

  Responsive CSS                      Desktop, tablet, mobile,
                                      short-height and software-keyboard
                                      states.

  Interaction support                 Mouse, touch, keyboard, Escape,
                                      click-to-reveal and
                                      click-to-continue.

  State hooks                         All visual states and transfer/game
                                      transitions connected to the
                                      existing mechanics.

  Accessibility                       ARIA labels, live-region handling,
                                      focus restoration, contrast and
                                      reduced motion.

  Asset replacement                   Robot placeholder removed and final
                                      dog/brand assets connected through
                                      configuration.

  Browser test                        Current Chrome, Safari, Edge and
                                      Firefox; iOS Safari and Android
                                      Chrome.

  QA evidence                         Screenshots or screen recordings of
                                      every state listed in Section 16 at
                                      desktop and mobile widths.
  -----------------------------------------------------------------------
