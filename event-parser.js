/*
 * Event Parser
 * @author Andrew "RayZ" Rumm
 * @version 0.1
 *
 * */



/*
 * The way it works:
 * 1) convert all known shortens on to full word representations: dec->december, nov->november
 * 2) convert all times into 24hour-format
 * 3) parse and remove recurrent parts from source string for futurer parses.
 * 4)
 *
 * */

(function () {

	// constructor
	function EventParser(config) {

		// Default configuration
		this.defaults = {
			sourceText: null
		};

		// completely new objec
		this.event = {}

		// checking given configuration
		if (typeof config === "string") {
			this.event.sourceText = config;
		} else if (typeof config === "object") {
			this.settings = extend({}, this.defaults, config);
		}

		// Avoid clobbering the window scope
		if (window === this) return new EventParser(config);


		// event object template
		this.eventTemplate = {
			sourceText: "",
			parsedText: "",
			recurrenceText: "",
			parsedDates: [],
			parsedTimes: [],

			title: "",
			startDate: null,
			endDate: null,

			until: null,
			separation: 1,
			frequency: 'once',
			recurrentAttr: [],

			isRecurrent: false,
			allDayEvent: true

		};


		this.formattedCuragoEvent = {
			title: "",
			starts_at: null,	// event start date
			ends_at: null,		// event end date

			until: null,		// limit recurrency execution up to date or Null for unlimited execution

			frequency: "once",  // 'once', 'daily', 'weekly', 'monthly', 'yearly'

			separation: 1,		// event recurrance offset (each 2 week: frequency=weekly, separation=2)

			count: null,		// recurrency count

			/*
			 * Array of event reccurance rules
			 * */
			recurrent_attributes: [
				{
					day: 0,
					week: 0,
					month: 0
				}
			],

			/*
			 * Array of excluded dates from event reccurance rules
			 * */
			cancelation_attributes: [
				{
					date: ""
				}
			]
		};

		this.sets = {
			weekday: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
			month: ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'],
			day: {
				prefix: ['twenty', 'thirty'],
				suffix: ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'nineth', 'tenth', 'eleventh', 'twelfth', 'thirteenth', 'fourteenth', 'fifteenth', 'sixteenth', 'seventeenth', 'eighteenth', 'nineteenth'],
				single: ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen']
			},
			holidays: [
				[/thanksgiving/gi, 'every 4th thuesday of november'], 	// USA, but not Canada
				[/christmas|xmas|x-mas/gi, '25/12'], 					// USA?
				[/new\s?year(:?\'s)?/gi, '1/1'],
				[/new\s?year(:?\'s)?/gi, '1/1'],
				[/april\sfools/gi, '4/1'],
				[/halloween/gi, '30/10']
			]
		};


		var weekdays = '(' + this.sets.weekday.join('|') + ')';

		this.patterns = {

			rangeSplitters: /(\bto\b|\-|\b(?:un)?till?\b|\bthrough\b|\bthru\b|\band\b|\bends?\b)/ig,
			//weekdays: new RegExp(this.sets.weekday.join('|'), 'i'),
			//recurrenceWeekdays: /(((sunday|monday|tuesday|wednesday|thursday|friday|saturday)(?:s)?\s?(?:,|and|&)?\s?){2,})/gi,
			//recurrenceWords: /\b(each|every|\d+\s?times|weekdays|(year|month|week|dai|hour)ly|weekends|ann(?:iversary)?|(monday|tuesday|wednesday|thursday|friday|saturday|sunday)s)\b/i,

			// todo: add dates masks
			// todo: add not listed atricules like on, at for ewxclusion
			recurrenceExpression: /(((?:at|on)?((every|each)?(?:\s)?(first|next|last|other)?)(?:\s)?((sunday|monday|tuesday|wednesday|thursday|friday|saturday)(?:s)?(?:\s)?(?:,|and|&)?\s?){2,})|((every|each)\s+?(?:other|last|first|next)?\s?((sunday|monday|tuesday|wednesday|thursday|friday|saturday)|(weekday|weekend|week|month|day|year)))|((sunday|monday|tuesday|wednesday|thursday|friday|saturday)s|(dai|week|month|year)ly|weekends|weekdays))/gi,

			/*recurrenceTimes:
			 new RegExp(

			 ),*/


			// dates detectors
			dates: {
				// june 12, june 12th, june 12th 2001, "june 12th, of 2001"
				// todo: add THE, AT, ON in front of detection block
				mdyStrings: /(?:(january|february|march|april|may|june|july|august|september|october|november|december)(?:(?:(?:\s?,)?\s?of)?\s?(\d{1,2}(?:\s)?(?:|th|st|nd|rd)?)\b)(?:(?:\s?,)?(?:\s?of\s?)?(?:\s)?(20\d{2}|\d{2}[6-9]\d+))?)/gi,

				//12 july, 12th of july, 12th of july of 2012
				// todo: add THE, AT, ON in front of detection block
				dmyStrings: /(?:(\d{1,2}(?:\s)?(?:|th|st|nd|rd)?)\b(?:\sof\s)?\s?(january|february|march|april|may|june|july|august|september|october|november|december)(?:(?:\s?,)?(?:\s?of\s?)?(20\d{2}|\d{2}[6-9]\d+))?)/gi,

				// relative closest dates aliases
				// on friday, on other friday, at monday, at next monday, tommorow, today
				relative: /((?:(?:on|at)?(?:\s)?)(?:(?:(next|this|last|after|other)?(?:\s)?)(?:(today|tomorrow)|(month|week|year)|(sunday|monday|tuesday|wednesday|thursday|friday|saturday)))(?:(?:\s)(morning|evening|night))?)/ig,

				// date ranges
				// from - to, in between
				ranges: /s/ig

			},

			// todo: add AT, ON in front of detection block
			times: {
				singleInstances: /(\d{1,2})(?:\:)(\d{2})(?:\s)?(am|pm)?|(\d{1,2})(?:\s)?(am|pm)/gi,
				rangeWithHyphen: /s/i,
				rangeWithFromTo: /s/i,
			},

			// Nicers
			nicers: [


				[/(\d{4})(?:-|.)(\d{2})(?:-|.)(\d{2})/ig, "$2/$3/$1"],

				[/(w(\.|\/))/i, 'with'],

				[/[^0-9a-z]\s?(@)\s?/i, ' at '],

				//[/am\b/ig, 'AM'],
				//[/pm\b/ig, 'PM'],

				[/(\btom(?:orrow)?\b)/i, 'tomorrow'],

				//aliases
				[/\b(noon)\b/i, '12:00'],
				[/\b(midnight)\b/i, '24:00'], // depends on needs?

				// weekdays
				[/(\bmon(?:day)?\b)/i, 'monday'],
				[/(\btue(?:s(?:day)?)?\b)/i, 'tuesday'],
				[/(\bwed(?:nes(?:day)?)?\b)/i, 'wednesday'],
				[/(\bthu(?:rs(?:day)?)?\b)/i, 'thursday'],
				[/(\bfri(?:day)?\b)/i, 'friday'],
				[/(\bsat(?:ur(?:day)?)?\b)/i, 'saturday'],
				[/(\bsun(?:day)?\b)/i, 'sunday'],

				// months
				[/(\bjan(?:uary)?\b)/i, 'january'],
				[/(\bfeb(?:ruary)?\b)/i, 'february'],
				[/(\bmar(?:ch)?\b)/i, 'march'],
				[/(\bapr(?:il)?\b)/i, 'april'],
				[/(\bmay\b)/i, 'may'],
				[/(\bjun(?:e)?\b)/i, 'june'],
				[/(\bjul(?:y)?\b)/i, 'july'],
				[/(\baug(?:ust)?\b)/i, 'august'],
				[/(\bsep(?:t(?:ember)?)?\b)/i, 'september'],
				[/(\boct(?:ober)?\b)/i, 'october'],
				[/(\bdec(?:ember)?\b)/i, 'december']
			]
		};

		this.now = null;

		// using one EventParser instance
		if (!(this instanceof EventParser )) return new EventParser(this.settings);

		return this;
	}

	EventParser.prototype = {

		getNow: function () {
			return (this.now) ? new Date(this.now.getTime()) : new Date();
		},

		// curago object wrapper
		getCurago: function () {
			return {}
		},

		// apply new settings into existing configuration
		apply: function (settings) {
			this.settings = extend({}, this.settings, settings);
		},

		formatStrDate: function (date, month, year) {
			return;
		},

		cleanup: function () {
			var formattedString;
			this.event.parsedText = this.event.sourceText;

			// Complete uncompleted, shortened words, parts and abbrreveations.
			for (var i = 0; i < this.patterns.nicers.length; i++) {
				this.event.parsedText = this.event.parsedText.replace(this.patterns.nicers[i][0], this.patterns.nicers[i][1]);
			}

		},

		setText: function (source) {
			this.event = this.eventTemplate;
			this.event.sourceText = source;
			this.cleanup();
			return this;
		},

		str2num: function (string) {

		},

		getEvent: function () {
			return this.event;
		},

		getText: function () {
			return this.event.sourceText;
		},

		parseRecurrent: function () {
			var match, re;
			if (match = /(every|each)/i.exec(this.event.recurrenceText)) {

				// if every then untill forever
				this.event.until = "";
				this.event.recurrenceText = this.event.recurrenceText.replace(match[0], '');

				// weekdays
				re = new RegExp(this.sets.weekday.join('|'), 'ig')
				while (match = re.exec(this.event.recurrenceText)) {
					this.event.frequency = 'weekly';
					this.event.recurrentAttr.push({day: this.sets.weekday.indexOf(match[0])})
				}

			} else {


			}


		},

		parseToken: function (string, date, previousDate) {

		},

		parse: function (source) {
			var match, matches;

			if (typeof source === "string") this.setText(source);

			if (this.checkRecurrency()) {
				this.parseRecurrent();
			} else {

			}
			this.event.parsedDates = [];

			// store preformatted sting to store date index positions
			var preConvertedString = this.event.parsedText;

			// parse and format dates
			// M D Y

			while (matches = this.patterns.dates.mdyStrings.exec(this.event.parsedText)) {
				//console.log(this.patterns.dates.mdyStrings.lastIndex);
				match = matches.filter(filterUndefined);
				console.dir(match);

				this.event.parsedDates.push({
					index: matches.index,
					match: match[0]}
				);

				// matched only month and date
				// changing to MM/DD || MM/DD/YYYY
				formattedString = (this.sets.month.indexOf(match[1]) + 1) + '/' + parseInt(match[2]) + ((match.length == 4) ? '/' + match[3] : "");
				this.event.parsedText = this.event.parsedText.replace(match[0], formattedString);
			}

			// D M Y
			while (matches = this.patterns.dates.dmyStrings.exec(this.event.parsedText)) {

				match = matches.filter(filterUndefined);

				this.event.parsedDates.push({index: preConvertedString.indexOf(match[0]), match: match[0]});

				if (match.length >= 4) {

					// changing to MM/DD || MM/DD/YYYY
					formattedString = (this.sets.month.indexOf(match[2]) + 1) + '/' + parseInt(match[1]) + ((match.length == 4) ? '/' + match[3] : "");

					this.event.parsedText = this.event.parsedText.replace(match[0], formattedString);
				}
			}

			// parse and format times

			while (matches = this.patterns.times.singleInstances.exec(this.event.parsedText)) {
				//if (this.patterns.dates.singleInstances.lastIndex) console.log(this.patterns.dates.singleInstances.lastIndex);
				var hasMeridian = false,
					meridian,
					hours,
					mins;

					match = matches.filter(filterUndefined);
				if (match.length >= 3) {
					if (hasMeridian = (match[match.length - 1] === 'am' || match[match.length - 1] === 'pm')) {
						meridian = match[match.length - 1];

						hours = (meridian == 'am' && parseInt(match[1]) == 12) ? 0 : (meridian == 'pm' && parseInt(match[1]) < 12) ? parseInt(match[1])+12 : parseInt(match[1]);
						mins = (match.length == 3) ? 0 : parseInt(match[2]);
					} else {
						hours = parseInt(match[1]);
						mins = parseInt(match[2]);
					}

					formattedString = pad(hours, 2) + ':' + pad(mins, 2);
					this.event.parsedText = this.event.parsedText.replace(match[0], formattedString);

					this.event.parsedTimes.push({index: matches.index, match: match[0]});
				}

				//parse relatives


			}


			//this.event.tokens = this.event.parsedText.split(this.patterns.rangeSplitters);
			return this;
		},


		checkRecurrency: function () {
			var match;
			this.event.isRecurrent = false;
			this.event.recurrenceText = "";

			while ((match = this.patterns.recurrenceExpression.exec(this.event.parsedText)) != null) {
				this.event.isRecurrent = true;
				this.event.recurrenceText = match[0];
				this.event.parsedText = this.event.parsedText.replace(this.event.recurrenceText, '');
			}

			if (!this.event.isRecurrent) this.event.recurrenceText = "";

			return this.event.isRecurrent;

		}

	};

	/** @export */
	window.EventParser = EventParser;

})();


// object helper, merge objects into one single
function extend() {
	for (var i = 1; i < arguments.length; i++)
		for (var key in arguments[i])
			if (arguments[i].hasOwnProperty(key))
				arguments[0][key] = arguments[i][key];
	return arguments[0];
}

function pad(num, size) {
	size = size || 2;
	var s = num + "";
	while (s.length < size) s = "0" + s;
	return s;
}

function filterUndefined(el) {
	return el != undefined;
}