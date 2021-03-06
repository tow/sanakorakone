var update_url_options = function(tense, ignore_negative, verbtype) {
        var url = new URL(document.location);
	url.searchParams.delete("verb");
	url.searchParams.delete("tense");
	for (const v of tense) {
	    url.searchParams.append("tense", v);
	}
	url.searchParams.delete("ignore_negative");
	if (ignore_negative) {
            url.searchParams.append("ignore_negative", "");
	}
	url.searchParams.delete("verbtype");
	for (const v of verbtype) {
	    url.searchParams.append("verbtype", v);
	}
        history.pushState(null, null, url.toString());
};

var update_url_word = function(word) {
        var u = new URL(document.location);
        var params = u.searchParams;
        u.searchParams.set("verb", word);
        history.pushState(null, null, u.toString());
};

var show_negative = function(neg) {
	if (neg) {
		$("#negative").text("negatiivinen");
	} else {
		$("#negative").text("");
	}
};

var populate_question = function(data) {
        update_url_word(data.infinitive);
	$("#infinitive").text(data.infinitive);
        $("#glosses ol").html(data.glosses.map(function(t){return $("<li/>").text(t);}));
	$("#person").text(data.person);
	$("#aikamuoto").text(data.tense);
	show_negative(data.negative);
	var check_answer = function() {
		var user_answer = $("#answer").val().toLowerCase().trim();
		if (user_answer == data.answer) {
			$("#judgment").empty().text("✔ Kyllä!").removeClass("alert-danger").addClass("alert-success");
			incrementScore("rights_"+data.index);
		} else {
			var answerdiv = $("<div>");
			answerdiv.append($("<span>").text("✘ "));
			var dmp = new diff_match_patch();
			var diff = dmp.diff_main(user_answer, data.answer);
			dmp.diff_cleanupSemantic(diff);
			// Result: [(-1, "Hello"), (1, "Goodbye"), (0, " World.")]
			for (const k in diff) {
				const d = diff[k];
				let el = null;
				if (d[0] == -1) {
					el = $("<del>");
				} else if (d[0] == 1) {
					el = $("<ins>");
				} else {
					el = $("<span>");
				}
				answerdiv.append(el.text(d[1]));
			}
			answerdiv.append($("<br>"));
			answerdiv.append($("<span>").text(data.answer));
			$("#judgment").empty().append(answerdiv).removeClass("alert-success").addClass("alert-danger");
			incrementScore("wrongs_"+data.index);
		}
		display_scores();
		$("#check").removeClass("btn-primary").addClass("btn-secondary").removeAttr('type');
		$("#new").removeClass("btn-secondary").addClass("btn-primary").attr('type', 'submit');
		$("form").off('submit').on('submit', function(e) {
			e.preventDefault();
                        update_url_options(
				$("#tense").val(),
				$("#ignore_negative").prop("checked"),
				$("#verbtype").val());
			get_question();
		});
	};
	$("#check").removeClass("btn-secondary").addClass("btn-primary").attr('type', 'submit');
	$("#new").removeClass("btn-primary").addClass("btn-secondary").removeAttr('type');
	$("form").off('submit').on('submit', function(e) {
		e.preventDefault();
		check_answer();
	});
};

var get_question = function(verb) {
        var u = "/generate_example/?"+$("form").serialize()
        if (!$("#verb").prop("value") && verb) {
             // if it is set in the form, the user has chosen it, so don't override
             // if it is not in the form but it is in function args, then it is set in the URL, use that as a backup
             var url = new URL(u, document.location);
             url.searchParams.set("verb", verb);
             u = url.toString();
	}
	$.getJSON(u, populate_question);
	$("#answer").val('');
	$("#judgment").text('').removeClass("alert-danger alert-success");
};

var get_scores = function() {
	var total_wrongs = 0;
	var total_rights = 0;
	for (const i of scoreIterator()) {
		total_rights += Number(localStorage.getItem("scores_rights_"+i));
		total_wrongs += Number(localStorage.getItem("scores_wrongs_"+i));
	}
	var total = total_rights + total_wrongs;
	return {
		"rights": total_rights,
		"wrongs": total_wrongs,
		"total": total_rights+total_wrongs,
		"percent": 100.0 * total_rights / total || 0
	};
};

var display_scores = function() {
	var summed_scores = get_scores();
	$("#rights").text(summed_scores.rights);
	$("#total").text(summed_scores.total);
	$("#percent").text(Math.round(100*summed_scores.percent)/100);
}

var scoreIterator = function*() {
	// array key is {verbtype|tense|negation|person}
	// verbtype 1 to 6
	// tense 1 = present, 2 = imperfect, 3 = perfect, 4 = pluperfect
	// negation 1 = positive, 2 = negative
	// person 1 = SG1, ... 6 = PL3
	for (var verbtype=1; verbtype<7; verbtype++) {
		for (var tense=1; tense<5; tense++) {
			for (var negative=1; negative<3; negative++) {
				for (var person=1; person<7; person++) {
					const index = 	
						verbtype.toString() +
						tense.toString() +
						negative.toString() +
						person.toString();
					yield index;
				}
			}
		}
	}
};

var incrementScore = function(index) {
	const s = Number(localStorage.getItem("scores_"+index));
	localStorage.setItem("scores_"+index, s+1);
}

var clear_scores = function() {
	for (const i of scoreIterator()) {
  	 	localStorage.removeItem("scores_rights_"+index);
  	 	localStorage.removeItem("scores_wrongs_"+index);
	}
	display_scores();
};

var get_and_set_opts = function() {
        var url = new URL(document.location);

        $.each(url.searchParams.getAll("tense"), function(i,e) {
             $("#tense option[value='" + e + "']").prop("selected", true);
        });
        if (url.searchParams.get("ignore_negative")!=null) {
             $("#ignore_negative").prop("checked", true);
        }
        $.each(url.searchParams.getAll("verbtype"), function(i,e) {
             $("#verbtype option[value='" + e + "']").prop("selected", true);
        });

        return url.searchParams.get("verb");
}; 

$(document).ready( function() {
	display_scores();
	get_question(get_and_set_opts());
});
