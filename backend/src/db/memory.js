export const profilesByUser = new Map();
export const teams = new Map();
export const teamNames = new Map();

let seq = 1;
export function nextId() {
  return String(seq++);
}