var distributions;
var selected_name;
var selected_obj;
var sq1;
var sq2;
var sq3;
var dist_clone;
var close_names;
var svg_width;
var svg_height;
var width;
var height;
var name_buffer_size;
var offset = 0;
var name_offset = 100;
var head_height = 40;
var margin_width = 0;
var box_height;
var current_name_index = -1;
var parameters = [	{"display": "25th Percentile", "name": "q1"},
					{"display": "50th Percentile", "name": "q2"},
					{"display": "75th Percentile", "name": "q3"},
					{"display": "Popularity (Total)", "name": "total"},
					{"display": "Mean Age", "name": "mean"}];
var use_param = [true, true, true, true, true];
var param_values = [0, 0, 0, 0, 0];

function getCloseNames() {
	var data = dist_clone.slice(offset, offset + name_buffer_size * 2 + 1);
	height = svg_height - head_height - 10;
	width = svg_width - margin_width * 2 - name_offset;
	box_height = height / data.length;
	var height_iter = 0;
	var iter = 0;
	for(var key in data) {
		data[key].x = data[key].q1 / 95.0 * width + margin_width + name_offset;
		data[key].y = 1.0 * height_iter++ / data.length * height + 2 + head_height;
		data[key].width = (data[key].q3 - data[key].q1) / 95.0 * width;
		data[key].height = box_height - 4;
		data[key].cx = data[key].q2 / 95.0 * width + margin_width + name_offset;
		data[key].cy = data[key].y + box_height / 2.0;
		data[key].highlight = (iter++ + offset) % 2 == 0 ? "#eeeeee" : "#ffffff";
	}
	return data;
}

function setParamValues() {
	if(use_param[0]) // q0
		param_values[0] = $("#param_" + parameters[0].name).slider("value") / 100.0;
	if(use_param[1]) // q1
		param_values[1] = $("#param_" + parameters[1].name).slider("value") / 100.0;
	if(use_param[2]) // q2
		param_values[2] = $("#param_" + parameters[2].name).slider("value") / 100.0;
	if(use_param[3]) // total
		param_values[3] = $("#param_" + parameters[3].name).slider("value") / 20.0;
	if(use_param[4]) // mean
		param_values[4] = $("#param_" + parameters[4].name).slider("value") / 20.0;
}

function dist(a, b) {
	var score = 1;
	if(use_param[0])
		score += Math.pow(a.q1 - b.q1, 2) * param_values[0];
	if(use_param[1])
		score += Math.pow(a.q2 - b.q2, 2) * param_values[1];
	if(use_param[2])
		score += Math.pow(a.q3 - b.q3, 2) * param_values[2];
	if(use_param[3])
		score *= Math.pow(Math.max(a.total, b.total) / Math.min(a.total, b.total), param_values[3]);
	if(use_param[4])
		score *= Math.pow(Math.max(a.mean, b.mean) / Math.min(a.mean, b.mean), param_values[4]);
	return score;
}

function initialize(selected_name_index, same_name) {
	$("#distribution").empty();
	if(selected_name_index == -1) {
		alert("Name not in data!");
		return;
	}

	$("#name_entry").val(fixNameCase(distributions[selected_name_index].name));
	current_name_index = selected_name_index;
	svg_width = $("#distribution").width();
	svg_height = $("#distribution").height();

	name_buffer_size = parseInt(svg_height / 50 - 2);

	setParamValues();
	if(!same_name) {
		offset = 0;
		selected_obj  = distributions[selected_name_index];
		selected_name = selected_obj.name;
		selected_sex  = selected_obj.sex;
		sq1 = distributions[selected_name_index].q1;
		sq2 = distributions[selected_name_index].q2;
		sq3 = distributions[selected_name_index].q3;

		dist_clone = distributions.slice();
		for(var key in distributions)
			dist_clone[key].dist = dist(selected_obj, distributions[key]);

		dist_clone.sort(function(a, b) {
			if(a.dist != b.dist)
				return a.dist - b.dist;
			if(a.name == b.name && a.name == selected_name)
				return 0;
			if(a.name == selected_name)
				return -1;
			if(b.name == selected_name)
				return 1;
			return a.name < b.name ? -1 : a.name == b.name ? 0 : 1;
		});
	}

	var svg = d3.select("#distribution")
				.append("svg")
				.attr("width", svg_width)
				.attr("height", svg_height);

	close_names = getCloseNames();

	var highlight = svg.selectAll("rect.highlight")
					.data(close_names)
					.enter().append("rect")
					.attr("class", "highlight")
					.attr("x", margin_width + name_offset)
					.attr("y", function(d) {
						return d.y;
					})
					.attr("width", width)
					.attr("height", box_height)
					.attr("stroke", "none")
					.attr("stroke-width", "1px")
					.style("fill", function(d) {
						return d.highlight;
					})
					.on("click", function(d) {
						initialize(getNameIndex(d.name, d.sex));
					})
					.on("mouseover", function(d) {
						d3.select(d3.event.target).style("fill", "#dddddd");
					})
					.on("mouseout", function(d) {
						d3.select(d3.event.target).style("fill", d.highlight);
					});

	var rects = svg.selectAll("rect.range")
					.data(close_names)
					.enter().append("rect")
					.attr("class", "range")
					.attr("x", function(d) {
						return d.x;
					})
					.attr("y", function(d) {
						return d.y + 2;
					})
					.attr("width", function(d) {
						return d.width;
					})
					.attr("height", function(d) {
						return d.height;
					})
					.style("fill", function(d) {
						return d.sex == "M" ? "#84CAEF" : "#80DAB6";
					});

	var ticks = svg.selectAll("line.tick")
					.data(d3.range(0, 95, 10).map(function(d) {
						return {"index" : d};
					}))
					.enter().append("line")
					.attr("class", "tick")
					.attr("x1", function(d) {
						d.x1 = margin_width + name_offset + d.index / 95.0 * width;
						return d.x1;
					})
					.attr("y1", function(d) {
						return head_height - 10;
					})
					.attr("x2", function(d) {
						return d.x1;
					})
					.attr("y2", function(d) {
						return height + head_height + 2;
					})
					.attr("stroke", "gray")
					.attr("stroke-width", 1);

	var circles = svg.selectAll("circle.median")
					.data(close_names)
					.enter().append("circle")
					.attr("class", "median")
					.attr("cx", function(d) {
						return d.cx;
					})
					.attr("cy", function(d) {
						return d.cy;
					})
					.attr("r", box_height * .25)
					.attr("stroke", "white")
					.attr("stroke-width", "2px")
					.style("fill", "#EC5F5F");

	var names = svg.selectAll("text.name")
					.data(close_names)
					.enter().append("text")
					.attr("class", "name")
					.text(function(d) {
						return d.name.slice(0,1) + d.name.slice(1).toLowerCase();
					})
					.attr("font-family", "sans-serif")
					.attr("font-size", "18px")
					.attr("fill", function(d) {
						return "#333333";
					})
					.attr("x", -5 + margin_width + name_offset)
					.attr("y", function(d) {
						return d.y + box_height / 2.0;
					})
					.attr("alignment-baseline", "middle")
					.attr("text-anchor", "end");

	var labels = svg.selectAll("text.age_label")
					.data(d3.range(0, 95, 10))
					.enter().append("text")
					.attr("class", "age_label")
					.attr("x", function(d) {
						var x1 = margin_width + name_offset + d / 95.0 * width;
						return x1;
					})
					.attr("y", function(d) {
						return head_height / 2;
					})
					.text(function(d) {
						if(d == 0)
							return "0 years old";
						return d;
					})
					.attr("font-family", "sans-serif")
					.attr("font-size", "20px")
					.attr("alignment-baseline", "middle")
					.attr("text-anchor", function(d) {
						return "middle";
					})
					.attr("fill", "black");
}

