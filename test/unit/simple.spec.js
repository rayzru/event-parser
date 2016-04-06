describe("Mocking relative", function() {

	beforeEach(function() {
		jasmine.clock().install();
	});

	afterEach(function() {
		jasmine.clock().uninstall();
	});

	it("today", function() {

		var today = new Date();
		jasmine.clock().mockDate(today);
		var ep = EventParser();

		expect(ep.parse("Meeting today")).toEqual(jasmine.objectContaining({
			startDate: today.valueOf()
		}));

	});
});