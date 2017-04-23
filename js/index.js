var classes = ['WARRIOR', 'SHAMAN', 'ROGUE', 'PALADIN', 'HUNTER', 'DRUID', 'WARLOCK', 'MAGE', 'PRIEST'];
var cards = [];
var selectedClasses = new Set(classes);
var acronym = "";

function changeStatus(hero)
{
	var className = hero.toUpperCase();
	if(selectedClasses.has(className))
	{
		selectedClasses.delete(className);
		$("."+hero).css("opacity", 0.5);
	}
	else
	{
		selectedClasses.add(className);
		$("."+hero).css("opacity", 1.);
	}
}

$(window).load(function ()
{
	$.ajax({
		dataType: "json",
		url: "https://api.hearthstonejson.com/v1/latest/enUS/cards.collectible.json",
		data: "",
		success: function(json) {
			cards = json;
			cards.filter(filterHeroes);
		}
	});
});

$(document).ready(function() {

   $('#acronym').keypress(function(e){
			if(e.which === 13)
        launch();
   });

});

function filterHeroes(card)
{
	return card.type == "HERO";
}

function launch()
{
	acronym = $("#acronym").val().toUpperCase().replace(/[^A-Z]+/g, '');
	console.log(acronym);
}


