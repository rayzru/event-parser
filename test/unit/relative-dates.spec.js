describe("Relative dates", function() {
	var el, now;

	it("today", function() {
		el = "Meeting today".parseEvent();
		now = moment().toDate();

		expect(el.startDate.getDate())
			.toEqual(now.getDate());
	});

	it("tomorrow", function() {

		el = "Pickup Jane tomorrow for big ride".parseEvent();
		now = moment().toDate();

		expect(moment(el.startDate).toDate().toDateString())
			.toEqual(moment(now).add(1, 'days').toDate().toDateString());

		el = "Lunch with Nabi tomorrow at Sprinkle’s Cupcakes".parseEvent();
		now = moment().toDate();

		expect(moment(el.startDate).toDate().toDateString())
			.toEqual(moment(now).add(1, 'days').toDate().toDateString());

	});


	it("in x days|weeks|", function() {

		now = moment().toDate();

		el = "Phone convo w/Jane in 2 days".parseEvent();

		expect(moment(el.startDate).toDate().toDateString())
			.toEqual(moment(now).add(2, 'days').toDate().toDateString());

		now = moment().toDate();
		el = "Sam birthday in 2 weeks".parseEvent();

		expect(moment(el.startDate).toDate().toDateString())
			.toEqual(moment(now).add(14, 'days').toDate().toDateString());

	});

	it('at specified weekday', function() {
		now = moment().toDate();

		el = "Lunch on Friday with Crystal and Kim at Joan’s on Third".parseEvent();

		expect(moment(el.startDate).toDate().toDateString())
			.toEqual(
				(moment(now).day() <= 5) ?
					moment(now).day(5).toDate().toDateString() :
					moment(now).day(5 + 7).toDate().toDateString()
			);

		el = "Lunch on Monday with Crystal and Kim at Joan’s on Third".parseEvent();

		expect(moment(el.startDate).toDate().toDateString())
			.toEqual(
				(moment(now).day() <= 1) ?
					moment(now).day(1).toDate().toDateString() :
					moment(now).day(1 + 7).toDate().toDateString()
			);

	});


});