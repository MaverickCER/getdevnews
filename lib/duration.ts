export function getDurationFromPT(ISO_8601: string): number {
  if (typeof ISO_8601 !== 'string' || !ISO_8601.startsWith('PT')) return 0;
  return ISO_8601
    .slice(2) // remove PT
    .replace(/[YMWDHMS]/gi, ':') // 5M3S to 5:3
    .split(':') // 5:3 to ['5', '3']
    .reverse() // ['5', '3'] to ['3', '5']
    .reduce((total, part, i) => {
      const value = parseInt(part || '0', 10);
      switch (i) {
        case 0: return total + value * 1000; // seconds
        case 1: return total + value * 1000 * 60; // minutes
        case 2: return total + value * 1000 * 60 * 60; // hours
        case 3: return total + value * 1000 * 60 * 60 * 24; // days
        case 4: return total + value * 1000 * 60 * 60 * 24 * 7; // weeks
        case 5: return total + value * 1000 * 60 * 60 * 24 * 28; // months
        case 6: return total + value * 1000 * 60 * 60 * 24 * 365; // years
        default: return total;
      }
    }, 0);
}

export function getDurationFromMs(ms: number): string {
  if (typeof ms !== 'number') {
    return '';
  }

  const lead = (digit: number): string => {
    if (digit > 9) return `${digit}`;
    if (digit > 0) return `0${digit}`;
    return '';
  };

  const seconds = lead(Math.floor(ms / 1000) % 60);
  const minutes = lead(Math.floor(ms / 1000 / 60) % 60);
  const hours = lead(Math.floor(ms / 1000 / 60 / 60) % 24);
  const days = lead(Math.floor(ms / 1000 / 60 / 60 / 24) % 30);
  const weeks = lead(Math.floor(ms / 1000 / 60 / 60 / 24 / 7) % 4);
  const months = lead(Math.floor(ms / 1000 / 60 / 60 / 24 / 30) % 12);
  const years = lead(Math.floor(ms / 1000 / 60 / 60 / 24 / 365));

  let output = [minutes, seconds];
  if (years) {
    output.unshift(years, months || '00', weeks || '00', days || '00', hours || '00');
  } else if (months) {
    output.unshift(months, weeks || '00', days || '00', hours || '00');
  } else if (weeks) {
    output.unshift(weeks, days || '00', hours || '00');
  } else if (days) {
    output.unshift(days, hours || '00');
  } else if (hours) {
    output.unshift(hours);
  }
  return output.join(':');
}