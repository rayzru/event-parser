describe("mockup", function() {

	var event = 'something'.parseEvent();

	it("Defined", function() {
		expect(event.startDate).toBeDefined();
		expect(event.endDate).toBeDefined();
		expect(event.allDay).toBeDefined();
	});
});