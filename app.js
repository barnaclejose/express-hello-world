import express from 'express';
import { Xtream } from '@iptv/xtream-api';

const app = express();
const port = process.env.PORT || 3001;
const arabicCharacters = /[\u0600-\u06FF]/;


		

app.get("/", (req, res) => res.type('html').send(html_default_response));

//m3u
app.get("/get.php", function(req, res){
		
	res.type('html').sendStatus(404);

});

//EPG
app.get("/xmltv.php", function(req, res){
		
	res.type('html').sendStatus(404);

});


app.get("/player_api.php", async function(req, res){
	
	console.log(req.url);
	var m_var_Server = req.query.server;	
	var m_var_Username = req.query.username;
	var m_var_Password = req.query.password;
	var m_var_Action = req.query.action; //get_profile get_server_info get_live_streams get_channel_categories

	console.log(m_var_Server, m_var_Username, m_var_Password, m_var_Action);

	if(m_var_Username === undefined || m_var_Password === undefined){
		res.type('html').sendStatus(400);
		return;
	}

	if(m_var_Server === undefined){
		m_var_Server = m_var_Username;

		var temp_passwordField = m_var_Password.split(":");
		m_var_Username = temp_passwordField[0];
		m_var_Password = temp_passwordField[1];
	}

	if(m_var_Server === undefined || m_var_Username === undefined || m_var_Password === undefined){
		res.type('html').sendStatus(400);
		return;
	}
	
	const xtream = new Xtream({
	  url: m_var_Server, //'http://cf.business-cdn.me',
	  username: m_var_Username, //'020a99bbf5',
	  password: m_var_Password, //'aaa38a3ab0',
	  preferredFormat: 'm3u8', // optional preferred format for channel URLs
	});

	if(m_var_Action === undefined || m_var_Action == "" || m_var_Action == "get_profile"){
		//var returnVal = {"user_info":{"username":"020a99bbf5","password":"aaa38a3ab0","message":"Welcome to World 8K","auth":1,"status":"Active","exp_date":"1768031057","is_trial":"0","active_cons":"1","created_at":"1765352657","max_connections":"1","allowed_output_formats":["m3u8","ts","rtmp"]},"server_info":{"url":"cf.business-cdn.me","port":"80","https_port":"443","server_protocol":"http","rtmp_port":"25462","timezone":"Europe\/Amsterdam","timestamp_now":1765445611,"time_now":"2025-12-11 10:33:31","process":true}}
		//res.type('json').send(returnVal);
		var getProfile = await xtream.getProfile();
		res.type('json').send(getProfile);
	
	}else if(m_var_Action === "get_server_info"){
		
		var getServerInfo = await xtream.getServerInfo();
		res.type('json').send(getServerInfo);
	
	}else if(m_var_Action === "get_series_categories" || m_var_Action === "get_show_categories"){
		
		var fncGetSeriesCategories = await fncGetSeriesCategories(xtream);
		res.type('json').send(fncGetSeriesCategories.getShowCategories);
		
	}else if(m_var_Action === "get_series"){
		var fncGetSeriesCategories = await fncGetSeriesCategories(xtream);
		var JSON_ShowCategories = fncGetSeriesCategories.JSON_ShowCategories;
		
		var getShows = await xtream.getShows();
		var filtered_getShows = [];

			for(var index in getShows){
				var mCategory_ID = getShows[index].category_id;

				if(JSON_ShowCategories[mCategory_ID] !== undefined && JSON_ShowCategories[mCategory_ID].exclude == true){
					
				}else{
					filtered_getShows.push(getShows[index]);
				}
			}
			
		getShows = null;
		res.type('json').send(filtered_getShows);

	}else if(m_var_Action === "get_vod_categories" || m_var_Action === "get_movie_categories"){

	}else if(m_var_Action === "get_vod_streams"){

	}else if(m_var_Action === "get_live_categories" || m_var_Action === "get_channel_categories"){

	}else if(m_var_Action === "get_live_streams"){

	}else if(m_var_Action === "get_short_epg"){
	
	}else{
		//res.type('json').send("[{'a': 1}, {'a': 2}]");
		res.type('html').sendStatus(404);
	}
	
	
	return;
	
});




