/*
	/////////////////////////////////
	|
	|         GRAPH   VARS
	|
	/////////////////////////////////
*/
// constants
const TOOLTIP_PADDING = 3;
const GRAPH_WIDTH = 800;
const GRAPH_HEIGHT = 500;

// HTML Elements
var dropdown = document.getElementById("dropdown");
var dropdown2 = document.getElementById("dropdown2");

var checkbox = document.getElementById("checkbox");
var checkbox2 = document.getElementById("checkbox2");

// Graph drawing vars
var margin = {top: 10, right: 100, bottom: 120, left: 30},
	width = GRAPH_WIDTH - margin.left - margin.right,
	height = GRAPH_HEIGHT - margin.top - margin.bottom;

var x = d3.time.scale()
	.range([0, width]);

var y = d3.scale.linear()
	.range([height, 0]);

var y2 = d3.scale.linear()
	.range([height, 0]);

var xAxis = d3.svg.axis()
	.scale(x)
	.orient("bottom");

var yAxis = d3.svg.axis()
	.scale(y)
	.orient("left");

var yAxis2 = d3.svg.axis()
	.scale(y2)
	.orient("right");

var line = d3.svg.line()
	.x(function(d, i){ return x(dateTime[i]); })
	.y(function(d, i){ return y(d); });

var line2 = d3.svg.line()
	.x(function(d, i){ return x(dateTime[i]); })
	.y(function(d, i){ return y2(d); });

