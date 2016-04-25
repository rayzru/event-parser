describe("Time parsing: 11:00AM", function() {

	it("11:00", function() {
		el = "11:00".parseEvent();

		expect(el.startDate.toTimeString())
			.toEqual(moment().hours(11).minutes(0).seconds(0).toDate().toTimeString());
	});

	it("1:00", function() {
		el = "1:00".parseEvent();

		expect(el.startDate.toTimeString())
			.toEqual(moment().hours(1).minutes(0).seconds(0).toDate().toTimeString());
	});

	it("11:00am", function() {
		el = "11:00am".parseEvent();

		expect(el.startDate.toTimeString())
			.toEqual(moment().hours(11).minutes(0).seconds(0).toDate().toTimeString());
	});

	it("11:00 AM", function() {
		el = "11:00 AM".parseEvent();

		expect(el.startDate.toTimeString())
			.toEqual(moment().hours(11).minutes(0).seconds(0).toDate().toTimeString());
	});

	it("11:00 pm", function() {
		el = "11:00 pm".parseEvent();

		expect(el.startDate.toTimeString())
			.toEqual(moment().hours(23).minutes(0).seconds(0).toDate().toTimeString());
	});

	it("22:00 pm", function() {
		el = "22:00 pm".parseEvent();

		expect(el.startDate).toBeUndefined();
	});

	it("25:00", function() {
		el = "25:00".parseEvent();

		expect(el.startDate).toBeUndefined();
	});

});