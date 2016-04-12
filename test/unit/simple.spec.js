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

		expect("Meeting today".parseEvent()).toEqual(jasmine.objectContaining({
			startDate: today.valueOf()
		}));

	});
});