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
			this.settings = extend({}, this.defaults, config);
		}

		// Avoid clobbering the window scope
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


		var weekdays = '(' + this.sets.weekday.join('|') + ')';

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
					'(?:\\b(' + this.sets.number.prefix.join('|') + '(?:-| ))?\\b(' + this.sets.number.normal.join('|') + '))|' +
					'\\b(' + this.sets.number.prefix.join('|') + ')' +
					'\\b', 'gi')
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
				// on friday, on other friday, at monday, at next monday, tommorow, today, at 2nd tuesday
				relative: {

					// todo: there is a problem, capturing single relatives with 1 space before.
					common: /(?:(?:on|at|to)\s)?(?:(next|this|last|after|other|\d(?:st|nd|rd|th)?)\s)?(today|tomorrow|month|week|year|sunday|monday|tuesday|wednesday|thursday|friday|saturday)/ig,

					// not common usages
					dayAfter: /(\bday\safter\stomorrow\b)/ig,
					in: /\bin\s(\d+)?(day|month|week|year)s?\b/ig
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
			this.settings = extend({}, this.settings, settings);
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
				match = matches.filter(filterUndefined);
				this.patterns.numbers.numerical.lastIndex = matches.index + 1;

				// don't believe anyone, just reconvert it.
				source = source.replace(match[0], this.getOrdinal(match[1]));
			}

			// not ordinal literal numbers
			this.patterns.numbers.normal.lastIndex = 0;
			while (matches = this.patterns.numbers.normal.exec(source)) {
				match = matches.filter(filterUndefined);
				this.patterns.numbers.normal.lastIndex = matches.index + 1;
				//?
			}

			// ordinal literal numbers
			this.patterns.numbers.ordinal.lastIndex = 0;
			while (matches = this.patterns.numbers.ordinal.exec(source)) {

				match = matches.filter(filterUndefined);
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
						formattedString = this.getOrdinal(this.sets.number.ordinal.indexOf(match[1].toLowerCase()) + 1);
					}
				} else if (match.length == 3) {
					formattedString =
						(this.sets.number.prefix.indexOf(match[1].toLowerCase()) + 2) +
						this.getOrdinal(this.sets.number.ordinal.indexOf(match[2].toLowerCase()) + 1);
				}

				if (formattedString != '') source = source.replace(match[0], formattedString);
			}
			return source;
		},

		getOrdinal: function (number) {
			number = parseInt(number);
			var s = ["th", "st", "nd", "rd"],
				v = number % 100;
			return number + (s[(v - 20) % 10] || s[v] || s[0]);
		},

		str2num: function (string) {

		},

		getEvent: function () {
			return {
				title: this.event.parsedTitle,
				startDate: new Date(this.event.startDate) || null,
				endDate: new Date(this.event.endDate) || null,
				allDay: this.event.allDay
			};
		},

		// curago object wrapper
		getCurago: function () {

			var collectedDate = extend({}, this.curagoEventTemplate, {
				title: this.event.parsedTitle || "",
				starts_at: new Date(this.event.startDate).toISOString() || null,
				ends_at: new Date(this.event.endDate).toISOString() || null,
				location_name: (this.event.parsedLocations.length) ? this.event.parsedLocations[0] : ""
				//separation: this.event.setPosition
			});

			return collectedDate;
		},

		getText: function () {
			return this.event.sourceText;
		},

		getFirstWeekday: function () {
			return (this.settings.weekStart === 'sunday') ? 0 : 1;
		},

		hasDatesParsed: function () {
			return this.event.parsedDates.length > 0;
		},

		parseRecurrent: function () {
			var match, re;
			if (match = /(every|each)/i.exec(this.event.recurrenceText)) {

				// if every then untill forever
				this.event.until = "";
				this.event.recurrenceText = this.event.recurrenceText.replace(match[0], '');

				// weekdays
				re = new RegExp(this.sets.weekday.join('|'), 'ig');
				while (match = re.exec(this.event.recurrenceText)) {
					this.event.frequency = 'weekly';
					this.event.recurrentAttr.push({day: this.sets.weekday.indexOf(match[0])})
				}

			} else {


			}
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

		parse: function (source) {

			source = source || "";

			this.now = this.getNow();

			var event = this.event;

			event = this.eventTemplate;

			event.sourceText = source;
			event.parsedTitle = event.sourceText;

			this.cleanup();

			var match, matches, formattedString;

			var hasMeridian = false,
				meridian;

			var date, month, year, hour, min, tmpDate;

			// store preformatted sting to store date index positions
			var preConvertedString = this.event.parsedText;

			// parse and format dates
			// M D Y
			this.patterns.dates.mdyStrings.lastIndex = 0;
			while (matches = this.patterns.dates.mdyStrings.exec(this.event.parsedText)) {
				this.event.isValidDate = true;
				match = matches.filter(filterUndefined);

				// this is actially a tweak, allowing get more matches like matchAll.
				// todo: get clear view of matchAll
				this.patterns.dates.mdyStrings.lastIndex = matches.index + 1;

				// changing to MM/DD || MM/DD/YYYY
				formattedString =
					(this.sets.month.indexOf(match[1]) + 1) + '/' + parseInt(match[2]) + ((match.length == 4) ?
					'/' + match[3] : "");
				this.event.parsedText = this.event.parsedText.replace(match[0], formattedString);

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
			while (matches = this.patterns.dates.dmyStrings.exec(this.event.parsedText)) {

				this.event.isValidDate = true;

				match = matches.filter(filterUndefined);
				this.patterns.dates.dmyStrings.lastIndex = matches.index + 1;

				// changing to MM/DD || MM/DD/YYYY
				formattedString =
					(this.sets.month.indexOf(match[2]) + 1) + '/' + parseInt(match[1]) + ((match.length == 4) ?
					'/' + match[3] : "");
				this.event.parsedText = this.event.parsedText.replace(match[0], formattedString);

				this.event.parsedDates.push({
					index: preConvertedString.indexOf(match[0]),
					match: match[0],
					formattedDate: formattedString,
					date: {
						month: (this.sets.month.indexOf(match[2]) + 1),
						date: parseInt(match[1]),
						year: ((match.length == 4) ? match[3] : undefined)
					}
				});
			}


			// parse and format times
			while (matches = this.patterns.times.singleInstances.exec(this.event.parsedText)) {
				//if (this.patterns.dates.singleInstances.lastIndex) console.log(this.patterns.dates.singleInstances.lastIndex);

				this.event.isValidDate = true;

				match = matches.filter(filterUndefined);
				if (match.length >= 3) {
					if (hasMeridian = (match[match.length - 1] === 'am' || match[match.length - 1] === 'pm')) {
						meridian = match[match.length - 1];

						hour = (meridian == 'am' && parseInt(match[1]) == 12) ? 0 :
							(meridian == 'pm' && parseInt(match[1]) < 12) ? parseInt(match[1]) + 12 :
								parseInt(match[1]);
						min = (match.length == 3) ? 0 : parseInt(match[2]);
					} else {
						hour = parseInt(match[1]);
						min = parseInt(match[2]);
					}

					formattedString = pad(hour, 2) + ':' + pad(min, 2);
					this.event.parsedText = this.event.parsedText.replace(match[0], formattedString);

					this.event.parsedTimes.push({
						index: matches.index,
						match: match[0],
						formattedTime: formattedString,
						time: {
							hours: hour,
							minutes: min
						}
					});
				}
			}


			//
			if (this.checkRecurrency()) {
				this.parseRecurrent();
			} else {

			}

			// parse uncommon relative date instances
			// todo: in n days, day after tomorrow
			// !!!!!!!!!

			// Convert common relative dates given
			while (matches = this.patterns.dates.relative.common.exec(this.event.parsedText)) {

				this.event.isValidDate = true;

				match = matches.filter(filterUndefined);
				this.patterns.dates.relative.common.lastIndex = matches.index + 1;

				var relPrefix = this.parseRelPrefix(match);
				var relSuffix = this.parseRelSuffix(match);


				// todo: if relative date relates to today, should check time. if it already passed, check next relative.

				// weekdays
				if (this.sets.weekday.indexOf(match[relPrefix.subjectIndex]) >= 0) {
					var subjectDay = this.sets.weekday.indexOf(match[relPrefix.subjectIndex]);

					// todo: parse suffix (14th, 11th) as well

					if (relPrefix.next) {
						tmpDate = moment(this.now).day(subjectDay + 7);
					} else if (relPrefix.last) {
						if (moment(this.now).endOf('month').day() < subjectDay) {
							tmpDate = new Date(moment(this.now).endOf('month').day(subjectDay).subtract(1, 'week'));
						} else {
							tmpDate = new Date(moment(this.now).endOf('month').day(subjectDay));
						}
					} else if (relPrefix.number > 0) {

					} else {
						// no suffixes?
						tmpDate = new Date(moment(this.now).day(subjectDay));
					}

					date = tmpDate.getDate();
					month = tmpDate.getMonth();
					year = tmpDate.getFullYear();

					//this.now.setDate(this.getNow().getDate() + (x+(7-this.getNow().getDay())) % 7);

				} else

				// months
				if (this.sets.month.indexOf(match[relPrefix.subjectIndex]) > 0) {

					/// need cases
					var subjectMonth = this.sets.month.indexOf(match[relPrefix.subjectIndex]);

					if (this.getNow().getMonth() == this.sets.month.indexOf(match[relPrefix.subjectIndex]) + 1) {

					} else {

					}
					//this.now.setDate(this.getNow().getDate() + (x+(7-this.getNow().getDay())) % 7);
				} else {

					// single
					switch (match[relPrefix.subjectIndex]) {
						case 'tomorrow':
							date = this.getNow().getDate() + 1;
							month = this.getNow().getMonth();
							year = this.getNow().getFullYear();
							formattedString = month + '/' + (date + 1) + '/' + year;
							break;
						case 'today':
							date = this.getNow().getDate();
							month = this.getNow().getMonth();
							year = this.getNow().getFullYear();
							formattedString = month + '/' + date + '/' + year;
							break;
						case 'day':
							if (relPrefix.next) {
								// same as tomorrow
								date = this.getNow().getDate() + 1;
								month = this.getNow().getMonth();
								year = this.getNow().getFullYear();
								formattedString = month + '/' + (date + 1) + '/' + year;
							} else if (relPrefix.number) {

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

				this.event.parsedText = this.event.parsedText.replace(match[0], formattedString);

				this.event.parsedDates.push({
					index: preConvertedString.indexOf(match[0]),
					match: match[0],
					formattedDate: formattedString,
					date: {
						month: month,
						date: date,
						year: year
					}
				});
			}

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
			for (var i = 0; i < this.event.parsedDates.length; i++) {
				var el = this.event.parsedDates[i];
				if (!el.Date) {
					if (!isNaN(el.date.year)) {
						el.Date = new Date().setFullYear(el.date.year, el.date.month, el.date.date);
						el.hasYear = true;
					} else {
						el.Date = new Date().setMonth(el.date.month, el.date.date);
						// this date is incomplete
						el.hasYear = false;
					}
				}

				this.event.parsedDates[i] = el;


				// swap 2 parsed dates in incremental date  order.
				// todo: this should sort whole array (in case there is more than 2 elements)
				if (this.event.parsedDates.length == 2 && (this.event.parsedDates[0].Date < this.event.parsedDates[1].Date))
					this.event.parsedDates.swap(0,1);

			}

			// create Time objects for each parsed time element
			for (var i = 0; i < this.event.parsedTimes.length; i++) {
				var el = this.event.parsedTimes[i];
				el.Time = el.Time || new Date().setHours(el.time.hours, el.time.minutes);
				this.event.parsedTimes[i] = el;
			}



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
				this.event.startDate.set
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

		checkRecurrency: function () {
			var match;
			this.event.isRecurrent = false;
			this.event.recurrenceText = "";

			// get all of recurrencies
			while (match = this.patterns.recurrenceExpression.exec(this.event.parsedText)) {
				this.patterns.recurrenceExpression.lastIndex = match.index + 1;
				this.event.isRecurrent = true;
				this.event.recurrenceText = match[0];
				this.event.parsedText = this.event.parsedText.replace(this.event.recurrenceText, '');
			}

			//get all of exceptions for recurrencies
			if (this.event.isRecurrent) {
				while (match = this.patterns.recurrenceExcepts.exec(this.event.parsedText)) {
					this.event.recurrenceExceptionsText = match[0];
					this.event.parsedText = this.event.parsedText.replace(this.event.recurrenceExceptionsText, '');
				}
			}


			if (!this.event.isRecurrent) this.event.recurrenceText = "";

			return this.event.isRecurrent;

		},

		helpers: {

			setDayStart: function (dt) {
				dt = dt || this.now || new Date();
				return dt.setHours(0, 0, 0, 0);
			},

			setWeekday: function (dt, weekday, rel) {
				dt = dt || this.now || new Date();


			},

			setMonth: function (dt, month, rel) {

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

Array.prototype.swap = function (x, y) {
	var b = this[x];
	this[x] = this[y];
	this[y] = b;
	return this;
}