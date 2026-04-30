export interface VoiceLine {
  id: string;
  text: string;
  shortcut?: string;
}

export const VOICE_LINES: VoiceLine[] = [
  { id: "reinforce", text: "REINFORCING!", shortcut: "1" },
  { id: "get_some", text: "GET SOME!", shortcut: "2" },
  { id: "for_democracy", text: "FOR DEMOCRACY!", shortcut: "3" },
  { id: "affirmative", text: "AFFIRMATIVE", shortcut: "4" },
  { id: "negative", text: "NEGATIVE", shortcut: "5" },
  { id: "enemies", text: "ENEMIES SPOTTED", shortcut: "6" },
  { id: "stratagem", text: "STRATAGEM CALLED IN", shortcut: "7" },
  { id: "extract", text: "EXTRACT IMMINENT", shortcut: "8" },
  { id: "for_super_earth", text: "FOR SUPER EARTH!", shortcut: "9" },
  { id: "liberty", text: "LIBERTY PREVAILS!", shortcut: "0" },
];

export function getVoiceLine(id: string): VoiceLine | undefined {
  return VOICE_LINES.find((v) => v.id === id);
}
