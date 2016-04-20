describe("mockup", function() {

	var event = 'something'.parseEvent();

	it("Defined", function() {
		expect(event.startDate).toBeUndefined();
		expect(event.endDate).toBeUndefined();
		expect(event.allDay).toBeDefined();
	});
});