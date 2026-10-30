// A name not yet taken, for a saved meme: the name itself, else "Name (2)", "Name (3)"...
export function freeName(name: string, taken: string[]): string {
  if (!taken.includes(name)) return name;
  let n = 2;
  while (taken.includes(`${name} (${n})`)) n++;
  return `${name} (${n})`;
}