var svg = d3.select("body")
		.attr("oncontextmenu", "return false")
		.select("g")
		.insert("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Graph vars
var variable1Name = "Select a variable...";
var variable2Name = "Select a variable...";
var graphing1 = false;
var graphing2 = false;

// Enhanced graph elements

// Select line
var selectLine;

// Mouseover focus
var overlay;
var focusLine;
var focusCircle;
var focusCircle2;

d3.select("#tooltip")
	.style("background-color", "steelblue");

d3.select("#tooltip2")
	.style("background-color", "green");

var tooltip1Y;
var tooltip2Y;

// Brush
var brushMargin = {top: 500 - margin.bottom + margin.top + 20, right: margin.right, bottom: 40, left: margin.left},
	brushGraphHeight = 500 - brushMargin.top - brushMargin.bottom;

var xBrush = d3.time.scale()
	.range([0, width]);

var yBrush = d3.scale.linear()
	.range([brushGraphHeight, 0]);

var xAxisBrush = d3.svg.axis()
	.scale(xBrush)
	.orient("bottom");

var brush = d3.svg.brush()
	.x(xBrush)
	.on("brush", brushed);

var brushArea = d3.svg.area()
	.interpolate("monotone")
	.x(function(d, i){ return xBrush(dateTime[i]); })
	.y0(brushGraphHeight)
	.y1(function(d, i){ return yBrush(d); });

svg.append("defs").append("clipPath")
	.attr("id", "clip")
	.append("rect")
		.attr("width", width)
		.attr("height", height);

var focus = svg.append("g")
	.attr("class", "focus")
	.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var context = svg.append("g")
	.attr("class", "context")
	.attr("transform", "translate(" + brushMargin.left + "," + brushMargin.top + ")");

// Data
var floor1Vars = d3.map(); // Floor 1 variables and their values
var dateTime = [];
var units = d3.map();

//
// GRAPH EXECUTION START
//

load();

//
// GRAPH FUNCTIONS START
//

function load()
{
	// load units
	d3.csv("../data/csv/units.csv")
		.row(function(d)
		{
			units.set(d.field, [d.units, d.abbreviation]);
		})
		.get(function(error, rows)
		{
			// load hazium data
			loadHaziumData();

			// load hvac data
			loadHVACData();
		});
}

function loadHaziumData()
{
	floor1Vars.set("F_1_Z_8A: Hazium Concentration", []);
	floor1Vars.set("F_2_Z_2: Hazium Concentration", []);
	floor1Vars.set("F_2_Z_4: Hazium Concentration", []);
	floor1Vars.set("F_3_Z_1: Hazium Concentration", []);

	// floor 1 zone 8a
	d3.json("../data/json/f1z8a-MC2.json", function(error, data)
	{
		if(error)
			throw error;

		var attribute = "F_1_Z_8A: Hazium Concentration";

		for(var i = 0; i < data.length; i++)
		{
			var temp = floor1Vars.get(attribute);
			temp.push(+(data[i].message[attribute]));

			floor1Vars.set(attribute, temp);
		}		
	});

	// floor 2 zone 2
	d3.json("../data/json/f2z2-MC2.json", function(error, data)
	{
		if(error)
			throw error;

		var attribute = "F_2_Z_2: Hazium Concentration";

		for(var i = 0; i < data.length; i++)
		{
			var temp = floor1Vars.get(attribute);
			temp.push(+(data[i].message[attribute]));

			floor1Vars.set(attribute, temp);
		}		
	});

	// floor 2 zone 4
	d3.json("../data/json/f2z4-MC2.json", function(error, data)
	{
		if(error)
			throw error;

		var attribute = "F_2_Z_4: Hazium Concentration";

		for(var i = 0; i < data.length; i++)
		{
			var temp = floor1Vars.get(attribute);
			temp.push(+(data[i].message[attribute]));

			floor1Vars.set(attribute, temp);
		}		
	});

	// floor 3 zone 1
	d3.json("../data/json/f3z1-MC2.json", function(error, data)
	{
		if(error)
			throw error;

		var attribute = "F_3_Z_1: Hazium Concentration";

		for(var i = 0; i < data.length; i++)
		{
			var temp = floor1Vars.get(attribute);
			temp.push(+(data[i].message[attribute]));

			floor1Vars.set(attribute, temp);
		}		
	});
}

function loadHVACData()
{
	// floor 1
	d3.json("../data/json/floor1-MC2.json", function(error, data)
	{
		// Make sure there's no error
		if(error)
			throw error;

		// Load in floor 1 data
		for(var i = 0; i < data.length; i++)
		{
			var properties = Object.keys(data[i].message);

			// for each property in this entry, add its value to its list
			for(var j = 0; j < properties.length; j++)
			{
				// if this property doesn't have a list yet, make it
				if(!(floor1Vars.has(properties[j])))
				{
					floor1Vars.set(properties[j], []);
				}

				// if we're getting a datetime entry, create date object in dateTime array
				if(properties[j] == "Date/Time")
				{
					dateTime.push(new Date(data[i].message[properties[j]]));
					continue;
				}

				// get the value to add
				var temp = floor1Vars.get(properties[j]);

				// add the value to the property's list
				temp.push(+(data[i].message[properties[j]]));

				floor1Vars.set(properties[j], temp);
			}
		}

		// add different fields to dropdown
		var keyNames = floor1Vars.keys().sort();

		// floor 2
		d3.json("../data/json/floor2-MC2.json", function(error, data)
		{
			// Make sure there's no error
			if(error)
				throw error;
	
			// Load in floor 1 data
			for(var i = 0; i < data.length; i++)
			{
				var properties = Object.keys(data[i]);
	
				// for each property in this entry, add its value to its list
				for(var j = 0; j < properties.length; j++)
				{
					// if this property doesn't have a list yet, make it
					if(!(floor1Vars.has(properties[j])))
					{
						floor1Vars.set(properties[j], []);
					}
	
					// if we're getting a datetime entry, create date object in dateTime array
					if(properties[j] == "Date/Time")
					{
						continue;
					}
	
					// get the value to add
					var temp = floor1Vars.get(properties[j]);
	
					// add the value to the property's list
					temp.push(+(data[i][properties[j]]));
	
					floor1Vars.set(properties[j], temp);
				}
			}
	
			// floor 3
			d3.json("../data/json/floor3-MC2.json", function(error, data)
			{
				// Make sure there's no error
				if(error)
					throw error;
		
				// Load in floor 1 data
				for(var i = 0; i < data.length; i++)
				{
					var properties = Object.keys(data[i]);
		
					// for each property in this entry, add its value to its list
					for(var j = 0; j < properties.length; j++)
					{
						// if this property doesn't have a list yet, make it
						if(!(floor1Vars.has(properties[j])))
						{
							floor1Vars.set(properties[j], []);
						}
		
						// if we're getting a datetime entry, create date object in dateTime array
						if(properties[j] == "Date/Time")
						{
							continue;
						}
		
						// get the value to add
						var temp = floor1Vars.get(properties[j]);
		
						// add the value to the property's list
						temp.push(+(data[i][properties[j]]));
		
						floor1Vars.set(properties[j], temp);
					}
				}
		
				// add different fields to dropdown
				var keyNames = floor1Vars.keys().sort();
		
				for(var i = 0; i < keyNames.length; i++)
				{
					if(keyNames[i] == "Date/Time" || keyNames[i] == "floor" || keyNames[i] == "type")
					{
						continue;
					}
		
					var o = document.createElement("option");
					var o2 = document.createElement("option");
		
					o.text = keyNames[i];
					o2.text = keyNames[i];
		
					dropdown.options.add(o);
					dropdown2.options.add(o2);
		
					log("add " + keyNames[i]);
				}

				var i = 1;
				d3.selectAll("option")
					.each(function()
					{
						var o = d3.select(this);

						o.style("background-color", i == 0 ? "#E0E0E0" : "#F0F0F4");
						o.style("color", "black");

						i = (i+1)%2;
						/*
						o.style("background-color", "white");
						o.style("color", "black");

						log(o.text().substr(0,3));
						if(o.property("text").substr(0, 3) == "F_1")
						{
							o.style("background-color", "#E0E0E0");
						}
						else
						if(o.property("text").substr(0, 3) == "F_3")
						{
							o.style("background-color", "#E0E0E0");
						}		
						*/				
					})
			});
		});
	});	
}

function createGraph(var1, var2)
{
	variable1Name = var1;
	variable2Name = var2;

	graphing1 = false;
	graphing2 = false;

	// Figure out where we've selected variables to graph
	if(variable1Name != "Select a variable...")
	{
		graphing1 = true;
		//graphLabel1.innerHTML = variable1Name;
	}
	else
	{
		//graphLabel1.innerHTML = "";
	}

	if(variable2Name != "Select a variable...")
	{
		graphing2 = true;
		//graphLabel2.innerHTML = variable2Name;
	}
	else
	{
		//graphLabel2.innerHTML = "";
	}

	// wipe old graph
	focus.selectAll("*")
		.remove();

	context.selectAll("*")
		.remove();

	// Don't let us try to graph nothing
	if(!graphing1 && !graphing2)
	{
		return;
	}	

	// draw graph
	x.domain(brush.empty() ? d3.extent(dateTime, function(d, i) { return d; }) : brush.extent());
	//x.domain(d3.extent(dateTime, function(d, i) { return d; }));

	// draw x-axis
	focus.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + height + ")")
		.call(xAxis);

	// add focus line
	focusLine = focus.append("line")
		.attr("x1", 0)
		.attr("y1", 0)
		.attr("x2", 0)
		.attr("y2", height)
		.style("display", "none")
		.attr("class", "focusline");	

	if(graphing1)
	{
		if(checkbox.checked && graphing2)
		{
			if(checkbox2.checked)
			{
				y.domain([0, d3.max([.5, d3.max(floor1Vars.get(variable1Name)), d3.max(floor1Vars.get(variable2Name))])]);
			}
			else
			{
				y.domain([d3.min([d3.min(floor1Vars.get(variable1Name)), d3.min(floor1Vars.get(variable2Name))]), d3.max([.5, d3.max(floor1Vars.get(variable1Name)), d3.max(floor1Vars.get(variable2Name))])]);
			}
		}
		else
		{
			if(checkbox2.checked)
			{
				y.domain([0, d3.max([.5, d3.max(floor1Vars.get(variable1Name))])]);
			}
			else
			{
				y.domain([d3.min(floor1Vars.get(variable1Name)), d3.max([.5, d3.max(floor1Vars.get(variable1Name))])]);
			}
		}

		// draw first y-axis
		focus.append("g")
			.attr("class", "y axis")	
			.call(yAxis)						
			.append("text")
				.attr("transform", "translate(-65)rotate(-90)")
				.attr("y", 6)
				.attr("dy", ".71em")
				.style("text-anchor", "end")
				.text(getAxisLabel(variable1Name));

		// draw first path
		focus.append("path")
			.datum(floor1Vars.get(variable1Name))
			.attr("class", "line")
			.attr("id", "line1")
			.style("stroke", "steelblue")
			.attr("d", line);

		// add first focus circle
		focusCircle = focus.append("circle")
			.attr("r", 4)
			.style("display", "none")
			.style("stroke", "red")
			.attr("class", "focusCircle");		

		// draw tooltip
		d3.select("#tooltip").classed("tooltip", true);
	}

	if(graphing2)
	{
		if(checkbox.checked && graphing1)
		{
			if(checkbox2.checked)
			{
				y2.domain([0, d3.max([.5, d3.max(floor1Vars.get(variable1Name)), d3.max(floor1Vars.get(variable2Name))])]);
			}
			else
			{
				y2.domain([d3.min([d3.min(floor1Vars.get(variable1Name)), d3.min(floor1Vars.get(variable2Name))]), d3.max([.5, d3.max(floor1Vars.get(variable1Name)), d3.max(floor1Vars.get(variable2Name))])]);
			}			
		}
		else
		{
			if(checkbox2.checked)
			{
				y2.domain([0, d3.max([.5, d3.max(floor1Vars.get(variable2Name))])]);
			}
			else
			{
				y2.domain([d3.min(floor1Vars.get(variable2Name)), d3.max([.5, d3.max(floor1Vars.get(variable2Name))])]);
			}
		}

		// draw second y-axis
		focus.append("g")
			.attr("class", "y axis")
			.attr("transform", "translate(" + width + ",0)")
			.call(yAxis2)
			.append("text")
				.attr("transform", "translate(45)rotate(-90)")
				.attr("y", 6)
				.attr("dy", ".71em")
				.style("text-anchor", "end")
				.text(getAxisLabel(variable2Name));

		// draw second path
		focus.append("path")
			.datum(floor1Vars.get(variable2Name))
			.attr("class", "line")
			.attr("id", "line2")
			.style("stroke", "green")
			.attr("d", line2);

		// add second focus circle
		focusCircle2 = focus.append("circle")
			.attr("r", 4)
			.style("display", "none")
			.style("stroke", "red")
			.attr("class", "focusCircle");

		// draw tooltip
		d3.select("#tooltip2").classed("tooltip", true);
	}

	// add select line
	selectLine = focus.append("line")
		.attr("x1", 0)
		.attr("y1", 0)
		.attr("x2", 0)
		.attr("y2", height)
		.style("display", function()
		{
			return selectedIndex != undefined ? null : "none";
		})
		.attr("class", "selectLine");

	// brush
	xBrush.domain(d3.extent(dateTime, function(d, i) { return d; }));
	yBrush.domain(y.domain());

	context.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + brushGraphHeight + ")")
		.call(xAxisBrush);

	context.append("g")
		.attr("class", "x brush")
		.call(brush)
		.selectAll("rect")
			.attr("y", -6)
			.attr("height", brushGraphHeight + 7);

	// add overlay
	overlay = focus.append("rect")
		.attr("class", "overlay")
		.attr("id", "overlay")
		.attr("width", width)
		.attr("height", height)
		.on("mouseover", onMouseOver)
		.on("mouseout", onMouseOut)
		.on("mousemove", onMouseMove);

	// set selected date range
	//selectDateRange(x.domain());
	setDateRange(x.domain());
	setGraphDateRange(x.domain());
}

