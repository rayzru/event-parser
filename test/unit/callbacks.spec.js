describe("Callbacks", function () {
	var called;

	it("Callback onDateParsed", function () {

		called = false;
		el = "New event at 12th of august".parseEvent({
			onDateParsed: function () {
				called = true;
			}
		});

		expect(called).toEqual(true);
	});

	it("Callback onDateParsed", function () {

		called = false;
		el = "New event without date".parseEvent({
			onDateParsed: function () {
				called = true;
			}
		});

		expect(called).toEqual(false);
	});


	it("Callback onTimeParsed valid time", function () {

		called = false;
		el = "New event at 12:00".parseEvent({
			onTimeParsed: function () {
				called = true;
			}
		});

		expect(called).toEqual(true);
	});

	it("Callback onTimeParsed invalid time", function () {

		called = false;
		el = "New event at 42:00 -- wrong time, no callbacks".parseEvent({
			onTimeParsed: function () {
				called = true;
			}
		});

		expect(called).toEqual(false);
	});


});