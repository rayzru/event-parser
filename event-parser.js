/*
 * Event Parser
 * Natural Language Processing library for parsing event-related text into event object.
 * @author Andrew "RayZ" Rumm
 *
 * The way it works:
 * 1) convert all known shortens on to full word representations: dec->december, nov->november
 * 2) convert all times into 24hour-format
 * 3) interpret all related dates and times into real one
 * 4) parse and remove recurrent parts from source string for futurer parses. Parse and get exceptions.
 * work is not finished yet
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

		this.now = this.getNow();

		// data object
		this.event = {};
		this.curagoEvent = {};

		// checking given configuration
		if (typeof config === "string") {
			this.parse(config);
		} else if (typeof config === "object") {
			this.settings = this.helpers.extend({}, this.defaults, config);
		}

		// Avoid clobbering the window scope
		// possibly it;s not necessary
		if (window === this) return new EventParser(config);


		// event object template
		this.eventTemplate = {
			sourceText: "",
			parsedText: "",
			parsedTitle: "",
			parsedDates: [],
			parsedTimes: [],
			parsedNames: [],
			parsedLocations: [],
			parsedRecurrencies: [],

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

			//recurrenceExpression: /(((?:at|on)?((every|each)?(?:\s)?((?:(\d+)(?:st|nd|rd|th))|first|next|last|other)?)(?:\s)?((sunday|monday|tuesday|wednesday|thursday|friday|saturday)(?:s)?(?:\s)?(?:,|and|&)?\s?){2,})|((every|each)\s+?(?:other|last|first|next)?\s?((sunday|monday|tuesday|wednesday|thursday|friday|saturday)|(weekday|weekend|week|month|day|year)))|((sunday|monday|tuesday|wednesday|thursday|friday|saturday)s|(dai|week|month|year)ly|weekends|weekdays))/gi,
			recurrenceExpression: /((?:at|on)\s)?(((every|each)\s)?((((sunday|monday|tuesday|wednesday|thursday|friday|saturday)(?:s)?(?:\s)?(?:,|and|&)?\s?){2,})|((january|february|march|april|may|june|july|august|september|october|november|december)(?:\s)?(?:,|and|&)?\s?){2,}))|((every|each)\s(((?:((?:(twenty|thirty(?:-|\s))?(first|second|third|fourth|fifth|sixth|seventh|eighth|nineth|tenth|eleventh|twelfth|thirteenth|fourteenth|fifteenth|sixteenth|seventeenth|eighteenth|nineteenth))|(?:tenth|twentieth|thirtieth))|(\d+)(?:st|nd|rd|th))|next|last|other)?\s)?((sunday|monday|tuesday|wednesday|thursday|friday|saturday)(?:s)?|(january|february|march|april|may|june|july|august|september|october|november|december)|(weekday|weekend|week|month|day|year)))|(dai|week|month|year)ly|weekends|weekdays/gi,
			/*recurrenceExpression: new RegExp('' +
			 '((?:at|on)\\s)?' +
			 '?(((every|each)\\s)?' +
			 '((' +
			 '((' + this.sets.weekday.join('|') + ')(?:s)?(?:\\s)?(?:,|and|&)\\s){2,})|' +
			 '((' + this.sets.month.join('|') + ')?(?:\\s)?(?:,|and|&)\\s){2,}))|' +
			 '', 'gi')*/

			/*recurrenceTimes:
			 new RegExp(

			 ),*/

			// todo: possible except rules, should be checked
			recurrenceExcepts: /(?:except)(.+?)(?=on|at|with|from|to|(un)?till?)/gi,

			numbers: {
				numerical: /\b(?:(\d+)(st|nd|rd|th)\b)/gi,
				ordinal: new RegExp(
					'(?:(' + this.sets.number.prefix.join('|') + '(?:-|\\s))?(' + this.sets.number.ordinal.join('|') + '))|' +
					'(?:tenth|twentieth|thirtieth)' +
					'', 'gi'),
				normal: new RegExp(
					'((?:(?:(?:' + this.sets.number.prefix.join('|') + ')(?:-|\\s))?(' + this.sets.number.normal.join('|') + '))|' +
					'(?:ten|' + this.sets.number.prefix.join('|') + '))', 'gi')
			},
			// dates detectors
			dates: {

				formatted: /((?:(?:on|at)\s)?\d{1,2}\/\d{1,2}(?:\/(?:\d{4}|\d{2}))?)/gi,

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
					in: /(?:in\b\s(?:a\s)?(couple|(?:\d+)|(?:\b(?:twenty|thirty(?:-|\s))?\b(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen))|(?:twenty|thirty))?(?:\s)?(?:of\s)?(day|week|month|year)(?:s)?)/ig
				},
				// date ranges
				// from - to, in between
				// todo make ranges parsable?
				ranges: /s/ig

			},

			// todo: add AT, ON in front of detection block
			times: {
				formatted: /((?:(?:at|on)\s)?(?:\d{1,2})(?:\:)(?:\d{2}))/gi,
				//singleInstances: /(?:at|on)?(\d{1,2})(?:\:)(\d{2})(?:\s)?(am|pm)?|(\d{1,2})(?:\s)?(am|pm)/gi,
				singleInstances: /(?:(?:at|on)?(\d{1,2})(?:(?:\:)(\d{2}))(?:(?:\s)?(am|pm))?|(\d{1,2})(?:\s)?(am|pm))/gi,
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
				[/(?:\b)(noon)(?:\b)/i, '12:00'],
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

			var match, matches;

			event.isRecurrent = false;
			event.recurrenceText = "";

			// get recurrencies
			// todo: currently gets only one recurrence. That's pity.
			while (matches = this.patterns.recurrenceExpression.exec(event.parsedText)) {

				match = matches.filter(this.helpers.isUndefined);

				this.patterns.recurrenceExpression.lastIndex = matches.index + 1;

				event.isRecurrent = true;
				event.parsedText = event.parsedText.replace(match[0], '');

				event.parsedRecurrencies.push({
						index: matches.index,
						match: match[0]
					}
				);

			}

			if (!event.isRecurrent) {

				//event.recurrenceText = "";

			} else {

				//get all of exceptions for recurrencies
				while (match = this.patterns.recurrenceExcepts.exec(event.parsedText)) {
					event.recurrenceExceptionsText = match[0];
					event.parsedText = event.parsedText.replace(event.recurrenceExceptionsText, '');
				}

				/*if (match = /(every|each)/i.exec(event.recurrenceText)) {

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


				 }*/

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
							//console.warn('Unexpected value: ', matches[1]);
						}
						break;
				}
				subjectIndex = 2;
			} else {
				subjectIndex = 1;
			}

			return {
				last: hasLast,
				next: hasNext,
				self: hasSelf,
				number: hasNumber,
				subjectIndex: subjectIndex
			}
		},

		parseRelSuffix: function (matches) {
			//
		},

		parseDates: function (event) {
			var match, matches, formattedString;
			var now = this.getNow();
			// M D Y
			this.patterns.dates.mdyStrings.lastIndex = 0;
			while (matches = this.patterns.dates.mdyStrings.exec(event.parsedText)) {
				event.isValidDate = true;
				match = matches.filter(this.helpers.isUndefined);

				this.patterns.dates.mdyStrings.lastIndex = matches.index + 1;

				// changing to MM/DD || MM/DD/YYYY
				formattedString =
					(this.sets.month.indexOf(match[1]) + 1) + '/' + parseInt(match[2]) + ((match.length == 4) ?
					'/' + match[3] : "");
				event.parsedText = event.parsedText.replace(match[0], formattedString);

				event.parsedDates.push({
						index: matches.index,
						match: match[0],
						formattedDate: formattedString,
						hasYear: match.length == 4,
						dt: (match.length == 4) ? new Date(match[3], this.sets.month.indexOf(match[1]), match[2]) : new Date(now.getFullYear(), this.sets.month.indexOf(match[1]), match[2]),
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

				match = matches.filter(this.helpers.isUndefined);
				this.patterns.dates.dmyStrings.lastIndex = matches.index + 1;

				// changing to MM/DD || MM/DD/YYYY
				formattedString =
					(this.sets.month.indexOf(match[2]) + 1) + '/' + parseInt(match[1]) + ((match.length == 4) ?
					'/' + match[3] : "");

				event.parsedText = event.parsedText.replace(match[0], formattedString);

				event.parsedDates.push({
					index: event.preConvertedString.indexOf(match[0]),
					match: match[0],
					formattedDate: formattedString,
					hasYear: match.length == 4,
					dt: (match.length == 4) ? new Date(match[3], this.sets.month.indexOf(match[2]), match[1]) : new Date(now.getFullYear(), this.sets.month.indexOf(match[2]), match[1]),
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

			while (matches = this.patterns.times.singleInstances.exec(event.parsedText)) {
				//if (this.patterns.dates.singleInstances.lastIndex) console.log(this.patterns.dates.singleInstances.lastIndex);

				event.isValidDate = true;

				match = matches.filter(this.helpers.isUndefined);
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


					event.parsedTimes.push({
						index: matches.index,
						hasMeridian: meridian || false,
						match: match[0],
						formattedTime: formattedString,
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
			//console.log('parsing: ', event.parsedText);
			var matches, match, targetDate, formattedString, relPrefix, relSuffix;

			var now = this.getNow();

			// Convert common relative dates given
			while (matches = this.patterns.dates.relative.common.exec(event.parsedText)) {

				formattedString = undefined;
				event.isValidDate = true;

				match = matches.filter(this.helpers.isUndefined);
				this.patterns.dates.relative.common.lastIndex = matches.index + 1;

				relPrefix = this.parseRelPrefix(match);
				//relSuffix = this.parseRelSuffix(match);

				//
				// todo: if relative date relates to today, should check time. if it already passed, check next relative.


				if (this.sets.weekday.indexOf(match[relPrefix.subjectIndex]) >= 0) {
					// weekdays
					var subjectDay = this.sets.weekday.indexOf(match[relPrefix.subjectIndex]);
					targetDate = this.helpers.getNextWeekday(now, subjectDay, relPrefix);
				} else if (this.sets.month.indexOf(match[relPrefix.subjectIndex]) > 0) {
					// months
					var subjectMonth = this.sets.month.indexOf(match[relPrefix.subjectIndex]) + 1;
					targetDate = this.helpers.getNextMonth(now, subjectMonth, relPrefix);
				} else {

					// single
					switch (match[relPrefix.subjectIndex]) {
						case 'tomorrow':
							targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
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

							} else if (relPrefix.last) {
								//console.log('got last');


							} else if (relPrefix.number) {
								// at Nth day

							}
							break;
						case 'week':
							if (relPrefix.next) {
								targetDate = new Date().setFullYear(now.getFullYear(), now.getMonth(), now.getDate() + 7);
							}
							break;
						case 'month':
							if (relPrefix.next) {
								targetDate = new Date().setFullYear(now.getFullYear(), now.getMonth() + 1, now.getDate());
								formattedString = this.sets.month[now.getMonth() + 1];
								event.parsedText = event.parsedText.replace(match[0], formattedString);
								event = this.parseDates(event);

								//start parse from beginning
								this.patterns.dates.relative.common.lastIndex = 0;
							} else if (relPrefix.self) {
								targetDate = new Date().setFullYear(now.getFullYear(), now.getMonth(), now.getDate());
								formattedString = this.sets.month[now.getMonth()];
								event.parsedText = event.parsedText.replace(match[0], formattedString);
								event = this.parseDates(event);

								//start parse from beginning
								this.patterns.dates.relative.common.lastIndex = 0;
							}
							break;
						case 'year':
							if (relPrefix.next) {
								targetDate = new Date().setFullYear(now.getFullYear() + 1, now.getMonth() + 1, now.getDate());
							}
							break;
						default:
							//console.log('wat?');
							break;
					}
				}

				if (!formattedString) {
					formattedString = (targetDate.getMonth() + 1) + '/' + targetDate.getDate() + '/' + targetDate.getFullYear(); // MM/DD/YYYY
					event.parsedText = event.parsedText.replace(match[0], formattedString);

					event.parsedDates.push({
						index: event.preConvertedString.indexOf(match[0]),
						match: match[0],
						formattedDate: formattedString,
						dt: new Date(targetDate),
						date: {
							month: targetDate.getMonth(),
							date: targetDate.getDate(),
							year: targetDate.getFullYear()
						}
					});
				}

				//console.log(targetDate, event);

				return event;
			}


			// Day after tomorrow (should be only one mention, ok?)
			if (matches = event.parsedText.match(this.patterns.dates.relative.dayAfter)) {

				targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2);
				formattedString = targetDate.getMonth() + '/' + targetDate.getDate() + '/' + targetDate.getFullYear();

				event.parsedText = event.parsedText.replace(matches[0], formattedString);

				event.parsedDates.push({
					index: event.preConvertedString.indexOf(matches[0]),
					match: match[0],
					formattedDate: formattedString,
					dt: new Date(targetDate),
					date: {
						month: targetDate.getMonth(),
						date: targetDate.getDate(),
						year: targetDate.getFullYear()
					}
				});
			}

			while (matches = this.patterns.dates.relative.in.exec(event.parsedText)) {

				match = matches.filter(this.helpers.isUndefined);

				if (match.length == 2) {
					targetDate = this.helpers.getDateShifted(now, match[1], 1);
				} else if (match.length == 3) {
					targetDate = this.helpers.getDateShifted(now, match[2], match[1]);
				}


				formattedString = targetDate.getMonth() + '/' + targetDate.getDate() + '/' + targetDate.getFullYear();

				event.parsedText = event.parsedText.replace(matches[0], formattedString);

				event.parsedDates.push({
					index: event.preConvertedString.indexOf(matches[0]),
					match: match[0],
					formattedDate: formattedString,
					dt: new Date(targetDate),
					date: {
						month: targetDate.getMonth(),
						date: targetDate.getDate(),
						year: targetDate.getFullYear()
					}
				});
			}

			return event;
		},

		parse: function (source) {

			if (!source) throw "Nothng to parse";

			var matches;

			// store preformatted sting to store date index positions

			var event = JSON.parse(JSON.stringify(this.eventTemplate));
			//new Object(); //= extend({}, this.eventTemplate);
			//this.event = event;

			event.parsedText = source;
			event.parsedText = this.cleanup(event.parsedText);
			event.preConvertedString = event.parsedText;
			event.parsedTitle = event.parsedText;

			this.now = this.getNow();
			var now = this.now;

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
			 *  2) parse time ranges
			 *
			 *
			 * */


			// not useful actually. if we got all dates parsed/
			// todo: figure it out.
			if (false || event.parsedTimes.length == 411111) {
				while (matches = this.patterns.times.fullRanges.exec(event.parsedText)) {
					//console.log('time full ranges');
				}
			}

			// should check if there is no enough dates parsed
			if (event.parsedTimes.length == 1) {

				while (matches = this.patterns.times.partialX2Time.exec(event.parsedText)) {
					//console.log('time partial ranges');
				}

				while (matches = this.patterns.times.partialTime2X.exec(event.parsedText)) {
					//console.log('time partial ranges');
				}
			}

			//parse date ranges

			//parse relatives


			//
			// Finalize dates, make ajustements
			// ================================

			event.parsedTitle = event.parsedText;
			event.parsedTitle = event.parsedTitle.replace(this.patterns.dates.formatted, '');
			event.parsedTitle = event.parsedTitle.replace(this.patterns.times.formatted, '');
			//event.parsedTitle = event.parsedTitle.replace(/ +/g, ' ').trim(); // remove multiple spaces

			if (!event.startDate) {

				if (event.parsedDates.length) {
					// has dates
					if (event.parsedTimes.length) {
						// has times

						event.startDate =
							new Date(
								(event.parsedDates[0].hasYear) ? event.parsedDates[0].date.year : now.getFullYear(),
								event.parsedDates[0].date.month,
								event.parsedDates[0].date.date,
								event.parsedTimes[0].time.hours,
								event.parsedTimes[0].time.minutes, 0, 0
							);


						if (event.parsedTimes.length == 2) {
							if (event.parsedDates.length == 1) {
								event.endDate =
									new Date(
										(event.parsedDates[0].hasYear) ? event.parsedDates[0].date.year : now.getFullYear(),
										event.parsedDates[0].date.month,
										event.parsedDates[0].date.date,
										event.parsedTimes[1].time.hours,
										event.parsedTimes[1].time.minutes, 0, 0
									);
							} else if (event.parsedDates.length == 2) {
								event.endDate =
									new Date(
										(event.parsedDates[1].hasYear) ? event.parsedDates[1].date.year : now.getFullYear(),
										event.parsedDates[1].date.month,
										event.parsedDates[1].date.date,
										event.parsedTimes[1].time.hours,
										event.parsedTimes[1].time.minutes, 0, 0
									);
							}

						}
					} else {
						event.startDate =
							new Date(
								(event.parsedDates[0].hasYear) ? event.parsedDates[0].date.year : now.getFullYear(),
								event.parsedDates[0].date.month,
								event.parsedDates[0].date.date,
								0, 0, 0, 0
							);

							event.allDay = true;

					}

				} else {
					// no dates

					if (event.parsedTimes.length) {
						// has times
						if (event.parsedTimes.length == 1) {
							event.startDate =
								new Date(now.getFullYear(), now.getMonth(), now.getDate(), event.parsedTimes[0].time.hours, event.parsedTimes[0].time.minutes, 0, 0);


						} else if (event.parsedTimes.length == 2) {
							event.startDate =
								new Date(now.getFullYear(), now.getMonth(), now.getDate(), event.parsedTimes[0].time.hours, event.parsedTimes[0].time.minutes, 0, 0);
							event.endDate =
								new Date(now.getFullYear(), now.getMonth(), now.getDate(), event.parsedTimes[1].time.hours, event.parsedTimes[1].time.minutes, 0, 0);

						}

					} else {
						event.allDay = true;
						// has no dates captured, setting event startDate from now

						event.startDate =
							new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), 0, 0);

						//console.info('No dates and times detected');
						event.isValidDate = false;
					}
				}
			}

			return {
				title: event.parsedTitle.trim(),
				startDate: (event.startDate instanceof Date) ? new Date(event.startDate) : "",
				endDate: (event.endDate instanceof Date) ? new Date(event.endDate) : "",
				allDay: event.allDay
				// Recurrencies: event.parsedRecurrencies
			};
		},

		// curago object wrapper
		getEventCurago: function (event) {

			return {
				title: this.event.parsedText.trim() || "",
				starts_at: new Date(event.startDate) || null,
				ends_at: new Date(event.endDate) || null
				//location_name: (event.parsedLocations.length) ? event.parsedLocations[0] : ""
				//separation: this.event.setPosition
			}

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
				while (result.length < size) result = "0" + result;
				return result;
			},

			getOrdinal: function (number) {
				number = parseInt(number);
				var s = ["th", "st", "nd", "rd"],
					v = number % 100;
				return number + (s[(v - 20) % 10] || s[v] || s[0]);
			},

			strToNumber: function (string) {
				var re = this.sets.number;
				if (this.patterns.numbers.normal.test(string)) {
					var parts, number;
					//var matches = this.patterns.numbers.normal.exec(string);

					parts = string.split(/\s|-/g);

					if (parts.length = 2) {
						number =
							(re.prefix.indexOf(parts[0]) + 1) + "" +
							(re.normal.indexOf(parts[1]) + 1);
					} else {
						number =
							(re.normal.indexOf(parts[0]) > 0) ?
							re.normal.indexOf(parts[0]) + 1 :
							(['ten', 'twenty', 'thirty'].indexOf(parts[0]) + 1) * 10;
					}

					return parseInt(number);

				} else {
					return null;
				}

			},


			getDateShifted: function (dt, dateModifier, amount) {

				amount = amount || 1;

				if (typeof amount == 'string' && isNaN(amount)) {
					switch (amount) {
						case "couple":
							amount = 2;
							break;
						default:
							amount = this.helpers.strToNumber(amount);
							break;
					}

				} else {
					amount = parseInt(amount);
				}

				switch (dateModifier) {
					case "day":
						return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate() + amount);
					case "week":
						return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate() + (7 * amount));
					case "month":
						return new Date(dt.getFullYear(), dt.getMonth() + amount, dt.getDate());
					case "year":
						return new Date(dt.getFullYear() + amount, dt.getMonth(), dt.getDate());
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

				var daysUntilNext = targetWeekday - currentWeekday + ((currentWeekday <= targetWeekday) ? 0 : 7);

				if (relativeStates.next && currentWeekday == targetWeekday) daysUntilNext += 7;
				if (relativeStates.self && currentWeekday == targetWeekday) daysUntilNext -= 7;

				if (relativeStates.number) {
					// parse suffix (1st monday, 11th saturday) as well
					daysUntilNext = (relativeStates.number > 1) ? daysUntilNext + (7 * relativeStates.number) : daysUntilNext;
				}

				return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate() + daysUntilNext);

			},

			isSameDay: function (date1, date2) {
				return date1.getMonth() === date2.getMonth() && date1.getDate() === date2.getDate() && date1.getFullYear() === date2.getFullYear();
			}
		}


	};

	/** @export */
	window.EventParser = EventParser;

})();