var countryMap = new Map();
var developmentData = new Map();

var timelineData;

function addIndicator(error, data, mapping, mainIndicator, indicatorName) 
{
	var indicatorMap = new Map();
	var countryElement = [];
	var countryName = "";
	var val = 0;
	data.forEach(function(d) 
	{
		countryName = d['Country Name'];
		countryElement = [];
		if (mapping.has(mainIndicator))
		{
			indicatorMap = mapping.get(mainIndicator);
		}

		if (indicatorMap.has(countryName))
		{
			countryElement = indicatorMap.get(countryName);
		}

		//countryElement[indicatorName] = [];

		for (key in d)
		{
			if (!isNaN(parseInt(key)))
			{
				//countryElement[indicatorName][key] = parseFloat(d[key]) || "";
		  		var missingdata = isNaN(parseInt(d[key]));
		  		if(!missingdata)
		  			val = parseInt(d[key]);
		  		else
		  			val = 0;

				countryElement.push({
			  		"date": key,
			  		"val": val,
			  		"indicator": indicatorName,
			  		"nodata" : missingdata,
			  		"country" : countryName
			  	});
			}
		}
		
    	indicatorMap.set(countryName, countryElement);
    	mapping.set(mainIndicator, indicatorMap);
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
	// d3.csv("data/landdist/API_AG.LND.TOTL.K2_DS2_en_csv_v2.csv", function(error, data) {
	// 	addIndicator(error, data, landDist, "Total_Land_Sqkm")
	// });
	// d3.csv("data/landdist/API_AG.LND.FRST.K2_DS2_en_csv_v2.csv", function(error, data) {
	// 	addIndicator(error, data, landDist, "Forest_Land_Sqkm")
	// });
	// d3.csv("data/landdist/API_AG.LND.AGRI.K2_DS2_en_csv_v2.csv", function(error, data) {
	// 	addIndicator(error, data, landDist, "Agriculture_Land_Sqkm")
	// });
	// d3.csv("data/landdist/API_AG.LND.TOTL.RU.K2_DS2_en_csv_v2.csv", function(error, data) {
	// 	addIndicator(error, data, landDist, "Rural_Land_Sqkm")
	// });
	// d3.csv("data/landdist/API_AG.LND.TOTL.UR.K2_DS2_en_csv_v2.csv", function(error, data) {
	// 	addIndicator(error, data, landDist, "Urban_Land_Sqkm")
	// });


	// Load land distribution percentage metadata
	d3.csv("data/landdistperc/API_AG.LND.AGRI.ZS_DS2_en_csv_v2.csv", function(error, data) {
		addIndicator(error, data, developmentData, "Land_Distribution", "Agriculture_Land_perc")
	});
	d3.csv("data/landdistperc/API_AG.LND.ARBL.ZS_DS2_en_csv_v2.csv", function(error, data) {
		addIndicator(error, data, developmentData, "Land_Distribution", "Arable_Land_perc")
	});
	d3.csv("data/landdistperc/API_AG.LND.FRST.ZS_DS2_en_csv_v2.csv", function(error, data) {
		addIndicator(error, data, developmentData, "Land_Distribution", "Forest_Land_perc")
	});


	// Load GDP distribution percentage metadata
	d3.csv("data/gdpdist/API_NV.AGR.TOTL.ZS_DS2_en_csv_v2.csv", function(error, data) {
		addIndicator(error, data, developmentData, "GDP_Distribution" ,"Agriculture_GDP_perc")
	});
	d3.csv("data/gdpdist/API_NV.IND.TOTL.ZS_DS2_en_csv_v2.csv", function(error, data) {
		addIndicator(error, data, developmentData, "GDP_Distribution", "Industry_GDP_perc")
	});
	d3.csv("data/gdpdist/API_NV.SRV.TETC.ZS_DS2_en_csv_v2.csv", function(error, data) {
		addIndicator(error, data, developmentData, "GDP_Distribution", "Services_GDP_perc")
	});
	/* // This is a subset of the industry GDP
	d3.csv("data/gdpdist/API_NV.IND.MANF.ZS_DS2_en_csv_v2.csv", function(error, data) {
		addIndicator(error, data, gdpDist, "Manifacturing_GDP_perc")
	});*/
}