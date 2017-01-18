var countryMap = new Map();
var landDist = new Map();
var gdpDist = new Map();

function PrettifyEmptyData()
{
	//TODO : Fix this

	console.log("hoi");
	console.log(landDist);
	for (var [key, value] of landDist)//.foreach(function(data)
	{
		console.log(key);
		var countryCode = key;
		var countryElement = landDist.get(countryCode);
		var previousData = '';
		value.forEach(function(d) 
		{
			if (d == '')
			{
				if (previousData != '')
				{
					//data[d] = "No data";
					countryElement[d] = "No data";
				}
				else
				{
					//data[d] = previousData;
    				countryElement[d] = data[d];
				}
			//Check for actual 'year' value
			}
			else
			{
				previousData = data[d];
			}
		});
    	landDist.set(countryCode, countryElement);

	}
}

function addIndicator(error, data, mapping, indicatorName) 
{
	data.forEach(function(d) 
	{
		var countryCode = d['Country Code'];
		var countryElement = [];

		if (mapping.has(countryCode))
		{
			countryElement = mapping.get(countryCode);
		}

    	countryElement[indicatorName] = d;
    	mapping.set(countryCode, countryElement);
	});
}

function loaddata()
{

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