function onButtonClick()
{
	createGraph(dropdown.options[dropdown.selectedIndex].text, dropdown2.options[dropdown2.selectedIndex].text);
	//log("CLICKED");
}

function onMouseMove()
{
	// Indicate value in tooltip at the mouse's x-coordinate

	if(!focusLine)
		return;

	var x0 = x.invert(d3.mouse(this)[0]);
	var bisectDate = d3.bisector(function(d) { return d; }).left;
	var i = bisectDate(dateTime, x0, 1);

	if(i < 0 || i >= dateTime.length || dateTime[i] > dateRange[1] || dateTime[i] < dateRange[0])
		return;

	var xloc = x(dateTime[i]);

	// draw focus line
	focusLine.attr("x1", xloc);
	focusLine.attr("x2", xloc);
	focusLine.style("display", null);

	if(graphing1)
	{
		var yVal = y(floor1Vars.get(variable1Name)[i]);		

		// draw focus circle
		focusCircle.attr("cx", xloc);
		focusCircle.attr("cy", yVal);
		focusCircle.style("display", null);
	
		// update tooltip
		tooltip1Y = (+focusCircle.attr("cy") + 58);

		d3.select("#tooltip")
			.style("left", (document.getElementById("overlay").getBoundingClientRect().left + +focusCircle.attr("cx")) + "px")
			.style("top", tooltip1Y + "px")
			.select("#value")
			.text(floor1Vars.get(variable1Name)[i] + " " + getUnitsShort(variable1Name) + " on " + formatDate(dateTime[i]));		
	}

	if(graphing2)
	{
		var yVal2 = y2(floor1Vars.get(variable2Name)[i]);

		// draw focus circle
		focusCircle2.attr("cx", xloc);
		focusCircle2.attr("cy", yVal2);
		focusCircle2.style("display", null);
	
		// update tooltip
		tooltip2Y = (+focusCircle2.attr("cy") + 58);		

		d3.select("#tooltip2")
			.style("left", (document.getElementById("overlay").getBoundingClientRect().left + +focusCircle2.attr("cx")) + "px")
			.style("top", tooltip2Y + "px")
			.select("#value")
			.text(floor1Vars.get(variable2Name)[i] + " " + getUnitsShort(variable2Name) + " on " + formatDate(dateTime[i]));
	}

	// fix potential tooltip overlap issues
	checkTooltipOverlap();
}

