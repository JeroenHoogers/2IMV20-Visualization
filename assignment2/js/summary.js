var Summary = function (width, height) 
{
	this.selection = "World";
	this.width = width;
	this.height = height;
	this.Initialize();

	this.selectedYear = d3.select(null);
};

Summary.prototype = Object.create(Object.prototype);

//Private methods
Summary.prototype.Initialize = function () 
{
	// Create timeline svg
	this.svg = d3.select("#summary").append("svg")
        .attr("width", this.width)
        .attr("height", this.height);

	this.margin = {top: 10, right: 30, bottom: 30, left: 30};
	this.innerWidth = +this.svg.attr("width") - this.margin.left - this.margin.right;
	this.innerHeight = +this.svg.attr("height") - this.margin.top - this.margin.bottom;

	this.g = this.svg.append("g").attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");
	this.path = this.g.append("path").attr("class", "chart-line");

	this.xColumn = "1990";
    this.yColumn = "2010";

    this.xAxisLabelText = "Country";
    this.xAxisLabelOffset = 48;

    this.yAxisLabelText = "Forest in 2010";
    this.yAxisLabelOffset = 40;
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

	
	this.xAxisG = this.g.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + this.innerHeight + ")")
	this.xAxisLabel = this.xAxisG.append("text")
		.style("text-anchor", "middle")
		.attr("transform", "translate(" + (this.innerWidth / 2) + "," + this.xAxisLabelOffset + ")")
		.attr("class", "label")
		.text(this.xAxisLabelText);

	this.yAxisG = this.g.append("g")
		.attr("class", "y axis");
	this.yAxisLabel = this.yAxisG.append("text")
		.style("text-anchor", "middle")
		.attr("transform", "translate(-" + this.yAxisLabelOffset + "," + (this.innerHeight / 2) + ") rotate(-90)")
		.attr("class", "label")
		.text(this.yAxisLabelText);

	this.xAxis = d3.svg.axis().scale(this.x).orient("bottom")
		.scale(this.x)
		.orient("bottom")
		.ticks(5)
		.tickSubdivide(4)
		.tickFormat(function(d){ return d}) // <-- format
		// .outerTickSize(0) 
		.tickSize(10, 10, 0);


	this.yAxis = d3.svg.axis().scale(this.y).orient("left")
		.ticks(5)
		.tickFormat(d3.format("s"))
		.outerTickSize(0);

    var that = this;

	
	var data = developmentData["Land_Distribution"]["World"]; 

	var val = 0;

	// Format data before use it
	// TODO: use dynamic indicator

	console.log(data);

	this.line = d3.svg.line()
        .x(function(d) { return d.val; })
        .y(function(d) { return d.values; });

	
	this.linescale = this.svg.append("g")
		.attr("class", "axis")
		.attr("transform", "translate("+ this.margin.left + "," + (this.height - this.margin.bottom) + ")")
		.call(this.xAxis);
	


	this.x.domain(d3.extent(data, function (d){ return that.x(parseInt(d.date)) - 8;; }));
    this.y.domain(d3.extent(data, function (d){ return that.y(d.val); }));

    this.xAxisG.call(this.xAxis);
    this.yAxisG.call(this.yAxis);

	this.path.attr("d", this.line(data));

	//var indicators = ["Total_Land_Sqkm", "Forest_Land_Sqkm", "Agriculture_Land_Sqkm", "Urban_Land_Sqkm", "Rural_Land_Sqkm"];

	// function render(data){
 //        this.x.domain(d3.extent(data, function (d){ return d[xColumn]; }));
 //        this.y.domain(d3.extent(data, function (d){ return d[yColumn]; }));

 //        this.xAxisG.call(this.xAxis);
 //        this.yAxisG.call(this.yAxis);

 //        this.path.attr("d", line(data));
	// }

	// function type(d){
	// 	d["1990"] = +d["1990"];
	// 	d["2010"] = +d["2010"];
	// 	return d;
	// }

 //    d3.csv("data/landdistperc/API_AG.LND.FRST.ZS_DS2_en_csv_v2.csv", type, render);

};


Summary.prototype.clicked = function(d, that, p) 
{
	// if(that.selectedCountry.node() === p) return that.resetZoom();
	that.selectedYear.classed("active", false);
	that.selectedYear = d3.select(p).classed("active", true);

};

Summary.prototype.Filter = function(countryName)
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

