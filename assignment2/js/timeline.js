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
	this.svg = d3.select("#timeline").append("svg").attr({			
		"width": 1000,
		"height": 100
	});

	this.margin = {top: 20, right: 20, bottom: 30, left: 40};
	this.graph = this.svg.append("g").attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

	// this.x = d3.scaleBand()
	//     .rangeRound([0, width])
	//     .paddingInner(0.05)
	//     .align(0.1);

	this.x = d3.time.scale()
		.range([0, width]);

	this.y = d3.scale.linear()
	    .rangeRound([height, 0]);

	this.z = d3.scale.ordinal()
	    .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);


	var indicators = ["Total_Land_Sqkm", "Forest_Land_Sqkm", "Agriculture_Land_Sqkm", "Urban_Land_Sqkm", "Rural_Land_Sqkm"];

	//var data = landDist.get(this.selection);

	var data = timelineData;

	// // var keys = data.columns.slice(1);

 //  	x.domain(data.map(function(d) { return d.Indicator; }));
 //  	// y.domain([0, d3.max(data, function(d) { return d.total; })]).nice();
 //  	z.domain(keys);


	// var that = this;

	// // this.graph.append("g")
	// // 	    .selectAll("g")
	// // 	    .data(d3.stack().keys(keys)())
	// // 	    .enter().append("g")
	// // 	      .attr("fill", function(d) { return that.z(d.key); })
	// 	    // console.log(data);
	// //	    ['Total_Land_Sqkm']['2015']
	// //console.log(data['Total_Land_Sqkm']);
	// this.graph.selectAll("rect")
	// 	    .data(data)
	// 	    .enter().append("rect")
	// 	      .attr("x", function(d,i) { return that.x(i * 20); })
	// 	      .attr("y", 150)
	// 	      .attr("height", function(d,i) { return that.y(d[i]);})
	// 	      .attr("width", 15);

	// // data.get("World").forEach(function(d)
	// // {

	// // });
};