function onMouseOver()
{
	if(focusLine)
		focusLine.style("display", null);	

	if(graphing1)
	{
		focusCircle.style("display", null);
		d3.select("#tooltip").classed("hidden", false);
	}

	if(graphing2)
	{
		focusCircle2.style("display", null);
		d3.select("#tooltip2").classed("hidden", false);
	}
}

function onMouseOut()
{
	if(focusLine)
		focusLine.style("display", "none");

	if(focusCircle)	
		focusCircle.style("display", "none");

	if(focusCircle2)
		focusCircle2.style("display", "none");

	d3.select("#tooltip").classed("hidden", true);
	d3.select("#tooltip2").classed("hidden", true);
}

function brushed()
{
	var ext = brush.empty() ? xBrush.domain() : brush.extent();

	selectDateRange(ext);
}

function getUnits(variableName)
{
	var floor;
	var zone;

	var floorRE = /F_\d/;
	var floorIndex = variableName.search(floorRE);

	var zoneRE = /Z_\d/;
	var zoneIndex = variableName.search(zoneRE);

	var delimiterIndex = d3.min([variableName.indexOf(" "), variableName.indexOf(":")]);

	if(floorRE != -1)
	{
		floor = variableName.substr(floorIndex + 2, 1);

		if(zoneRE != -1)
		{
			zone = variableName.substring(zoneIndex + 2, delimiterIndex);			
		}
		else
		{
			zone = "";
		}
	}
	else
	{
		floor = "";
		zone = "";
	}

	for(var i = 0; i < units.keys().length; i++)
	{
		if(units.keys()[i].replace("%f", floor).replace("%z", zone) == variableName)
		{
			return units.get(units.keys()[i])[0];
		}
	}
}

