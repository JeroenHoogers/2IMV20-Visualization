var Filter = function (map, timeline, legend) 
{
	this.worldmap = map;
	this.timeline = timeline;
	this.legend = legend;

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
};

Filter.prototype.updateCountry = function (country)
{
	this.countryFilter = country;

	// Get new dataset
	var data = developmentData.get(this.categoryFilter).get(this.countryFilter);

	// Update timeline and summary
	timeline.render(data);
};

Filter.prototype.updateIndicator = function(indicator)
{
	this.indicatorFilter = indicator;

	var data = developmentData.get(this.categoryFilter);
	// TODO: get indicator category
	worldmap.filterYear = this.yearFilter.toString();
	worldmap.filterIndicator = this.indicatorFilter;
	worldmap.render(data);
}
