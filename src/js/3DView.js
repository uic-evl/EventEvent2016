const RENDER_WIDTH = 650;
const RENDER_HEIGHT = 600;

const FLOOR_SIZE = {width: 190, height: 111};

const TOTAL_ZONES = 44; // 41 zones + 3 overall floor zones
const zoneCounts = {floor1: 9, floor2: 18, floor3: 14};

var canvas;
var camera, scene, renderer;
var buildingGroup;
var pathGroup;

var sectionMeshes = [];

var outlineMaterial;

// zone mesh groups
var zoneMeshes;
var floor1;
var floor2;
var floor3;
var floorGroups;

// Current position sphere
var currentPositionSphere;

// Data
var RawHVACData;
var HVACData; // HVACData[zoneIndex][variableName][timestep] = value
var HVACVariables;

// status
var currentVariable = "RETURN OUTLET CO2 Concentration";
var currentTimestep = 0;

// EXECUTION START
init();
// EXECUTION END

var zoneCenters = [[[110, -100, 55.5],
					[24, -100, 20],
					[8, -100, 71],
					[46, -100, 57],
					[99, -100, 18],
					[98, -100, 79],
					[162, -100, 103.5],
					[182, -100, 103.5]],

					[[60, 0, 55.5],
					[20, 0, 50],
					[152, 0, 8],
					[46, 0, 56],
					[30, 0, 77],
					[130.25, 0, 81.75],
					[138.4, 0, 35.11]],

					[[60, 100, 55.5],
					[110, 100, 59.25],
					[20, 100, 50],
					[46, 100, 56.5],
					[155.6, 100, 13.3],
					[18.6, 100, 13.3],
					[28.5, 100, 78.5]]];

var colors = ["#1b9e77", "#d95f02", "#7570b3", "#e7298a", "#66a61e", "#e6ab02", "#a6761d", "#666666"];

function init()
{	
	scene = new THREE.Scene();
	scene.background = new THREE.Color(0x272832);

	var geometry = new THREE.BoxBufferGeometry(192, 200, 111);

	buildingGroup = new THREE.Group();
	buildingGroup.rotation.x = (Math.PI)/32;

	outlineMaterial = new THREE.LineBasicMaterial({linewidth: 2, color: 0x444444});

	// building frame
	var pillar = new THREE.Geometry();
	pillar.vertices.push(new THREE.Vector3(-96, -100, -55), new THREE.Vector3(-96, 100, -55));
	pillar.vertices.push(new THREE.Vector3(-96, 100, 55), new THREE.Vector3(-96, -100, 55));
	pillar.vertices.push(new THREE.Vector3(93, -100, 55), new THREE.Vector3(93, 100, 55));
	pillar.vertices.push(new THREE.Vector3(93, 100, -55), new THREE.Vector3(93, -100, -55));	

	var line = new THREE.Line(pillar, outlineMaterial);

	buildingGroup.add(line);

	scene.add(buildingGroup);

	canvas = document.getElementById("threeCanvas");
	var boundingRect = canvas.getBoundingClientRect();
	renderWidth = boundingRect.width;
	renderHeight = boundingRect.height;

	renderer = new THREE.WebGLRenderer({canvas: canvas});
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(RENDER_WIDTH, RENDER_HEIGHT);

	camera = new THREE.PerspectiveCamera(70, RENDER_WIDTH/RENDER_HEIGHT, 1, 1000);
	camera.position.y = 0;
	camera.position.z = 400;
	camera.lookAt(new THREE.Vector3(0, 0, 0));

	floor1 = new THREE.Group();
	floor2 = new THREE.Group();
	floor3 = new THREE.Group();
	floorGroups = [floor1, floor2, floor3];

	zoneMeshes = [];

	loadHVACData(true);	
	animate();
	controlCube();
}

function changeHVAC()
{
	var HVACDropdown = document.getElementById("HVACDropdown");
	currentVariable = HVACVariables[HVACDropdown.value].name;
	update();
}

function changeTimestep()
{
	var timeSlider = document.getElementById("timeSlider");
	currentTimestep = +timeSlider.value + (288 * currentDay);

	var timeLabel = document.getElementById("HVACTime");
	var timeSeconds = 300 * timeSlider.value;
	var hour = Math.floor(timeSeconds / 3600);
	var minute = Math.floor((timeSeconds % 3600) / 60);
	timeLabel.innerHTML = (hour < 10 ? "0" + hour : hour) + ":" + (minute < 10 ? "0" + minute : minute); //timeSlider.value * 300 + "s";

	update();
}

