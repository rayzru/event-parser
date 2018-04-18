import EventParser from '../src/event-parser';

/**
 * Dummy test
 */
describe("Init test", () => {
  it("Just to be sure that true is true, you know...", () => {
    expect(true).toBeTruthy()
  })

  it("EventParser is instantiable", () => {
    expect(new EventParser()).toBeInstanceOf(EventParser)
  })
})
