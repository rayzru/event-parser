describe("Mocking relative", function() {

	var ep = EventParser();

	beforeEach(function() {
		jasmine.clock().install();
	});

	afterEach(function() {
		jasmine.clock().uninstall();
	});

	it("today", function() {

		var today = new Date();
		jasmine.clock().mockDate(today);

		expect(ep.parse("Meeting today")).toEqual(jasmine.objectContaining({
			startDate: today.valueOf()
		}));

	});
});