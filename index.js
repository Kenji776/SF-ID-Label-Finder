/**
 * @Name SF-ID-Label-Finder
 * @Date 2/1/2023
 * @Author Daniel Llewellyn
 * @Description Locates custom labels that are likely to be Id's so they can be replaced between orgs.
 */
 const fs = require("fs");
const path = require("path");
const readline = require('readline');

var xml2js = require('xml2js');
var parseString = xml2js.parseString;

let customLabelsData = null;


//entries to write into the program log on completion
let logEntries = [];

//entries to write into the program  error log on completion
let errorLogEntries = [];

//default config options
let config = {

};

//allows for user input
const keypress = async () => {
	process.stdin.setRawMode(true);
	fs.readSync(0, Buffer.alloc(1), 0, 1);
}

/**
* @Description Entry point function. Loads configuration, checks it for validity and calls the menu to display to the user
*/
async function init() {
    console.log("                                    Salesforce Id Label Finder\r\n");
    console.log("                                     Author: Daniel Llewellyn\r\n");

    let d = new Date();
    d.toLocaleString();

    log("Started process at " + d, false);
	


	customLabelsData = await xmlToJson(loadCustomLabels());
	
	console.log(customLabelsData);
	
	let idLabels = findIdLabels(customLabelsData.CustomLabels.labels);
	
	console.log(idLabels);

	fs.writeFileSync('Id Labels.json', JSON.stringify(idLabels, null, 2), 'utf8', function(){;
		log('Wrote file Id Labels.json', true, 'green');
	});
	
	fs.writeFileSync('Id Labels.csv', jsonToCsv(idLabels), 'utf8', function(){;
		log('Id Labels.csv', true, 'green');
	});
	
	
}

function findIdLabels(labelsAsJSON){
	let idLabels = [];
	
	for(let label of labelsAsJSON){
		
		
		let alphaNumericExp = /^([0-9]|[a-z])+([0-9a-z]+)$/i;
		
		try{
			let labelVal = new String(label.value); 
			if(labelVal.match(alphaNumericExp) && 
			  (labelVal.length === 15 || (labelVal.length === 18 && isValidSfId(labelVal)))){
				console.log(`Found potential Id: ${label.fullName} with value ${labelVal}`);  
				idLabels.push({
					"fullName": new String(label.fullName),
					"language": new String(label.language),
					"protected": new String(label.protected) === 'true' ? true : false,
					"shortDescription": new String(label.shortDescription),
					"value": labelVal
				});
			}
		}catch(ex){
			log(`Unable to perform check on value ${labelVal}. Error: ${ex.message}. Type is ${typeof labelVal}`);
		}
	}
	
	return idLabels;
}

function jsonToCsv(JSONObject){
	var json = JSONObject
	var fields = Object.keys(json[0])
	var replacer = function(key, value) { return value === null ? '' : value } 
	var csv = json.map(function(row){
	  return fields.map(function(fieldName){
		return JSON.stringify(row[fieldName], replacer)
	  }).join(',')
	})
	csv.unshift(fields.join(',')) // add header column
	csv = csv.join('\r\n')
	
	return csv;
}

function isValidSfId(str) {
    // https://stackoverflow.com/a/29299786/1333724
    if (typeof str !== 'string' || str.length !== 18) {
        return false;
    }

    let upperCaseToBit = (char) => char.match(/[A-Z]/) ? '1' : '0';
    let binaryToSymbol = (digit) => digit <= 25 ? String.fromCharCode(digit + 65) : String.fromCharCode(digit - 26 + 48);

    let parts = [
        str.slice(0,5).split("").reverse().map(upperCaseToBit).join(""),
        str.slice(5,10).split("").reverse().map(upperCaseToBit).join(""),
        str.slice(10,15).split("").reverse().map(upperCaseToBit).join(""),
    ];

    let check = parts.map(str => binaryToSymbol(parseInt(str, 2))).join("");

    return check === str.slice(-3);
}

/**
* @description reads the custom labels from from the local file system project folder and loads it into memory so it can be quickly searched.
*/
function loadCustomLabels(){
	log(`Loading custom labels data from ${config.orgDataLocation}\\labels\\CustomLabels.labels-meta.xml`,true);
	
	let fileData = fs.readFileSync(`${config.orgDataLocation}\\labels\\CustomLabels.labels-meta.xml`, 'utf-8', function (err) {
		log('Could not load custom labels file into memory. Custom label translation analysis will not work' + err.message, true, "red");
		if(config.pauseOnError) keypress();
		return false;
	});	
	
	log(`Custom labels loaded`,true,'green');
	return fileData;
}