function update()
{
	var zoneValues = new Array(TOTAL_ZONES);

	for(var i = 0; i < TOTAL_ZONES; i++)
	{
		if(HVACData[i][currentVariable] == [] || HVACData[i][currentVariable][currentTimestep] == undefined)
		{
			//console.log("skipper " + i);
			zoneValues[i] = -1;
			continue;
		}
		
		zoneValues[i] = (+HVACData[i][currentVariable][currentTimestep]);//.value;
	}

	var valueToRGB = d3.scale.linear()
		.domain([0, d3.max(zoneValues)])
		.range([.05, 1]);

	var valueToHSL = d3.scale.linear()
		.domain([0, d3.max(zoneValues)])
		.range([.66, 1]);

	// TODO: DRAW KEY
	var colorScaleElem = document.getElementById("colorScale");


	for(var i = 0; i < TOTAL_ZONES; i++)
	{
		if(zoneValues[i] == -1)
		{
			//zoneMeshes[i].material.color.setRGB(.5, .5, .5);
			zoneMeshes[i].material.visible = false;
		}
		else
		{
			//var val = (1.0 - (valueToRGB(zoneValues[i]))) * 240 / 360;
			//var val = valueToHSL(zoneValues[i]);

			//zoneMeshes[i].material.color.setHSL(val, 1, .5);
			zoneMeshes[i].material.visible = true;
			zoneMeshes[i].material.color.setRGB(0, valueToRGB(zoneValues[i])/2, valueToRGB(zoneValues[i]));
			//zoneMeshes[i].material.color.setRGB(valueToRGB(zoneValues[i])/2, valueToRGB(zoneValues[i])/4, valueToRGB(zoneValues[i]));
		}		
		
		zoneMeshes[i].geometry.meshNeedsUpdate = true;
	}
}

function animate()
{
	requestAnimationFrame(animate);
	renderer.render(scene, camera);
}

function controlCube()
{
	var isDragging = false;

	var previousMousePosition = {x:0,y:0};

	$(renderer.domElement)
	.on('contextmenu', function(e){return false;})
	.on('mousedown', function(e)
	{
		isDragging = true;
	})
	.on('wheel', function(e)
	{
		e.preventDefault();

		// get delta
		var delta = e.originalEvent.deltaY;

		camera.translateZ(delta/10);
	})
	.on('mousemove', function(e)
	{
		var deltaMove = {x:e.offsetX - previousMousePosition.x,
						 y:e.offsetY - previousMousePosition.y};

		if(isDragging)
		{
			var mouseButton = e.which;

			if(mouseButton == 1)
			{
				buildingGroup.rotation.x += deltaMove.y * Math.PI/180;
	
				if(buildingGroup.rotation.x > (Math.PI)/2)
				{
					buildingGroup.rotation.x = (Math.PI)/2;
				}
				else if(buildingGroup.rotation.x % Math.PI < (Math.PI)/32)
				{
					buildingGroup.rotation.x = (Math.PI)/32;
				}
	
				buildingGroup.rotation.y += deltaMove.x * Math.PI/180;
	
				if(buildingGroup.rotation.y > (Math.PI)/2)
				{
					buildingGroup.rotation.y = (Math.PI)/2;
				}
				else if(buildingGroup.rotation.y % Math.PI < (Math.PI)/-2)
				{
					buildingGroup.rotation.y = (Math.PI)/-2;
				}

				//camera.lookAt(new THREE.Vector3(0, 0, 0));
			}
			/*else if(mouseButton == 2)
			{
				//camera.rotation.x -= deltaMove.y * Math.PI/180;
				//camera.rotation.y -= deltaMove.x * Math.PI/180;
			}*/
			else if(mouseButton == 3 || mouseButton == 2)
			{
				camera.position.x -= deltaMove.x;
				camera.position.y += deltaMove.y;
			}
		}
	
		previousMousePosition = {x:e.offsetX, y:e.offsetY};
	});

	$(document).on('mouseup', function(e)
	{
		isDragging = false;
	});
}

