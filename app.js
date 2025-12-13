import express from 'express';
import { Xtream } from '@iptv/xtream-api';

const app = express();
const port = process.env.PORT || 3001;
const arabicCharacters = /[\u0600-\u06FF]/;

//Key (unique account identifier) comes from user agent. or lookup the account with username field (not unique in scale).
const gApiKeys = {
	"020a99bbf5" : {server: "http://cf.one-cdn24.me", username: "020a99bbf5", password: "aaa38a3ab0"},
};
		

app.use(function(req, res, next) {
	res.locals.ua = req.get('User-Agent');
	next();
});


app.get("/", (req, res) => res.type('html').send(html_default_response));


//heartbeat
app.get("/pulse", async function(req, res){
	var response = await fetch("https://cf.business-cdn.me/player_api.php?username=020a99bbf5&password=aaa38a3ab0");
	res.type('html').send(await response.json());

});

//m3u
app.get("/get.php", function(req, res){
		
	res.type('html').sendStatus(404);

});

//EPG
app.get("/xmltv.php", function(req, res){
	var mUserAgent = res.locals.ua || req.headers['user-agent'];
	var m_var_Server = req.query.server;
	var m_var_Username = req.url.split("/")[2];
	var m_var_Password = req.url.split("/")[3];

	m_var_Server = (gApiKeys[mUserAgent] !== undefined) ? gApiKeys[mUserAgent].server : gApiKeys[m_var_Username].server;

	res.redirect(307, m_var_Server + req.url);

});


