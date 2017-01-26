var pieChart = function (width, height, id, category, indicators, startIndex) 
{
	this.id = id;
	this.i = startIndex;
	this.width = width;
	this.height = height;
	this.radius = Math.min(this.width, this.height) / 2;
	this.filterYear = "1980";
	this.filterCountry = "World";
	this.filterCategory = category;
	this.indicators = indicators;
	this.Initialize();
};

pieChart.prototype = Object.create(Object.prototype);

//Private methods
pieChart.prototype.Initialize = function () 
{
	var that = this;

	this.svg = d3.select("#" + this.id).append("svg")
	    .attr("width", this.width)
	    .attr("height", this.height)
	  .append("g")
	    .attr("transform", "translate(" + this.width / 2 + "," + (this.height / 2) + ")");

	this.z = d3.scale.category10();

	this.pie = d3.layout.pie()
	    .value(function(d) { return d.val; })
	    .sort(null);

	this.arc = d3.svg.arc()
	    .outerRadius(this.radius - 20);


	// Create legend
	this.legend = this.svg.append("g")
		.selectAll("g")
		.data([this.i,this.i + 1,this.i + 2])		// TODO: dynamic range
		.enter()
			.append("g")
		  	.attr("class","legend");

	this.legend.append("rect")
		.attr("width", 0)
		.attr("height", 0)
		.style("fill", function(i){ return that.z(i + that.i)})
		.style("stroke", function(i){ return that.z(i + that.i)});

	this.data = developmentData.get(this.filterCategory).get(this.filterCountry)
		.filter(function (value) { return value.date == that.filterYear});

	this.path = this.svg.datum(this.data).selectAll("path")
		.data(this.pie)
		.enter().append("path")
		.style("fill", function(d, i) { return that.z(i+ that.i); })
		.attr("d", that.arc)
		.each(function(d) { this._current = d; })
	    .on("click", function(d){ that.clicked(d, that, this); });

	this.render();
};

pieChart.prototype.render = function()
{
	var indicators = ["Forest_Land_perc", "Arable_Land_perc", "Agriculture_Land_perc", "Agriculture_GDP_perc", "Industry_GDP_perc", "Services_GDP_perc"];
	var that = this;

	this.data = developmentData.get(this.filterCategory).get(this.filterCountry); 

	this.data = this.data.filter(function (value) { return value.date == that.filterYear});

	this.pie.value(function(d) { return d.val; }); // change the value function
	this.path = this.svg.datum(this.data).selectAll("path")
		.data(this.pie);
	this.path.transition().duration(750).attrTween("d", arcTween)
		.attr("fill", function(d, i) { return that.z(i); })
	    .attr("class",  function(d) { return d.nodata ? "date nodata" : "date"}); // redraw the arcs

	// Store the displayed angles in _current.
	// Then, interpolate from _current to the new angles.
	// During the transition, _current is updated in-place by d3.interpolate.
	function arcTween(a) {
	  var i = d3.interpolate(this._current, a);
	  this._current = i(0);
	  return function(t) {
	    return that.arc(i(t));
	  };
	}
}

pieChart.prototype.clicked = function(d, that, p) 
{
	filter.updateCategoryIndicator(that.filterCategory);
	filter.updateIndicator(d.data.indicator);
};