describe("Relative dates", function() {
	var el, now;

	it("today", function() {
		el = "Meeting today".parseEvent();
		now = moment().toDate();

		expect(el.startDate.toDateString()).toEqual(now.toDateString());
	});

	it("tomorrow", function() {

		el = "Pickup Jane tomorrow for big ride".parseEvent();

		expect(el.startDate.toDateString())
			.toEqual(moment().add(1, 'days').toDate().toDateString());

		el = "Lunch with Nabi tomorrow at Sprinkle’s Cupcakes".parseEvent();

		expect(el.startDate.toDateString())
			.toEqual(moment().add(1, 'days').toDate().toDateString());

	});


	it("in x days|weeks|", function() {

		el = "Phone convo w/Jane in 2 days".parseEvent();

		expect(el.startDate.toDateString())
			.toEqual(moment().add(2, 'days').toDate().toDateString());

		el = "Sam birthday in 2 weeks".parseEvent();

		expect(el.startDate.toDateString())
			.toEqual(moment().add(14, 'days').toDate().toDateString());

	});

	it('at next week', function() {
		el = "Event at next week".parseEvent();
		expect(el.startDate.toDateString())
			.toEqual(moment().add((8 - moment().day()), 'days').toDate().toDateString());
	});

	it('at this week', function() {
		el = "Event at this week".parseEvent();
		expect(el.startDate.toDateString())
			.toEqual(moment().toDate().toDateString());

		expect(el.endDate.toDateString())
			.toEqual(moment().add((7 - moment().day()), 'days').toDate().toDateString());

	});

	it('at next month', function() {
		el = "Event at next month".parseEvent();
		expect(el.startDate.toDateString())
			.toEqual(moment().endOf('month').add(1, 'days').toDate().toDateString());
	});

	it('at this month', function() {
		el = "Event at this month".parseEvent();

		expect(el.startDate.toDateString())
			.toEqual(moment().toDate().toDateString());

		expect(el.endDate.toDateString())
			.toEqual(moment().endOf('month').add(0, 'days').toDate().toDateString());
	});


});