function drawHVACZones()
{
	d3.json("../../data/json/hvacpaths.json", function(error, data)
	{
		if(error)
			throw error;

		for(var zone = 0; zone < TOTAL_ZONES; zone++)
		{
			var path = data[zone];
			var tokens = path.split(" ");

			var sectionGeometry = new THREE.Geometry;

			var floor = indexToFloor(zone);

			for(var i = 0; i < tokens.length;)
			{
				if(isNaN(+tokens[i]))
				{
					// The current token isn't a number, check the next one
					i++;
				}
				else
				{
					// The current token is a number. We ensure that every time this happens that the next token is also a number, so grab both coordinates and add a vertex, then jump 2 spaces ahead (over the other number we grabbed)
					sectionGeometry.vertices.push(new THREE.Vector3(+tokens[i], +tokens[i+1], 0));

					i += 2;
				}
			}	

			sectionGeometry.vertices.push(sectionGeometry.vertices[0]);

			triangles = THREE.ShapeUtils.triangulateShape(sectionGeometry.vertices, []);

			for(var i = 0; i < triangles.length; i++)
			{
				sectionGeometry.faces.push(new THREE.Face3(triangles[i][0], triangles[i][1], triangles[i][2]));
			}	

			var mat = new THREE.MeshBasicMaterial({color: colors[zone%colors.length]});
			mat.side = THREE.DoubleSide;
			mat.depthWrite = false;

			var mesh = new THREE.Mesh(sectionGeometry, mat);
			mesh.rotateX(Math.PI/2);

			zoneMeshes.push(mesh);

			floorGroups[floor - 1].add(mesh);
		}


		for(var floor = 0; floor < 3; floor++)
		{
			buildingGroup.add(floorGroups[floor]);
			floorGroups[floor].position.x -= 96;
			floorGroups[floor].position.y += 100*(floor - 1);
			floorGroups[floor].position.z -= 55;
		}

		changeHVAC();
	});
}

function showPath(name, date)
{
	// Erase old path
	buildingGroup.remove(pathGroup);

	// Draw path
	var theDate = new Date(date);
	var month = +(theDate.getUTCMonth() + 1);
	var day = +theDate.getUTCDate();

	var filename = "../../data/json/proxOut-Durations-" + month + "-" + day + ".json";

	d3.json(filename, function(error, data)
	{
		if(error)
			throw error;

		var pathLineMaterial = new THREE.LineBasicMaterial({color: 0xffffff, linewidth: 5});

		pathGroup = new THREE.Group();
		pathGeometry = new THREE.Geometry();

		var employeeIndex = 0;
		for(var i = 0; i < data.length; i++)
		{
			if(data[i][0].proxID == name)
			{
				employeeIndex = i;
				break;
			}
		}

		for(var i = 0; i < data[employeeIndex].length; i++)
		{
			var floor = +(data[employeeIndex][i].floor) - 1;
			var zone = +data[employeeIndex][i].zone - 1;

			if(isNaN(zone))
			{
				// server room
				zone = 6;
			}

			pathGeometry.vertices.push(new THREE.Vector3(zoneCenters[floor][zone][0], zoneCenters[floor][zone][1], zoneCenters[floor][zone][2]));
		}

		var path = new THREE.Line(pathGeometry, pathLineMaterial);

		pathGroup.add(path);

		buildingGroup.add(pathGroup);

		pathGroup.position.x -= 96;
		pathGroup.position.z -= 56;
	});

	// Display the selected name and date
	var canvasRect = canvas.getBoundingClientRect();

	var x = 0;
	var y = canvasRect.height - 30;

	d3.select("#pathLabel")		
		.html("Displaying movement for " + name + " on " + date)
		.style("width", canvasRect.width + "px")
		.style("left", x + "px")
		.style("top", y + "px");
}

function getHVACIndex(floorString, zoneString)
{
	if(floorString == "")
	{
		return -1;
	}
	else if(zoneString == "")
	{
		switch(+floorString)
		{
			case 1: return 0; break;
			case 2: return zoneCounts.floor1 + 1; break;
			case 3: return zoneCounts.floor1 + zoneCounts.floor2 + 2; break;
			default: return -1; break;
		}
	}

	var floor = +floorString;
	var zone = +zoneString;

	if(isNaN(zone))
	{
		var alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
		var baseNum = +(zoneString.substr(0, 1));
		var char = zoneString.substr(1, 1);
		var charIndex = alpha.indexOf(char);

		zone = baseNum + charIndex;
	}

	if(floor == 1)
	{
		//console.log("zone: " + zoneString + " -> " + zone);
		return zone;
	}
	else if(floor == 2)
	{
		return zoneCounts.floor1 + 1 + zone;
	}
	else if(floor == 3)
	{
		return zoneCounts.floor1 + zoneCounts.floor2 + 2 + zone;
	}

	return -1;
}

