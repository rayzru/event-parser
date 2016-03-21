/*
 * Event Parser
 * by Andrew Rumm
 *
 *
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
				suffix: ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'nineth', 'tenth', 'eleventh', 'twelfth', 'thirteenth', 'fourteenth', 'fifteenth', 'sixteenth', 'seventeenth', 'eighteenth', 'nineteenth']
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

		
		var weekdays = '('  + this.sets.weekday.join('|') + ')'; 
		
		this.patterns = {

			rangeSplitters: /(\bto\b|\-|\b(?:un)?till?\b|\bthrough\b|\bthru\b|\band\b|\bends?\b)/ig,

			//weekdays: new RegExp(this.sets.weekday.join('|'), 'i'),

			//recurrenceWords: /\b(each|every|\d+\s?times|weekdays|(year|month|week|dai|hour)ly|weekends|ann(?:iversary)?|(monday|tuesday|wednesday|thursday|friday|saturday|sunday)s)\b/i,
			recurrenceExpression: /(((sunday|monday|tuesday|wednesday|thursday|friday|saturday)(?:s)?(\s+)?(?:,|and|&)?\s?){2,})|((every|each)\s+?(?:other|last|first|next)?\s?((sunday|monday|tuesday|wednesday|thursday|friday|saturday)|(weekday|weekend|week|month|day|year)))|((sunday|monday|tuesday|wednesday|thursday|friday|saturday)s|(dai|week|month|year)ly|weekends|weekdays)/ig,
			//recurrenceWeekdays: /(((sunday|monday|tuesday|wednesday|thursday|friday|saturday)(?:s)?\s?(?:,|and|&)?\s?){2,})/gi,

			// dates parsers
			dates: [
				// june 12, june 12th, june 12th 2001
				/((january|february|march|april|may|june|july|august|september|october|november|december)(\s?(?:,)?(?:\sof\s)?\s?(\d+)\s?(?:th|st|nd|rd)?)(\s?(?:,)?(?:\sof\s)?(20\d{2}|\d{2}[6-9]\d+))?)/ig,

				//12 july, 12th of july, 12th of july of 2012
				/((\d+)(?:th|nd|rd)?(?:\sof\s)?\s?(january|february|march|april|may|june|july|august|september|october|november|december)(\s?(?:,)?(?:\sof\s)?(20\d{2}|\d{2}[6-9]\d+))?)/i,

			],

			// Nicers
			nicers: [
				[/(w(\.|\/))/i, 'with'],

				[/[^0-9a-z]\s?(@)\s?/i, ' at '],

				//[/am\b/ig, 'AM'],
				//[/pm\b/ig, 'PM'],

				[/(\btom(?:orrow)?\b)/i, 'tomorrow'],

				// numbers
				[/(first|one|1st)/i, 1],
				[/(second|two|2nd)/i, 2],
				[/(third|three|3rd)/i, 3],

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

		getNow: function() {
			return (this.now) ? new Date(this.now.getTime()) : new Date();
		},

		formatCurago: function () {
			return {}
		},

		// apply new settings into existing configuration
		apply: function (settings) {
			this.settings = $.extend({}, this.settings, settings);
		},

		// Complete uncompleted, shortened words, parts and abbrreveations.
		cleanup: function () {
			this.event.parsedText = this.event.sourceText;
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

		getEvent: function () {
			return this.event;
		},

		getText: function () {
			return this.event.sourceText;
		},

		parseRecurrent: function() {
			var match, re;
			if (match = /(every|each)/i.exec(this.event.recurrenceText)) {
				
				// if every then untill forever
				this.event.until = "";
				this.event.recurrenceText = this.event.recurrenceText.replace(match[0], '');

				// weekdays
				re =  new RegExp(this.sets.weekday.join('|'), 'i')
				if (match = re.exec(this.event.recurrenceText)) {
					this.event.frequency = 'weekly';

					this.event.recurrentAttr.push({day: this.sets.weekday.indexOf(match[0])})
					
					

				}

			} else {



			}



		},

		parseToken: function (string, date, previousDate) {

		},

		parse: function (source) {

			if (typeof source === "string") this.setText(source);

			if (this.checkRecurrency()) {
				this.parseRecurrent();
			} else {

			}

			this.event.tokens = this.event.parsedText.split(this.patterns.rangeSplitters);
			return this;
		},


		checkRecurrency: function () {
			var match;
			this.event.isRecurrent = false;
			this.event.recurrenceText = "";

			while ((match = this.patterns.recurrenceExpression.exec(this.event.parsedText)) != null) {
				this.event.isRecurrent = true;
				this.event.recurrenceText = match[0];
				//console.log(this.event.parsedText, '::',this.event.recurrenceText);
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
