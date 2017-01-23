var Timeline = function (width, height) 
{
	this.selection = "World";
	this.width = width;
	this.height = height;
	this.Initialize();

	this.selectedYear = d3.select(null);
};

Timeline.prototype = Object.create(Object.prototype);

//Private methods
Timeline.prototype.Initialize = function () 
{
	// Create timeline svg
	this.svg = d3.select("#timeline").append("svg")
		.attr("width", this.width)
		.attr("height", this.height);

	this.margin = {top: 10, right: 30, bottom: 30, left: 30};
	this.innerWidth = +this.svg.attr("width") - this.margin.left - this.margin.right;
	this.innerHeight = +this.svg.attr("height") - this.margin.top - this.margin.bottom;

	this.g = this.svg.append("g").attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

	this.x = d3.scale.linear()
		.domain([1960, 2016])
		.range([0, this.innerWidth], .1);

	this.y = d3.scale.linear()
	    .rangeRound([this.innerHeight, 0]);


	this.z = d3.scale.category10();

	this.xAxis = d3.svg.axis()
		.scale(this.x)
		.orient("bottom")
		.ticks(10)
		.tickSubdivide(4)
		.tickFormat(function(d){ return d}) // <-- format
		// .outerTickSize(0) 
		.tickSize(10, 10, 0);


	// Default data
	var data = developmentData.get("Land_Distribution").get("World");
 	this.render(data);

	// Add year scale
	this.timescale = this.svg.append("g")
		.attr("class", "axis")
		.attr("transform", "translate("+ this.margin.left + "," + (this.height - this.margin.bottom) + ")")
		.call(this.xAxis);
};


Timeline.prototype.clicked = function(d, that, p) 
{
	// if(that.selectedCountry.node() === p) return that.resetZoom();
	that.selectedYear.classed("active", false);
	that.selectedYear = d3.select(p).classed("active", true);

};

Timeline.prototype.render = function(data)
{
	// Indicator / color bindings
	var indicators = ["Arable_Land_perc", "Forest_Land_perc", "Agriculture_Land_perc"];

	// Get new dataset
	//var data = developmentData.get(mainIndicator).get(countryName);

	var that = this;

	this.nested = d3.nest()
 		.key(function(d) { return d.indicator; })
 		.entries(data);

 	var stack = d3.layout.stack()
	 	.y(function(d) { return d.val; })
	 	.values(function(d){ return d.values; });

	var layers = stack(this.nested);

 	var layersGroups = this.g.selectAll(".layer").data(layers);
 	layersGroups.enter().append("g").attr("class", "layer");
 	layersGroups.exit().remove();
 	layersGroups.style("fill", function(d) { 
		return that.z(indicators.indexOf(d.key)); 
	});

 	// Adjust domains using maximum values
    this.y.domain([
      0,
      d3.max(layers, function (layer){
        return d3.max(layer.values, function (d){
          return d.y0 + d.y;
        });
      })
    ]);

    // Create stacked bars
  //   this.bars.transition()
		// .duration(750);
	this.bars = layersGroups.selectAll("rect").data(function(d) { 
		return d.values; 
	});
	this.bars.enter().append("rect");
	this.bars
    	.attr("x", function(d) { return that.x(parseInt(d.date)) - 8; })
	    .attr("width", 16)
	    .attr("class",  function(d) { return d.nodata ? "date nodata" : "date"})
	    .on("click", function(d){ that.clicked(d, that, this); });


	// Transition to new data
	this.bars.transition().duration(750)
		.attr("height", function(d,i) { return that.innerHeight - that.y(d.val);})
	  	.attr("y", function(d) { return that.y(d.y0 + d.val);});

};

