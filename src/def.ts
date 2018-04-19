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

export const Normalizers: NormalizerType[] = [
  [/(\btom(?:\.|orrow)?\b)/gi, 'tomorrow'],

  // aliases
  [/\bnoon\b/i, '12:00'],
  [/\bmidnight\b/i, '00:00'], // depends on needs?

  // weekdays
  [/(\bmon(?:day)?\b)/i, 'monday'],
  [/(\btue(?:s(?:day)?)?\b)/i, 'tuesday'],
  [/(\bwed(?:nes(?:day)?)?\b)/i, 'wednesday'],
  [/(\bthu(?:rs(?:day)?)?\b)/i, 'thursday'],
  [/(\bfri(?:day)?\b)/i, 'friday'],
  [/(\bsat(?:ur(?:day)?)?\b)/i, 'saturday'],
  [/(\bsun(?:day)?\b)/i, 'sunday'],

  // months
  [/(\bjan(?:uary)?\b)/i, 'january'],
  [/(\bfeb(?:ruary)?\b)/i, 'february'],
  [/(\bmar(?:ch)?\b)/i, 'march'],
  [/(\bapr(?:il)?\b)/i, 'april'],
  [/(\bmay\b)/i, 'may'],
  [/(\bjun(?:e)?\b)/i, 'june'],
  [/(\bjul(?:y)?\b)/i, 'july'],
  [/(\baug(?:ust)?\b)/i, 'august'],
  [/(\bsep(?:t(?:ember)?)?\b)/i, 'september'],
  [/(\boct(?:ober)?\b)/i, 'october'],
  [/(\bnov(?:ember)?\b)/i, 'november'],
  [/(\bdec(?:ember)?\b)/i, 'december'],

  [/(\bthanksgiving\b)/gi, 'every 4th thuesday of november'], // USA, but not Canada
  [/\b(christmas|xmas|x-mas)\b/gi, '12/25'], // USA?
  [/(\bnew\s?year(:?'s)?(\seve)\b)/gi, '12/31 at 23:00'],
  [/(\bnew\s?year(:?'s)\b)/gi, '1/1'],
  [/(\bapril\sfools\b)/gi, '4/1'],
  [/(\bhalloween\b)/gi, '10/30']
]
