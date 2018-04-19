import { IConfig, Normalizers } from './def'
import Normalizer from './normalizer'

const defaults: IConfig = {
  source: '',
  weekStart: 0
}

export default class EventParser {
  private settings: IConfig = defaults

  constructor(config?: IConfig) {
    Object.assign(this.settings, config)
  }

  private init() {
    const normalized = new Normalizer()
      .add(Normalizers)
      .normalize(this.settings.source)
  }
}
