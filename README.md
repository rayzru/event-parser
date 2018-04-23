Event Parser.js
========

Tiny, depency-free library developed to process English sentences describing Events into plain understandable objects. 

##Features
* Determinating dates and times
* Detects time ranges, relative dates
* Support multiple time and date formats, various date-related abbreviations
* Detects recurrent dates
* Suggests event title, places and person names at given subject
* TypeScript-ed!

##Achtung!
Library is in development. Feel free to submit bugs and suggest any ideas.

##Usage

```javascript
var event = "Push into master every day at 6pm".parseEvent();
```

```json
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
* Move to TypeScript, use new ES6 ASAP
* Completely rewrite old chaotic codebase into acceptable step-by-step simple and smart architecture.
* Generate RRULE

## Author
- Email: info@rayz.ru
- GitHub: https://github.com/rayzru

## Copyright and license

Code and documentation copyright 2011-2018 by Andrew Rumm.
Code released under [the MIT license](https://github.com/rayzru/event-parser/blob/master/LICENSE).