function getNameIndex(name, sex) {
	for(var key in distributions)
		if(distributions[key].name == name && distributions[key].sex == sex)
			return key;
}

$(function() {
	var controls = $("#controls");
	var slider_controls = $("#slider_controls");
	for(var key in parameters) {
		var div = $("<div>", {"id": "param_" + parameters[key].name, "class": "slider"});
		var label = $("<h5>", {"class": "param_label"});
		label.text(parameters[key].display);
		div.slider({
			min: 0,
			max: 100,
			value: 50,
			step: 1,
			slide: function() {
				setTimeout(function() {
					initialize(current_name_index);
				}, 10);
			}
		});

		slider_controls.append(label).append(div);
	}

	$.get("//bretthansen.github.io/age_distribution_by_name/data.json", function(data) {
		distributions = data;
		distributions.sort(function(a, b) {
			return a.name < b.name ? -1 : a.name == b.name ? (b.total - a.total) : 1;
		});
		var search = $("#name_entry");
		var suggestions_div = $("<div id=\"suggestions_div\"></div>");
		search.on("input focus", function(e) {
			var search_text = search.val().toUpperCase();
			if(search_text == "") {
				suggestions_div.empty();
				suggestions_div.hide();
				return;
			}
			var i = 0;
			for(var char_iter in search_text) {
				var c = search_text[char_iter];
				while(i < distributions.length) {
					if(distributions[i].name[char_iter] == c) {
						break;
					}
					if(distributions[i].name[char_iter] > c)
						return;
					i++;
				}
			}
			var suggestions = [];
			for(var j = i; j < distributions.length; j++) {
				if(distributions[j].name.slice(0, search_text.length) == search_text)
					suggestions.push({ obj : distributions[j], index : j});
				else
					break;
			}
			if(suggestions.length > 10)
				suggestions = suggestions.slice(0, 10);

			var ul = $("<ul id=\"suggestions\"></ul>");
			for(var key in suggestions) {
				var li = $("<li>" + (suggestions[key].obj.sex == "M" ? "\u2642" : "\u2640") + "\t" + fixNameCase(suggestions[key].obj.name) + "</li>");
				li.click({index : suggestions[key].index}, function(e) {
					e.stopPropagation();
					var index = e.data.index;
					search.val(fixNameCase(distributions[index].name));
					suggestions_div.empty();
					suggestions_div.hide();
					initialize(index);
				});
				ul.append(li);
			}
			suggestions_div.empty();
			suggestions_div.append(ul);
			suggestions_div.show();
		});
		search.click(function(e) {
			if(suggestions_div.children().length != 0)
				suggestions_div.show();
			e.stopPropagation();
			$(document).one("click", function(e) {
				suggestions_div.hide();
			});
		});
		controls.children().first().after(suggestions_div);
		suggestions_div.width(search.outerWidth() - 2);
		suggestions_div.css({top: search.offset().top + search.outerHeight(), left: search.offset().left});

		var popular_names = distributions.filter(function(d) {
			return d.total >= 50000 ? true : false;
		}).map(function(d) {
			return [d.name, d.sex];
		});
		var choice = popular_names[parseInt(Math.random() * popular_names.length)];
		initialize(getNameIndex(choice[0], choice[1]));
	});
});

function fixNameCase(name) {
	return name[0].toUpperCase() + name.slice(1, name.length).toLowerCase();
}