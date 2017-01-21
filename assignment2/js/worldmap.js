var Worldmap = function (width, height) 
{
	this.width = width;
	this.height = height;
	this.Initialize();

	this.selectedCountry = d3.select(null);
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

  	this.path = d3.geo.path().projection(this.projection);

	this.svg = d3.select("#map").append("svg")
		.attr("width", this.width)
		.attr("height", this.height);

  	this.svg.append("rect")
  		.attr("class", "map-background")
  		.attr("width", this.width)
  		.attr("height", this.height)
  		.on("click", this.resetZoom.bind(this));

  	this.g = this.svg.append("g").style("stroke-width", "1.5px");

  	var that = this;

  	// Load & fill worldmap
	d3.json("data/world-topo-min.json", function(error, topology) 
	{
	    that.g.selectAll("path")
	      	.data(topojson.feature(topology, topology.objects.countries).features)
		    .enter()
		      	.append("path")
		      	.attr("d", that.path)
		      	.attr("class", "country")
		      	.on("mouseenter", mouseenter.bind(that))
		      	// .on("mouseleave", mouseexit)
		   		.style("fill", that.countryColor.bind(that))
		      	.on("click", function(d){that.clicked(d, that, this); })
		      	.append("title").text(that.tooltip);

	});
};

Worldmap.prototype.countryColor = function(d,i)
{
	return landDist.has(d.properties.name) ? "#aaa" : "red";
};

Worldmap.prototype.tooltip = function(d)
{
	var tooltip =  ""; 
	var name = d.properties.name;
	tooltip += name;

	if(landDist.has(d.properties.name))
	{
		tooltip += " Total 2015: " + landDist.get(name)['Total_Land_Sqkm']['2015'];
		tooltip += ",  Forest 2015: " + landDist.get(name)['Forest_Land_Sqkm']['2015'];
		tooltip += ",  Agriculture 2015: " + landDist.get(name)['Agriculture_Land_Sqkm']['2015'];
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
		.style("stroke-width", "1.5px")
		.attr("transform", "");
};


Worldmap.prototype.clicked = function(d, that, p) 
{
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
		.style("stroke-width", 1.5 / scale + "px")
		//.attr("transform", "translate(" + translate + ")");
		.attr("transform", "translate(" + translate + ")scale(" + scale + ")");


	// if (d && that.selectedCountry !== d) 
	// 	that.selectedCountry = d;
	// else 
	// 	that.selectedCountry = null;

	// that.svg.selectAll("path")
	// 	.classed("active", function(d) { return d === that.selectedCountry; });
};


function mouseenter(d) 
{
	hover = d;
	this.svg.selectAll("path")
		.classed("hover", function(d) { return d === hover; });
		
}

// function mouseexit(d) 
// {
// 	hover = null;
// 	map.selectAll("path")
// 		.classed("hover", function(d) { return d === hover; });	
// }