function getUnitsShort(variableName)
{
	var floor;
	var zone;

	var floorRE = /F_\d/;
	var floorIndex = variableName.search(floorRE);

	if(floorRE != -1)
	{
		var spaceIndex = variableName.indexOf(" ");
		variableName = variableName.substr(spaceIndex + 1);

		for(var i = 0; i < units.keys().length; i++)
		{
			var oSpaceIndex = units.keys()[i].indexOf(" ");

			if(spaceIndex == -1)
				continue;

			if(units.keys()[i].substr(oSpaceIndex + 1) == variableName)
			{
				return units.get(units.keys()[i])[1];
			}
		}
	}

	for(var i = 0; i < units.keys().length; i++)
	{
		if(units.keys()[i] == variableName)
		{
			return units.get(units.keys()[i])[1];
		}
	}
}

function getAxisLabel(variableName)
{
	var floor;
	var zone;

	var floorRE = /F_\d/;
	var floorIndex = variableName.search(floorRE);

	var zoneRE = /Z_\d/;
	var zoneIndex = variableName.search(zoneRE);

	var delimiterIndex = d3.min([variableName.indexOf(" "), variableName.indexOf(":")]);

	var label = variableName;

	var unit;
	var shortUnit;

	if(floorRE != -1)
	{
		floor = variableName.substr(floorIndex + 2, 1);

		if(zoneRE != -1)
		{
			zone = variableName.substring(zoneIndex + 2, delimiterIndex);			
		}
		else
		{
			zone = "";
		}
	}
	else
	{
		floor = "";
		zone = "";
	}

	for(var i = 0; i < units.keys().length; i++)
	{
		if(units.keys()[i].replace("%f", floor).replace("%z", zone) == variableName)
		{
			unit = units.get(units.keys()[i])[0];
			shortUnit = units.get(units.keys()[i])[1];
		}
	}

	if(unit !== undefined && unit != "")
	{
		label += ", " + unit + " (" + shortUnit + ")";
	}

	return label;
}

