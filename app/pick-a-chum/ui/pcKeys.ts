// Pick a Chum sessionStorage keys, in a tiny standalone module so the lightweight launcher and the
// appearance helper can read them WITHOUT importing the heavy, code-split PickAChumExperience.

// The live chat payload (messages + session). Non-null = a conversation is open (Task 105).
export const CHAT_KEY = 'pc-chat';
// Task 148: a content-free flag set once a session has entered a protected safety state. The chat
// itself is scrubbed from sessionStorage (a disclosure must never persist), but this bare boolean
// survives so the Terrier's unbidden appearances stay suppressed for the rest of the session.
export const PROTECTED_FLAG = 'pc-protected';
// Task 176: a content-free flag set once the VISITOR has actually SENT a message. CHAT_KEY alone means
// "a dog session exists" -- which an unbidden appearance sets before the visitor ever replies -- so Case A
// (the Labrador's /hot-dogs thread pickup) gates on THIS instead, to avoid greeting a first-time visitor
// as if a conversation had happened. CHAT_KEY keeps its own job (appearance suppression) unchanged.
export const HAS_SPOKEN = 'pc-spoke';
