var classes = ['WARRIOR', 'SHAMAN', 'ROGUE', 'PALADIN', 'HUNTER', 'DRUID', 'WARLOCK', 'MAGE', 'PRIEST'];
var proccessedClass;
var allCards = [];
var selectedClasses = classes;
var acronym = "";

function changeStatus(hero)
{
	var className = hero.toUpperCase();
	var idx = selectedClasses.indexOf(className);
	if(idx != -1)
	{
		selectedClasses.splice(idx,1);
		$("."+hero).css("opacity", 0.5);
	}
	else
	{
		selectedClasses.push(className);
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
			allCards = json.filter(filterHeroes);
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
	return card.type != "HERO";
}

function launch()
{
	acronym = $("#acronym").val().toUpperCase().replace(/[^A-Z]+/g, '');
	console.log(selectedClasses);
	for (var j = 0; j < selectedClasses.length; j++){
		processedClass = selectedClasses[j];
		findDeck();
	}
}

function findDeck()
{
	var validCards = allCards.filter(filterProcessedClass).sort(sortByOrderInDeck);
	var result = [];
	
	for (var i = 0; i < acronym.length && validCards.length > 0; i++) 
	{
		var letter = acronym[i];
		var chosenCard = null;
		for(var j = 0; j < validCards.length && chosenCard == null; j++)
		{
			if(validCards[j].name[0] == letter)
			{
				chosenCard = validCards[0];
				validCards.splice(0,1);
			}
			else
			{
				validCards.splice(0,1);
			}
			j--;
		}
		
		result.push(chosenCard);
	}
	
	console.log(result);
}

function filterProcessedClass(obj)
{
	return ('cardClass' in obj && (obj.cardClass == processedClass || obj.cardClass == "NEUTRAL"));
}

function sortByOrderInDeck(card1, card2)
{
	if(card1.cost < card2.cost)
		return -1;
	else if (card2.cost < card1.cost)
		return 1;
	else
	{
		if(card1.name.toUpperCase() < card2.name.toUpperCase()) return -1;
    else if(card1.name.toUpperCase() > card2.name.toUpperCase()) return 1;
    else return 0;
	}
}


