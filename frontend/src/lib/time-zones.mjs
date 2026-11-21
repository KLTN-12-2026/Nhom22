import { ZONE_COUNTRY } from './time-zone-countries.mjs';

export const DEFAULT_ZONE = 'Asia/Ho_Chi_Minh';

export const POPULAR_ZONES = [
  'Asia/Ho_Chi_Minh', 'Asia/Bangkok', 'Asia/Singapore', 'Asia/Tokyo', 'Asia/Seoul', 'Asia/Shanghai',
  'Asia/Kolkata', 'Asia/Dubai', 'Australia/Sydney', 'Europe/London', 'Europe/Paris', 'Europe/Berlin',
  'America/New_York', 'America/Chicago', 'America/Los_Angeles', 'America/Toronto'
];

const CITY_VI = {
  Ho_Chi_Minh: 'TP. Hồ Chí Minh',
  Bangkok: 'Bangkok',
  Tokyo: 'Tokyo',
  Seoul: 'Seoul',
  Shanghai: 'Thượng Hải',
  Singapore: 'Singapore',
  Kolkata: 'Kolkata',
  Phnom_Penh: 'Phnôm Pênh',
  Vientiane: 'Viêng Chăn',
  Moscow: 'Mát-xcơ-va',
  Paris: 'Paris',
  London: 'Luân Đôn',
  Berlin: 'Berlin',
  New_York: 'New York',
  Los_Angeles: 'Los Angeles'
};

const GMT_RANGE = Array.from({ length: 27 }, (_, i) => i - 12);

export const isFixedGmt = zone => zone === 'UTC' || zone === 'Etc/UTC' || /^Etc\/GMT([+-]\d{1,2})?$/.test(zone || '');

export const gmtZoneId = hours => (hours === 0 ? 'Etc/GMT' : `Etc/GMT${hours > 0 ? '-' : '+'}${Math.abs(hours)}`);

export const gmtHoursOf = zone => {
  if (zone === 'UTC' || zone === 'Etc/UTC' || zone === 'Etc/GMT') return 0;
  const m = /^Etc\/GMT([+-])(\d{1,2})$/.exec(zone || '');
  return m ? (m[1] === '-' ? 1 : -1) * Number(m[2]) : null;
};

export const GMT_OPTIONS = GMT_RANGE.map(h => ({ id: gmtZoneId(h), hours: h, label: `GMT${h === 0 ? '±0' : h > 0 ? `+${h}` : `−${-h}`}` }));

export function deviceZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_ZONE;
  } catch {
    return DEFAULT_ZONE;
  }
}

export function offsetMinutes(zone, at = new Date()) {
  try {
    const part = new Intl.DateTimeFormat('en-US', { timeZone: zone, timeZoneName: 'longOffset' })
      .formatToParts(at).find(p => p.type === 'timeZoneName')?.value || 'GMT';
    const m = /GMT([+-])(\d{1,2})(?::(\d{2}))?/.exec(part);
    if (!m) return 0;
    return (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3] || 0));
  } catch {
    return 0;
  }
}

export function formatOffset(minutes) {
  if (!minutes) return 'GMT±0';
  const sign = minutes > 0 ? '+' : '−';
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `GMT${sign}${h}${m ? `:${String(m).padStart(2, '0')}` : ''}`;
}

let regionNames;
export function countryName(code) {
  if (!code) return '';
  try {
    regionNames ??= new Intl.DisplayNames(['vi'], { type: 'region' });
    return regionNames.of(code) || code;
  } catch {
    return code;
  }
}

export function cityName(zone) {
  const last = String(zone || '').split('/').pop();
  return CITY_VI[last] || last.replace(/_/g, ' ');
}

export function isValidZone(zone) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}

export function localTime(zone, at = new Date()) {
  try {
    return new Intl.DateTimeFormat('vi-VN', { timeZone: zone, hour: '2-digit', minute: '2-digit', weekday: 'short', day: '2-digit', month: '2-digit' }).format(at);
  } catch {
    return '';
  }
}

export function localClock(zone, at = new Date()) {
  try {
    return new Intl.DateTimeFormat('vi-VN', { timeZone: zone, hour: '2-digit', minute: '2-digit' }).format(at);
  } catch {
    return '';
  }
}

export function describeZone(zone, at = new Date()) {
  if (!zone) return '';
  const hours = gmtHoursOf(zone);
  if (hours !== null) return `${formatOffset(hours * 60)} (cố định)`;
  const country = countryName(ZONE_COUNTRY[zone]);
  return `${cityName(zone)}${country ? `, ${country}` : ''} (${formatOffset(offsetMinutes(zone, at))})`;
}

const fold = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase();

let catalog;
export function zoneCatalog(at = new Date()) {
  if (catalog) return catalog;
  catalog = Object.keys(ZONE_COUNTRY).filter(isValidZone).map(zone => {
    const code = ZONE_COUNTRY[zone];
    const country = countryName(code);
    const offset = offsetMinutes(zone, at);
    const city = cityName(zone);
    return {
      zone, code, country, city, offset,
      offsetLabel: formatOffset(offset),
      names: [fold(country), fold(city), fold(zone.split('/').pop().replace(/_/g, ' '))],
      haystack: fold(`${city} ${zone.replace(/[/_]/g, ' ')} ${country} ${code} ${formatOffset(offset)} ${formatOffset(offset).replace('−', '-')}`)
    };
  }).sort((a, b) => a.offset - b.offset || a.country.localeCompare(b.country, 'vi') || a.city.localeCompare(b.city, 'vi'));
  return catalog;
}

export function searchZones(query, limit = 40) {
  const list = zoneCatalog();
  const q = fold(query).trim();
  if (!q) {
    return POPULAR_ZONES.map(z => list.find(x => x.zone === z)).filter(Boolean);
  }
  const words = q.split(/\s+/);
  const score = x => {
    if (x.names.some(n => n === q)) return 3;
    if (x.names.some(n => n.startsWith(q))) return 2;
    if (x.names.some(n => n.includes(q)) || x.haystack.includes(q)) return 1;
    return 0;
  };
  return list
    .filter(x => words.every(w => x.haystack.includes(w)))
    .map(x => [score(x), x])
    .sort((a, b) => b[0] - a[0])
    .map(([, x]) => x)
    .slice(0, limit);
}
