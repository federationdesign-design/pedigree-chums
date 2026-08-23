// The composer emoji picker set: the owner's list, minus the newspaper (it had no mapped response). Every
// emoji here maps to a real reply in the router's matchEmoji (food -> the Labrador's override, cookie -> his
// game, balls -> the ball answer, gaming -> the games menu, bath/cat -> the two new lines, the positive
// reactions and 😮 (a neutral acknowledgement) -> the ":)" row, and the two sad reactions -> the sadness
// route (😭 the full personal-sadness L1/L2, ☹️ a non-escalating L1 empathy line), so the picker never offers
// an emoji that only gets "I cannot read it". Keep the two in step. `label` is the accessible name spoken in place of the raw glyph (which screen readers read poorly),
// so the picker works in hide-images and the contrast schemes.
export interface PickerEmoji {
  emoji: string;
  label: string;
}

export const PICKER_EMOJI: PickerEmoji[] = [
  { emoji: '🤣', label: 'rolling on the floor laughing' },
  { emoji: '🤭', label: 'giggling' },
  { emoji: '😂', label: 'laughing until crying' },
  { emoji: '❤️', label: 'red heart' },
  { emoji: '😍', label: 'smiling with heart eyes' },
  { emoji: '👍', label: 'thumbs up' },
  { emoji: '😊', label: 'smiling' },
  { emoji: '🍔', label: 'burger' },
  { emoji: '🍕', label: 'pizza' },
  { emoji: '🌭', label: 'hot dog' },
  { emoji: '🍪', label: 'cookie' },
  { emoji: '🥕', label: 'carrot' },
  { emoji: '🎾', label: 'tennis ball' },
  { emoji: '🎮', label: 'video game controller' },
  { emoji: '🕹️', label: 'joystick' },
  { emoji: '🛁', label: 'bath' },
  { emoji: '🚿', label: 'shower' },
  { emoji: '🐱', label: 'cat' },
  { emoji: '😭', label: 'loudly crying' },
  { emoji: '😮', label: 'surprised' },
  { emoji: '☹️', label: 'frowning' },
];