app.get("/player_api.php", async function(req, res){
	
	//console.log(res.locals.ua, req.headers['user-agent']);
	var mUserAgent = res.locals.ua || req.headers['user-agent'];
	
	console.log(req.url);
	var originalURL = req.url;
	
	var m_var_Server = req.query.server;
	var m_var_Username = decodeURI(req.query.username);
	var m_var_Password = decodeURI(req.query.password);
	var m_var_Action = req.query.action; //get_profile get_server_info get_live_streams get_channel_categories


	
	m_var_Server = (gApiKeys[mUserAgent] !== undefined) ? gApiKeys[mUserAgent].server : gApiKeys[m_var_Username].server;
	
	
	const xtream = new Xtream({
	  url: m_var_Server, //'http://cf.business-cdn.me',
	  username: m_var_Username, //'020a99bbf5',
	  password: m_var_Password, //'aaa38a3ab0',
	  preferredFormat: 'm3u8', // optional preferred format for channel URLs
	});

		console.log(m_var_Server, m_var_Username, m_var_Password, m_var_Action);

	if(m_var_Action === undefined || m_var_Action == "" || m_var_Action == "get_profile" || m_var_Action === "get_server_info"){
		
		var getProfile = await xtream.getProfile();
		var getServerInfo = await xtream.getServerInfo();

		res.type('json').send({"user_info": getProfile, "server_info": getServerInfo}); //
	
	}else if(m_var_Action === "zzz_get_server_info"){
		
		var getServerInfo = await xtream.getServerInfo();
		res.type('json').send(getServerInfo);
	
	}else if(m_var_Action === "get_series_categories" || m_var_Action === "get_show_categories"){
		
		var getSeriesCategoriesResult = await fncGetSeriesCategories(xtream);
		res.type('json').send(getSeriesCategoriesResult.getShowCategories);
		
	}else if(m_var_Action === "get_series"){
		var getSeriesCategoriesResult = await fncGetSeriesCategories(xtream);
		var JSON_ShowCategories = getSeriesCategoriesResult.JSON_ShowCategories;
		
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
		var getVODCategoriesResult = await fncGetVODCategories(xtream);
		res.type('json').send(getVODCategoriesResult.getMovieCategories);

	}else if(m_var_Action === "get_vod_streams"){
		var getVODCategoriesResult = await fncGetVODCategories(xtream);
		var JSON_MovieCategories = getVODCategoriesResult.JSON_MovieCategories;

		var getMovies = await xtream.getMovies();
		var filtered_getMovies = [];

			for(var index in getMovies){
				var mCategory_ID = getMovies[index].category_id;
				var mCategory_Name = JSON_MovieCategories[mCategory_ID].category_name.toLowerCase();
				var mVODName = getMovies[index].name;
				var mVODIsAdult = getMovies[index].getChannels;

				if((JSON_MovieCategories[mCategory_ID] !== undefined && JSON_MovieCategories[mCategory_ID].exclude == true) || (mVODIsAdult == 1 || mVODIsAdult == true || mVODIsAdult == "true")){
					
				}else{

					filtered_getMovies.push(getMovies[index]);
				}
			}
			
			getMovies = null;
		res.type('json').send(filtered_getMovies);

	}else if(m_var_Action === "get_live_categories" || m_var_Action === "get_channel_categories"){
		var getLiveCategoriesResult = await fncGetLiveCategories(xtream);
		res.type('json').send(getLiveCategoriesResult.getChannelCategories);

	}else if(m_var_Action === "get_live_streams"){
		var getLiveCategoriesResult = await fncGetLiveCategories(xtream);
		var JSON_ChannelCategories = getLiveCategoriesResult.JSON_ChannelCategories;

		var getChannels = await xtream.getChannels();
		var filtered_getChannels = [];

			for(var index in getChannels){
				var mCategory_ID = getChannels[index].category_id;
				var mCategory_Name = JSON_ChannelCategories[mCategory_ID].category_name.toLowerCase();
				var mChannelName = getChannels[index].name;
				var mChannelIsAdult = getChannels[index].is_adult;

				if((JSON_ChannelCategories[mCategory_ID] !== undefined && JSON_ChannelCategories[mCategory_ID].exclude == true) || (mChannelIsAdult == 1 || mChannelIsAdult == true || mChannelIsAdult == "true")){
					
				}else{

					getChannels[index]["category_id"] = 999999;
					
					if( ["cricket"].some(searchString => mCategory_Name.includes(searchString)) ){
						getChannels[index]["category_id"] = 999941;
					}else if( ["nfl"].some(searchString => mCategory_Name.includes(searchString)) ){
						getChannels[index]["category_id"] = 999942;
					}else if( ["nba"].some(searchString => mCategory_Name.includes(searchString)) ){
						getChannels[index]["category_id"] = 999943;
					}else if( ["mlb"].some(searchString => mCategory_Name.includes(searchString)) ){
						getChannels[index]["category_id"] = 999944;
					}else if( ["soccer"].some(searchString => mCategory_Name.includes(searchString)) ){
						getChannels[index]["category_id"] = 999945;
					}else if( ["sports", "golf", "boxing", "mma"].some(searchString => mCategory_Name.includes(searchString)) ){
						getChannels[index]["category_id"] = 999946;
					}else if(["tamil", "hindi", "bollywood", "in|", "in - ","inr - ", "inr| "].some(searchString => mCategory_Name.includes(searchString)) ){
					
						if(["kid", "cartoon"].some(searchString => mCategory_Name.includes(searchString)) ){
							getChannels[index]["category_id"] = 999921;
						}

						if(["tamil"].some(searchString => mCategory_Name.includes(searchString)) ){

							getChannels[index]["category_id"] = 999911;
							
							if(["news", "seithigal"].some(searchString => mChannelName.includes(searchString)) ){
								getChannels[index]["category_id"] = 999914;
							}else if(["movie", "24/7", "24x7"].some(searchString => mCategory_Name.includes(searchString)) ){ //***mCategory_Name NOT mChannelName
								getChannels[index]["category_id"] = 999916;
							}else if(["movie"].some(searchString => mChannelName.includes(searchString)) ){
								getChannels[index]["category_id"] = 999915;
							}else if(["music", "musix"].some(searchString => mChannelName.includes(searchString)) ){
								getChannels[index]["category_id"] = 999917;
							}else{
								getChannels[index]["category_id"] = 999913;
							}

						}

						if(["hindi", "bollywood"].some(searchString => mCategory_Name.includes(searchString)) ){

							getChannels[index]["category_id"] = 999931;
							
							if(["news"].some(searchString => mChannelName.includes(searchString)) ){
								getChannels[index]["category_id"] = 999934;
							}else if(["movie", "24/7", "24x7"].some(searchString => mCategory_Name.includes(searchString)) ){ //***mCategory_Name NOT mChannelName
								getChannels[index]["category_id"] = 999936;
							}else if(["movie"].some(searchString => mChannelName.includes(searchString)) ){
								getChannels[index]["category_id"] = 999935;
							}else if(["music", "musix"].some(searchString => mChannelName.includes(searchString)) ){
								getChannels[index]["category_id"] = 999937;
							}else{
								getChannels[index]["category_id"] = 999933;
							}

						}

					}else if(["english", "usa", "us|", "us - "].some(searchString => mCategory_Name.includes(searchString)) ){

						if(["kid", "cartoon"].some(searchString => mCategory_Name.includes(searchString)) ){
							getChannels[index]["category_id"] = 999925;
						}

					}




					/*
					getChannelCategories.unshift({"category_id": 999911,"category_name":"IN| Tamil > Other","parent_id":0,"exclude":false, "master_category": true});
					getChannelCategories.unshift({"category_id": 999913,"category_name":"IN| Tamil > Live TV","parent_id":0,"exclude":false, "master_category": true});
					getChannelCategories.unshift({"category_id": 999914,"category_name":"IN| Tamil > News","parent_id":0,"exclude":false, "master_category": true});
					getChannelCategories.unshift({"category_id": 999915,"category_name":"IN| Tamil > Movie TV","parent_id":0,"exclude":false, "master_category": true});
					getChannelCategories.unshift({"category_id": 999916,"category_name":"IN| Tamil > Movies 24/7","parent_id":0,"exclude":false, "master_category": true});
					getChannelCategories.unshift({"category_id": 999917,"category_name":"IN| Tamil > Music","parent_id":0,"exclude":false, "master_category": true});

					getChannelCategories.unshift({"category_id": 999921,"category_name":"IN| Kids > Movies","parent_id":0,"exclude":false, "master_category": true});
					getChannelCategories.unshift({"category_id": 999922,"category_name":"IN| Kids > Series","parent_id":0,"exclude":false, "master_category": true});
					
					getChannelCategories.unshift({"category_id": 999925,"category_name":"US| Kids > Movies","parent_id":0,"exclude":false, "master_category": true});
					getChannelCategories.unshift({"category_id": 999926,"category_name":"US| Kids > Series","parent_id":0,"exclude":false, "master_category": true});

					getChannelCategories.unshift({"category_id": 999931,"category_name":"IN| Hindi > Other","parent_id":0,"exclude":false, "master_category": true});
					getChannelCategories.unshift({"category_id": 999933,"category_name":"IN| Hindi > Live TV","parent_id":0,"exclude":false, "master_category": true});
					getChannelCategories.unshift({"category_id": 999934,"category_name":"IN| Hindi > News","parent_id":0,"exclude":false, "master_category": true});
					getChannelCategories.unshift({"category_id": 999935,"category_name":"IN| Hindi > Movies TV","parent_id":0,"exclude":false, "master_category": true});
					getChannelCategories.unshift({"category_id": 999936,"category_name":"IN| Hindi > Movies 24/7","parent_id":0,"exclude":false, "master_category": true});
					getChannelCategories.unshift({"category_id": 999937,"category_name":"IN| Hindi > Music","parent_id":0,"exclude":false, "master_category": true});

					getChannelCategories.unshift({"category_id": 999941,"category_name":"US| Sports > Cricket","parent_id":0,"exclude":false, "master_category": true});
					getChannelCategories.unshift({"category_id": 999942,"category_name":"US| Sports > NFL","parent_id":0,"exclude":false, "master_category": true});
					getChannelCategories.unshift({"category_id": 999943,"category_name":"US| Sports > NBA","parent_id":0,"exclude":false, "master_category": true});
					getChannelCategories.unshift({"category_id": 999944,"category_name":"US| Sports > MLB","parent_id":0,"exclude":false, "master_category": true});
					getChannelCategories.unshift({"category_id": 999945,"category_name":"US| Sports > Soccer","parent_id":0,"exclude":false, "master_category": true});
					getChannelCategories.unshift({"category_id": 999945,"category_name":"US| Sports > Other","parent_id":0,"exclude":false, "master_category": true});

					getChannelCategories.unshift({"category_id": 999951,"category_name":"US| News","parent_id":0,"exclude":false, "master_category": true});
					getChannelCategories.unshift({"category_id": 999952,"category_name":"US| Movies","parent_id":0,"exclude":false, "master_category": true});
					getChannelCategories.unshift({"category_id": 999953,"category_name":"US| Broadcast","parent_id":0,"exclude":false, "master_category": true});
					getChannelCategories.unshift({"category_id": 999954,"category_name":"US| Live TV","parent_id":0,"exclude":false, "master_category": true});
					
					getChannelCategories.unshift({"category_id": 999999,"category_name":"ZZ| Other","parent_id":0,"exclude":false, "master_category": true});

					*/
					
					getChannels[index]["category_ids"] = [getChannels[index]["category_id"] + ""];
					filtered_getChannels.push(getChannels[index]);
				}
			}
		
		getChannels = null;
		res.type('json').send(filtered_getChannels);

	//}else if(m_var_Action === "get_short_epg"){
	
	}else{

		const response = await fetch(m_var_Server + req.url);
		res.type('html').send(await response.text());
		
	}
	
	
	return;
	
});




