// Pick a Chum sessionStorage keys, in a tiny standalone module so the lightweight launcher and the
// appearance helper can read them WITHOUT importing the heavy, code-split PickAChumExperience.

// The live chat payload (messages + session). Non-null = a conversation is open (Task 105).
export const CHAT_KEY = 'pc-chat';
// Task 148: a content-free flag set once a session has entered a protected safety state. The chat
// itself is scrubbed from sessionStorage (a disclosure must never persist), but this bare boolean
// survives so the Terrier's unbidden appearances stay suppressed for the rest of the session.
export const PROTECTED_FLAG = 'pc-protected';
