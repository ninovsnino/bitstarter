#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/
/*jshint smarttabs:true */

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');
var sys = require('sys');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";
var URL_DEFAULT = "http://fathomless-shore-5267.herokuapp.com/";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
	console.log("%s does not exist. Exiting.", instr);
	process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile) {
    $ = cheerioHtmlFile(htmlfile);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
	var present = $(checks[ii]).length > 0;
	out[checks[ii]] = present;
    }
    return out;
};

var checkUrlOut = function(urlOut, checksfile) {
    $ = cheerio.load(urlOut);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
	var present = $(checks[ii]).length > 0;
	out[checks[ii]] = present;
    }
    return out;
};

var getUrl = function(url, checksfile, callback) {
    rest.get(url).on('complete', function(result){
	if (result instanceof Error) {
	    sys.puts('Error: ' + result.message);
	    this.retry(5000); // try again after 5 sec
	} else {
	    //sys.puts(result);
	    //return result;
	    callback(checksfile, result);
	}
    });
};

function checkUrlHtml(checksfile, urlOut) {
    console.log(urlOut);
    $ = cheerio.load(urlOut);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
	var present = $(checks[ii]).length > 0;
	out[checks[ii]] = present;
    }
    return out;
}

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

// checks html
function checkHtml(html, checks) {
    $ = cheerio.load(html);
    var out = {};
    for(var ii in checks) {
	var present = $(checks[ii]).length > 0;
	out[checks[ii]] = present;
    }
    return out;
}

// this function loads checks & checks html
    function check(err, html) {
	if (err) {
	    console.log('Error getting html: ' + err);
	    process.exit(1);
	}
	var checks = loadChecks(program.checks);
	var checkJson = checkHtml(html, checks);
	//var checkJson = checkHtmlFile(html, checks);
	var outJson = JSON.stringify(checkJson, null, 4);
	console.log(outJson);
    }

function download(url, callback) {
    var resp = rest.get(url);
    resp.on('complete', function(result) {
	if (result instanceof Error) {
	    // callback(result);
	    sys.puts('Error: ' + result.message);
	    this.retry(5000); // try again after 5 sec
	    return;
	}
	callback(null, result);
    });
}

if(require.main == module) {
    program
	.option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
	.option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
	.option('-u, --url <url_path>', 'Path to url', clone(assertFileExists), URL_DEFAULT)
	.parse(process.argv);
    //sys.puts('nvn 0');
    //var outUrl = getUrl(program.url);
    //sys.puts(outUrl);
    //var checkJson = checkHtmlFile(program.file, program.checks);
    //var checkJson = checkHtmlFile(outUrl, program.checks);
    //var checkJson = checkUrlOut(outUrl, program.checks);
    //var checkJson = checkUrlOut(program.url, program.checks);

    //sys.puts('nvn 1');
    //var outJson = JSON.stringify(checkJson, null, 4);

    //console.log(outJson);

    if(program.url){
	download(program.url, check);
    } else {
	fs.readFile(program.file, check);
    }

} else {
    exports.checkHtmlFile = checkHtmlFile;
    exports.loadChecks = loadChecks; // for loading checks
}
