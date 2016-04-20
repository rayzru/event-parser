describe("Date ranges", function() {
	var el, now;

	now = moment().hour(0).minute(0).toDate();

	it("from to", function() {
		el = "Visit parents from 2 nov to 3 dec".parseEvent();

		expect(el.startDate.toDateString())
			.toEqual(moment().month(10).date(2).toDate().toDateString());

		expect(el.endDate.toDateString())
			.toEqual(moment().month(11).date(3).toDate().toDateString());

		expect(el.allDay).toEqual(true);

	});

	it("incomplete range from", function() {

		el = "Visit parents from 2 to 3 dec".parseEvent();

		expect(el.startDate.toDateString())
			.toEqual(moment(now).month(11).date(2).toDate().toDateString());

		expect(el.endDate.toDateString())
			.toEqual(moment(now).month(11).date(3).toDate().toDateString());

		expect(el.allDay).toEqual(true);

	});

	it("incomplete range to", function() {

		el = "Visit parents from 2 dec to 3".parseEvent();

		expect(el.startDate.toDateString())
			.toEqual(moment(now).month(11).date(2).toDate().toDateString());

		expect(el.endDate.toDateString())
			.toEqual(moment(now).month(11).date(3).toDate().toDateString());

		expect(el.allDay).toEqual(true);

	});


	it("Date range extending with time", function() {

		el = "New Event 20 april 17:00 - 20:00".parseEvent();

		expect(el.startDate.toDateString())
			.toEqual(moment(now).month(3).date(20).toDate().toDateString());

		expect(el.startDate.toTimeString())
			.toEqual(moment(now).month(3).date(20).hour(17).minute(0).second(0).toDate().toTimeString());

		expect(el.endDate.toDateString())
			.toEqual(moment(now).month(3).date(20).toDate().toDateString());

		expect(el.endDate.toTimeString())
			.toEqual(moment(now).month(3).date(20).hour(20).minute(0).second(0).toDate().toTimeString());


		expect(el.allDay).toEqual(false);

	});

	it("Date range exteding with time. Suggest nex day because of second time less that first one", function() {

		el = "New Event 20 april 20:00 - 17:00".parseEvent();

		expect(el.startDate.toDateString())
			.toEqual(moment(now).month(3).date(20).hour(20).minute(0).toDate().toDateString());

		expect(el.endDate.toDateString())
			.toEqual(moment(now).month(3).date(21).hour(17).minute(0).toDate().toDateString());

		expect(el.allDay).toEqual(false);

	});




});