app.get('/{*splat}', function(req, res) {

	console.log("other queries - " + req.url);
	res.type('html').sendStatus(404);

});

const server = app.listen(port, () => console.log(`Example app listening on port ${port}!`));

server.keepAliveTimeout = 120 * 1000;
server.headersTimeout = 120 * 1000;

const html_default_response = `
<!DOCTYPE html>
<html>
  <body>
    <section>
      Hello there!
    </section>
  </body>
</html>
`;


async function fncGetSeriesCategories(xtream){
	const getShowCategories = await xtream.getShowCategories();
	var JSON_ShowCategories = {};

		for(var index in getShowCategories){
			getShowCategories[index]["exclude"] = false;

			var mCategory = getShowCategories[index].category_name;
			
			if(arabicCharacters.test(mCategory)){
				getShowCategories[index]["exclude"] = true;
			}
			
			mCategory = mCategory.toLowerCase();
			console.log(mCategory);
			
			
			var splitCountrycode_Hyphen = mCategory.split(" - ")[0].toUpperCase();
			if(["AF","AX","AL","DZ","AS","AD","AO","AI","AQ","AG","AR","AM","AW","AU","AT","AZ","BS","BH","BD","BB","BY","BE","BZ","BJ","BM","BT","BA","BW","BV","BR","IO","BN","BG","BF","BI","KH","CM","CA","CV","KY","CF","TD","CL","CN","CX","CC","CO","KM","CG","CK","CR","CI","HR","CU","CW","CY","CZ","DK","DJ","DM","DO","EC","EG","SV","GQ","ER","EE","ET","FK","FO","FJ","FI","FR","GF","PF","TF","GA","GM","GE","DE","GH","GI","GR","GL","GD","GP","GU","GT","GG","GN","GW","GY","HT","HM","VA","HN","HK","HU","IS","ID","IR","IQ","IE","IM","IL","IT","JM","JP","JE","JO","KZ","KE","KI","KP","KR","KW","KG","LA","LV","LB","LS","LR","LY","LI","LT","LU","MO","MK","MG","MW","MY","MV","ML","MT","MH","MQ","MR","MU","YT","MX","FM","MD","MC","MN","ME","MS","MA","MZ","MM","NA","NR","NP","NL","NC","NZ","NI","NE","NG","NU","NF","MP","NO","OM","PK","PW","PS","PA","PG","PY","PE","PH","PN","PL","PT","PR","QA","RE","RO","RU","RW","BL","SH","KN","LC","MF","PM","VC","WS","SM","ST","SA","SN","RS","SC","SL","SG","SX","SK","SI","SB","SO","ZA","GS","SS","ES","LK","SD","SR","SJ","SZ","SE","CH","SY","TW","TJ","TZ","TH","TL","TG","TK","TO","TT","TN","TR","TM","TC","TV","UG","UA","AE","UM","UY","UZ","VU","VE","VN","VG","VI","WF","EH","YE","ZM","ZW"].indexOf(splitCountrycode_Hyphen) > -1){
				getShowCategories[index]["exclude"] = true;
			}
			if(["AFG","ALA","ALB","DZA","ASM","AND","AGO","AIA","ATA","ATG","ARG","ARM","ABW","AUS","AUT","AZE","BHS","BHR","BGD","BRB","BLR","BEL","BLZ","BEN","BMU","BTN","BOL","BES","BIH","BWA","BVT","BRA","IOT","BRN","BGR","BFA","BDI","CPV","KHM","CMR","CAN","CYM","CAF","TCD","CHL","CHN","CXR","CCK","COL","COM","COG","COD","COK","CRI","CIV","HRV","CUB","CUW","CYP","CZE","DNK","DJI","DMA","DOM","ECU","EGY","SLV","GNQ","ERI","EST","SWZ","ETH","FLK","FRO","FJI","FIN","FRA","GUF","PYF","ATF","GAB","GMB","GEO","DEU","GHA","GIB","GRC","GRL","GRD","GLP","GUM","GTM","GGY","GIN","GNB","GUY","HTI","HMD","VAT","HND","HKG","HUN","ISL","IND","IDN","IRN","IRQ","IRL","IMN","ISR","ITA","JAM","JPN","JEY","JOR","KAZ","KEN","KIR","PRK","KOR","KWT","KGZ","LAO","LVA","LBN","LSO","LBR","LBY","LIE","LTU","LUX","MAC","MDG","MWI","MYS","MDV","MLI","MLT","MHL","MTQ","MRT","MUS","MYT","MEX","FSM","MDA","MCO","MNG","MNE","MSR","MAR","MOZ","MMR","NAM","NRU","NPL","NLD","NCL","NZL","NIC","NER","NGA","NIU","NFK","MKD","MNP","NOR","OMN","PAK","PLW","PSE","PAN","PNG","PRY","PER","PHL","PCN","POL","PRT","PRI","QAT","REU","ROU","RUS","RWA","BLM","SHN","KNA","LCA","MAF","SPM","VCT","WSM","SMR","STP","SAU","SEN","SRB","SYC","SLE","SGP","SXM","SVK","SVN","SLB","SOM","ZAF","SGS","SSD","ESP","LKA","SDN","SUR","SJM","SWE","CHE","SYR","TWN","TJK","TZA","THA","TLS","TGO","TKL","TON","TTO","TUN","TUR","TKM","TCA","TUV","UGA","UKR","ARE","UMI","URY","UZB","VUT","VEN","VNM","VGB","VIR","WLF","ESH"].indexOf(splitCountrycode_Hyphen) > -1){
				getShowCategories[index]["exclude"] = true;
			}

			
			var splitCountrycode_Pipe = mCategory.split("|")[0].toUpperCase();
			if(["AF","AX","AL","DZ","AS","AD","AO","AI","AQ","AG","AR","AM","AW","AU","AT","AZ","BS","BH","BD","BB","BY","BE","BZ","BJ","BM","BT","BA","BW","BV","BR","IO","BN","BG","BF","BI","KH","CM","CA","CV","KY","CF","TD","CL","CN","CX","CC","CO","KM","CG","CK","CR","CI","HR","CU","CW","CY","CZ","DK","DJ","DM","DO","EC","EG","SV","GQ","ER","EE","ET","FK","FO","FJ","FI","FR","GF","PF","TF","GA","GM","GE","DE","GH","GI","GR","GL","GD","GP","GU","GT","GG","GN","GW","GY","HT","HM","VA","HN","HK","HU","IS","ID","IR","IQ","IE","IM","IL","IT","JM","JP","JE","JO","KZ","KE","KI","KP","KR","KW","KG","LA","LV","LB","LS","LR","LY","LI","LT","LU","MO","MK","MG","MW","MY","MV","ML","MT","MH","MQ","MR","MU","YT","MX","FM","MD","MC","MN","ME","MS","MA","MZ","MM","NA","NR","NP","NL","NC","NZ","NI","NE","NG","NU","NF","MP","NO","OM","PK","PW","PS","PA","PG","PY","PE","PH","PN","PL","PT","PR","QA","RE","RO","RU","RW","BL","SH","KN","LC","MF","PM","VC","WS","SM","ST","SA","SN","RS","SC","SL","SG","SX","SK","SI","SB","SO","ZA","GS","SS","ES","LK","SD","SR","SJ","SZ","SE","CH","SY","TW","TJ","TZ","TH","TL","TG","TK","TO","TT","TN","TR","TM","TC","TV","UG","UA","AE","UM","UY","UZ","VU","VE","VN","VG","VI","WF","EH","YE","ZM","ZW"].indexOf(splitCountrycode_Pipe) > -1){
				getShowCategories[index]["exclude"] = true;
			}
			if(["AFG","ALA","ALB","DZA","ASM","AND","AGO","AIA","ATA","ATG","ARG","ARM","ABW","AUS","AUT","AZE","BHS","BHR","BGD","BRB","BLR","BEL","BLZ","BEN","BMU","BTN","BOL","BES","BIH","BWA","BVT","BRA","IOT","BRN","BGR","BFA","BDI","CPV","KHM","CMR","CAN","CYM","CAF","TCD","CHL","CHN","CXR","CCK","COL","COM","COG","COD","COK","CRI","CIV","HRV","CUB","CUW","CYP","CZE","DNK","DJI","DMA","DOM","ECU","EGY","SLV","GNQ","ERI","EST","SWZ","ETH","FLK","FRO","FJI","FIN","FRA","GUF","PYF","ATF","GAB","GMB","GEO","DEU","GHA","GIB","GRC","GRL","GRD","GLP","GUM","GTM","GGY","GIN","GNB","GUY","HTI","HMD","VAT","HND","HKG","HUN","ISL","IND","IDN","IRN","IRQ","IRL","IMN","ISR","ITA","JAM","JPN","JEY","JOR","KAZ","KEN","KIR","PRK","KOR","KWT","KGZ","LAO","LVA","LBN","LSO","LBR","LBY","LIE","LTU","LUX","MAC","MDG","MWI","MYS","MDV","MLI","MLT","MHL","MTQ","MRT","MUS","MYT","MEX","FSM","MDA","MCO","MNG","MNE","MSR","MAR","MOZ","MMR","NAM","NRU","NPL","NLD","NCL","NZL","NIC","NER","NGA","NIU","NFK","MKD","MNP","NOR","OMN","PAK","PLW","PSE","PAN","PNG","PRY","PER","PHL","PCN","POL","PRT","PRI","QAT","REU","ROU","RUS","RWA","BLM","SHN","KNA","LCA","MAF","SPM","VCT","WSM","SMR","STP","SAU","SEN","SRB","SYC","SLE","SGP","SXM","SVK","SVN","SLB","SOM","ZAF","SGS","SSD","ESP","LKA","SDN","SUR","SJM","SWE","CHE","SYR","TWN","TJK","TZA","THA","TLS","TGO","TKL","TON","TTO","TUN","TUR","TKM","TCA","TUV","UGA","UKR","ARE","UMI","URY","UZB","VUT","VEN","VNM","VGB","VIR","WLF","ESH"].indexOf(splitCountrycode_Pipe) > -1){
				getShowCategories[index]["exclude"] = true;
			}


			if(["pakistan", "china", "bangla", "telugu", "gujarat", "kannada", "sinahlese", "punjab", "malayalam", "chinese", "japanese", "spanish", "french", "german", "canada", "france", "germany", "japan", "spain", "africa", "italy", "greek", "greece", "arab", "turk", "malta", "québec", "albania", "dutch", "netherland", "belgium", "austria", "swiss", "españa", "latin", "persia", "kurd", "hebrew", "russia", "bulgari", "hungary", "philippines", "nordic", "svensk", "dansk"].some(searchString => mCategory.includes(searchString))){
				getShowCategories[index]["exclude"] = true;
			}

			if(["viaplay", "discovery", "videoland", "pt/br", "norsk", "suomi", "íslands"].some(searchString => mCategory.includes(searchString))){
				getShowCategories[index]["exclude"] = true;
			}

			if(["india", "indian", "bollywood", "hollywood", "hindi", "tamil", "inr - ", "inr| ", "en - ", "en| ", "english"].some(searchString => mCategory.includes(searchString))){
				getShowCategories[index]["exclude"] = false;
			}

			JSON_ShowCategories[getShowCategories[index]["category_id"]] = getShowCategories[index];
		}
		
		return {JSON_ShowCategories: JSON_ShowCategories, getShowCategories: getShowCategories};
}
