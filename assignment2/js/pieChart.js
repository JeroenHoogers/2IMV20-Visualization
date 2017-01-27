var pieChart = function (width, height, id, category) 
{
	this.id = id;
	this.width = width;
	this.height = height;
	this.radius = Math.min(this.width, this.height - 10) / 2;
	this.filterYear = "1980";
	this.filterCountry = "World";
	this.filterCategory = category;

	this.selectedCategory = d3.select(null);
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
	    .attr("transform", "translate(" + this.width / 2 + "," + ((this.height - 20) / 2) + ")");

	this.z = d3.scale.category10()
		.domain([0,1,2,3,4,5,6,7,8,9]);

	this.pie = d3.layout.pie()
	    .value(function(d) { return d.val; })
	    .sort(null);

	this.arc = d3.svg.arc()
	    .outerRadius(this.radius - 20);

	this.legend = this.svg.append("g");
	// Create legend
	this.legend.selectAll("g").remove();
	var legendIndicators = this.legend.selectAll("g")
		.data(filter.getIndicatorsByCategory(this.filterCategory))		// TODO: dynamic range
		.enter()
			.append("g")
		  	.attr("class","legend")
		  	.attr("transform", function(d,i) {
		  		var x = i * 100 - (that.width / 2);
		  		var y = -15 + (that.height / 2);
		  		return "translate(" + x + "," + y + ")";}
	  		);

	legendIndicators.append("rect")
		.attr("width", 15)
		.attr("height", 15)
		.style("fill",  function(d) { return that.z(d.data.color);});
		// .style("stroke", function(d) { return that.z(indicatorMetaData.get(d).color);})
	legendIndicators.append("text")
		.attr("x", 20)
		.attr("y", 10)
  		.attr("fill", "black")
		.attr("font-size", "11px")
		.text(function(d){ return d.data.name});	


	d3.selectAll("input")
		.on("change", function () {filter.updateCategoryIndicator(this.value);
			filter.updateIndicator(indicatorMetaData.get(this.value).indicators[0]);});

	this.data = developmentData.get(this.filterCategory).get(this.filterCountry)
		.filter(function (value) { return value.date == that.filterYear});
	var remainingPerc = 100;
	for (var i in this.data)
	{
		remainingPerc -= this.data[i].val;
	}
	this.data.push({
			  		"date": this.filterYear,
			  		"val": (remainingPerc > 0) ? remainingPerc : 0,
			  		"indicator": "Other_perc",
			  		"nodata" : true,
			  		"country" : this.filterCountry
			  	})

	this.path = this.svg.datum(this.data).selectAll("path")
		.data(this.pie)
		.enter().append("path")
		.style("fill", function(d, i) {return that.z(indicatorMetaData.get(d.data.indicator).color); })
		.attr("d", that.arc)
		.each(function(d) { this._current = d; })
	    .on("click", function(d){ that.clicked(d, that, this); });

	this.render();
};

pieChart.prototype.render = function()
{
	var that = this;

	this.data = developmentData.get(this.filterCategory).get(this.filterCountry); 

	this.data = this.data.filter(function (value) { return value.date == that.filterYear});

	var remainingPerc = 100;
	for (var i in this.data)
	{
		remainingPerc -= this.data[i].val;
	}
	this.data.push({
			  		"date": this.filterYear,
			  		"val": (remainingPerc > 0) ? remainingPerc : 0,
			  		"indicator": "Other_perc",
			  		"nodata" : true,
			  		"country" : this.filterCountry
			  	})

	this.pie.value(function(d) { return d.val; }); // change the value function
	this.path = this.svg.datum(this.data).selectAll("path")
		.data(this.pie);
	this.path.transition().duration(750).attrTween("d", arcTween)
		.attr("fill", function(d, i) { return that.z(indicatorMetaData.get(d.data.indicator).color); })
	    .attr("class",  function(d) { return d.data.nodata ? "nodata" : "date"}) // redraw the arcs

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
	d3.select("input[value=" + that.filterCategory + "]").property("checked", true);
	filter.updateIndicator(d.data.indicator);
	filter.updateCategoryIndicator(that.filterCategory);
};