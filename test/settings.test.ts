import EventParser from '../src/event-parser';

/**
 * Dummy test
 */
describe("Settings", () => {
  it("EventParser accepting configuration", () => {
    const config = {
      source: 'bla bla bla'
    }
    expect(new EventParser(config)).toBeInstanceOf(EventParser)
  })
})
