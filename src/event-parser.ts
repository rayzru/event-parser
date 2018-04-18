export enum WeekStart {
  sunday = 0,
  monday = 1
}

export interface IConfig {
  source: string,
  weekStart?: WeekStart,
  onDateParsed?: () => void,
  onTimeParsed?: () => void,
  onParsed?: () => void,
}

const defaults: IConfig = {
  source: '',
  weekStart: 0,
}

export default class EventParser {
  private settings: IConfig = defaults;
  constructor(config?: IConfig) {
    Object.assign(this.settings, config);
  }

  

}