function writeXmlFromJSON(jsonObject, targetFolder, file){
	console.log('Constructing XML from JSON');
	console.log(jsonObject);
	
	var builder = new xml2js.Builder();
	var xml = builder.buildObject(jsonObject);

	fs.writeFileSync(`${targetFolder}\\${file}`, xml, function(err){
		if(err) {
			return log(err);
		}
	});
	
	log(`${targetFolder}\\${file} file was saved!`);
}

async function xmlToJson(xml){
	var parser = new xml2js.Parser(/* options */);
	return parser.parseStringPromise(xml);
}

//Checks if a file exists
function fileExists(filePath){
	log('Looking for file ' + filePath);
	if (!fs.existsSync(filePath)) {
		log('File not found!', true, 'yellow');
		return false;
	}
	log('File Found', true, 'green');
	return true;
}

function readFile(filePath){
	log('Reading file ' + filePath,true);

	let fileData = fs.readFileSync(filePath, 'utf-8', function (err) {
		log("File not found or unreadable." + err.message, true, "red");
	});

	log('File Found', true, 'green');
	return fileData;
}
/**
 * @Description Parses the raw HTML content fetched by getOutboundChangeSets() to return an array containing all the change set names.
 * @Param html a string of HTML that contains the change set names fetched from the Salesforce UI
 * @Return
 */
function loadConfig(configFileName) {
    return readJSONFromFile(configFileName);
}

/**
* @Description writes the current working config back into the config.json file
*/
function saveConfig(){
	fs.writeFileSync('config.json', JSON.stringify(config, null, 2), function(err){
		if(err) {
			return log(err);
		}
		log("The file was saved!");
	});
}

/**
 * @Description Reads and parses JSON from a given file.
 * @Param fileName the name of the file to read, parse, and return.
 * @Return a JSON object.
 */
function readJSONFromFile(fileName) {
    let fileJSON = fs.readFileSync(fileName, 'utf-8', function (err) {
        log("File not found or unreadable. Skipping import" + err.message, true, "red");
        return null;
    });

	//strip any comments from our JSON sting
	fileJSON = fileJSON.replace(/\\"|"(?:\\"|[^"])*"|(\/\/.*|\/\*[\s\S]*?\*\/)/g, (m, g) => g ? "" : m);
    const parsedJSON = JSON.parse(fileJSON);
    return parsedJSON;
}



/**
* @Description clears the terminal screen.
*/
function clearScreen(){
	console.log('\033[2J');
	process.stdout.write('\033c');
}

/**
 * @Description Creates a log entry in the log file, and optionally displays log entry to the terminal window with requested color.
 * @Param logItem a string of data to log
 * @Param printToScreen boolean flag indicating if this entry should be printed to the screen (true) or only to the log file (false)
 * @Param a string {'red','green','yellow'} that indicates what color the logItem should be printed in on the screen..
 */
function log(logItem, printToScreen, color) {
    printToScreen = printToScreen != null ? printToScreen : true;
    var colorCode = "";
    switch (color) {
        case "red":
            colorCode = "\x1b[31m";
            break;
        case "green":
            colorCode = "\x1b[32m";
            break;
        case "yellow":
            colorCode = "\x1b[33m";
    }

    if (printToScreen) console.log(colorCode + "" + logItem + "\x1b[0m");

	logEntries.push(logItem);
	
	if(color === 'red') errorLogEntries.push(logItem);
}

/**
* @Description Method that executes at the end of a script run. Writes to the log file. Exits the program.
*/
function finish() {
    log("Process completed. Writting " + logEntries.length + " log entries", true, "yellow");
	
;
	
    log("\r\n\r\n------------------------------------------------ ", false);
	
    fs.writeFileSync("log.txt", logEntries.join("\r\n"), function (err) {
        if (err) {	
			console.log('Unable to write to log file');
			console.log(err);
		}
    });
    fs.writeFileSync("errors.txt", errorLogEntries.join("\r\n"), function (err) {
        if (err) {	
			console.log('Unable to write to error log file');
			console.log(err);
		}
    });
	
	let d = new Date();
    d.toLocaleString();

    log("Finished process at " + d, true)
	process.exit(1);
}

/**
 * @Description Method that executes on an uncaught error.
*/
process.on("uncaughtException", (err) => {
    log(err, true, "red");
	console.trace(err);
	finish();
});

init();