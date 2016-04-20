describe("Dates", function() {
	var el, now;

	it("Xth of month", function() {
		el = "Buy milk on 10 of april".parseEvent();

		expect(el.startDate.toDateString())
			.toEqual(moment().month(3).date(10).toDate().toDateString());

		el = "Pick up Dave on 20 of january".parseEvent();

		expect(el.startDate.toDateString())
			.toEqual(moment().month(0).date(20).toDate().toDateString());
	});


	it("month Xth", function() {
		el = "BBQ at may 1st in forest".parseEvent();

		expect(el.startDate.toDateString())
			.toEqual(moment().month(4).date(1).toDate().toDateString());
	});


	it("month Xth", function() {
		el = "The meeting is scheduled for June 30.".parseEvent();

		expect(el.startDate.toDateString())
			.toEqual(moment().month(5).date(30).toDate().toDateString());
	});


	it("month Xth", function() {
		el = "Doctor's appointment for Nabi on Dec 3".parseEvent();

		expect(el.startDate.toDateString())
			.toEqual(moment().month(11).date(3).toDate().toDateString());
	});


	it("Wrong date: month Xth", function() {
		el = "The meeting is scheduled for June 31.".parseEvent();
		expect(el.startDate).toBeUndefined();
	});



});