export interface NormalizerElement {
  regexp: RegExp | string
  value: string
}

export type NormalizerType = [RegExp | string, string]

// Define

export default class Normalizer {
  private filter: NormalizerElement[] = []

  public normalize(source: string): string {
    return this.filter.reduce(
      (result: string, n: NormalizerElement) =>
        result.replace( (n.regexp instanceof RegExp) ? new RegExp(n.regexp, 'gi') : n.regexp, n.value),
      source
    )
  }

  public add(elementOrArray: NormalizerType | NormalizerType[]): Normalizer {
    let regexp: RegExp | string
    let value: string

    if (Array.isArray(elementOrArray)) {
      ;(elementOrArray as NormalizerType[]).forEach((el: NormalizerType) => {
        ;[regexp, value] = el
        this.filter.push({ regexp, value })
      })
    } else {
      ;[regexp, value] = elementOrArray as NormalizerType
      this.filter.push({ regexp, value })
    }

    return this
  }
}
