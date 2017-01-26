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

	this.margin = {top: 40, right: 30, bottom: 200, left: 50};
	this.innerWidth = +this.svg.attr("width") - this.margin.left - this.margin.right;
	this.innerHeight = +this.svg.attr("height") - this.margin.top - this.margin.bottom;

	this.g = this.svg.append("g").attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");
	this.path = this.g.append("path").attr("class", "chart-line");

	//this.xColumn = "1990";
    //this.yColumn = "2010";

    this.xAxisLabelText = "Year";
    this.xAxisLabelOffset = 38;

    this.yAxisLabelText = "%";
    this.yAxisLabelOffset = 30;
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
		.domain([0, 100])
	    .rangeRound([this.innerHeight, 0]);

	this.z = d3.scale.category10();

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

	var data = developmentData.get("Land_Distribution").get("World"); 

	this.render(data);

	// Format data before use it
	// TODO: use dynamic indicator

	this.linescale = this.svg.append("g")
		.attr("class", "axis")
		.attr("transform", "translate("+ this.margin.left + "," + (this.height - this.margin.bottom) + ")")
		.call(this.xAxis);

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

Summary.prototype.render = function(data)
{
	var indicators = ["Forest_Land_perc", "Arable_Land_perc", "Agriculture_Land_perc"];

	var innerdata = [data.filter(function (value) { return value.indicator == indicators[0]}),
	data.filter(function (value) { return value.indicator == indicators[1]}),
	data.filter(function (value) { return value.indicator == indicators[2]})];

	var that = this;

	this.line = d3.svg.line()
		.interpolate("basis") 
        .x(function(d) { return that.x(d.date); })
        .y(function(d) { return that.y(d.val); })
        .defined(function(d) { return (!d.nodata); });
	//this.x.domain(d3.extent(data, function (d){ return that.x(parseInt(d.date)); }));
    //this.y.domain(d3.extent(data, function (d){ return that.y(d.val); }));

    this.xAxisG.call(this.xAxis);
    this.yAxisG.call(this.yAxis);

	//this.xAxisLabel.text(data[0].indicator);
	//this.yAxisLabel.text(data[0].country);

	// var lines = this.g.selectAll(".lines")
 //    	.data(innerdata)
 //    	.enter().append("g")
 //      	.attr("class", "lines");

	// lines.append("path")
	// 	.attr("class", "line")
	// 	.attr("d", function(d) { return that.line(d.values); })
	// 	.style("stroke", function(d) { return that.z(d.id); });

	this.path.data(data);
	this.path.attr("d",  this.line(data))//(function(d) {return that.line(d);}) )
	       .style("stroke", function(d) {return that.z(indicators.indexOf(d.indicator));} )
	       .style("stroke-width", "1.5px");


	// this.path.transition().duration(1500)
	// 	.attr("x", function(d,i) { return that.innerHeight - that.x(d.date);})
	//  	.attr("y", function(d) { return that.y(d.y0 + d.val);})
	//   	.transition().attr("d", this.line);
	
	d3.selectAll("input").on("input", function() {
		filter.updateCategoryIndicator(this.value);
	});

	// this.path.append("path")
	// 	.attr("d", this.line(data))
	//     .style("stroke", this.z(0))
	//     .style("stroke-width", "0.5px")
	// this.g.append("path").attr("d", this.line(innnerdata[1]))
	//     .style("stroke", this.z(1))
	//     .style("stroke-width", "0.5px")
	// this.g.append("path").attr("d", this.line(innnerdata[2]))
	//     .style("stroke", this.z(2))
	//     .style("stroke-width", "0.5px")
};