app.get('/{*splat}', function(req, res) {

	console.log("other queries - " + req.url);
	var mUserAgent = res.locals.ua || req.headers['user-agent'];
	var m_var_Server = req.query.server;
	var m_var_Username = req.url.split("/")[2];
	var m_var_Password = req.url.split("/")[3];

	console.log(m_var_Server, m_var_Username, m_var_Password, "redirect info");
	m_var_Server = (gApiKeys[mUserAgent] !== undefined) ? gApiKeys[mUserAgent].server : gApiKeys[m_var_Username].server;

	res.redirect(308, m_var_Server + req.url);

	/*
	if(req.url.startsWith("/series/")){
		res.redirect(308, "http://cf.business-cdn.me" + req.url.replace("cf.business-cdn.me/", "").replace(":", "/"));
	} else if(req.url.startsWith("/live/")){
		//console.log("redirecting to " + "http://cf.business-cdn.me" + req.url.replace("cf.business-cdn.me/", "").replace(":", "/"));
		res.redirect(308, "http://cf.business-cdn.me" + req.url.replace("cf.business-cdn.me/", "").replace(":", "/"));
	} else if(req.url.startsWith("/movie/")){
		//console.log("redirecting to " + "http://cf.business-cdn.me" + req.url.replace("cf.business-cdn.me/", "").replace(":", "/"));
		res.redirect(308, "http://cf.business-cdn.me" + req.url.replace("cf.business-cdn.me/", "").replace(":", "/"));
	} else if(req.url.startsWith("/movies/")){
		//console.log("redirecting to " + "http://cf.business-cdn.me" + req.url.replace("cf.business-cdn.me/", "").replace(":", "/"));
		res.redirect(308, "http://cf.business-cdn.me" + req.url.replace("cf.business-cdn.me/", "").replace(":", "/"));
	}else{
		res.type('html').sendStatus(404);
	}
	*/
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



async function fncGetVODCategories(xtream){
	const getMovieCategories = await xtream.getMovieCategories();
	var JSON_MovieCategories = {};
	

		for(var index in getMovieCategories){
			getMovieCategories[index]["exclude"] = false;

			var mCategory = getMovieCategories[index].category_name;
			
			if(arabicCharacters.test(mCategory)){
				getMovieCategories[index]["exclude"] = true;
			}
			
			mCategory = mCategory.toLowerCase();
			//console.log(mCategory);
			
			
			var splitCountrycode_Hyphen = mCategory.split(" - ")[0].toUpperCase();
			if(["AF","AX","AL","DZ","AS","AD","AO","AI","AQ","AG","AR","AM","AW","AU","AT","AZ","BS","BH","BD","BB","BY","BE","BZ","BJ","BM","BT","BA","BW","BV","BR","IO","BN","BG","BF","BI","KH","CM","CA","CV","KY","CF","TD","CL","CN","CX","CC","CO","KM","CG","CK","CR","CI","HR","CU","CW","CY","CZ","DK","DJ","DM","DO","EC","EG","SV","GQ","ER","EE","ES","ET","FK","FO","FJ","FI","FR","GF","PF","TF","GA","GM","GE","DE","GH","GI","GR","GL","GD","GP","GU","GT","GG","GN","GW","GY","HT","HM","VA","HN","HK","HU","IS","ID","IR","IQ","IE","IM","IL","IT","JM","JP","JE","JO","KZ","KE","KI","KP","KR","KW","KG","LA","LV","LB","LS","LR","LY","LI","LT","LU","MO","MK","MG","MW","MY","MV","ML","MT","MH","MQ","MR","MU","YT","MX","FM","MD","MC","MN","ME","MS","MA","MZ","MM","NA","NR","NP","NL","NC","NZ","NI","NE","NG","NU","NF","MP","NO","OM","PK","PW","PS","PA","PG","PY","PE","PH","PN","PL","PT","PR","QA","RE","RO","RU","RW","BL","SH","KN","LC","MF","PM","VC","WS","SM","ST","SA","SN","RS","SC","SL","SG","SX","SK","SI","SB","SO","ZA","GS","SS","ES","LK","SD","SR","SJ","SZ","SE","CH","SY","TW","TJ","TZ","TH","TL","TG","TK","TO","TT","TN","TR","TM","TC","TV","UG","UA","AE","UM","UY","UZ","VU","VE","VN","VG","VI","WF","EH","YE","ZM","ZW"].indexOf(splitCountrycode_Hyphen) > -1){
				getMovieCategories[index]["exclude"] = true;
			}
			if(["AFG","ALA","ALB","DZA","ASM","AND","AGO","AIA","ATA","ATG","ARG","ARM","ABW","AUS","AUT","AZE","BHS","BHR","BGD","BRB","BLR","BEL","BLZ","BEN","BMU","BTN","BOL","BES","BIH","BWA","BVT","BRA","IOT","BRN","BGR","BFA","BDI","CPV","KHM","CMR","CAN","CYM","CAF","TCD","CHL","CHN","CXR","CCK","COL","COM","COG","COD","COK","CRI","CIV","HRV","CUB","CUW","CYP","CZE","DNK","DJI","DMA","DOM","ECU","EGY","SLV","GNQ","ERI","EST","SWZ","ETH","FLK","FRO","FJI","FIN","FRA","GUF","PYF","ATF","GAB","GMB","GEO","DEU","GHA","GIB","GRC","GRL","GRD","GLP","GUM","GTM","GGY","GIN","GNB","GUY","HTI","HMD","VAT","HND","HKG","HUN","ISL","IND","IDN","IRN","IRQ","IRL","IMN","ISR","ITA","JAM","JPN","JEY","JOR","KAZ","KEN","KIR","PRK","KOR","KWT","KGZ","LAO","LVA","LBN","LSO","LBR","LBY","LIE","LTU","LUX","MAC","MDG","MWI","MYS","MDV","MLI","MLT","MHL","MTQ","MRT","MUS","MYT","MEX","FSM","MDA","MCO","MNG","MNE","MSR","MAR","MOZ","MMR","NAM","NRU","NPL","NLD","NCL","NZL","NIC","NER","NGA","NIU","NFK","MKD","MNP","NOR","OMN","PAK","PLW","PSE","PAN","PNG","PRY","PER","PHL","PCN","POL","PRT","PRI","QAT","REU","ROU","RUS","RWA","BLM","SHN","KNA","LCA","MAF","SPM","VCT","WSM","SMR","STP","SAU","SEN","SRB","SYC","SLE","SGP","SXM","SVK","SVN","SLB","SOM","ZAF","SGS","SSD","ESP","LKA","SDN","SUR","SJM","SWE","CHE","SYR","TWN","TJK","TZA","THA","TLS","TGO","TKL","TON","TTO","TUN","TUR","TKM","TCA","TUV","UGA","UKR","ARE","UMI","URY","UZB","VUT","VEN","VNM","VGB","VIR","WLF","ESH"].indexOf(splitCountrycode_Hyphen) > -1){
				getMovieCategories[index]["exclude"] = true;
			}

			
			var splitCountrycode_Pipe = mCategory.split("|")[0].toUpperCase();
			if(["AF","AX","AL","DZ","AS","AD","AO","AI","AQ","AG","AR","AM","AW","AU","AT","AZ","BS","BH","BD","BB","BY","BE","BZ","BJ","BM","BT","BA","BW","BV","BR","IO","BN","BG","BF","BI","KH","CM","CA","CV","KY","CF","TD","CL","CN","CX","CC","CO","KM","CG","CK","CR","CI","HR","CU","CW","CY","CZ","DK","DJ","DM","DO","EC","EG","SV","GQ","ER","EE","ES","ET","FK","FO","FJ","FI","FR","GF","PF","TF","GA","GM","GE","DE","GH","GI","GR","GL","GD","GP","GU","GT","GG","GN","GW","GY","HT","HM","VA","HN","HK","HU","IS","ID","IR","IQ","IE","IM","IL","IT","JM","JP","JE","JO","KZ","KE","KI","KP","KR","KW","KG","LA","LV","LB","LS","LR","LY","LI","LT","LU","MO","MK","MG","MW","MY","MV","ML","MT","MH","MQ","MR","MU","YT","MX","FM","MD","MC","MN","ME","MS","MA","MZ","MM","NA","NR","NP","NL","NC","NZ","NI","NE","NG","NU","NF","MP","NO","OM","PK","PW","PS","PA","PG","PY","PE","PH","PN","PL","PT","PR","QA","RE","RO","RU","RW","BL","SH","KN","LC","MF","PM","VC","WS","SM","ST","SA","SN","RS","SC","SL","SG","SX","SK","SI","SB","SO","ZA","GS","SS","ES","LK","SD","SR","SJ","SZ","SE","CH","SY","TW","TJ","TZ","TH","TL","TG","TK","TO","TT","TN","TR","TM","TC","TV","UG","UA","AE","UM","UY","UZ","VU","VE","VN","VG","VI","WF","EH","YE","ZM","ZW"].indexOf(splitCountrycode_Pipe) > -1){
				getMovieCategories[index]["exclude"] = true;
			}
			if(["AFG","ALA","ALB","DZA","ASM","AND","AGO","AIA","ATA","ATG","ARG","ARM","ABW","AUS","AUT","AZE","BHS","BHR","BGD","BRB","BLR","BEL","BLZ","BEN","BMU","BTN","BOL","BES","BIH","BWA","BVT","BRA","IOT","BRN","BGR","BFA","BDI","CPV","KHM","CMR","CAN","CYM","CAF","TCD","CHL","CHN","CXR","CCK","COL","COM","COG","COD","COK","CRI","CIV","HRV","CUB","CUW","CYP","CZE","DNK","DJI","DMA","DOM","ECU","EGY","SLV","GNQ","ERI","EST","SWZ","ETH","FLK","FRO","FJI","FIN","FRA","GUF","PYF","ATF","GAB","GMB","GEO","DEU","GHA","GIB","GRC","GRL","GRD","GLP","GUM","GTM","GGY","GIN","GNB","GUY","HTI","HMD","VAT","HND","HKG","HUN","ISL","IND","IDN","IRN","IRQ","IRL","IMN","ISR","ITA","JAM","JPN","JEY","JOR","KAZ","KEN","KIR","PRK","KOR","KWT","KGZ","LAO","LVA","LBN","LSO","LBR","LBY","LIE","LTU","LUX","MAC","MDG","MWI","MYS","MDV","MLI","MLT","MHL","MTQ","MRT","MUS","MYT","MEX","FSM","MDA","MCO","MNG","MNE","MSR","MAR","MOZ","MMR","NAM","NRU","NPL","NLD","NCL","NZL","NIC","NER","NGA","NIU","NFK","MKD","MNP","NOR","OMN","PAK","PLW","PSE","PAN","PNG","PRY","PER","PHL","PCN","POL","PRT","PRI","QAT","REU","ROU","RUS","RWA","BLM","SHN","KNA","LCA","MAF","SPM","VCT","WSM","SMR","STP","SAU","SEN","SRB","SYC","SLE","SGP","SXM","SVK","SVN","SLB","SOM","ZAF","SGS","SSD","ESP","LKA","SDN","SUR","SJM","SWE","CHE","SYR","TWN","TJK","TZA","THA","TLS","TGO","TKL","TON","TTO","TUN","TUR","TKM","TCA","TUV","UGA","UKR","ARE","UMI","URY","UZB","VUT","VEN","VNM","VGB","VIR","WLF","ESH"].indexOf(splitCountrycode_Pipe) > -1){
				getMovieCategories[index]["exclude"] = true;
			}


			if(["pakistan", "china", "bangla", "telugu", "gujarat", "kannada", "sinahlese", "punjab", "malayalam", "chinese", "japanese", "spanish", "french", "german", "canada", "france", "germany", "japan", "spain", "africa", "italy", "greek", "greece", "arab", "turk", "malta", "québec", "albania", "dutch", "netherland", "belgium", "austria", "swiss", "españa", "latin", "persia", "kurd", "hebrew", "russia", "bulgari", "hungary", "philippines", "nordic", "svensk", "dansk", "polish", "poland", "polska"].some(searchString => mCategory.includes(searchString))){
				getMovieCategories[index]["exclude"] = true;
			}

			if(["viaplay", "porn", "xxx", "adult", "discovery", "videoland", "pt/br", "afr", "exyu", "somalia", "canal",  "norsk", "suomi", "íslands"].some(searchString => mCategory.includes(searchString))){
				getMovieCategories[index]["exclude"] = true;
			}

			
			if(["india", "indian", "bollywood", "hollywood", "hindi", "tamil", "in|", "in - ", "inr - ", "inr| ", "en - ", "en| ", "english"].some(searchString => mCategory.includes(searchString))){
				getMovieCategories[index]["exclude"] = false;
			}

			JSON_MovieCategories[getMovieCategories[index]["category_id"]] = getMovieCategories[index];

		}
		

		
		return {JSON_MovieCategories: JSON_MovieCategories, getMovieCategories: getMovieCategories};

}


async function fncGetLiveCategories(xtream){
	const getChannelCategories = await xtream.getChannelCategories();
	var JSON_ChannelCategories = {};

		getChannelCategories.unshift({"category_id": 999911,"category_name":"IN| Tamil > Other","parent_id":0,"exclude":false, "master_category": true});
		getChannelCategories.unshift({"category_id": 999913,"category_name":"IN| Tamil > Live TV","parent_id":0,"exclude":false, "master_category": true});
		getChannelCategories.unshift({"category_id": 999914,"category_name":"IN| Tamil > News","parent_id":0,"exclude":false, "master_category": true});
		getChannelCategories.unshift({"category_id": 999915,"category_name":"IN| Tamil > Movie TV","parent_id":0,"exclude":false, "master_category": true});
		getChannelCategories.unshift({"category_id": 999916,"category_name":"IN| Tamil > Movies 24/7","parent_id":0,"exclude":false, "master_category": true});
		getChannelCategories.unshift({"category_id": 999917,"category_name":"IN| Tamil > Music","parent_id":0,"exclude":false, "master_category": true});

		getChannelCategories.unshift({"category_id": 999921,"category_name":"IN| Kids > Movies","parent_id":0,"exclude":false, "master_category": true});
		getChannelCategories.unshift({"category_id": 999922,"category_name":"IN| Kids > Series","parent_id":0,"exclude":false, "master_category": true});
		
		getChannelCategories.unshift({"category_id": 999925,"category_name":"US| Kids > Movies","parent_id":0,"exclude":false, "master_category": true});
		getChannelCategories.unshift({"category_id": 999926,"category_name":"US| Kids > Series","parent_id":0,"exclude":false, "master_category": true});

		getChannelCategories.unshift({"category_id": 999931,"category_name":"IN| Hindi > Other","parent_id":0,"exclude":false, "master_category": true});
		getChannelCategories.unshift({"category_id": 999933,"category_name":"IN| Hindi > Live TV","parent_id":0,"exclude":false, "master_category": true});
		getChannelCategories.unshift({"category_id": 999934,"category_name":"IN| Hindi > News","parent_id":0,"exclude":false, "master_category": true});
		getChannelCategories.unshift({"category_id": 999935,"category_name":"IN| Hindi > Movies TV","parent_id":0,"exclude":false, "master_category": true});
		getChannelCategories.unshift({"category_id": 999936,"category_name":"IN| Hindi > Movies 24/7","parent_id":0,"exclude":false, "master_category": true});
		getChannelCategories.unshift({"category_id": 999937,"category_name":"IN| Hindi > Music","parent_id":0,"exclude":false, "master_category": true});

		getChannelCategories.unshift({"category_id": 999941,"category_name":"US| Sports > Cricket","parent_id":0,"exclude":false, "master_category": true});
		getChannelCategories.unshift({"category_id": 999942,"category_name":"US| Sports > NFL","parent_id":0,"exclude":false, "master_category": true});
		getChannelCategories.unshift({"category_id": 999943,"category_name":"US| Sports > NBA","parent_id":0,"exclude":false, "master_category": true});
		getChannelCategories.unshift({"category_id": 999944,"category_name":"US| Sports > MLB","parent_id":0,"exclude":false, "master_category": true});
		getChannelCategories.unshift({"category_id": 999945,"category_name":"US| Sports > Soccer","parent_id":0,"exclude":false, "master_category": true});
		getChannelCategories.unshift({"category_id": 999946,"category_name":"US| Sports > Other","parent_id":0,"exclude":false, "master_category": true});

		getChannelCategories.unshift({"category_id": 999951,"category_name":"US| News","parent_id":0,"exclude":false, "master_category": true});
		getChannelCategories.unshift({"category_id": 999952,"category_name":"US| Movies","parent_id":0,"exclude":false, "master_category": true});
		getChannelCategories.unshift({"category_id": 999953,"category_name":"US| Broadcast","parent_id":0,"exclude":false, "master_category": true});
		getChannelCategories.unshift({"category_id": 999954,"category_name":"US| Live TV","parent_id":0,"exclude":false, "master_category": true});
		
		getChannelCategories.unshift({"category_id": 999999,"category_name":"ZZ| Other","parent_id":0,"exclude":false, "master_category": true});

	
		for(var index in getChannelCategories){
			getChannelCategories[index]["exclude"] = false;

			var mCategory = getChannelCategories[index].category_name;
			
			if(mCategory.master_category == true){
				JSON_ChannelCategories[getChannelCategories[index]["category_id"]] = getChannelCategories[index];
				continue;
			}
			
			//remove clashes with new master category
			if(JSON_ChannelCategories[getChannelCategories[index]["category_id"]] !== undefined && JSON_ChannelCategories[getChannelCategories[index]["category_id"]].master_category == true){
				getChannelCategories[index]["category_id"] = "zzzz" + getChannelCategories[index]["category_id"];
			}
			
			if(arabicCharacters.test(mCategory)){
				getChannelCategories[index]["exclude"] = true;
			}
			
			mCategory = mCategory.toLowerCase();
			//console.log(mCategory);
			
			
			var splitCountrycode_Hyphen = mCategory.split(" - ")[0].toUpperCase();
			if(["AF","AX","AL","DZ","AS","AD","AO","AI","AQ","AG","AR","AM","AW","AU","AT","AZ","BS","BH","BD","BB","BY","BE","BZ","BJ","BM","BT","BA","BW","BV","BR","IO","BN","BG","BF","BI","KH","CM","CA","CV","KY","CF","TD","CL","CN","CX","CC","CO","KM","CG","CK","CR","CI","HR","CU","CW","CY","CZ","DK","DJ","DM","DO","EC","EG","SV","GQ","ER","EE","ES","ET","FK","FO","FJ","FI","FR","GF","PF","TF","GA","GM","GE","DE","GH","GI","GR","GL","GD","GP","GU","GT","GG","GN","GW","GY","HT","HM","VA","HN","HK","HU","IS","ID","IR","IQ","IE","IM","IL","IT","JM","JP","JE","JO","KZ","KE","KI","KP","KR","KW","KG","LA","LV","LB","LS","LR","LY","LI","LT","LU","MO","MK","MG","MW","MY","MV","ML","MT","MH","MQ","MR","MU","YT","MX","FM","MD","MC","MN","ME","MS","MA","MZ","MM","NA","NR","NP","NL","NC","NZ","NI","NE","NG","NU","NF","MP","NO","OM","PK","PW","PS","PA","PG","PY","PE","PH","PN","PL","PT","PR","QA","RE","RO","RU","RW","BL","SH","KN","LC","MF","PM","VC","WS","SM","ST","SA","SN","RS","SC","SL","SG","SX","SK","SI","SB","SO","ZA","GS","SS","ES","LK","SD","SR","SJ","SZ","SE","CH","SY","TW","TJ","TZ","TH","TL","TG","TK","TO","TT","TN","TR","TM","TC","TV","UG","UA","AE","UM","UY","UZ","VU","VE","VN","VG","VI","WF","EH","YE","ZM","ZW"].indexOf(splitCountrycode_Hyphen) > -1){
				getChannelCategories[index]["exclude"] = true;
			}
			if(["AFG","ALA","ALB","DZA","ASM","AND","AGO","AIA","ATA","ATG","ARG","ARM","ABW","AUS","AUT","AZE","BHS","BHR","BGD","BRB","BLR","BEL","BLZ","BEN","BMU","BTN","BOL","BES","BIH","BWA","BVT","BRA","IOT","BRN","BGR","BFA","BDI","CPV","KHM","CMR","CAN","CYM","CAF","TCD","CHL","CHN","CXR","CCK","COL","COM","COG","COD","COK","CRI","CIV","HRV","CUB","CUW","CYP","CZE","DNK","DJI","DMA","DOM","ECU","EGY","SLV","GNQ","ERI","EST","SWZ","ETH","FLK","FRO","FJI","FIN","FRA","GUF","PYF","ATF","GAB","GMB","GEO","DEU","GHA","GIB","GRC","GRL","GRD","GLP","GUM","GTM","GGY","GIN","GNB","GUY","HTI","HMD","VAT","HND","HKG","HUN","ISL","IND","IDN","IRN","IRQ","IRL","IMN","ISR","ITA","JAM","JPN","JEY","JOR","KAZ","KEN","KIR","PRK","KOR","KWT","KGZ","LAO","LVA","LBN","LSO","LBR","LBY","LIE","LTU","LUX","MAC","MDG","MWI","MYS","MDV","MLI","MLT","MHL","MTQ","MRT","MUS","MYT","MEX","FSM","MDA","MCO","MNG","MNE","MSR","MAR","MOZ","MMR","NAM","NRU","NPL","NLD","NCL","NZL","NIC","NER","NGA","NIU","NFK","MKD","MNP","NOR","OMN","PAK","PLW","PSE","PAN","PNG","PRY","PER","PHL","PCN","POL","PRT","PRI","QAT","REU","ROU","RUS","RWA","BLM","SHN","KNA","LCA","MAF","SPM","VCT","WSM","SMR","STP","SAU","SEN","SRB","SYC","SLE","SGP","SXM","SVK","SVN","SLB","SOM","ZAF","SGS","SSD","ESP","LKA","SDN","SUR","SJM","SWE","CHE","SYR","TWN","TJK","TZA","THA","TLS","TGO","TKL","TON","TTO","TUN","TUR","TKM","TCA","TUV","UGA","UKR","ARE","UMI","URY","UZB","VUT","VEN","VNM","VGB","VIR","WLF","ESH"].indexOf(splitCountrycode_Hyphen) > -1){
				getChannelCategories[index]["exclude"] = true;
			}

			
			var splitCountrycode_Pipe = mCategory.split("|")[0].toUpperCase();
			if(["AF","AX","AL","DZ","AS","AD","AO","AI","AQ","AG","AR","AM","AW","AU","AT","AZ","BS","BH","BD","BB","BY","BE","BZ","BJ","BM","BT","BA","BW","BV","BR","IO","BN","BG","BF","BI","KH","CM","CA","CV","KY","CF","TD","CL","CN","CX","CC","CO","KM","CG","CK","CR","CI","HR","CU","CW","CY","CZ","DK","DJ","DM","DO","EC","EG","SV","GQ","ER","EE","ES","ET","FK","FO","FJ","FI","FR","GF","PF","TF","GA","GM","GE","DE","GH","GI","GR","GL","GD","GP","GU","GT","GG","GN","GW","GY","HT","HM","VA","HN","HK","HU","IS","ID","IR","IQ","IE","IM","IL","IT","JM","JP","JE","JO","KZ","KE","KI","KP","KR","KW","KG","LA","LV","LB","LS","LR","LY","LI","LT","LU","MO","MK","MG","MW","MY","MV","ML","MT","MH","MQ","MR","MU","YT","MX","FM","MD","MC","MN","ME","MS","MA","MZ","MM","NA","NR","NP","NL","NC","NZ","NI","NE","NG","NU","NF","MP","NO","OM","PK","PW","PS","PA","PG","PY","PE","PH","PN","PL","PT","PR","QA","RE","RO","RU","RW","BL","SH","KN","LC","MF","PM","VC","WS","SM","ST","SA","SN","RS","SC","SL","SG","SX","SK","SI","SB","SO","ZA","GS","SS","ES","LK","SD","SR","SJ","SZ","SE","CH","SY","TW","TJ","TZ","TH","TL","TG","TK","TO","TT","TN","TR","TM","TC","TV","UG","UA","AE","UM","UY","UZ","VU","VE","VN","VG","VI","WF","EH","YE","ZM","ZW"].indexOf(splitCountrycode_Pipe) > -1){
				getChannelCategories[index]["exclude"] = true;
			}
			if(["AFG","ALA","ALB","DZA","ASM","AND","AGO","AIA","ATA","ATG","ARG","ARM","ABW","AUS","AUT","AZE","BHS","BHR","BGD","BRB","BLR","BEL","BLZ","BEN","BMU","BTN","BOL","BES","BIH","BWA","BVT","BRA","IOT","BRN","BGR","BFA","BDI","CPV","KHM","CMR","CAN","CYM","CAF","TCD","CHL","CHN","CXR","CCK","COL","COM","COG","COD","COK","CRI","CIV","HRV","CUB","CUW","CYP","CZE","DNK","DJI","DMA","DOM","ECU","EGY","SLV","GNQ","ERI","EST","SWZ","ETH","FLK","FRO","FJI","FIN","FRA","GUF","PYF","ATF","GAB","GMB","GEO","DEU","GHA","GIB","GRC","GRL","GRD","GLP","GUM","GTM","GGY","GIN","GNB","GUY","HTI","HMD","VAT","HND","HKG","HUN","ISL","IND","IDN","IRN","IRQ","IRL","IMN","ISR","ITA","JAM","JPN","JEY","JOR","KAZ","KEN","KIR","PRK","KOR","KWT","KGZ","LAO","LVA","LBN","LSO","LBR","LBY","LIE","LTU","LUX","MAC","MDG","MWI","MYS","MDV","MLI","MLT","MHL","MTQ","MRT","MUS","MYT","MEX","FSM","MDA","MCO","MNG","MNE","MSR","MAR","MOZ","MMR","NAM","NRU","NPL","NLD","NCL","NZL","NIC","NER","NGA","NIU","NFK","MKD","MNP","NOR","OMN","PAK","PLW","PSE","PAN","PNG","PRY","PER","PHL","PCN","POL","PRT","PRI","QAT","REU","ROU","RUS","RWA","BLM","SHN","KNA","LCA","MAF","SPM","VCT","WSM","SMR","STP","SAU","SEN","SRB","SYC","SLE","SGP","SXM","SVK","SVN","SLB","SOM","ZAF","SGS","SSD","ESP","LKA","SDN","SUR","SJM","SWE","CHE","SYR","TWN","TJK","TZA","THA","TLS","TGO","TKL","TON","TTO","TUN","TUR","TKM","TCA","TUV","UGA","UKR","ARE","UMI","URY","UZB","VUT","VEN","VNM","VGB","VIR","WLF","ESH"].indexOf(splitCountrycode_Pipe) > -1){
				getChannelCategories[index]["exclude"] = true;
			}


			if(["pakistan", "china", "bangla", "telugu", "gujarat", "kannada", "sinahlese", "punjab", "malayalam", "chinese", "japanese", "spanish", "french", "german", "canada", "france", "germany", "japan", "spain", "africa", "italy", "greek", "greece", "arab", "turk", "malta", "québec", "albania", "dutch", "netherland", "belgium", "austria", "swiss", "españa", "latin", "persia", "kurd", "hebrew", "russia", "bulgari", "hungary", "philippines", "nordic", "svensk", "dansk", "polish", "poland", "polska"].some(searchString => mCategory.includes(searchString))){
				getChannelCategories[index]["exclude"] = true;
			}

			if(["viaplay", "porn", "xxx", "adult", "discovery", "videoland", "pt/br", "afr", "exyu", "somalia", "canal",  "norsk", "suomi", "íslands"].some(searchString => mCategory.includes(searchString))){
				getChannelCategories[index]["exclude"] = true;
			}

			
			if(["india", "indian", "bollywood", "hollywood", "hindi", "tamil", "in|", "in - ", "inr - ", "inr| ", "en - ", "en| ", "english"].some(searchString => mCategory.includes(searchString))){
				getChannelCategories[index]["exclude"] = false;
			}

			JSON_ChannelCategories[getChannelCategories[index]["category_id"]] = getChannelCategories[index];

		}
		
		

		return {JSON_ChannelCategories: JSON_ChannelCategories, getChannelCategories: getChannelCategories};

}



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
			
			
			var splitCountrycode_Hyphen = mCategory.split(" - ")[0].toUpperCase();
			if(["AF","AX","AL","DZ","AS","AD","AO","AI","AQ","AG","AR","AM","AW","AU","AT","AZ","BS","BH","BD","BB","BY","BE","BZ","BJ","BM","BT","BA","BW","BV","BR","IO","BN","BG","BF","BI","KH","CM","CA","CV","KY","CF","TD","CL","CN","CX","CC","CO","KM","CG","CK","CR","CI","HR","CU","CW","CY","CZ","DK","DJ","DM","DO","EC","EG","SV","GQ","ER","EE","ES","ET","FK","FO","FJ","FI","FR","GF","PF","TF","GA","GM","GE","DE","GH","GI","GR","GL","GD","GP","GU","GT","GG","GN","GW","GY","HT","HM","VA","HN","HK","HU","IS","ID","IR","IQ","IE","IM","IL","IT","JM","JP","JE","JO","KZ","KE","KI","KP","KR","KW","KG","LA","LV","LB","LS","LR","LY","LI","LT","LU","MO","MK","MG","MW","MY","MV","ML","MT","MH","MQ","MR","MU","YT","MX","FM","MD","MC","MN","ME","MS","MA","MZ","MM","NA","NR","NP","NL","NC","NZ","NI","NE","NG","NU","NF","MP","NO","OM","PK","PW","PS","PA","PG","PY","PE","PH","PN","PL","PT","PR","QA","RE","RO","RU","RW","BL","SH","KN","LC","MF","PM","VC","WS","SM","ST","SA","SN","RS","SC","SL","SG","SX","SK","SI","SB","SO","ZA","GS","SS","ES","LK","SD","SR","SJ","SZ","SE","CH","SY","TW","TJ","TZ","TH","TL","TG","TK","TO","TT","TN","TR","TM","TC","TV","UG","UA","AE","UM","UY","UZ","VU","VE","VN","VG","VI","WF","EH","YE","ZM","ZW"].indexOf(splitCountrycode_Hyphen) > -1){
				getShowCategories[index]["exclude"] = true;
			}
			if(["AFG","ALA","ALB","DZA","ASM","AND","AGO","AIA","ATA","ATG","ARG","ARM","ABW","AUS","AUT","AZE","BHS","BHR","BGD","BRB","BLR","BEL","BLZ","BEN","BMU","BTN","BOL","BES","BIH","BWA","BVT","BRA","IOT","BRN","BGR","BFA","BDI","CPV","KHM","CMR","CAN","CYM","CAF","TCD","CHL","CHN","CXR","CCK","COL","COM","COG","COD","COK","CRI","CIV","HRV","CUB","CUW","CYP","CZE","DNK","DJI","DMA","DOM","ECU","EGY","SLV","GNQ","ERI","EST","SWZ","ETH","FLK","FRO","FJI","FIN","FRA","GUF","PYF","ATF","GAB","GMB","GEO","DEU","GHA","GIB","GRC","GRL","GRD","GLP","GUM","GTM","GGY","GIN","GNB","GUY","HTI","HMD","VAT","HND","HKG","HUN","ISL","IND","IDN","IRN","IRQ","IRL","IMN","ISR","ITA","JAM","JPN","JEY","JOR","KAZ","KEN","KIR","PRK","KOR","KWT","KGZ","LAO","LVA","LBN","LSO","LBR","LBY","LIE","LTU","LUX","MAC","MDG","MWI","MYS","MDV","MLI","MLT","MHL","MTQ","MRT","MUS","MYT","MEX","FSM","MDA","MCO","MNG","MNE","MSR","MAR","MOZ","MMR","NAM","NRU","NPL","NLD","NCL","NZL","NIC","NER","NGA","NIU","NFK","MKD","MNP","NOR","OMN","PAK","PLW","PSE","PAN","PNG","PRY","PER","PHL","PCN","POL","PRT","PRI","QAT","REU","ROU","RUS","RWA","BLM","SHN","KNA","LCA","MAF","SPM","VCT","WSM","SMR","STP","SAU","SEN","SRB","SYC","SLE","SGP","SXM","SVK","SVN","SLB","SOM","ZAF","SGS","SSD","ESP","LKA","SDN","SUR","SJM","SWE","CHE","SYR","TWN","TJK","TZA","THA","TLS","TGO","TKL","TON","TTO","TUN","TUR","TKM","TCA","TUV","UGA","UKR","ARE","UMI","URY","UZB","VUT","VEN","VNM","VGB","VIR","WLF","ESH"].indexOf(splitCountrycode_Hyphen) > -1){
				getShowCategories[index]["exclude"] = true;
			}

			
			var splitCountrycode_Pipe = mCategory.split("|")[0].toUpperCase();
			if(["AF","AX","AL","DZ","AS","AD","AO","AI","AQ","AG","AR","AM","AW","AU","AT","AZ","BS","BH","BD","BB","BY","BE","BZ","BJ","BM","BT","BA","BW","BV","BR","IO","BN","BG","BF","BI","KH","CM","CA","CV","KY","CF","TD","CL","CN","CX","CC","CO","KM","CG","CK","CR","CI","HR","CU","CW","CY","CZ","DK","DJ","DM","DO","EC","EG","SV","GQ","ER","EE","ES","ET","FK","FO","FJ","FI","FR","GF","PF","TF","GA","GM","GE","DE","GH","GI","GR","GL","GD","GP","GU","GT","GG","GN","GW","GY","HT","HM","VA","HN","HK","HU","IS","ID","IR","IQ","IE","IM","IL","IT","JM","JP","JE","JO","KZ","KE","KI","KP","KR","KW","KG","LA","LV","LB","LS","LR","LY","LI","LT","LU","MO","MK","MG","MW","MY","MV","ML","MT","MH","MQ","MR","MU","YT","MX","FM","MD","MC","MN","ME","MS","MA","MZ","MM","NA","NR","NP","NL","NC","NZ","NI","NE","NG","NU","NF","MP","NO","OM","PK","PW","PS","PA","PG","PY","PE","PH","PN","PL","PT","PR","QA","RE","RO","RU","RW","BL","SH","KN","LC","MF","PM","VC","WS","SM","ST","SA","SN","RS","SC","SL","SG","SX","SK","SI","SB","SO","ZA","GS","SS","ES","LK","SD","SR","SJ","SZ","SE","CH","SY","TW","TJ","TZ","TH","TL","TG","TK","TO","TT","TN","TR","TM","TC","TV","UG","UA","AE","UM","UY","UZ","VU","VE","VN","VG","VI","WF","EH","YE","ZM","ZW"].indexOf(splitCountrycode_Pipe) > -1){
				getShowCategories[index]["exclude"] = true;
			}
			if(["AFG","ALA","ALB","DZA","ASM","AND","AGO","AIA","ATA","ATG","ARG","ARM","ABW","AUS","AUT","AZE","BHS","BHR","BGD","BRB","BLR","BEL","BLZ","BEN","BMU","BTN","BOL","BES","BIH","BWA","BVT","BRA","IOT","BRN","BGR","BFA","BDI","CPV","KHM","CMR","CAN","CYM","CAF","TCD","CHL","CHN","CXR","CCK","COL","COM","COG","COD","COK","CRI","CIV","HRV","CUB","CUW","CYP","CZE","DNK","DJI","DMA","DOM","ECU","EGY","SLV","GNQ","ERI","EST","SWZ","ETH","FLK","FRO","FJI","FIN","FRA","GUF","PYF","ATF","GAB","GMB","GEO","DEU","GHA","GIB","GRC","GRL","GRD","GLP","GUM","GTM","GGY","GIN","GNB","GUY","HTI","HMD","VAT","HND","HKG","HUN","ISL","IND","IDN","IRN","IRQ","IRL","IMN","ISR","ITA","JAM","JPN","JEY","JOR","KAZ","KEN","KIR","PRK","KOR","KWT","KGZ","LAO","LVA","LBN","LSO","LBR","LBY","LIE","LTU","LUX","MAC","MDG","MWI","MYS","MDV","MLI","MLT","MHL","MTQ","MRT","MUS","MYT","MEX","FSM","MDA","MCO","MNG","MNE","MSR","MAR","MOZ","MMR","NAM","NRU","NPL","NLD","NCL","NZL","NIC","NER","NGA","NIU","NFK","MKD","MNP","NOR","OMN","PAK","PLW","PSE","PAN","PNG","PRY","PER","PHL","PCN","POL","PRT","PRI","QAT","REU","ROU","RUS","RWA","BLM","SHN","KNA","LCA","MAF","SPM","VCT","WSM","SMR","STP","SAU","SEN","SRB","SYC","SLE","SGP","SXM","SVK","SVN","SLB","SOM","ZAF","SGS","SSD","ESP","LKA","SDN","SUR","SJM","SWE","CHE","SYR","TWN","TJK","TZA","THA","TLS","TGO","TKL","TON","TTO","TUN","TUR","TKM","TCA","TUV","UGA","UKR","ARE","UMI","URY","UZB","VUT","VEN","VNM","VGB","VIR","WLF","ESH"].indexOf(splitCountrycode_Pipe) > -1){
				getShowCategories[index]["exclude"] = true;
			}


			if(["pakistan", "china", "bangla", "telugu", "gujarat", "kannada", "sinahlese", "punjab", "malayalam", "chinese", "japanese", "spanish", "french", "german", "canada", "france", "germany", "japan", "spain", "africa", "italy", "greek", "greece", "arab", "turk", "malta", "québec", "albania", "dutch", "netherland", "belgium", "austria", "swiss", "españa", "latin", "persia", "kurd", "hebrew", "russia", "bulgari", "hungary", "philippines", "nordic", "svensk", "dansk", "polish", "poland", "polska"].some(searchString => mCategory.includes(searchString))){
				getShowCategories[index]["exclude"] = true;
			}

			if(["viaplay", "porn", "xxx", "adult", "discovery", "videoland", "pt/br", "afr", "exyu", "somalia", "canal",  "norsk", "suomi", "íslands", "russain"].some(searchString => mCategory.includes(searchString))){
				getShowCategories[index]["exclude"] = true;
			}

			if(["india", "indian", "bollywood", "hollywood", "hindi", "tamil", "in|", "in - ", "inr - ", "inr| ", "en - ", "en| ", "english"].some(searchString => mCategory.includes(searchString))){
				getShowCategories[index]["exclude"] = false;
			}
			
			//final category override over preffered channels
			if(["turkish"].some(searchString => mCategory.includes(searchString))){
				getShowCategories[index]["exclude"] = true;
			}

			

			JSON_ShowCategories[getShowCategories[index]["category_id"]] = getShowCategories[index];
		}
		
		return {JSON_ShowCategories: JSON_ShowCategories, getShowCategories: getShowCategories};
}
