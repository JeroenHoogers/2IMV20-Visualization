var Filter = function (map, timeline, legend) 
{
	this.map = map;
	this.timeline = timeline;
	this.legend = legend;

	// Default filters
	this.yearFilter = 2015;
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

	// Update map and legend

};

Filter.prototype.updateCountry = function (country)
{
	this.countryFilter = country;

	var data = developmentData.get(this.categoryFilter).get(this.countryFilter);
	// Update timeline and legend
	timeline.render(data);
};

Filter.prototype.updateIndicator = function(indicator)
{
	// 

	// TODO: get indicator category
}