function checkTooltipOverlap()
{
	var tooltip1Height = document.getElementById("tooltip").clientHeight;
	var tooltip2Height = document.getElementById("tooltip2").clientHeight;

	if((tooltip1Y <= tooltip2Y && tooltip2Y <= (tooltip1Y + tooltip1Height + TOOLTIP_PADDING)) || (tooltip1Y >= tooltip2Y && tooltip1Y <= (tooltip2Y + tooltip2Height + TOOLTIP_PADDING)))
	{
		// tooltips are overlapping, move one down a bit

		// put the lower tooltip below (if they were supposed to have the same Y, tooltip 1 is always on top)
		if(tooltip2Y < tooltip1Y)
		{			
			// tooltip 1 is lower, move it below
			tooltip1Y = tooltip2Y + tooltip2Height + TOOLTIP_PADDING;

			d3.select("#tooltip")
				.style("top", tooltip1Y + "px")
		}
		else
		{
			// tooltip 2 is lower, move it below
			tooltip2Y = tooltip1Y + tooltip1Height + TOOLTIP_PADDING;

			d3.select("#tooltip2")
				.style("top", tooltip2Y + "px")			
		}		
	}
}

function setGraphDateRange(extent)
{
	// update graph to new, selected area
	x.domain(extent);
	focus.select("#line1").attr("d", line);
	focus.select("#line2").attr("d", line2);
	focus.select(".x.axis").call(xAxis);

	//if(d3.select(".selectLine").data())
	drawSelectionLine(selectedTime);
}

function drawSelectionLine(datetime)
{
	var xloc = x(datetime);

	if(isNaN(xloc))
	{
		d3.select(".selectLine")
			.style("display", "none");

		return;
	}

	d3.select(".selectLine")
		.attr("x1", xloc)
		.attr("x2", xloc)
		.style("display", null)
		.datum(datetime);
}