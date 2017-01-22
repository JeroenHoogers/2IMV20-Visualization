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

	// this.x = d3.scaleBand()
	//     .rangeRound([0, width])
	//     .paddingInner(0.05)
	//     .align(0.1);



	// this.x = d3.scale.ordinal()
	// 	.domain(data.map(function(d){d[0]}))
	// 	.rangeBands([0, this.innerWidth], .1);

	this.x = d3.scale.linear()
		.domain([1960, 2016])
		.range([0, this.innerWidth], .1);

	this.y = d3.scale.linear()
		// .domain([250000000, 0])
	    .rangeRound([this.innerHeight, 0]);

	// this.z = d3.scale.ordinal()
	//     .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);

	this.z = d3.scale.category10();

	this.xAxis = d3.svg.axis()
		.scale(this.x)
		.orient("bottom")
		.ticks(10)
		.tickSubdivide(4)
		.tickFormat(function(d){ return d}) // <-- format
		// .outerTickSize(0) 
		.tickSize(10, 10, 0);


	//var indicators = ["Total_Land_Sqkm", "Forest_Land_Sqkm", "Agriculture_Land_Sqkm", "Urban_Land_Sqkm", "Rural_Land_Sqkm"];

	var indicators = ["Total", "Forest", "Agriculture"];

	//var data = landDist.get(this.selection);



	// console.log(timelineData);

	// // var keys = data.columns.slice(1);

 //  	x.domain(data.map(function(d) { return d.Indicator; }));
 //  	// y.domain([0, d3.max(data, function(d) { return d.total; })]).nice();
 //  	z.domain(keys);


	var that = this;

	
	var data = new Array(); 

	var val = 0;

	// Format data before use it
	// TODO: use dynamic indicator
	for (var i = 0; i < timelineData.length; i++) 
	{
		var rawdata = timelineData[i];
	
		for (var key in rawdata) 
		{
		  if (rawdata.hasOwnProperty(key)) 
		  {
		  	if(!isNaN(parseInt(key)))
		  	{
		  		// Add last known data and mark as missing data
		  		var missingdata = isNaN(parseInt(rawdata[key]));
		  		if(!missingdata)
		  			val = parseInt(rawdata[key]);
		  		// else
		  		// 	val = 0
			  		
			  	data.push({
			  		"date": key,
			  		"val": val,
			  		"indicator": rawdata["Indicator"],
			  		"nodata" : missingdata
			  	});
		  	}
		  }
		}
	}
	// 	    .data(d3.stack().keys(keys)())
	// 	    .enter().append("g")
	// 	      .attr("fill", function(d) { return that.z(d.key); })

	// this.g.append("g")
 // 	    .selectAll("g")
 // 	    .data(d3.stack().keys(keys)(data))
 // 	    .enter().append("g")
 // 	      .attr("fill", function(d) { return that.z(d.key); });


 	var nested = d3.nest()
 		.key(function(d) { return d.indicator; })
 		.entries(data);

 	var stack = d3.layout.stack()
	 	.y(function(d) { return d.val; })
	 	.values(function(d){ return d.values; });

	var layers = stack(nested);

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
	this.bars = layersGroups.selectAll("rect").data(function(d) { 
		return d.values; 
	});
	this.bars.enter().append("rect");
	this.bars
		.attr("x", function(d) { return that.x(parseInt(d.date)) - 8; })
      	.attr("y", function(d) { return that.y(d.y0 + d.val);})
    	.attr("height", function(d,i) { return that.innerHeight - that.y(d.val);})
	    .attr("width", 16)
	    .attr("class",  function(d) { return d.nodata ? "date nodata" : "date"})
	    .on("click", function(d){ that.clicked(d, that, this); });

	    // .style("fill", function(d,i) { return ((!d.nodata) ? "red" : "grey")})
	    // .style("stroke", function(d) { return ((that.selectedYear == d.date ) ? "black" : "none" )})


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

Timeline.prototype.Filter = function(countryName)
{
	// Default to world
	if(countryName == "")
		countryName = "World";

	// Update data
	// this.g.selectAll("rect")
	// 	    .data(data)
	// 	    .enter().append("rect")
	// 	      .attr("x", function(d,i) { return that.x(i * 20); })
	// 	      .attr("y", this.height - this.margin.bottom)
	// 	      .attr("height", function(d,i) { return that.y(parseInt(d[i]));})
	// 	      .attr("width", 15);

};