function getZoneIndex(variableName)
{
	var floor;
	var zone;

	var floorRE = /F_\d/;
	var floorIndex = variableName.search(floorRE);

	var zoneRE = /Z_\d/;
	var zoneIndex = variableName.search(zoneRE);

	var space = variableName.indexOf(" ");
	var colon = variableName.indexOf(":");

	var delimiterIndex;

	if(space >= 0 && colon >= 0)
	{
		delimiterIndex = d3.min([variableName.indexOf(" "), variableName.indexOf(":")]);
	}
	else
	{
		delimiterIndex = space;
	}

	if(floorIndex != -1)
	{
		floor = variableName.substr(floorIndex + 2, 1);

		if(zoneIndex != -1)
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

	return getHVACIndex(floor, zone);
}

function indexToFloor(index)
{
	if(index <= zoneCounts.floor1)
	{
		return 1;
	}

	if(index <= zoneCounts.floor1 + zoneCounts.floor2 + 1)
	{
		return 2;
	}

	return 3;
}

function loadHVACData(callback)
{
	RawHVACData = new Array(3);

	d3.json("../../data/json/floor1-MC2.json", function(error1, data1)
	{	
		if(error1)
			throw error1;

		RawHVACData[0] = data1;

		var offsets = [];

		for(var i = 0; i < data1.length; i++)
		{
			offsets.push(data1[i].offset);
		}

		d3.json("../../data/json/floor2-MC2.json", function(error2, data2)
		{	
			if(error2)
				throw error2;

			var data2Fixed = [];

			for(var i = 0; i < data2.length; i++)
			{
				data2Fixed.push({message:data2[i], offset:offsets[i]});
			}

			RawHVACData[1] = data2Fixed;
			
			d3.json("../../data/json/floor3-MC2.json", function(error3, data3)
			{	
				if(error3)
					throw error3;

				var data3Fixed = [];

				for(var i = 0; i < data3.length; i++)
				{
					data3Fixed.push({message:data3[i], offset:offsets[i]});
				}
	
				RawHVACData[2] = data3Fixed;

				if(callback)
				{
					d3.csv("../../data/csv/HVACVariables.csv")
						.row(function(d){ return d; })
						.get(function(error, data)
						{
							if(error)
								throw error;
							
							HVACVariables = data;
				
							//console.log(HVACVariables);

							var HVACDropdown = document.getElementById("HVACDropdown");

							for(var i = 0; i < HVACVariables.length; i++)
							{
								var option = document.createElement("option");
								option.innerHTML = HVACVariables[i].name;
								option.value = i;
								HVACDropdown.appendChild(option);
							}

							createHeirarchy();
						});										
				}				
			});
		});
	});
}

function createHeirarchy()
{
	HVACData = new Array(TOTAL_ZONES);

	var numSteps = RawHVACData[0].length;
	console.log("steps: " + numSteps);

	for(var zone = 0; zone < TOTAL_ZONES; zone++)
	{
		HVACData[zone] = {};
		for(var param = 0; param < HVACVariables.length; param++)
		{
			HVACData[zone][HVACVariables[param].name] = new Array(numSteps);
		}
	}

	console.log(HVACData);

	for(var floor = 0; floor < 3; floor++)
	{
		console.log("floor " + floor + ": " + RawHVACData[floor].length + " steps");

		for(var step = 0; step < RawHVACData[floor].length; step++)
		{
			var message = RawHVACData[floor][step].message;
			var parameterList = Object.keys(message);

			for(var param = 0; param < parameterList.length; param++)
			{
				var parameterName = parameterList[param];
				var parameterType = getParameter(parameterName);

				if(parameterType == "")
				{
					// no matching parameterType, skip to next param
					continue;
				}

				var zoneIndex = getZoneIndex(parameterName);

				if(zoneIndex != -1)
				{
					if(HVACData[zoneIndex] == undefined)
						console.log(zoneIndex);

					HVACData[zoneIndex][parameterType][step] = +message[parameterName];
				}				
			}
		}
	}

	console.log(HVACData);

	drawHVACZones();
}

function getParameter(parameterName)
{
	for(var i = 0; i < HVACVariables.length; i++)
	{
		if(parameterName.includes(HVACVariables[i].name))
		{
			return HVACVariables[i].name;
		}
	}

	return "";
}

function markCurrentPosition(floor, zone)
{
	buildingGroup.remove(currentPositionSphere);

	console.log("markcurrent", floor, zone);
	var centerLoc = zoneCenters[floor - 1][zone - 1];

	var sphereGeom = new THREE.SphereGeometry(3, 16, 16);
	var sphereMat = new THREE.MeshBasicMaterial({color: 0xff0000});
	currentPositionSphere = new THREE.Mesh(sphereGeom, sphereMat);

	currentPositionSphere.position.x = centerLoc[0];
	currentPositionSphere.position.y = centerLoc[1];
	currentPositionSphere.position.z = centerLoc[2];

	currentPositionSphere.position.x -= 96;
	currentPositionSphere.position.z -= 56;

	buildingGroup.add(currentPositionSphere);
}