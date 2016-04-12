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

});