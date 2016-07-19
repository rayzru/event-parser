Event Parser
========

Рarses events written in plain English, and returns an object defining a basic event.

##Features
* detects various dates
* detects relative dates
* support multiple formats
* detects recurrency
* suggests event title, places and involved names at given subject


##Achtung
Library is in development. All features not implemented yet. Feel free to submit bugs, unit tests, and suggest improvements as well.

##Usage

```javascript
var event = "Have fun with Jane at home on 11th dec".parseEvent({

	// callback called after parse is done;
	onParsed: function() {},

   	// callback called after each instance of date is parsed;
    onDateParsed: function (parsedDateArray) {},

   	// callback called after each instance of time is parsed;
    onTimeParsed: function (parsedTimeArray) {}
});

```

```javascript
{
	title: "Have fun with Jane at home at 12 dec 2020",
	startDate: "‌Sun Dec 12 2020 00:00:00 GMT+0300",
	endDate: undefined,
	allDay: true,
	isRecurrent: false
}
````

##Install
Use Bower or NPM to install :
```sh=Bower
bower install event-parser.js
```
```sh=NPM
npm install event-parser.js
```

##Todo
* Support RRULE

##Inspired by

* [Sherlock -- javascript NLP event date parser library](https://github.com/neilgupta/Sherlock/)
* [Event Parser -- Perl NLP recurrent event date parser library](https://github.com/kvh/recurrent/blob/master/src/recurrent/event_parser.py)

## Author
- Email: info@rayz.ru
- GitHub: https://github.com/rayzru

## Copyright and license

Code and documentation copyright 2011-2016 by Andrew Rumm.
Code released under [the MIT license](https://github.com/rayzru/event-parser/blob/master/LICENSE).