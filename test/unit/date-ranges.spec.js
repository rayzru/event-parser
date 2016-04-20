describe("Date ranges", function() {
	var el, now;

	it("from to", function() {
		el = "Visit parents from 2 nov to 3 dec".parseEvent();

		expect(el.startDate.toDateString())
			.toEqual(moment().month(10).date(2).toDate().toDateString());

		expect(el.endDate.toDateString())
			.toEqual(moment().month(11).date(3).toDate().toDateString());

		expect(el.allDay).toEqual(true);

	});

	it("incomplete from to", function() {
		el = "Visit parents from 2 to 3 dec".parseEvent();

		expect(el.startDate.toDateString())
			.toEqual(moment().month(10).date(2).toDate().toDateString());

		expect(el.endDate.toDateString())
			.toEqual(moment().month(11).date(3).toDate().toDateString());

		expect(el.allDay).toEqual(true);

	});


});