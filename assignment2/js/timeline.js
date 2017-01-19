var Timeline = function (width, height) 
{
	this.width = width;
	this.height = height;
	this.Initialize();
};

Timeline.prototype = Object.create(Object.prototype);

//Private methods
Timeline.prototype.Initialize = function () 
{
	// Create timeline svg
	this.svg = d3.select("#timeline").append("svg").attr({			
		"width": 1000,
		"height": 100
	});

	this.margin = {top: 20, right: 20, bottom: 30, left: 40};
	this.graph = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	// this.x = d3.scaleBand()
	//     .rangeRound([0, width])
	//     .paddingInner(0.05)
	//     .align(0.1);

	this.x = d3.time.scale()
		.range([0, width]);

	this.y = d3.scaleLinear()
	    .rangeRound([height, 0]);

	this.z = d3.scaleOrdinal()
	    .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);
};

Timeline.prototype.Populate = function(data) 
{
	var indicators = ["Total_Land_Sqkm", "Forest_Land_Sqkm", "Agriculture_Land_Sqkm", "Urban_Land_Sqkm", "Rural_Land_Sqkm"];

	//this

	var world = data.get("World");

	var that = this;

 	this.graph.append("g")
		    .selectAll("g")
		    .data(d3.stack().keys(keys)())
		    .enter().append("g")
		      .attr("fill", function(d) { return that.z(d.key); })
		    .selectAll("rect")
		    .data(function(d) { return d[""]; })
		    .enter().append("rect")
		      .attr("x", function(d) { return that.x(d.data.State); })
		      .attr("y", function(d) { return that.y(d[1]); })
		      .attr("height", function(d) { return y(d[0]) - y(d[1]); })
		      .attr("width", x.bandwidth());

	data.get("World").forEach(function(d)
	{

	});
};

