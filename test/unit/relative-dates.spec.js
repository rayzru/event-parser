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

	});


	it("in x days|weeks|", function() {

		now = moment().toDate();

		el = "Phone convo in 2 days".parseEvent();

		expect(moment(el.startDate).toDate().toDateString())
			.toEqual(moment(now).add(2, 'days').toDate().toDateString());

		now = moment().toDate();
		el = "Sam birthday in 2 weeks".parseEvent();

		expect(moment(el.startDate).toDate().toDateString())
			.toEqual(moment(now).add(14, 'days').toDate().toDateString());

	});


});