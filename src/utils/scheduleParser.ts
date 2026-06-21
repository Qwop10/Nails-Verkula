/**
 * utils/scheduleParser.ts
 * Разбор текстового расписания на месяц в структуру по дням.
 * Пример строки: «1(ср) 10:00;12:00;14:00;16:00»
 *  - число в начале — день месяца
 *  - скобки/эмодзи/заголовки игнорируются
 *  - времена в формате ЧЧ:ММ, разделители ; , или пробел
 */

export interface DayEntry {
  day: number;
  slots: string[];
}

export interface ParseResult {
  entries: DayEntry[];
  skipped: { line: string; reason: string }[];
}

function normTime(h: string, m: string): string | null {
  const hh = Number(h);
  const mm = Number(m);
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export function parseSchedule(text: string): ParseResult {
  const byDay = new Map<number, Set<string>>();
  const skipped: { line: string; reason: string }[] = [];

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;

    // День месяца — число в начале строки.
    const dayMatch = line.match(/^(\d{1,2})/);
    if (!dayMatch) continue; // заголовки/эмодзи — молча пропускаем

    const day = Number(dayMatch[1]);
    if (day < 1 || day > 31) {
      skipped.push({ line, reason: 'число вне диапазона 1–31' });
      continue;
    }

    // Времена ЧЧ:ММ.
    const times: string[] = [];
    for (const m of line.matchAll(/(\d{1,2}):(\d{2})/g)) {
      const t = normTime(m[1], m[2]);
      if (t) times.push(t);
    }
    if (times.length === 0) {
      skipped.push({ line, reason: 'не найдено время (формат ЧЧ:ММ)' });
      continue;
    }

    if (!byDay.has(day)) byDay.set(day, new Set());
    const set = byDay.get(day)!;
    times.forEach((t) => set.add(t));
  }

  const entries: DayEntry[] = [...byDay.entries()]
    .map(([day, set]) => ({ day, slots: [...set].sort() }))
    .sort((a, b) => a.day - b.day);

  return { entries, skipped };
}
