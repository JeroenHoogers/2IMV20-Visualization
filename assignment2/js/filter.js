var Filter = function (map, timeline, pieChartA, pieChartB) 
{
	this.worldmap = map;
	this.timeline = timeline;
	this.pieChartA = pieChartA;
	this.pieChartB = pieChartB;

	// Default filters
	this.yearFilter = 1981;
	this.countryFilter = "World";
	this.indicatorFilter = "Agriculture_Land_perc";
	this.categoryFilter = "Land_Distribution";
};

Filter.prototype = Object.create(Object.prototype);

//Private methods
Filter.prototype.Initialize = function () 
{

};


Filter.prototype.updateYear = function (year)
{
	this.yearFilter = year;

	// Get dataset
	var data = developmentData.get(this.categoryFilter);
	// Filter year
	// data = data.filter(function(value){ return value.date == this.yearFilter});

	worldmap.filterYear = this.yearFilter.toString();
	worldmap.filterIndicator = this.indicatorFilter;
	worldmap.render(data);

	pieChartA.filterYear = this.yearFilter.toString();
	pieChartB.filterYear = this.yearFilter.toString();
	pieChartA.render();
	pieChartB.render();
};

Filter.prototype.updateCountry = function (country)
{
	this.countryFilter = country;

	// Get new dataset
	var data = developmentData.get(this.categoryFilter).get(this.countryFilter);

	// Update timeline and summary
	timeline.render(data);
	pieChartA.filterCountry = country;
	pieChartA.render();
	pieChartB.filterCountry = country;
	pieChartB.render();
};

Filter.prototype.updateIndicator = function(indicator)
{
	this.indicatorFilter = indicator;

	var data = developmentData.get(this.categoryFilter);
	// TODO: get indicator category
	worldmap.filterYear = this.yearFilter.toString();
	worldmap.filterIndicator = this.indicatorFilter;
	worldmap.render(data);
};

Filter.prototype.updateCategoryIndicator = function(categoryIndicator)
{
	this.categoryFilter = categoryIndicator;

	//Get first indicator from current category.
	for (var indicator in developmentData.get(this.categoryFilter))
	{
		this.indicatorFilter = indicator;
		break;
	}

	var data = developmentData.get(this.categoryFilter);

	// Update worldmap
	worldmap.filterYear = this.yearFilter.toString();
	worldmap.filterIndicator = this.indicatorFilter;
	worldmap.render(data);

	data = developmentData.get(this.categoryFilter).get(this.countryFilter);
	
	//Update timeline and summary
	timeline.render(data);
};

Filter.prototype.getIndicators = function()
{
	var names = indicatorMetaData.get(this.categoryFilter).indicators;
	var indicators = [];
	for (var i = 0; i < names.length; i++) {
		indicators.push({"id": names[i], "data" : indicatorMetaData.get(names[i])});
	}

	return indicators;
};

Filter.prototype.getIndicatorsByCategory = function(category)
{
	var names = indicatorMetaData.get(category).indicators;
	var indicators = [];

	for (var i = 0; i < names.length; i++) {
		indicators.push({"id": names[i], "data" : indicatorMetaData.get(names[i])});
	}

	return indicators;
};