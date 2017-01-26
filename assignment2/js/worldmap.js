var Worldmap = function (width, height) 
{
	this.width = width;
	this.height = height;
	this.Initialize();

	this.selectedCountry = d3.select(null);
	this.filterYear = "1980";
	this.filterIndicator = "Agriculture_Land_perc";
	this.hover;
};

Worldmap.prototype = Object.create(Object.prototype);

//Private methods
Worldmap.prototype.Initialize = function () 
{
	// Create map svg
	this.projection = d3.geo.mercator()
		.scale(145)
		.translate([this.width / 2, (this.height / 2) + 120]);
      // .scale((this.width + 1) / 2 / Math.PI)
      // .translate([this.width / 2, this.height / 1.6]);

  // var projection = d3.geo.albersUsa()
  //   .scale(1000)
  //   .translate([width / 2, height / 2]);

  	this.x = d3.scale.linear()
  		.domain([1,100])
  		.rangeRound([0, 200]);

  	this.path = d3.geo.path().projection(this.projection);

  	// this.colorScale = d3.scale.linear()
	  //   .rangeRound([this.innerHeight, 0])
	  //   .domain();

 	// this.color = d3.scale.threshold()
	 //    .domain(d3.range(0, 1000))				// TODO: dynamic scale based on max value
	 //    .range(d3.schemeBlues);

	this.color = d3.scale.linear()
		.domain(d3.range(1, 100))		// TODO: dynamic scale based on max value / use percentages
		.range(["lightblue","#1269FF"]);

	this.svg = d3.select("#map").append("svg")
		.attr("width", this.width)
		.attr("height", this.height);

  	this.svg.append("rect")
  		.attr("class", "map-background")
  		.attr("width", this.width)
  		.attr("height", this.height)
  		.on("click", this.resetZoom.bind(this));

  	this.g = this.svg.append("g").style("stroke-width", "0.5px");

  	this.countryLabel = this.svg.append("text")
  		.attr("x", 30)
  		.attr("y", 570)
  		.attr("fill", "black")
  		.attr("font-size", "20px").text("World");

  	this.axis = d3.svg.axis()
		.scale(this.x)
		.orient("bottom")
		.tickSize(8)
		.ticks(3)
		.tickFormat(function(d,i){ return d + "%";});
		// .tickValues([this.color.domain()[0],this.color.domain()[]]);

	var that = this;

	this.legend = this.svg.append("g")
  		.attr("class", "legend")
  		.attr("transform", "translate(30, 510)");

  

  	// Load & fill worldmap
	d3.json("data/world-topo-min.json", function(error, topology) 
	{
		that.topology = topology;

		var data = developmentData.get("Land_Distribution");

		that.render(data);
	});
};


Worldmap.prototype.render = function(data)
{
	var fulldata = [];

	var that = this;
	// Add all countries to one dataset
	for(let entry of data)
	{
		// Apply filters
		var countryData = entry[1].filter(function(value) { return value.date == that.filterYear && value.indicator == that.filterIndicator; });
		
		fulldata = fulldata.concat(countryData);
	}

	var features = topojson.feature(this.topology, this.topology.objects.countries).features;

	// Adjust domain
	var max = d3.max(fulldata, function (d){ return d.val; });

	this.x.domain([0, max]);
	this.color.domain([0, max]);

	this.legend.selectAll("rect")
  		.data(d3.range(this.color.domain()[0], this.color.domain()[1]))
  		.enter().append("rect")
  			.attr("height", 8)
  			.attr("x", function(d){ return that.x(d);})
  			.attr("width", 3)
  			 // .attr("width", function(d){ return 10;})
  			.attr("fill", function(d){ return that.color(d);});
	
	// set tick values
	this.axis.tickValues([this.color.domain()[0], this.color.domain()[1]/2, this.color.domain()[1]]);

	// TODO: Adjust legend

	//console.log(fulldata);
	// Loop through each data element
	for (var i = 0; i < fulldata.length; i++) 
	{
		// find country name and value
		var dataCountry = fulldata[i].country;
		var dataValue = fulldata[i].val;
		var dataNodata = fulldata[i].nodata;

		// console.log(dataCountry);

		// Find the corresponding state inside the GeoJSON
		for (var j = 0; j < features.length; j++)  {
			var topoCountry = features[j].properties.name;

			if (dataCountry == topoCountry) 
			{
				// Copy the data value into the JSON
				features[j].properties.value = dataValue; 
				features[j].properties.nodata = dataNodata;
				// console.log(topoCountry);
				// Stop looking through the worldmap
				break;
			}
		}
	}

	var that = this;

	this.world = this.g.selectAll("path")
      	.data(features)
      	.style("fill", that.countryColor.bind(that))
		.enter()
		    .append("path")
	      	.attr("d", that.path)
	      	.attr("class", "country")
	      	.on("click", function(d){that.clicked(d, that, this); })
	      	.style("fill", that.countryColor.bind(that))
	      	// .on("mouseenter", mouseenter.bind(that))
	      	// .on("mouseleave", mouseexit)
	      	.append("title").text(that.tooltip);

  	this.legend.call(this.axis)
  		.select(".domain")
  			.remove();

	 // this.world.selectAll("path").transition().duration(200).style("fill", function(d) { console.log(d.properties.value);return that.color(d.properties.value); });

    // this.world.transition(500).style("fill", function(d) { console.log(d.properties.value);return that.color(d.properties.value); });

};

