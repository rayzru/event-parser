import { NormalizerType } from './normalizer'

export interface IConfig {
  source: string
  weekStart?: Weekstart
  onDateParsed?: () => void
  onTimeParsed?: () => void
  onParsed?: () => void
}

export enum Weekstart {
  sunday = 0,
  monday = 1
}
export enum Weekday {
  sunday = 0,
  monday = 1,
  tuesday,
  wednesday,
  thursday,
  friday,
  saturday
}
export enum Month {
  january = 1,
  february,
  march,
  april,
  may,
  june,
  july,
  august,
  september,
  october,
  november,
  december
}

export enum Units {
  second,
  minute,
  hour,
  day,
  week,
  month,
  year
}

export const Normalizers: NormalizerType[] = [
  [/[^0-9a-z]\s?@\s?/, ' at '],

  [/w(\.|\/)/, 'with'],

  [/\btom(orrow)?\b/, 'tomorrow'],

  // aliases
  [/\bnoon\b/, '12:00'],
  [/\bmidnight\b/, '00:00'], // depends on needs?

  // weekdays
  [/\bmon(day)?\b/, 'monday'],
  [/\btue(s(day)?)?\b/, 'tuesday'],
  [/\bwed(nes(day)?)?\b/, 'wednesday'],
  [/\bthu(rs(day)?)?\b/, 'thursday'],
  [/\bfri(day)?\b/, 'friday'],
  [/\bsat(ur(day)?)?\b/, 'saturday'],
  [/\bsun(day)?\b/, 'sunday'],

  // months
  [/\bjan(uary)?\b/, 'january'],
  [/\bfeb(ruary)?\b/, 'february'],
  [/\bmar(ch)?\b/, 'march'],
  [/\bapr(il)?\b/, 'april'],
  [/\bmay\b/, 'may'],
  [/\bjun(e)?\b/, 'june'],
  [/\bjul(y)?\b/, 'july'],
  [/\baug(ust)?\b/, 'august'],
  [/\bsep(t(ember)?)?\b/, 'september'],
  [/\boct(ober)?\b/, 'october'],
  [/\bnov(ember)?\b/, 'november'],
  [/\bdec(ember)?\b/, 'december'],

  // units
  [/sec(ond)?s?/, 'second'],
  [/min(ute)?s?/, 'minute'],
  [/h(our|r)s?/, 'minute'],
  [/y(ear|r)s?/, 'minute'],

  [/\bthanksgiving\b/, 'every 4th thuesday of november'], // USA, but not Canada
  [/\bchristmas|xmas|x-mas\b/, '12/25'], // USA?
  [/\bnew\s?year('s)?(\seve)\b/, '12/31 at 23:00'],
  [/\bnew\s?year('s)?\b/, '1/1'],
  [/\bapril\sfools\b/, '4/1'],
  [/\bhalloween\b/, '10/30']
]
