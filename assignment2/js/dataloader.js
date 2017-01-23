var countryMap = new Map();
var landDist = new Map();
var gdpDist = new Map();

var timelineData;

// function InterpolateMissingData(data)
// {
// 	var countryCode = data['Country Name'];
// 	var previousData = 0;
// 	var interpolatedData = 0;
// 	var previouskey = '';
// 	for (key in data)//.foreach(function(data)
// 	{
		
// 		if (key >= 1960 && data[key] != 0)
// 		{
// 			previousData = Math.round(parseFloat(data[key]));// + " (in " + key + ")";
// 			previouskey = key;
// 		}
// 		else if (key >= 1960)
// 		{
// 			if (previousData != 0)
// 			{
// 				var nextKey = Number(key) + 1;
// 				while (nextKey in data && data[nextKey] == 0)
// 				{
// 					nextKey += 1;
// 				}
// 				if (nextKey in data && data[nextKey] != 0)
// 				{
// 					previousData += Math.round(Math.round((parseFloat(data[nextKey])) - previousData) / (nextKey - key));
// 					data[key] = previousData;
// 				}
// 				else
// 					data[key] = previousData;
// 			}	
// 			else
// 			{
// 				data[key] = previousData;
// 			}
// 		}
// 	}
// 	return data;
// }

function addIndicator(error, data, mapping, indicatorName) 
{
	var countryElement = [];
	var countryName = "";
	data.forEach(function(d) 
	{
		var countryName = d['Country Name'];
		countryElement = [];
		if (mapping.has(countryName))
		{
			countryElement = mapping.get(countryName);
		}

		countryElement[indicatorName] = [];

		for (key in d)
		{
			if (key >= 1960)
			{
				countryElement[indicatorName][key] = parseFloat(d[key]) || "";
			}
		}
		
		// Interpolate missing data, turn of by setting to 'd'.
		var interpolatedData = InterpolateMissingData(countryElement[indicatorName]);
		
    	countryElement[indicatorName] = interpolatedData;
    	mapping.set(countryName, countryElement);
	});
}

function loaddata()
{
	d3.csv("data/testworld.csv", function(error, data) {
		timelineData = data;
	});

	// Load country metadata such that we can identify a country using the country code
	d3.csv("data/country-codes.csv", function(error, data) {
	    data.forEach(function(d) {
	        countryMap.set(parseInt(d['M49']), 
	        	{"name": d['name'],  "code": d['ISO3166-1-Alpha-3']}
	        );
	    });
	});

	// Load land distribution metadata
	d3.csv("data/landdist/API_AG.LND.TOTL.K2_DS2_en_csv_v2.csv", function(error, data) {
		addIndicator(error, data, landDist, "Total_Land_Sqkm")
	});
	d3.csv("data/landdist/API_AG.LND.FRST.K2_DS2_en_csv_v2.csv", function(error, data) {
		addIndicator(error, data, landDist, "Forest_Land_Sqkm")
	});
	d3.csv("data/landdist/API_AG.LND.AGRI.K2_DS2_en_csv_v2.csv", function(error, data) {
		addIndicator(error, data, landDist, "Agriculture_Land_Sqkm")
	});
	d3.csv("data/landdist/API_AG.LND.TOTL.RU.K2_DS2_en_csv_v2.csv", function(error, data) {
		addIndicator(error, data, landDist, "Rural_Land_Sqkm")
	});
	d3.csv("data/landdist/API_AG.LND.TOTL.UR.K2_DS2_en_csv_v2.csv", function(error, data) {
		addIndicator(error, data, landDist, "Urban_Land_Sqkm")
	});

	// Load GDP distribution metadata
	d3.csv("data/gdpdist/API_NV.AGR.TOTL.ZS_DS2_en_csv_v2.csv", function(error, data) {
		addIndicator(error, data, gdpDist, "Agriculture_GDP_perc")
	});
	d3.csv("data/gdpdist/API_NV.IND.TOTL.ZS_DS2_en_csv_v2.csv", function(error, data) {
		addIndicator(error, data, gdpDist, "Industry_GDP_perc")
	});
	d3.csv("data/gdpdist/API_NV.SRV.TETC.ZS_DS2_en_csv_v2.csv", function(error, data) {
		addIndicator(error, data, gdpDist, "Services_GDP_perc")
	});
	/* // This is a subset of the industry GDP
	d3.csv("data/gdpdist/API_NV.IND.MANF.ZS_DS2_en_csv_v2.csv", function(error, data) {
		addIndicator(error, data, gdpDist, "Manifacturing_GDP_perc")
	});*/

	// Previous method
	// d3.csv("data/landdist/API_AG.LND.TOTL.K2_DS2_en_csv_v2.csv", function(error, data) {
	//     data.forEach(function(d) {
	//        landDist.set(d['Country Code'], d);
	//     });
	// });
}