Worldmap.prototype.countryColor = function(d)
{
	var name = d.properties.name;

	if(!d.properties.nodata)
	{
		// TODO: insert dynamic indicator
		//var val = parseInt(landDist.get(name)[this.filterIndicator][this.filterYear]);
		return this.color(d.properties.value);
	}
	else
	{	
		// Missing data color
		return "grey";
	}

	//return landDist.has(d.properties.name) ? "#aaa" : "red";
};

Worldmap.prototype.tooltip = function(d)
{
	var tooltip =  "";
	var name = d.properties.name;
	tooltip += name;

	if(developmentData.has(d.properties.name))
	{
		//console.log(developmentData.get(name));
		// for (var i = 0; i < currentLand.length; i++)
		// {
		// 	console.log(currentLand);
		// 	if (currentLand.indicator == "Forest_Land_perc" && currentLand.date == "2015")
		// 	{
		// 		tooltip += ", " + currentLand.indicator + " " + currentLand.date + ": " + currentLand.val;
		// 	}
		// }
		//landDist.get(name).indicator + ", " + landDist.get(name).indicator ;//['Total_Land_Sqkm']['2015'];
		//tooltip += ",  Forest 2015: " + landDist.get(name)['Forest_Land_Sqkm']['2015'];
		//tooltip += ",  Agriculture 2015: " + landDist.get(name)['Agriculture_Land_Sqkm']['2015'];
	}

	return tooltip;
};

Worldmap.prototype.resetZoom = function()
{
	this.selectedCountry.classed("active", false);
	this.selectedCountry = d3.select(null);

	// Perform zoom out transition
	this.g.transition()
		.duration(750)
		.style("stroke-width", "0.5px")
		.attr("transform", "");

	this.countryLabel.text("World");

	filter.updateCountry("World");
};


Worldmap.prototype.clicked = function(d, that, p) 
{
	console.log(d);

	if(that.selectedCountry.node() === p) return that.resetZoom();
	that.selectedCountry.classed("active", false);
	// console.log(p);
	that.selectedCountry = d3.select(p).classed("active", true);

	// Get country bounding box and calculate translation / scaling
	var bounds = that.path.bounds(d),
		dx = bounds[1][0] - bounds[0][0],
		dy = bounds[1][1] - bounds[0][1],
		x = (bounds[0][0] + bounds[1][0]) / 2,
		y = (bounds[0][1] + bounds[1][1]) / 2,
		scale = .9 / Math.max(dx / that.width, dy / that.height),
		translate = [(that.width / 2) - x * scale, (that.height / 2) - y * scale];

	// Perform zoom transition
	that.g.transition()
		.duration(750)
		.style("stroke-width", 1 / scale + "px")
		.attr("transform", "translate(" + translate + ")scale(" + scale + ")");

	var country = d.properties.name;

	this.countryLabel.text(country);

	filter.updateCountry(country);


	// if (d && that.selectedCountry !== d) 
	// 	that.selectedCountry = d;
	// else 
	// 	that.selectedCountry = null;

	// that.svg.selectAll("path")
	// 	.classed("active", function(d) { return d === that.selectedCountry; });
};


// function mouseenter(d) 
// {
// 	hover = d;
// 	this.svg.selectAll("path")
// 		.classed("hover", function(d) { return d === hover; });
		
// }

// function mouseexit(d) 
// {
// 	hover = null;
// 	map.selectAll("path")
// 		.classed("hover", function(d) { return d === hover; });	
// }