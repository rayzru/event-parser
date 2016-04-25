describe("Weekdays", function() {
	var el, now, day;

	it("Weekdays: weekday", function() {
		el = "Meeting Sam at monday".parseEvent();
		day = 1;
		expect(el.startDate.toDateString())
			.toEqual(moment().day((moment().day() > day) ? day + 7 : day).toDate().toDateString());

		el = "Meeting Sam at friday".parseEvent();
		day = 5;

		expect(el.startDate.toDateString())
			.toEqual(moment().day((moment().day() > day) ? day + 7 : day).toDate().toDateString());
	});

	it("Weekdays: this weekday", function() {
		el = "Meeting Sam at this monday".parseEvent();
		day = 1;
		expect(el.startDate.toDateString())
			.toEqual(moment().day((moment().day() > day) ? day + 7 : day).toDate().toDateString());

		el = "Meeting Sam at this saturday".parseEvent();
		day = 6;
		expect(el.startDate.toDateString())
			.toEqual(moment().day((moment().day() > day) ? day + 7 : day).toDate().toDateString());
	});

	it("Weekdays: next weekday", function() {
		el = "Meeting Sam at next monday".parseEvent();
		day = 1;
		expect(el.startDate.toDateString())
			.toEqual(moment().day((moment().day() >= day) ? day + 7 : day).toDate().toDateString());

		el = "Meeting Sam at next saturday".parseEvent();
		day = 6;
		expect(el.startDate.toDateString())
			.toEqual(moment().day((moment().day() >= day) ? day + 7 : day).toDate().toDateString());
	});

	it("Weekdays: next week", function() {
		el = "Meeting Sam at next week".parseEvent();
		day = 1;
		expect(el.startDate.toDateString())
			.toEqual(moment().day((moment().day() >= day) ? day + 7 : day).toDate().toDateString());

		el = "Meeting Sam at next saturday".parseEvent();
		day = 6;
		expect(el.startDate.toDateString())
			.toEqual(moment().day((moment().day() >= day) ? day + 7 : day).toDate().toDateString());
	});
});