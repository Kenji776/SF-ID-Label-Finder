Salesforce Id Label Finder Readme

--What does this do? What problem does it solve?

This is a node.js application for finding custom labels that seem to contain ID values. Many admins/developers will sometimes store configuration data as labels, unfortunatly including Ids. When you deploy your custom labels between two orgs, such as a sandbox and production those ID's are likely (pretty much guarenteed) to be wrong in the target org. This application will find any custom labels that seem to be used to contain an ID so updates can be made as a post deployment step.

--How does it work?

Simply copy your custom labels file from your Salesforce project into the customLabels folder. The script will evaluate the 'value' property of each label element and test to see if it looks like an Id. If so, it will log it.

--How to use it?

1) Use the included package.xml to pull down all the needed metadata.

2) Modify the config.json file as needed (if needed). In most cases there shouldn't be any need to change this, except MAYBE the orgDataLocation (personally I copy the project folder into this script folder when running it just to keep my main project folder clean). 

3) Run the script (either using the included Id Label Finder.bat batch file if on windows or just use the console command 'node index.js' no quotes).

4) Gasp at the glory of properly formatted output data in the form of a JSON and CSV file containing all the labels you'll need to update.

*Nifty update process not created yet. I might make an update tool in the future*

--Prerequisites

To use this script you must have the following.
- NodeJs installed
- A local download of your org custom labels