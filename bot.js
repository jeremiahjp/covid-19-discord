const Discord = require('discord.js');
const client = new Discord.Client();
const config = require("./config.json");
const fs = require('fs');
const Axios = require('axios');
const Path = require('path');


async function downloadJohnHopkinsJson (location, servicetype, filename) {
  	let url = '';
  	let path = '';
	if (servicetype === 1) {
  		url = `https://services1.arcgis.com/0MSEUqKaxRlEPj5g/ArcGIS/rest/services/ncov_cases/FeatureServer/1/query?where=province_state='${location}'&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&returnGeodetic=false&outFields=Province_State%2C+Country_Region%2C+Last_Update%2C+Confirmed%2C+Recovered%2C+Deaths%2C+Active&returnGeometry=false&featureEncoding=esriDefault&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=pjson&token=`
  		path = Path.resolve(__dirname, 'covid', `${filename}`)
  	}
  	else if (servicetype === 2) {
  		url = `https://services1.arcgis.com/0MSEUqKaxRlEPj5g/ArcGIS/rest/services/ncov_cases/FeatureServer/2/query?where=Country_Region='${location}'&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&returnGeodetic=false&outFields=country_region%2C+Last_Update%2C+confirmed%2C+deaths%2C+recovered%2C+active&returnGeometry=true&featureEncoding=esriDefault&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=pjson&token=`
  		path = Path.resolve(__dirname, 'covid', `${filename}`)
  	}
 	const writer = fs.createWriteStream(path)
 	const response = await Axios({
    url,
    method: 'GET',
    responseType: 'stream'
  })

  response.data.pipe(writer)

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve)
    writer.on('error', reject)
  })
}


function sendNotFoundCovidResponse(msg) {
	const embed = new Discord.RichEmbed()
	.setTitle(`Not found`)
	.setColor(Math.floor(Math.random() * 16777214 - 0 + 1) + 0)
	.setAuthor("iSuck Bot")
	.setDescription("```No Data found for the area.\n\nExamples:\n!covid19 state texas\n!covid19 province ontario\n!covid19 province hubei\n!covid19 country US```")
	.setFooter("Source: https://coronavirus.jhu.edu/map.html")
	msg.channel.send({embed});
	return;
}

function invalidCovidUsage(msg) {
	const embed = new Discord.RichEmbed()
	.setTitle(`Invalid usage`)
	.setColor(Math.floor(Math.random() * 16777214 - 0 + 1) + 0)
	.setAuthor("iSuck Bot")
	.setDescription("```Invalid usage.\nKeyword state, province, or country req.\n\nExamples:\n!covid19 country US\n!covid19 state Texas\n!covid19 province Ontario```")
	.setFooter("Source: https://coronavirus.jhu.edu/map.html")
	msg.channel.send({embed});
	return;
}

function sendFoundCovidResponse(msg, covid_data, service_type) {
	let area = '';

	if (service_type === 1) {
		area = covid_data.Province_State
	}
	else if (service_type === 2) {
		area = covid_data.Country_Region
	}
	let readable_date = new Date(covid_data.Last_Update);
	let all_data_table =
`     Where?    |     ${area}
 --------------|-----------------
  Confirmed    | ${covid_data.Confirmed}
  Deaths       | ${covid_data.Deaths}
  Recovered    | ${covid_data.Recovered}
  Active       | ${covid_data.Active}
  Last Updated | ${readable_date}`

	const embed = new Discord.RichEmbed()
	    .setTitle(`Coronavirus COVID-19 Cases by the Center for Systems Science and Engineering (CSSE) at Johns Hopkins University (JHU)`)
	    .setColor(Math.floor(Math.random() * 16777214 - 0 + 1) + 0)
	    .setAuthor("iSuck Bot")
	    .setDescription("```" + all_data_table + "```")
	    .setFooter("Source: https://coronavirus.jhu.edu/map.html")
	    msg.channel.send({embed});
}


function openHopkinsJson(filename) {
  let menuFileLocation = `covid/${filename}`;

  return new Promise(function(resolve, reject) {
    require('fs').readFile(menuFileLocation, "utf8", function(err, data) {
      if (err) {
        console.log(err);
        return err;
      }
      else {
        resolve(data);
      }
    });
  });
}

//Main Commands
client.on('message', async msg => {

	// !covid19 country USA
	// !covid19 state texas
	// !covid19 province ontario
	if (msg.content.substring(0,8) === '!covid19') {

		const args = msg.content.substring(9).split(" ");
		const command_type = args[0];
		const STATE_PROVINCE_COMMAND = ['state','province']
		const COUNTRY_COMMAND = 'country';
		const SERVICE_TYPE_1 = 1;
		const SERVICE_TYPE_2 = 2;
		const HOPKINS_COUNTRY_FILENAME = 'hopkins-latest-country.json';
		const HOPKINS_STATE_PROVINCE_FILENAME = 'hopkins-latest-state-province.json';

		if (args.length <= 1 || !STATE_PROVINCE_COMMAND.includes(command_type.toLowerCase()) && command_type.toLowerCase() !== COUNTRY_COMMAND) {
			invalidCovidUsage(msg);
			return;
		}

		let location = '';
		for (i = 1; i < args.length; i++) {
			location = location + args[i] + " ";
		}

		location = location.trim();
		let service_type = 1;
		let filename = '';
		if (STATE_PROVINCE_COMMAND.includes(command_type.toLowerCase())) {
			service_type = 1;
			filename = HOPKINS_STATE_PROVINCE_FILENAME;
		}

		else if (command_type.toLowerCase() === COUNTRY_COMMAND) {
			service_type = 2;
			filename = HOPKINS_COUNTRY_FILENAME;
		}
		// Download the hopkins JSON data
		let hopkinsJSON = downloadJohnHopkinsJson(location, service_type, filename);

		// When the data is done downloading, trigger this
		hopkinsJSON.then(function() {
			// Open the hopkins data
			let hopkins = openHopkinsJson(filename);
			// When the hopkins data file is opened
			hopkins.then(function(json) {

				let parsed_data = JSON.parse(json).features;

            	if (parsed_data.length > 0) {
            		sendFoundCovidResponse(msg, parsed_data[0].attributes, service_type);
            	}

	        	else  {
	        		sendNotFoundCovidResponse(msg);
	        	}
	        })
		})
	}

});

client.login(config.token);


client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  client.user.setPresence({ game: { name: 'Your mom' }, status: 'Busy' });
});

client.on('error', console.error);
