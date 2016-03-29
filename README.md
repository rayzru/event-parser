Event Parser
========

Рarses events written in plain English, and returns an object defining a basic event.

###Features
* detects various dates
* detects relative dates
* support multiple formats
* can detect recurrency
* suggests event title, places and involved names at given subject



###Usage

```javascript
var event = new EventParser();

console.log(event.parse("Have fun with Jane at home on 11th dec"));
```

```javascript
{
	title: "Have fun with Jane at home",
	startDate: "‌Sun Dec 11 2016 00:00:00 GMT+0300",
	endDate: "",
	allDay: true
}
````

###Install
Use Bower to install library:
```sh
bower install --save event-parser.js
```

###Todo
* Support RRULE

###Sources
Used sources for development

* [Sherlock -- javascript NLP event date parser library](https://github.com/neilgupta/Sherlock/)
* [Event Parser -- Perl NLP recurrent event date parser library](https://github.com/kvh/recurrent/blob/master/src/recurrent/event_parser.py)