var classes = ['DRUID', 'HUNTER', 'MAGE', 'PALADIN', 'PRIEST', 'ROGUE', 'SHAMAN', 'WARLOCK', 'WARRIOR'];
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
	var mainList = $("<ul>");
	for (var j = 0; j < selectedClasses.length; j++){
		processedClass = selectedClasses[j];
		var result = findDeck();
		if(result != null)
		{
			var deck = "[";
			console.log(result);
			for(var i = 0; i < result.length; i++)
			{
				console.log(result[i]);
				deck += "<b>" + result[i].name[0] + "</b>" + result[i].name.substring(1,result[i].name.length) + (i == result.length - 1 ? "]" : ", ");
			}
			console.log(deck);
			mainList.append($("<h4>").text(processedClass));
			mainList.append($("<li>").html(deck));
		}
	}
	
	$("#results").html(mainList);
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
	
	if(validCards.length == 0)
		result = null;
	
	return result;
}

function filterProcessedClass(obj)
{
	var result = false;
	if('cardClass' in obj)
	{
		result = obj.cardClass == processedClass;
		
		if(!result && obj.cardClass == "NEUTRAL")
		{
			result = 
				'multiClassGroup' in obj
				&& ((obj.multiClassGroup == "JADE_LOTUS" && (processedClass == "DRUID" || processedClass == "ROGUE" || processedClass == "SHAMAN"))
					|| (obj.multiClassGroup == "KABAL" && (processedClass == "MAGE" || processedClass == "PRIEST" || processedClass == "WARLOCK"))
					|| (obj.multiClassGroup == "GRIMY_GOONS" && (processedClass == "WARRIOR" || processedClass == "HUNTER" || processedClass == "PALADIN")));
		}
	}
	return result;
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


