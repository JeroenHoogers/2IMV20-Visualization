var Timeline = function (width, height) 
{
	this.selection = "World";
	this.width = width;
	this.height = height;
	this.Initialize();
};

Timeline.prototype = Object.create(Object.prototype);

//Private methods
Timeline.prototype.Initialize = function () 
{
	// Create timeline svg
	this.svg = d3.select("#timeline").append("svg")
		.attr("width", this.width)
		.attr("height", this.height);

	this.margin = {top: 20, right: 20, bottom: 30, left: 40};
	this.innerWidth = +this.svg.attr("width") - this.margin.left - this.margin.right;
	this.innerHeight = +this.svg.attr("height") - this.margin.top - this.margin.bottom;

	this.g = this.svg.append("g").attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

	// this.x = d3.scaleBand()
	//     .rangeRound([0, width])
	//     .paddingInner(0.05)
	//     .align(0.1);

	var data = timelineData;

	console.log(data);

	// this.x = d3.scale.ordinal()
	// 	.domain(data.map(function(d){d[0]}))
	// 	.rangeBands([0, this.innerWidth], .1);

	this.x = d3.scale.linear()
		.domain([1970, 2016])
		.range([0, this.innerWidth], .1);

	this.y = d3.scale.linear()
	    .rangeRound([this.innerHeight, 0]);

	this.z = d3.scale.ordinal()
	    .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);

	this.xAxis = d3.svg.axis()
		.scale(this.x)
		.orient("bottom")
		.ticks(10)
		.tickSubdivide(4)
		.tickFormat(function(d){ return d}) // <-- format
		// .outerTickSize(0) 
		.tickSize(10, 10, 0);


	var indicators = ["Total_Land_Sqkm", "Forest_Land_Sqkm", "Agriculture_Land_Sqkm", "Urban_Land_Sqkm", "Rural_Land_Sqkm"];

	//var data = landDist.get(this.selection);



	// console.log(timelineData);

	// // var keys = data.columns.slice(1);

 //  	x.domain(data.map(function(d) { return d.Indicator; }));
 //  	// y.domain([0, d3.max(data, function(d) { return d.total; })]).nice();
 //  	z.domain(keys);


	var that = this;

	// this.graph.append("g")
	// 	    .selectAll("g")
	// 	    .data(d3.stack().keys(keys)())
	// 	    .enter().append("g")
	// 	      .attr("fill", function(d) { return that.z(d.key); })
		    // console.log(data);
	//	    ['Total_Land_Sqkm']['2015']
	//console.log(data['Total_Land_Sqkm']);


	// this.bars = this.g.selectAll("rect")
	// 	    .data(data)
	// 	    .enter().append("rect")
	// 	      .attr("x", function(d,i) { return that.x(d.date); })
	// 	      .attr("y", this.height - this.margin.bottom)
	// 	      .attr("height", 120)
	// 	      // .attr("height", function(d,i) { return that.y(parseInt(d[i]));})
	// 	      .attr("width", 15);

	// Add year scale
	this.timescale = this.svg.append("g")
		.attr("class", "axis")
		.attr("transform", "translate("+ this.margin.left + "," + (this.height - this.margin.bottom) + ")")
		.call(this.xAxis);

};


Timeline.prototype.Filter = function(countryName)
{
	// Default to world
	if(countryName == "")
		countryName = "World";

	// Update data


	this.g.selectAll("rect")
		    .data(data)
		    .enter().append("rect")
		      .attr("x", function(d,i) { return that.x(i * 20); })
		      .attr("y", this.height - this.margin.bottom)
		      .attr("height", function(d,i) { return that.y(parseInt(d[i]));})
		      .attr("width", 15);

}

