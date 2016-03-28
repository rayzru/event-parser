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
 * 3) interpret all related dates and times into real one
 * 4) parse and remove recurrent parts from source string for futurer parses. parse and get exceptions.
 * 5)
 *
 * */

(function () {

	// constructor
	function EventParser(config) {

		// Default configuration
		this.defaults = {
			sourceText: null,
			weekStart: 'sunday' // monday|sunday;
		};

		this.now = moment();

		// data object
		this.event = {};
		this.curagoEvent = {};

		// checking given configuration
		if (typeof config === "string") {
			this.parse(config);
		} else if (typeof config === "object") {
			this.settings = this.apply(this.defaults, config);
		}

		// Avoid clobbering the window scope
		// possibly it;s not necessary
		if (window === this) return new EventParser(config);


		// event object template
		this.eventTemplate = {
			sourceText: "",
			parsedText: "",
			parsedTitle: "",
			recurrenceText: "",
			parsedDates: [],
			parsedTimes: [],
			parsedNames: [],
			parsedLocations: [],

			title: "",
			startDate: null,
			endDate: null,

			until: null,
			separation: 1,
			frequency: 'once',
			count: 0,
			recurrentAttr: [],

			isRecurrent: false,
			isValidDate: false,
			allDay: true

		};


		this.curagoEventTemplate = {
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
			number: {
				prefix: ['twenty', 'thirty'],
				ordinal: ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'nineth', 'tenth', 'eleventh', 'twelfth', 'thirteenth', 'fourteenth', 'fifteenth', 'sixteenth', 'seventeenth', 'eighteenth', 'nineteenth'],
				normal: ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen']
			},
			range: {
				splitter: ['to', '-', '(?:un)?till?', 'through', 'thru', 'and', 'ends'],
				prefix: ['from', 'start(?:ing)?', 'on', 'at']
			},
			timeRelatives: ['afternoon', 'night', 'evening', 'morning']
		};

		this.patterns = {

			//rangeSplitters: /(\bto\b|\-|\b(?:un)?till?\b|\bthrough\b|\bthru\b|\band\b|\bends?\b)/ig,
			//weekdays: new RegExp(this.sets.weekday.join('|'), 'i'),
			//recurrenceWeekdays: /(((sunday|monday|tuesday|wednesday|thursday|friday|saturday)(?:s)?\s?(?:,|and|&)?\s?){2,})/gi,
			//recurrenceWords: /\b(each|every|\d+\s?times|weekdays|(year|month|week|dai|hour)ly|weekends|ann(?:iversary)?|(monday|tuesday|wednesday|thursday|friday|saturday|sunday)s)\b/i,

			// todo: add dates numbers masks
			// todo: add not listed atricules like on, at for ewxclusion
			recurrenceExpression: /(((?:at|on)?((every|each)?(?:\s)?(first|next|last|other)?)(?:\s)?((sunday|monday|tuesday|wednesday|thursday|friday|saturday)(?:s)?(?:\s)?(?:,|and|&)?\s?){2,})|((every|each)\s+?(?:other|last|first|next)?\s?((sunday|monday|tuesday|wednesday|thursday|friday|saturday)|(weekday|weekend|week|month|day|year)))|((sunday|monday|tuesday|wednesday|thursday|friday|saturday)s|(dai|week|month|year)ly|weekends|weekdays))/gi,

			/*recurrenceTimes:
			 new RegExp(

			 ),*/

			// todo: possible except rules, should be checked
			recurrenceExcepts: /(?:except)(.+?)(?=on|at|with|from|to|(un)?till?)/gi,

			numbers: {
				numerical: /\b(?:(\d+)(st|nd|rd|th)\b)/gi,
				ordinal: new RegExp(
					'(?:\\b(' + this.sets.number.prefix.join('|') + '(?:-| ))?\\b(' + this.sets.number.ordinal.join('|') + '))|' +
					'\\b(?:tenth|twentieth|thirtieth)' +
					'\\b', 'gi'),
				normal: new RegExp(
					'((?:(?:(?:' + this.sets.number.prefix.join('|') + ')(?:-|\\s))?(' + this.sets.number.normal.join('|') + '))|' +
					'(?:ten|' + this.sets.number.prefix.join('|') + '))', 'gi')
			},
			// dates detectors
			dates: {
				// june 12, june 12th, june 12th 2001, "june 12th, of 2001"
				// todo: add THE, AT, ON in front of detection block
				mdyStrings: /(?:(january|february|march|april|may|june|july|august|september|october|november|december)(?:(?:(?:\s?,)?\s?of)?\s?(\d{1,2}(?:\s)?(?:|th|st|nd|rd)?)\b)(?:(?:\s?,)?(?:\s?of\s?)?(?:\s)?(20\d{2}|\d{2}[6-9]\d+))?)/gi,

				//12 july, 12th of july, 12th of july of 2012
				// todo: add THE, AT, ON in front of detection block
				dmyStrings: /(?:(\d{1,2}(?:\s)?(?:|th|st|nd|rd)?)\b(?:\sof\s)?\s?(january|february|march|april|may|june|july|august|september|october|november|december)(?:(?:\s?,)?(?:\s?of\s?)?(20\d{2}|\d{2}[6-9]\d+))?)/gi,

				// relative closest dates aliases
				// on friday, on other friday, at monday, at next monday, tomorrow, today, at 2nd tuesday
				relative: {

					common: /(?:(?:on|at|to)\s)?(?:(next|this|last|after|other|\d(?:st|nd|rd|th)?)\s)?(today|tomorrow|month|week|year|sunday|monday|tuesday|wednesday|thursday|friday|saturday)/ig,

					// not common usages
					dayAfter: /(\bday\safter\stomorrow\b)/ig,
					in: /(in\b\s(?:a\s)?(couple|(?:\d+)|(?:\b(?:twenty|thirty(?:-| ))?\b(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen))|(?:twenty|thirty))?(?:\s)?(?:of\s)?(day|week|month|year)(?:s)?)/ig
				},
				// date ranges
				// from - to, in between
				ranges: /s/ig

			},

			// todo: add AT, ON in front of detection block
			times: {
				singleInstances: /(?:at|on)?(\d{1,2})(?:\:)(\d{2})(?:\s)?(am|pm)?|(\d{1,2})(?:\s)?(am|pm)/gi,
				fullRanges: new RegExp('((?:' + this.sets.range.prefix.join('|') + '\\s)?(?:\\d{1,2})(?:\:)(\\d{2}))\\s?(?:' + this.sets.range.splitter.join('|') + ')\\s?((\\d{1,2})(?::)(\\d{2}))', 'gi'),
				partialX2Time: new RegExp('((?:' + this.sets.range.prefix.join('|') + '\\s)?(?:\d{1,2})(?:\:)(\d{2}))\s?(?:' + this.sets.range.splitter.join('|') + ')\s?((\d{1,2})(?:\:)(\d{2}))', 'gi'),
				partialTime2X: new RegExp('((?:' + this.sets.range.prefix.join('|') + '\\s)?(?:\d{1,2})(?:\:)(\d{2}))\s?(?:' + this.sets.range.splitter.join('|') + ')\s?((\d{1,2})(?:\:)(\d{2}))', 'gi'),

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
			],

			holidays: [
				[/(\bthanksgiving\b)/gi, 'every 4th thuesday of november'], 	// USA, but not Canada
				[/\b(christmas|xmas|x-mas)\b/gi, '12/25'], 					// USA?
				[/(\bnew\s?year(:?\'s)?(\seve)\b)/gi, '12/31 at 23:00'],
				[/(\bnew\s?year(:?\'s)\b)/gi, '1/1'],
				[/(\bapril\sfools\b)/gi, '4/1'],
				[/(\bhalloween\b)/gi, '10/30']
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

		// apply new settings into existing configuration
		apply: function (settings) {
			this.settings = this.helpers.extend({}, this.settings, settings);
		},

		formatStrDate: function (date, month, year) {

		},

		cleanup: function (source) {
			var formattedString, match, matches;

			// Complete uncompleted, shortened words, parts and abbrreveations.
			for (var i = 0; i < this.patterns.nicers.length; i++) {
				source = source.replace(this.patterns.nicers[i][0], this.patterns.nicers[i][1]);
			}

			//convert holidays
			for (var i = 0; i < this.patterns.holidays.length; i++) {
				source = source.replace(this.patterns.holidays[i][0], this.patterns.holidays[i][1]);
			}

			//normalise numbers

			// digitals
			this.patterns.numbers.numerical.lastIndex = 0;
			while (matches = this.patterns.numbers.numerical.exec(source)) {
				match = matches.filter(this.helpers.isUndefined);
				this.patterns.numbers.numerical.lastIndex = matches.index + 1;

				// don't believe anyone, just reconvert it.
				source = source.replace(match[0], this.helpers.getOrdinal(match[1]));
			}

			// not ordinal literal numbers
			this.patterns.numbers.normal.lastIndex = 0;
			while (matches = this.patterns.numbers.normal.exec(source)) {
				match = matches.filter(this.helpers.isUndefined);
				this.patterns.numbers.normal.lastIndex = matches.index + 1;
				//?
			}

			// ordinal literal numbers
			this.patterns.numbers.ordinal.lastIndex = 0;
			while (matches = this.patterns.numbers.ordinal.exec(source)) {

				match = matches.filter(this.helpers.isUndefined);
				this.patterns.numbers.ordinal.lastIndex = matches.index + 1;
				formattedString = "";
				if (match.length == 2) {
					// 10, 20, 30?
					if (match[1].match(/tenth|twentieth|thirtieth/i)) {
						switch (match[1]) {
							case "tenth":
								formattedString = '10th';
								break;
							case "twentieth":
								formattedString = '20th';
								break;
							case "thirtieth":
								formattedString = '30th';
								break;
						}
					} else {
						formattedString =
							this.helpers.getOrdinal(this.sets.number.ordinal.indexOf(match[1].toLowerCase()) + 1);
					}
				} else if (match.length == 3) {
					formattedString =
						(this.sets.number.prefix.indexOf(match[1].toLowerCase()) + 2) +
						this.helpers.getOrdinal(this.sets.number.ordinal.indexOf(match[2].toLowerCase()) + 1);
				}

				if (formattedString != '') source = source.replace(match[0], formattedString);
			}
			return source;
		},

		parseRecurrent: function (event) {

			var match, re;

			event.isRecurrent = false;
			event.recurrenceText = "";

			// get recurrencies
			// todo: currently gets only one recurrence. That's pity.
			while (match = this.patterns.recurrenceExpression.exec(event.parsedText)) {
				this.patterns.recurrenceExpression.lastIndex = match.index + 1;
				event.isRecurrent = true;
				event.recurrenceText = match[0];
				event.parsedText = event.parsedText.replace(event.recurrenceText, '');
			}

			if (!event.isRecurrent) {

				event.recurrenceText = "";

			} else {

				//get all of exceptions for recurrencies
				while (match = this.patterns.recurrenceExcepts.exec(event.parsedText)) {
					event.recurrenceExceptionsText = match[0];
					event.parsedText = event.parsedText.replace(event.recurrenceExceptionsText, '');
				}

				if (match = /(every|each)/i.exec(event.recurrenceText)) {

					// if every then untill forever
					event.until = "";
					event.recurrenceText = event.recurrenceText.replace(match[0], '');

					// weekdays
					re = new RegExp(this.sets.weekday.join('|'), 'ig');
					while (match = re.exec(event.recurrenceText)) {
						event.frequency = 'weekly';
						event.recurrentAttr.push({day: this.sets.weekday.indexOf(match[0])})
					}

				} else {


				}

			}

			return event;
		},

		parseRelPrefix: function (matches) {
			var hasLast = false,
				hasNext = false,
				hasSelf = false,
				hasNumber = false,
				subjectIndex,
				found;

			// relative suffix matched
			if (matches.length >= 3) {
				switch (matches[1]) {
					case 'last':
						hasLast = true;
						break;
					case 'next':
						hasNext = true;
						break;
					case 'this':
						hasSelf = true;
						break;
					default:
						// relative word suffix not found.
						if (found = matches[1].match(this.patterns.numbers.numerical)) {
							subjectIndex = 2;
							hasNumber = parseInt(found[0]);
						} else {
							console.warn('Unexpected value: ', matches[1]);
						}
						break;
				}
				subjectIndex = 1;
			} else subjectIndex = 1;

			return {
				last: hasLast,
				next: hasNext,
				self: hasSelf,
				number: hasNumber,
				subjectIndex: subjectIndex
			}
		},

		parseRelSuffix: function (matches) {

		},

		parseDates: function (event) {
			var match, matches, formattedString;
			var parsedDates = [];

			// M D Y
			this.patterns.dates.mdyStrings.lastIndex = 0;
			while (matches = this.patterns.dates.mdyStrings.exec(event.parsedText)) {
				event.isValidDate = true;
				match = matches.filter(filterUndefined);

				this.patterns.dates.mdyStrings.lastIndex = matches.index + 1;

				// changing to MM/DD || MM/DD/YYYY
				formattedString =
					(this.sets.month.indexOf(match[1]) + 1) + '/' + parseInt(match[2]) + ((match.length == 4) ?
					'/' + match[3] : "");
				event.parsedText = event.parsedText.replace(match[0], formattedString);

				this.event.parsedDates.push({
						index: matches.index,
						match: match[0],
						formattedDate: formattedString,
						date: {
							month: (this.sets.month.indexOf(match[1]) + 1),
							date: parseInt(match[2]),
							year: ((match.length == 4) ? '/' + match[3] : undefined)
						}
					}
				);

			}

			// D M Y
			this.patterns.dates.dmyStrings.lastIndex = 0;
			while (matches = this.patterns.dates.dmyStrings.exec(event.parsedText)) {

				event.isValidDate = true;

				match = matches.filter(filterUndefined);
				this.patterns.dates.dmyStrings.lastIndex = matches.index + 1;

				// changing to MM/DD || MM/DD/YYYY
				formattedString =
					(this.sets.month.indexOf(match[2]) + 1) + '/' + parseInt(match[1]) + ((match.length == 4) ?
					'/' + match[3] : "");

				event.parsedText = event.parsedText.replace(match[0], formattedString);

				parsedDates.push({
					index: preConvertedString.indexOf(match[0]),
					match: match[0],
					formattedDate: formattedString,
					hasYear: match.length == 4,
					dt: (match.length == 4) ? new Date().setFullYear(el.date.year, el.date.month, el.date.date) : new Date().setMonth(el.date.month, el.date.date),
					date: {
						month: (this.sets.month.indexOf(match[2]) + 1),
						date: parseInt(match[1]),
						year: (match.length == 4) ? match[3] : undefined
					}
				});
			}

			// sort parsed dates in incremental order.
			event.parsedDates.sort(function (a, b) {
				return (a.dt < b.dt) ? -1 : (a.dt > b.dt) ? 1 : 0;
			});

			return event;
		},

		parseTimes: function (event) {
			var hours, minutes, meridian, match, matches;

			while (matches = this.patterns.times.singleInstances.exec(this.event.parsedText)) {
				//if (this.patterns.dates.singleInstances.lastIndex) console.log(this.patterns.dates.singleInstances.lastIndex);

				event.isValidDate = true;

				match = matches.filter(filterUndefined);
				if (match.length >= 3) {
					if (match[match.length - 1] === 'am' || match[match.length - 1] === 'pm') {
						meridian = match[match.length - 1];

						hours = (meridian == 'am' && parseInt(match[1]) == 12) ? 0 :
							(meridian == 'pm' && parseInt(match[1]) < 12) ? parseInt(match[1]) + 12 :
								parseInt(match[1]);
						minutes = (match.length == 3) ? 0 : parseInt(match[2]);
					} else {
						hours = parseInt(match[1]);
						minutes = parseInt(match[2]);
					}

					formattedString = this.helpers.padNumberWithZeroes(hours, 2) + ':' + this.helpers.padNumberWithZeroes(minutes, 2);
					event.parsedText = event.parsedText.replace(match[0], formattedString);


					this.event.parsedTimes.push({
						index: matches.index,
						hasMeridian: meridian || undefined,
						match: match[0],
						formattedTime: formattedString,
						dt: new Date().setHours(el.time.hours, el.time.minutes),
						time: {
							hours: hours,
							minutes: minutes
						}
					});
				}
			}

			return event;
		},

		parseRelativeDates: function (event) {
			var matches, match, targetDate, date, month, year, formattedString;

			var now = this.getNow();

			// Convert common relative dates given
			while (matches = this.patterns.dates.relative.common.exec(event.parsedText)) {

				event.isValidDate = true;

				match = matches.filter(this.helpers.isUndefined);
				this.patterns.dates.relative.common.lastIndex = matches.index + 1;

				var relPrefix = this.parseRelPrefix(match);
				var relSuffix = this.parseRelSuffix(match);

				//
				// todo: if relative date relates to today, should check time. if it already passed, check next relative.

				// weekdays
				if (this.sets.weekday.indexOf(match[relPrefix.subjectIndex]) >= 0) {

					var subjectDay = this.sets.weekday.indexOf(match[relPrefix.subjectIndex]);

					targetDate = this.getNextWeekday(now, subjectDay, relPrefix);

				} else

				// months
				if (this.sets.month.indexOf(match[relPrefix.subjectIndex]) > 0) {

					var subjectMonth = this.sets.month.indexOf(match[relPrefix.subjectIndex]) + 1;
					targetDate = this.getNextMonth(now, subjectMonth, relPrefix);

				} else {

					// single
					switch (match[relPrefix.subjectIndex]) {
						case 'tomorrow':
							targetDate = new Date().setFullYear(now.getFullYear(), now.getMonth(), now.getDate() + 1);
							break;
						case 'today':
							// today
							targetDate = new Date().setFullYear(now.getFullYear(), now.getMonth(), now.getDate());
							break;
						case 'day':
							if (relPrefix.next) {
								// same as tomorrow
								// at next day
								targetDate = new Date().setFullYear(now.getFullYear(), now.getMonth(), now.getDate());

							} else if (relPrefix.number) {
								// at Nth day
							}
							break;
						case 'week':

							break;
						case 'month':
							break;
						case 'year':
							break;
					}


				}

				formattedString = targetDate.toLocaleString('en-US'); // MM/DD/YYYY
				event.parsedText = event.parsedText.replace(match[0], formattedString);

				this.event.parsedDates.push({
					index: preConvertedString.indexOf(match[0]),
					match: match[0],
					formattedDate: formattedString,
					date: {
						month: targetDate.getMonth(),
						date: targetDate.getDate(),
						year: targetDate.getFullYear()
					}
				});
			}


			// Day after tomorrow (should be only one mention, ok?)
			if (matches = event.parsedText.match(this.patterns.dates.relative.dayAfter)) {

				targetDate = new Date().setFullYear(now.getFullYear(), now.getMonth(), now.getDate() + 2);
				formattedString = targetDate.toLocaleString('en-US'); // MM/DD/YYYY
				event.parsedText = event.parsedText.replace(matches[0], formattedString);

				this.event.parsedDates.push({
					index: preConvertedString.indexOf(matches[0]),
					match: match[0],
					formattedDate: formattedString,
					date: {
						month: targetDate.getMonth(),
						date: targetDate.getDate(),
						year: targetDate.getFullYear()
					}
				});
			}

			if (matches = event.parsedText.match(this.patterns.dates.relative.in)) {

				match = matches.filter(this.helpers.isUndefined);

				if (match.length == 2) {
					targetDate = this.helpers.getDateShifted(now, match[1], 1);

				} else if (match.length == 3) {


					targetDate = this.helpers.getDateShifted(now, match[1], 1);
				}

				formattedString = targetDate.toLocaleString('en-US'); // MM/DD/YYYY
				event.parsedText = event.parsedText.replace(matches[0], formattedString);

				this.event.parsedDates.push({
					index: preConvertedString.indexOf(matches[0]),
					match: match[0],
					formattedDate: formattedString,
					date: {
						month: targetDate.getMonth(),
						date: targetDate.getDate(),
						year: targetDate.getFullYear()
					}
				});
			}


		},

		parse: function (source) {

			if (!source) throw "Nothng to parse";

			var match, matches, formattedString;

			var hasMeridian = false,
				meridian;

			var date, month, year, hour, min, tmpDate;

			// store preformatted sting to store date index positions
			var preConvertedString = event.parsedText;

			var event = this.eventTemplate;

			event.sourceText = source;
			event.parsedTitle = event.sourceText;

			source = this.cleanup(source);

			this.now = this.getNow();


			// parse and format dates
			event = this.parseDates(event);

			// parse and format times
			event = this.parseTimes(event);

			// go get recurrency ant cut it from
			event = this.parseRecurrent(event);

			// Convert common relative dates given
			event = this.parseRelativeDates(event);


			/** TODO: Parse time ranges
			 *  1) detect and fix low confidence partial ranges given
			 *  2)parse time ranges
			 *
			 *
			 * */


			// not useful actually. if we got all dates parsed/
			// todo: figure it out.
			if (false || this.event.parsedTimes.length == 411111) {
				while (matches = this.patterns.times.fullRanges.exec(this.event.parsedText)) {
					console.log('time full ranges');
				}
			}

			// should check if there is no enough dates parsed
			if (this.event.parsedTimes.length == 1) {

				while (matches = this.patterns.times.partialX2Time.exec(this.event.parsedText)) {
					console.log('time partial ranges');
				}

				while (matches = this.patterns.times.partialTime2X.exec(this.event.parsedText)) {
					console.log('time partial ranges');
				}
			}

			//parse date ranges

			//parse relatives

			//this.event.tokens = this.event.parsedText.split(this.patterns.rangeSplitters);


			//
			// Finalize dates, make ajustements
			// ================================

			// create Date objects for each parsed date element


			if (!this.event.startDate) {

				//
				if (this.event.parsedDates.length) {

				} else if (this.event.parsedTimes.length) {

				} else {
					this.event.isValidDate = false;
				}

				if (!this.event.endDate) {

				}
			}


			if (this.event.parsedDates.length >= 1) {
				this.event.startDate =
					new Date(
						this.event.parsedDates[0].date.year || this.now.getFullYear(),
						this.event.parsedDates[0].date.month,
						this.event.parsedDates[0].date.date
					);

				if (this.event.parsedDates.length == 2) {
					this.event.endDate =
						new Date(
							this.event.parsedDates[1].date.year || this.now.getFullYear(),
							this.event.parsedDates[1].date.month,
							this.event.parsedDates[1].date.date
						);
				}

			} else {
				this.event.startDate = new Date(this.now);
			}

			if (this.event.parsedTimes.length >= 1) {

				// Huston we got time!
				this.event.allDay = false;

				this.event.startDate.setHours(0);
				this.event.startDate.setMinutes(0);
				this.event.startDate.setMilliseconds(0);

				// such dumb way to format days.
				// todo: find better way
				this.event.startDate.set;
				moment(this.event.startDate)
					.startOf('day')
					.add(this.event.parsedTimes[0].time.hour, 'h')
					.add(this.event.parsedTimes[0].time.minutes, 'm')
					.toDate();

				if (this.event.parsedTimes.length == 2) {

					if (this.event.parsedDates.length == 1) this.event.endDate = this.event.startDate;

					this.event.endDate =
						moment(this.event.endDate)
							.startOf('day')
							.add(this.event.parsedTimes[0].time.hour, 'h')
							.add(this.event.parsedTimes[0].time.minutes, 'h')

				}

			} else {
				this.event.allDay = true;
			}

			return this;
		},


		//
		// RETURN DATA
		// ================================


		getEvent: function (event) {
			return {
				title: event.parsedTitle,
				startDate: new Date(event.startDate) || null,
				endDate: new Date(event.endDate) || null,
				allDay: event.allDay
			};
		},

		// curago object wrapper
		getEventCurago: function (event) {

			var collectedDate = this.helpers.extend({}, this.curagoEventTemplate, {
				title: event.parsedTitle || "",
				starts_at: new Date(event.startDate).toISOString() || null,
				ends_at: new Date(event.endDate).toISOString() || null,
				location_name: (event.parsedLocations.length) ? event.parsedLocations[0] : ""
				//separation: this.event.setPosition
			});

			return collectedDate;
		},


		//
		// Helpers functions
		// ================================


		helpers: {

			extend: function () {
				for (var i = 1; i < arguments.length; i++)
					for (var key in arguments[i])
						if (arguments[i].hasOwnProperty(key))
							arguments[0][key] = arguments[i][key];
				return arguments[0];
			},


			isUndefined: function (el) {
				return el != undefined;
			},

			padNumberWithZeroes: function (number, size) {
				size = size || 2;
				var result = number + "";
				while (result.length < size) s = "0" + s;
				return result;
			},

			getOrdinal: function (number) {
				number = parseInt(number);
				var s = ["th", "st", "nd", "rd"],
					v = number % 100;
				return number + (s[(v - 20) % 10] || s[v] || s[0]);
			},

			strToNumber: function (string) {

				if (this.patterns.numbers.normal.test(string)) {
					var parts, number;
					//var matches = this.patterns.numbers.normal.exec(string);

					parts = string.split(/\s|-/g);

					if (parts.length = 2) {
						number = (this.sets.number.prefix.indexOf(parts[0]) + 1) + ""
							+ this.sets.number.normal.indexOf(parts[0]) + 1;
					} else {
						if (this.sets.number.normal.indexOf(parts[0]) > 0) {
							number = this.sets.number.normal.indexOf(parts[0]) + 1;
						} else {
							number = (['ten', 'twenty', 'thirty'].indexOf(parts[0]) + 1) * 10;
						}
					}

					return number;

				} else {
					return false;
				}

			},

			setDayStart: function (dt) {
				dt = dt || this.now || new Date();
				return dt.setHours(0, 0, 0, 0);
			},

			getDateShifted: function (dt, dateModifier, amount) {

				amount = amount || 1;

				switch (dateModifier) {
					case "day":
						return new Date().setFullYear(dt.getFullYear(), dt.getNextMonth(), dt.getDate() + amount);
					case "week":
						return new Date().setFullYear(dt.getFullYear(), dt.getNextMonth(), dt.getDate() + (7 * amount));
					case "month":
						return new Date().setFullYear(dt.getFullYear(), dt.getNextMonth() + amount, dt.getDate());
					case "year":
						return new Date().setFullYear(dt.getFullYear() + amount, dt.getNextMonth(), dt.getDate());
				}

			},

			getNextMonth: function (dt, targetMonth, relativeStates) {

				dt = dt || this.now || new Date();
				var currentMonth = dt.getMonth();
				var targetDate;

				targetMonth =
					(typeof targetMonth == "string" && isNaN(parseInt(targetMonth))) ?
						this.sets.month.indexOf(targetMonth.toLowerCase()) :
						parseInt(targetMonth);

				targetDate = (targetMonth <= currentMonth) ?
					new Date().setFullYear(dt.getFullYear() + 1, targetMonth, 1) :
					new Date().setFullYear(dt.getFullYear(), targetMonth, 1);

				if (targetMonth == currentMonth && relativeStates.self)
					targetDate = new Date().setFullYear(dt.getFullYear(), targetMonth, 1);

				if (targetMonth == currentMonth && relativeStates.next)
					targetDate = new Date().setFullYear(dt.getFullYear() + 1, targetMonth, 1);

				return targetDate;
			},

			getNextWeekday: function (dt, targetWeekday, relativeStates) {

				dt = dt || this.now || new Date();
				var currentWeekday = dt.getDay();

				targetWeekday =
					(typeof targetWeekday == "string" && isNaN(parseInt(targetWeekday))) ?
						this.sets.weekday.indexOf(targetWeekday.toLowerCase()) :
						parseInt(targetWeekday);

				var daysUntilNext = targetWeekday - currentWeekday + (currentWeekday <= targetWeekday) ? 7 : 0;

				if (relativeStates.next && currentWeekday == targetWeekday) daysUntilNext += 7;
				if (relativeStates.self && currentWeekday == targetWeekday) daysUntilNext -= 7;

				if (relativeStates.number) {
					// todo: parse suffix (14th, 11th) as well
					throw "Relative weekdays with dates is currently unsupported";
				}

				return new Date().setDate(dt.getDate() + daysUntilNext);

			},

			isSameDay: function (date1, date2) {
				return date1.getMonth() === date2.getMonth() && date1.getDate() === date2.getDate() && date1.getFullYear() === date2.getFullYear();
			}
		}


	};

	/** @export */
	window.EventParser = EventParser;

})();

// object helper, merge objects into one single
Array.prototype.swap = function (x, y) {
	var b = this[x];
	this[x] = this[y];
	this[y] = b;
	return this;
};