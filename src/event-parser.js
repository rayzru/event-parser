/*
 * Event Parser
 * Natural Language Processing library for parsing event-related text into event object.
 * @author Andrew "RayZ" Rumm
 *
 *
 * */

(function () {

	// constructor
	function EventParser(config) {

		// Default configuration
		var defaults = {
			sourceText: null,
			weekStart: 'sunday', // monday|sunday;

			onDateParsed: function () {
				// callback triggered on date parsed event.
			},

			onTimeParsed: function () {
				// callback triggered on time parsed event.
			}
		};

		// checking given configuration
		this.settings = this.helpers.extend({}, defaults, config);


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

		this.sets = {
			weekday: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
			month: ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'],
			number: {
				prefix: ['twenty', 'thirty'],
				ordinal: ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'nineth', 'tenth', 'eleventh', 'twelfth', 'thirteenth', 'fourteenth', 'fifteenth', 'sixteenth', 'seventeenth', 'eighteenth', 'nineteenth'],
				normal: ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen']
			},
			range: {
				splitter: ['to', '(?:-+)?-', '(?:un)?till?', 'through', 'thru', 'and', 'ends'],
				prefix: ['between', 'from', 'start(?:ing)?', 'on', 'at']
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

				formatted: /(?:(?:on|at)\s)?\b[^\/\d+](\d{1,2})\/(\d{1,2})(?:\/(\d{4}|\d{2}))?(?!\/)\b/gi,

				// june 12, june 12th, june 12th 2001, "june 12th, of 2001"
				mdyStrings: /(?:(?:on|at)\s)?(?:(january|february|march|april|may|june|july|august|september|october|november|december)(?:(?:(?:\s?,)?\s?of)?\s?(\d{1,2}(?:\s)?(?:th|st|nd|rd)?)(?!(:|(?:\s+)?am|(?:\s+)?pm))\b)(?:(?:\s?,)?(?:\s?of\s?)?(?:\s)?(20\d{2}|\d{2}[6-9]\d+))?)/gi,

				//12 july, 12th of july, 12th of july of 2012
				dmyStrings: /(?:(?:on|at)\s)?(?:(\d{1,2}(?:\s)?(?:|th|st|nd|rd)?)\b(?:\sof\s)?\s?(january|february|march|april|may|june|july|august|september|october|november|december)(?:(?:\s?,)?(?:\s?of\s?)?(20\d{2}|\d{2}[6-9]\d+))?)/gi,

				// relative closest dates aliases
				// on friday, on other friday, at monday, at next monday, tomorrow, today, at 2nd tuesday
				relative: {
					common: /(?:(?:on|at|to)\s)?(?:(next|this|last|after|other|\d(?:st|nd|rd|th)?)\s)?(today|tomorrow|month|week|year|sunday|monday|tuesday|wednesday|thursday|friday|saturday)/ig,
					dayAfter: /(\bday\safter\stomorrow\b)/ig,
					in: /(?:in\b\s(?:a\s)?(couple|(?:\d+)|(?:\b(?:twenty|thirty(?:-|\s))?\b(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen))|(?:twenty|thirty))?(?:\s)?(?:of\s)?(day|week|month|year)(?:s)?)/ig
				},

				// date ranges
				// from - to, in between
				ranges: {
					formatted: new RegExp('(?:' + this.sets.range.prefix.join('|') + ')?(?:\\s)?(\\d{1,2}\\/\\d{1,2}(?:\\/\\d{2,4})?)(?:(?:\\s)?(' + this.sets.range.splitter.join('|') + ')(?:\\s)?)(\\d{1,2}\\/\\d{1,2}(?:\\/\\d{2,4})?)', 'gi'),
					from: new RegExp('(?:' + this.sets.range.prefix.join('|') + ')?(?:\\s)?[^\/\\d+](\\d{1,2})(?:(?:\\s)?(' + this.sets.range.splitter.join('|') + ')(?:\\s)?)(\\d{1,2}\\/\\d{1,2}(?:\\/\\d{2,4})?)', 'gi'),
					to: new RegExp('(?:' + this.sets.range.prefix.join('|') + ')?(?:\\s)?(\\d{1,2}\\/\\d{1,2}(?:\\/\\d{2,4})?)(?:(?:\\s)?(' + this.sets.range.splitter.join('|') + ')(?:\\s)?)(\\d{1,2}(?!\\/))', 'gi'),
					between: /\s/ig
				}
			},

			times: {
				formatted: /((?:(?:at|on)\s)?(?:\d{1,2})(?::)(?:\d{2}))/gi,
				singleInstances: /(?:(?:at|on)?(\d{1,2})(?:(?::)(\d{2}))(?:(?:\s)?(am|pm))?|(\d{1,2})(?:\s)?(am|pm))/gi,

				fullRanges: new RegExp('((?:' + this.sets.range.prefix.join('|') + '\\s)?(?:\\d{1,2})(?::)(\\d{2}))\\s?(?:' + this.sets.range.splitter.join('|') + ')\\s?((\\d{1,2})(?::)(\\d{2}))', 'gi'),
				partialX2Time: new RegExp('((?:' + this.sets.range.prefix.join('|') + '\\s)?(?:\\d{1,2})(?::)(\\d{2}))\\s?(?:' + this.sets.range.splitter.join('|') + ')\\s?((\\d{1,2})(?:\\:)(\\d{2}))', 'gi'),
				partialTime2X: new RegExp('((?:' + this.sets.range.prefix.join('|') + '\\s)?(?:\\d{1,2})(?::)(\\d{2}))\\s?(?:' + this.sets.range.splitter.join('|') + ')\\s?((\\d{1,2})(?:\\:)(\\d{2}))', 'gi')

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
				[/(\bnov(?:ember)?\b)/i, 'november'],
				[/(\bdec(?:ember)?\b)/i, 'december']
			],

			holidays: [
				[/(\bthanksgiving\b)/gi, 'every 4th thuesday of november'], 	// USA, but not Canada
				[/\b(christmas|xmas|x-mas)\b/gi, '12/25'], 					// USA?
				[/(\bnew\s?year(:?'s)?(\seve)\b)/gi, '12/31 at 23:00'],
				[/(\bnew\s?year(:?'s)\b)/gi, '1/1'],
				[/(\bapril\sfools\b)/gi, '4/1'],
				[/(\bhalloween\b)/gi, '10/30']
			]
		};

		this.now = undefined;

		// using one EventParser instance
		if (!(this instanceof EventParser )) {
			return new EventParser(this.settings);
		}

		return this;
	}

	EventParser.prototype = {

		getNow: function () {
			return (this.now) ? new Date(this.now.getTime()) : new Date();
		},

		cleanup: function (source) {
			var formattedString, match, matches, i;

			// Complete uncompleted, shortened words, parts and abbrreveations.
			for (i = 0; i < this.patterns.nicers.length; i++) {
				source = source.replace(this.patterns.nicers[i][0], this.patterns.nicers[i][1]);
			}

			//convert holidays
			for (i = 0; i < this.patterns.holidays.length; i++) {
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
			var match, matches, formattedString, date, month, year;

			this.patterns.dates.formatted.lastIndex = 0;
			while (matches = this.patterns.dates.formatted.exec(event.parsedText)) {

				match = matches.filter(this.helpers.isUndefined);

				date = (parseInt(match[1]) <= 31 && parseInt(match[1]) >= 1) ? parseInt(match[1]) : null;
				month = (parseInt(match[0]) <= 12 && parseInt(match[0]) >= 1) ? parseInt(match[0]) : null;
				year = ((match.length == 4) ? parseInt(match[3]) : null);

				if (date && month && this.helpers.isValidDate(match[0])) {

					event.hasValidDate = true;

					formattedString = match[0];

					event.parsedDates.push({
							index: matches.index,
							match: formattedString,
							formattedDate: formattedString,
							hasYear: this.helpers.isNumeric(year),
							date: {
								month: month,
								date: date,
								year: year
							}
						}
					);

					if (this.settings.onDateParsed && typeof(this.settings.onDateParsed) === "function") {
						this.settings.onDateParsed();
					}
				}

			}

			// M D Y
			this.patterns.dates.mdyStrings.lastIndex = 0;
			while (matches = this.patterns.dates.mdyStrings.exec(event.parsedText)) {

				match = matches.filter(this.helpers.isUndefined);

				date = (parseInt(match[2]) <= 31 && parseInt(match[2]) >= 1) ? parseInt(match[2]) : null;
				month = (this.sets.month.indexOf(match[1]) >= 0) ? this.sets.month.indexOf(match[1]) + 1 : null;
				year = ((match.length == 4) ? parseInt(match[3]) : null);
				formattedString = month + '/' + date + ((year) ? '/' + year : '');

				this.patterns.dates.mdyStrings.lastIndex = matches.index + 1;

				// changing to MM/DD || MM/DD/YYYY


				if (date && month && this.helpers.isValidDate(formattedString)) {

					event.hasValidDate = true;

					event.parsedText = event.parsedText.replace(match[0], formattedString);

					event.parsedDates.push({
							index: matches.index,
							match: match[0],
							formattedDate: formattedString,
							hasYear: this.helpers.isNumeric(year),
							date: {
								month: month,
								date: date,
								year: year
							}
						}
					);

					if (this.settings.onDateParsed && typeof(this.settings.onDateParsed) === "function") {
						this.settings.onDateParsed();
					}
				}
			}

			// D M Y
			this.patterns.dates.dmyStrings.lastIndex = 0;
			while (matches = this.patterns.dates.dmyStrings.exec(event.parsedText)) {

				event.isValidDate = true;

				match = matches.filter(this.helpers.isUndefined);

				this.patterns.dates.dmyStrings.lastIndex = matches.index + 1;

				date = (parseInt(match[1]) <= 31 && parseInt(match[1]) >= 1) ? parseInt(match[1]) : null;
				month = (this.sets.month.indexOf(match[2]) >= 0) ? this.sets.month.indexOf(match[2]) + 1 : null;
				year = ((match.length == 4) ? parseInt(match[3]) : null);

				formattedString = month + '/' + date + ((year) ? '/' + year : '');

				if (date && month && this.helpers.isValidDate(formattedString)) {

					event.hasValidDate = true;

					event.parsedText = event.parsedText.replace(match[0], formattedString);

					event.parsedDates.push({
							index: matches.index,
							match: match[0],
							formattedDate: formattedString,
							hasYear: this.helpers.isNumeric(year),
							date: {
								month: month,
								date: date,
								year: year
							}
						}
					);

					if (this.settings.onDateParsed && typeof(this.settings.onDateParsed) === "function") {
						this.settings.onDateParsed();
					}

				}
			}

			// sort parsed dates in incremental order.
			event.parsedDates.sort(function (a, b) {
				return (a.dt < b.dt) ? -1 : (a.dt > b.dt) ? 1 : 0;
			});

			return event;
		},

		parseTimes: function (event) {
			var hours, minutes, meridian, match, matches, formattedString;

			while (matches = this.patterns.times.singleInstances.exec(event.parsedText)) {
				//if (this.patterns.dates.singleInstances.lastIndex) console.log(this.patterns.dates.singleInstances.lastIndex);

				event.isValidDate = true;

				match = matches.filter(this.helpers.isUndefined);
				if (match.length >= 3) {

					if (match[match.length - 1].toLowerCase() === 'am' || match[match.length - 1].toLowerCase() === 'pm') {

						if (
							parseInt(match[1]) > 12 ||
							parseInt(match[1]) < 0 ||
							(match.length == 3 &&
							(parseInt(match[2]) > 59 ||
							parseInt(match[2]) < 0))
						) continue;

						meridian = match[match.length - 1].toLowerCase();
						hours = (meridian == 'am' && parseInt(match[1]) == 12) ? 0 :
							(meridian == 'pm' && parseInt(match[1]) < 12) ? parseInt(match[1]) + 12 :
								parseInt(match[1]);
						minutes = (match.length == 3) ? 0 : parseInt(match[2]);
					} else {
						if (
							parseInt(match[1]) > 23 ||
							parseInt(match[1]) < 0 ||
							parseInt(match[2]) > 59 ||
							parseInt(match[2]) < 0
						) continue;
						meridian = undefined;
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

					if (this.settings.onTimeParsed && typeof(this.settings.onTimeParsed) === "function") {
						this.settings.onTimeParsed();
					}

				}
			}

			return event;
		},

		parseRelativeDates: function (event) {

			var matches, match, targetDate, formattedString, relPrefix;

			var now = this.getNow();


			// Day after tomorrow (should be only one mention, ok?)
			if (matches = event.parsedText.match(this.patterns.dates.relative.dayAfter)) {

				targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2);
				formattedString = (targetDate.getMonth() + 1) + '/' + targetDate.getDate() + '/' + targetDate.getFullYear();

				event.parsedText = event.parsedText.replace(matches[0], formattedString);

				event.parsedDates.push({
					index: event.preConvertedString.indexOf(matches[0]),
					match: matches[0],
					formattedDate: formattedString,
					date: {
						month: targetDate.getMonth() + 1,
						date: targetDate.getDate(),
						year: targetDate.getFullYear()
					}
				});
			}

			// in x days|weeks|month
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
					date: {
						month: targetDate.getMonth() + 1,
						date: targetDate.getDate(),
						year: targetDate.getFullYear()
					}
				});

				if (this.settings.onDateParsed && typeof(this.settings.onDateParsed) === "function") {
					this.settings.onDateParsed();
				}
			}


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

				// todo: DONT USE DATE OBJECT. Dates can be uncomplete if year not specified.

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
					switch (match[relPrefix.subjectIndex].toLowerCase()) {
						case 'tomorrow':
							targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
							break;
						case 'today':
							// today
							targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
							break;
						case 'day':
							if (relPrefix.next) {
								// same as tomorrow
								// at next day
								targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

							} else if (relPrefix.last) {


							} else if (relPrefix.number) {
								// at Nth day

							}
							break;
						case 'week':
							if (relPrefix.next) {
								targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 0, 0, 0);
							}
							break;
						case 'month':
							if (relPrefix.next) {
								targetDate = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate(), 0, 0, 0);
								formattedString = this.sets.month[now.getMonth() + 1];
								event.parsedText = event.parsedText.replace(match[0], formattedString);
								event = this.parseDates(event);

								//start parse from beginning
								this.patterns.dates.relative.common.lastIndex = 0;
							} else if (relPrefix.self) {
								targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
								formattedString = this.sets.month[now.getMonth()];
								event.parsedText = event.parsedText.replace(match[0], formattedString);
								event = this.parseDates(event);

								//start parse from beginning
								this.patterns.dates.relative.common.lastIndex = 0;
							}
							break;
						case 'year':
							if (relPrefix.next) {
								targetDate = new Date(now.getFullYear() + 1, now.getMonth() + 1, now.getDate(), 0, 0, 0);
							}
							break;
						default:
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
							month: targetDate.getMonth() + 1,
							date: targetDate.getDate(),
							year: targetDate.getFullYear()
						}
					});

					if (this.settings.onDateParsed && typeof(this.settings.onDateParsed) === "function") {
						this.settings.onDateParsed();
					}

				}

				return event;
			}

			return event;
		},

		parseDateRanges: function (event) {

			var formattedString, replacement, match, matches, date, month, year;

			while (matches = this.patterns.dates.ranges.from.exec(event.parsedText)) {

				if (event.parsedDates.length == 1) {

					match = matches.filter(this.helpers.isUndefined);

					date = (parseInt(match[1]) <= 31 && parseInt(match[1]) >= 1) ? parseInt(match[1]) : null;
					month = event.parsedDates[0].date.month;
					year = ((event.parsedDates[0].hasYear) ? event.parsedDates[0].date.year : null);

					formattedString = month + '/' + date + ((year) ? '/' + year : '');
					if (date && month && this.helpers.isValidDate(formattedString)) {
						replacement = month + '/' + date + ((year) ? '/' + year : '') + ' ' + match[2] + ' ' + match[3];
						event.parsedText = event.parsedText.replace(match[0], replacement);

						event.parsedDates.push({
							index: event.preConvertedString.indexOf(matches[0]),
							match: matches[0],
							formattedDate: month + '/' + date + ((year) ? '/' + year : ''),
							hasYear: event.parsedDates[0].hasYear,
							date: {
								month: month,
								date: date,
								year: year
							}
						});

						if (this.settings.onDateParsed && typeof(this.settings.onDateParsed) === "function") {
							this.settings.onDateParsed();
						}


					}
				} else {
					// todo: sure this is bad behaviour, i shouldnt relate to stupid logic that there is just one dates were parsed. I should get related date by match index position
					console.error('Cannot comeplete range. There is no dates detected or there more than 1 date in cache.')
				}
			}

			while (matches = this.patterns.dates.ranges.to.exec(event.parsedText)) {

				if (event.parsedDates.length == 1) {

					match = matches.filter(this.helpers.isUndefined);


					date = (parseInt(match[3]) <= 31 && parseInt(match[3]) >= 1) ? parseInt(match[3]) : null;
					month = event.parsedDates[0].date.month;
					year = ((event.parsedDates[0].hasYear) ? event.parsedDates[0].date.year : null);

					formattedString = month + '/' + date + ((year) ? '/' + year : '');
					if (date && month && this.helpers.isValidDate(formattedString)) {
						replacement = match[1] + ' ' + match[2] + ' ' + event.parsedDates[0].date.month + '/' + match[3] + ((event.parsedDates[0].hasYear) ? '/' + event.parsedDates[0].date.year : '');
						event.parsedText = event.parsedText.replace(match[0], replacement);
					}

					event.parsedDates.push({
						index: event.preConvertedString.indexOf(matches[0]),
						match: matches[0],
						formattedDate: month + '/' + date + ((year) ? '/' + year : ''),
						hasYear: event.parsedDates[0].hasYear,
						date: {
							month: month,
							date: date,
							year: year
						}
					});

					if (this.settings.onDateParsed && typeof(this.settings.onDateParsed) === "function") {
						this.settings.onDateParsed();
					}

				} else {
					// todo: sure this is bad behaviour, i shouldnt relate to stupid logic that there is just one dates were parsed. I should get related date by match index position
					console.error('Cannot comeplete range. There is no dates detected or there more than 1 date in cache.')
				}


			}

			return event;
		},

		parse: function (source) {

			if (!source) throw "Nothng to parse";

			// store preformatted sting to store date index positions

			var event = JSON.parse(JSON.stringify(this.eventTemplate));

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

			event = this.parseDateRanges(event);

			//sort dates

			//
			// Finalize dates, make ajustements
			// ================================

			event.parsedTitle = event.parsedText;
			event.parsedTitle = event.parsedTitle.replace(this.patterns.dates.ranges.formatted, '');
			event.parsedTitle = event.parsedTitle.replace(this.patterns.dates.formatted, '');
			event.parsedTitle = event.parsedTitle.replace(this.patterns.times.formatted, '');
			event.parsedTitle = event.parsedTitle.replace(/ +(?= )/g, '').trim(); // remove multiple spaces

			// get parsedDates in order. Incomplete date range parser can makes it following in wrong order.
			event.parsedDates = event.parsedDates.sort(this.helpers.sortByParsedDates);

			/*
			 // works with chrome only
			 console.groupCollapsed('Parser found Dates (' + event.parsedDates.length + ') and Times (' + event.parsedTimes.length + ')');
			 console.info('Dates: ' + event.parsedDates.length);
			 console.dir(event.parsedDates);
			 console.info('Times: ' + event.parsedTimes.length);
			 console.dir(event.parsedTimes);
			 console.groupEnd();
			 */

			if (!event.startDate) {

				if (event.parsedDates.length) {
					// has dates
					if (event.parsedTimes.length) {
						// has times
						event.allDay = false;


						event.startDate =
							new Date(
								(event.parsedDates[0].hasYear) ? event.parsedDates[0].date.year : now.getFullYear(),
								event.parsedDates[0].date.month - 1,
								event.parsedDates[0].date.date,
								event.parsedTimes[0].time.hours,
								event.parsedTimes[0].time.minutes, 0, 0
							);


						if (event.parsedTimes.length == 2) {

							// suggest time is sheduled on the next day when last hours are less that prevoious.
							var suggestDayDelta = (parseFloat(event.parsedTimes[0].time.hours + '.' + event.parsedTimes[0].time.minutes) > parseFloat(event.parsedTimes[1].time.hours + '.' + event.parsedTimes[1].time.minutes)) ? 1 : 0;

							if (event.parsedDates.length == 1) {
								event.endDate =
									new Date(
										(event.parsedDates[0].hasYear) ? event.parsedDates[0].date.year : now.getFullYear(),
										event.parsedDates[0].date.month - 1,
										event.parsedDates[0].date.date + suggestDayDelta,
										event.parsedTimes[1].time.hours,
										event.parsedTimes[1].time.minutes, 0, 0
									);
							} else if (event.parsedDates.length == 2) {
								event.endDate =
									new Date(
										(event.parsedDates[1].hasYear) ? event.parsedDates[1].date.year : (event.parsedDates[0].hasYear) ? event.parsedDates[0].date.year : now.getFullYear(),
										event.parsedDates[1].date.month - 1,
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
								event.parsedDates[0].date.month - 1,
								event.parsedDates[0].date.date,
								0, 0, 0, 0
							);

						if (event.parsedDates.length == 2) {
							event.endDate =
								new Date(
									(event.parsedDates[1].hasYear) ? event.parsedDates[1].date.year : (event.parsedDates[0].hasYear) ? event.parsedDates[0].date.year : now.getFullYear(),
									event.parsedDates[1].date.month - 1,
									event.parsedDates[1].date.date,
									0, 0, 0, 0
								);
						}

						event.allDay = true;

					}

				} else {
					// no dates

					if (event.parsedTimes.length) {
						// has times
						if (event.parsedTimes.length == 1) {

							event.allDay = false;

							event.startDate =
								new Date(
									now.getFullYear(),
									now.getMonth(),
									now.getDate(),
									event.parsedTimes[0].time.hours,
									event.parsedTimes[0].time.minutes,
									0, 0);


						} else if (event.parsedTimes.length == 2) {

							event.allDay = false;

							event.startDate =
								new Date(
									now.getFullYear(),
									now.getMonth(),
									now.getDate(),
									event.parsedTimes[0].time.hours,
									event.parsedTimes[0].time.minutes,
									0, 0);

							event.endDate =
								new Date(
									now.getFullYear(),
									now.getMonth(),
									now.getDate(),
									event.parsedTimes[1].time.hours,
									event.parsedTimes[1].time.minutes,
									0, 0);

						}

					} else {
						event.allDay = true;

						// has no dates captured
						event.startDate = null;
						event.endDate = null;

						event.isValidDate = false;
					}
				}
			}

			return {
				title: event.parsedTitle.trim(),
				startDate: (this.helpers.isDateObject(event.startDate)) ? new Date(event.startDate) : undefined,
				endDate: (this.helpers.isDateObject(event.endDate)) ? new Date(event.endDate) : undefined,
				allDay: event.allDay,
				isRecurrent: event.isRecurrent
				// Recurrencies: event.parsedRecurrencies
			};
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
			isValidDate: function (s) {
				var bits = s.split('/');

				// mm/dd/yy
				var y = bits[2], m = bits[0], d = bits[1];
				// Assume not leap year by default (note zero index for Jan)
				var daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

				// If evenly divisible by 4 and not evenly divisible by 100,
				// or is evenly divisible by 400, then a leap year
				if ((!(y % 4) && y % 100) || !(y % 400)) {
					daysInMonth[1] = 29;
				}
				return d <= daysInMonth[--m]
			},

			isDateObject: function (date) {
				return Object.prototype.toString.call(date) === '[object Date]';
			},

			isSameDay: function (date1, date2) {
				return date1.getMonth() === date2.getMonth() && date1.getDate() === date2.getDate() && date1.getFullYear() === date2.getFullYear();
			},

			isNumeric: function (n) {
				return (!isNaN(parseFloat(n)) && isFinite(n));
			},

			sortByParsedDates: function (a, b) {
				var aDate = new Date((a.hasYear) ? a.date.year : new Date().getFullYear(), a.date.month, a.date.date);
				var bDate = new Date((b.hasYear) ? b.date.year : new Date().getFullYear(), b.date.month, b.date.date);

				if (aDate < bDate) return -1;
				else if (aDate > bDate) return 1;
				else return 0;
			}
		}
	};

	String.prototype.parseEvent = function (config) {
		var ep = new EventParser(config);
		return ep.parse(this);
	};

	/** @export */
	window.EventParser = EventParser;

})();