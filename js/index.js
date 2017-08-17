const classes = ['DRUID', 'HUNTER', 'MAGE', 'PALADIN', 'PRIEST', 'ROGUE', 'SHAMAN', 'WARLOCK', 'WARRIOR'];
const heroesIdx = [274, 31, 637, 671, 813, 930, 1066, 893, 7];
var proccessedClass;
var allCards = [];
var selectedClasses = classes;
var acronym = "";
var loadedLanguage = "EN";
var lastResults = new Map();
const nbDisplayedDecks = 30;
var nbNeutralDecks = 0;
var Format = {WILD : {name : "Wild", index : 1} , STANDARD : {name : "Standard", index : 2}};
var currentFormat = Format.WILD;

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

function changeFormat()
{
    if(currentFormat == Format.STANDARD)
    {
        currentFormat = Format.WILD;
        $("#format").attr("src", "img/wild.png");
    }
    else
    {
        currentFormat = Format.STANDARD;        
        $("#format").attr("src", "img/standard.png");
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
			if(currentFormat == Format.STANDARD)
			{
				allCards = allCards.filter(filterStandard);
			}
			allCards.forEach(lightCard);
		}
	});
});

function loadCards(language)
{
	$.ajax({
		dataType: "json",
		url: "https://api.hearthstonejson.com/v1/latest/"+language+"/cards.collectible.json",
		data: "",
		success: function(json) {
			allCards = json.filter(filterHeroes);
			if(currentFormat == Format.STANDARD)
			{
				allCards = allCards.filter(filterStandard);
			}
			allCards.forEach(lightCard);
			launch();
		}
	});
}

function lightCard(card)
{
	card.description = undefined;
	card.artist = undefined;
	card.flavor = undefined;
	card.text = undefined;
	card.mechanics = undefined;
	card.id = undefined;
}

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

function filterStandard(card)
{
	return card.set == "CORE" 
	|| card.set == "EXPERT1" 
	|| card.set == "OG" 
	|| card.set == "KARA" 
	|| card.set == "GANGS"
	|| card.set == "UNGORO"
	|| card.set == "ICECROWN";
}

function launch()
{
	var wantedLanguage = $("#languageSelect").val();
	if(wantedLanguage != loadedLanguage)
	{
		loadedLanguage = wantedLanguage;
		loadCards(languageCorrespondance(wantedLanguage));
	}
	else
	{
		acronym = $("#acronym").val().toUpperCase().replace(/[^A-Z]+/g, '');
		if(acronym.length > 0)
		{
			var outerDiv = $("<div>");
			var start = new Date().getTime();
			var totalNbResults = 0;
			for (var j = 0; j < selectedClasses.length + 1; j++){
				processedClass =  j == 0 ? "NEUTRAL" : selectedClasses[j-1];
				var results = findDecks();
				var nbResults = getNbDecks(results);
				(j == 0 ? nbNeutralDecks = nbResults : nbResults -= nbNeutralDecks);
				
				if(nbResults > 0)
				{
					totalNbResults += nbResults;
					display(results, outerDiv, nbResults);
					lastResults.set(processedClass, results);
				}
			}
			var end = new Date().getTime();
			var time = end - start;
			outerDiv.prepend($("<p>").text(totalNbResults + " decks generated in " + time + "ms").addClass("timer"));
			$("#results").html(outerDiv);
		}
	}
}

function display(results, outerDiv, nbDecksFound)
{
	var title = $("<p>").html(processedClass + " " + "(" + nbDecksFound + " deck" + (nbDecksFound > 1 ? "s"	: "") + ")   ");
	title.append($("<button>").addClass("btn btn-default btn-sm dust").attr("type", "button").attr("onClick", "sort('"+processedClass+"', 'asc');").html("<img src='img/dustIcon.png' class='smallDust'/>"));
	title.append($("<button>").addClass("btn btn-default btn-sm dust").attr("type", "button").attr("onClick", "sort('"+processedClass+"', 'desc');").html("<img src='img/dustIcon.png' class='largeDust'/>"));
	title.append($("<button>").addClass("btn btn-default btn-sm mana").attr("type", "button").attr("onClick", "sort('"+processedClass+"', 'mana');").html("<img src='img/manaIcon.png' class='largeDust'/>"));

	if(nbDecksFound > nbDisplayedDecks) title.append($("<button>").addClass("btn btn-default btn-sm repeat").attr("type", "button").attr("onClick", "reroll('"+processedClass+"');").html("<span class='glyphicon glyphicon-repeat'/>"));
	outerDiv.append($("<h4>").html(title));
	var nbDecks = getNbDecks(results);
	var chosenResults = chooseRandomDecksToDisplay(results, nbDecks);

	var container = $("<div>").addClass("container").attr("id", "results"+processedClass);
	displayDecks(container, chosenResults);
	outerDiv.append(container);
	outerDiv.append($("<br>"));
}

function reroll(className)
{
	processedClass = className;
	var decks = lastResults.get(className);
	decks = chooseRandomDecksToDisplay(decks, getNbDecks(decks));
	var classDiv = $("#results"+className);
	classDiv.empty();
	displayDecks(classDiv, decks);
}

function chooseRandomDecksToDisplay(results, nbDecksGenerated)
{
	var generatedResults = [];
	var nbDecksClass = nbDecksGenerated - (processedClass == "NEUTRAL" ? 0 : nbNeutralDecks);
	
	if(nbDecksClass < nbDisplayedDecks)
	{
		generatedResults = expandAllResults(results, 0, 0, 0).filter(e => !(processedClass != "NEUTRAL" && isNeutral(e)));
		for(var result in generatedResults)
		{
			generatedResults[result].reverse();
		}
	}
	else if(processedClass == "NEUTRAL")
	{
		if(nbDecksGenerated > 5 * nbDisplayedDecks)
		{
			generatedResults = selectByRandomShoot(results, nbNeutralDecks, true);
		}
		else
		{
			generatedResults = selectByGeneration(results, nbNeutralDecks, true);
		}
	}
	else
	{
		if(nbNeutralDecks == 0 || 100*nbDecksClass > nbNeutralDecks)
		{
			generatedResults = selectByRandomShoot(results, nbDecksClass, false);
		}
		else if(nbDecksClass > 0)
		{
			generatedResults = selectByGeneration(results, nbDecksClass, false);
		}
	}
	
	return generatedResults;
}

function selectByRandomShoot(results, nbClassDecks, acceptNeutral)
{
	var chosenIndexes = [];
	var generatedResults = [];
	while(generatedResults.length < nbDisplayedDecks && generatedResults.length < nbClassDecks)
	{
		var subIdx = 0;
		var indexesVector = [];
		for(var i = 0; i < results.length; i++)
		{
			var chosenIdx = Math.floor(Math.random()*(results[i].length - subIdx)) + subIdx;
			subIdx = results[i][chosenIdx].subIdx;
			indexesVector.push(chosenIdx);
		}
		
		if(chosenIndexes.indexOf(indexesVector) == -1)
		{
			chosenIndexes.push(indexesVector);
			var deck = expandResult(results, indexesVector);
			if(acceptNeutral || !isNeutral(deck))
			{
				generatedResults.push(deck);
			}
		}
	}
	
	return generatedResults;
}

function selectByGeneration(results, nbClassDecks, acceptNeutral)
{
	var generatedResults = [];
	var possibleIndexesVector = generateAllPossibleIndexesVector(results, 0, 0);
	
	while(generatedResults.length < nbDisplayedDecks && generatedResults.length < nbClassDecks && possibleIndexesVector.length > 0)
	{
		var chosenIdx = Math.floor(Math.random()*possibleIndexesVector.length);
		var deck = expandResult(results, possibleIndexesVector[chosenIdx]);
		if(acceptNeutral || !isNeutral(deck))
		{
			generatedResults.push(deck);
		}
		possibleIndexesVector.splice(chosenIdx, 1);
	}
	
	return generatedResults;
}

function sort(className, order)
{
	processedClass = className;
	var decks = lastResults.get(className);
	if(order == 'asc')
	{
		decks = getFirstElements(decks, lowDustCost);
	}	
	else if(order == 'desc')
	{
		decks = getFirstElements(decks, highDustCost);
	}
	else
	{
		decks = getFirstElements(decks, maxManaCostDiff);
	}
	var classDiv = $("#results"+className);
	classDiv.empty();
	displayDecks(classDiv, decks);
}

function displayDecks(parentBlock, decks)
{
	parentBlock.append($("<ul>"));
	for(var i = 0; i < decks.length; ++i)
	{
		var row = $("<li>");
		var deck = decks[i];
		
		row.append(getDeckstringCopySpan(deck, processedClass));
		
		var html = "[";
		for(var j = 0; j < deck.length; j++)
		{
			html += '<b class="'+ deck[j].rarity.toLowerCase()+'">' + deck[j].name[0] + "</b>" + deck[j].name.substring(1,deck[j].name.length) + (j == deck.length - 1 ? "]" : ", ");
		}
		row.append($("<span>").html(html));		
		parentBlock.append(row);
	}
}

function getFirstElements(results, costFunction)
{
	var firstElements = [];
	var possibleIndexesVector = generateAllPossibleIndexesVector(results, 0, 0);
	
	for(var i = 0; i < possibleIndexesVector.length && (i < 100000 || firstElements.length < nbDisplayedDecks); ++i)
	{
		if(processedClass == "NEUTRAL" || !isNeutralVector(results, possibleIndexesVector[i]))
		{
			var deckCost = costFunction(results, possibleIndexesVector[i]);
			var insertionIdx = firstElements.length-1;
			for( ; insertionIdx >= 0 && deckCost > firstElements[insertionIdx].cost; insertionIdx--);
			
			if(insertionIdx+1 < firstElements.length || firstElements.length < nbDisplayedDecks)
			{
				var newArray = firstElements.slice(0, insertionIdx+1);
				newArray.push({deck:expandResult(results, possibleIndexesVector[i]), cost:deckCost});
				firstElements = newArray.concat(firstElements.slice(insertionIdx+1, firstElements.length == nbDisplayedDecks ? firstElements.length-1 : firstElements.length));
			}
		}
	}
	
	var decks = [];
	for(var i in firstElements)
	{
		decks[i] = firstElements[i].deck;
	}
	return decks;
}

function highDustCost(results, indexVector)
{
	var cost = 0;
	for(var i in results)
	{
		cost += getCost(results[i][indexVector[i]].card);
	}
	
	return cost;
}

function lowDustCost(results, indexVector)
{
	return -highDustCost(results, indexVector);
}

function maxManaCostDiff(results, indexVector)
{
	return -(results[results.length-1][indexVector[results.length-1]].card.cost - results[0][indexVector[0]].card.cost);
}

function getCost(card)
{
	switch(card.rarity)
	{
		case "COMMON": return 40;
		case "RARE": return 100;
		case "EPIC": return 400;
		case "LEGENDARY": return 1600;
		default: return 0;
	}
}

function findDecks()
{
	var validCards = allCards.filter(filterProcessedClass).sort(sortByOrderInDeck);
	if(currentFormat == Format.STANDARD)
	{
		validCards = validCards.filter(filterStandard);
	}
	
	var result = findAllCombinations(acronym, validCards);

	return result;
}

function findAllCombinations(string, localUseable)
{
	//console.log("enter " + string + " " + localUseable.length);
	var result = [];
	if(string.length > 0)
	{
		var letter = string[0];
		var previousSubCombinations = [];
		var tested = false;
		var substring = string.substring(1, string.length);
		var idxFirstSub = 0;
		var rowToAdd = [];
		while(localUseable.length > 0 && (!tested || idxFirstSub < previousSubCombinations[0].length))
		{
			var card = localUseable[0];
			localUseable.shift();
			//console.log("studying " + card.name);
			
			if(previousSubCombinations.length > 0 && previousSubCombinations[0][idxFirstSub].card == card)
			{
				idxFirstSub++;
			}

			if(card.name[0] == letter)
			{		
				if(string.length > 1)
				{
					if(!tested)
					{
						var subUseable = (substring.indexOf(letter) == -1) ? localUseable.filter(function(card){ return card.name[0] != letter;} ) : localUseable.slice();						
						previousSubCombinations = findAllCombinations(substring, subUseable);
						tested = true;
					}
					//console.log("firstIndex " + idxFirstSub);
					if(idxFirstSub < previousSubCombinations[0].length)
					{
						var nbSubDecks = 0;
						for(var i = idxFirstSub; i < previousSubCombinations[0].length; ++i)
						{
							nbSubDecks += previousSubCombinations[0][i].nbSubDecks;
						}
					
						rowToAdd.push({card:card, subIdx:idxFirstSub, nbSubDecks:nbSubDecks});
					}
				}
				else
				{
					//console.log("feuille " + card.name);
					rowToAdd.push({card: card, subIdx: 0, nbSubDecks: 1});
				}
			}
		}
		
		result.push(rowToAdd);
		result = result.concat(previousSubCombinations);
		//console.log("result");
		//console.log(result);
	}
	//console.log("exit " + string);
	return result;
}

function filterProcessedClass(obj)
{
	var result = false;
	if('cardClass' in obj)
	{
		result = obj.cardClass == processedClass && !('multiClassGroup' in obj);
		
		if(!result && obj.cardClass == "NEUTRAL")
		{
			result = 
				!('multiClassGroup' in obj)
				|| ('classes' in obj && obj.classes.indexOf(processedClass)!= -1);
		}
	}
	return result && acronym.indexOf(obj.name[0]) != -1;
}

function isNeutral(deck)
{
	var result = true;
	for(var idx = 0; idx < deck.length && result; idx++)
	{
		result = (deck[idx].cardClass == "NEUTRAL") && !('multiClassGroup' in deck[idx]);
	}
	
	return result;
}

function getDeckstringCopySpan(deck, deckClass)
{
	var result = $("<button>").addClass("btn btn-default btn-sm copy").attr("type", "button").html("<span class='glyphicon glyphicon-copy'/>");
	result.click(function(){ copyTextToClipboard(getDeckstring(deck, deckClass)); });
	return result;
}

function copyTextToClipboard(text) 
{
	var textArea = document.createElement("textarea");
	console.log(text);

	// Place in top-left corner of screen regardless of scroll position.
	textArea.style.position = 'fixed';
	textArea.style.top = 0;
	textArea.style.left = 0;

	// Ensure it has a small width and height. Setting to 1px / 1em
	// doesn't work as this gives a negative w/h on some browsers.
	textArea.style.width = '2em';
	textArea.style.height = '2em';

	// We don't need padding, reducing the size if it does flash render.
	textArea.style.padding = 0;

	// Clean up any borders.
	textArea.style.border = 'none';
	textArea.style.outline = 'none';
	textArea.style.boxShadow = 'none';

	// Avoid flash of white box if rendered for any reason.
	textArea.style.background = 'transparent';


	textArea.value = text;

	document.body.appendChild(textArea);

	textArea.select();

	try {
	var successful = document.execCommand('copy');
	}
	catch (err) {
		
	}

	document.body.removeChild(textArea);
}

function getDeckstring(deck, deckClass)
{
	var cards = [];
	
	for(var cardIdx in deck)
	{
		cards.push([deck[cardIdx].dbfId, (deck[cardIdx].rarity == "LEGENDARY" ? 1 : 2)]);
	}
	
	var heroIdx = classes.indexOf(deckClass);
	heroIdx = (heroIdx == -1) ? heroesIdx[2] : heroesIdx[heroIdx];
	
	const formattedDeck = {
		cards: cards, // [dbfid, count] pairs
		heroes: [heroIdx],
		format: currentFormat.index, // 1 for Wild, 2 for Standard
	};

	return encode(formattedDeck);
}

function isNeutralVector(results, indexesVector)
{
	var result = true;
	for(var i = 0; i < results.length && result; i++)
	{
		result = (results[i][indexesVector[i]].card.cardClass == "NEUTRAL") && !('multiClassGroup' in results[i][indexesVector[i]].card);
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

function languageCorrespondance(shortLanguage)
{
	switch(shortLanguage)
	{
		case "EN": return "enUS";
		case "DE": return "deDE";
		case "FR": return "frFR";
		case "ES": return "esES";
		case "MX": return "esMX";
		case "IT": return "itIT";
		case "PL": return "plPL";
		case "BR": return "ptBR";
		default: return "";
	}
}

function getNbDecks(results)
{
	var result = 0;
	
	for(var idx in results[0])
	{
		result += results[0][idx].nbSubDecks;
	}
	
	return result;
}

function expandAllResults(results, letterIdx, subIdx, currentNbResults)
{
	var expandedResults = [];
	for(var idx = subIdx; idx < results[letterIdx].length; ++idx)
	{
		if(letterIdx == results.length-1)
		{
			expandedResults.push([results[letterIdx][idx].card]);
		}
		else
		{
			var subResults = expandAllResults(results, letterIdx+1, results[letterIdx][idx].subIdx);
			for(var subIdx2 in subResults)
			{
				var local = subResults[subIdx2].slice();
				local.push(results[letterIdx][idx].card);
				expandedResults.push(local);
			}
		}
	}
		
	return expandedResults;
}

function expandResult(results, indexesVector)
{
	var result = [];
	for(var i in results)
	{
		result.push(results[i][indexesVector[i]].card);
	}
		
	return result;
}

function generateAllPossibleIndexesVector(results, letterIdx, subIdx)
{
	var expandedResults = [];
	for(var idx = subIdx; idx < results[letterIdx].length; ++idx)
	{
		if(letterIdx == results.length-1)
		{
			expandedResults.push([idx]);
		}
		else
		{
			var subResults = generateAllPossibleIndexesVector(results, letterIdx+1, results[letterIdx][idx].subIdx);
			for(var subIdx2 in subResults)
			{
				var local = subResults[subIdx2].slice();
				local.unshift(idx);
				expandedResults.push(local);
			}
		}
	}
	
	return expandedResults
}

////////////////////////////////////////////////////////////////////
var encode_1 = encode$1;

var MSB = 0x80;
var REST = 0x7F;
var MSBALL = ~REST;
var INT = Math.pow(2, 31);

function encode$1(num, out, offset) {
  out = out || [];
  offset = offset || 0;
  var oldOffset = offset;

  while(num >= INT) {
    out[offset++] = (num & 0xFF) | MSB;
    num /= 128;
  }
  while(num & MSBALL) {
    out[offset++] = (num & 0xFF) | MSB;
    num >>>= 7;
  }
  out[offset] = num | 0;
  
  encode$1.bytes = offset - oldOffset + 1;
  
  return out
}

var decode$1 = read;

var MSB$1 = 0x80;
var REST$1 = 0x7F;

function read(buf, offset) {
  var res    = 0
    , offset = offset || 0
    , shift  = 0
    , counter = offset
    , b
    , l = buf.length;

  do {
    if (counter >= l) {
      read.bytes = 0;
      throw new RangeError('Could not decode varint')
    }
    b = buf[counter++];
    res += shift < 28
      ? (b & REST$1) << shift
      : (b & REST$1) * Math.pow(2, shift);
    shift += 7;
  } while (b >= MSB$1)

  read.bytes = counter - offset;

  return res
}

var N1 = Math.pow(2,  7);
var N2 = Math.pow(2, 14);
var N3 = Math.pow(2, 21);
var N4 = Math.pow(2, 28);
var N5 = Math.pow(2, 35);
var N6 = Math.pow(2, 42);
var N7 = Math.pow(2, 49);
var N8 = Math.pow(2, 56);
var N9 = Math.pow(2, 63);

var length = function (value) {
  return (
    value < N1 ? 1
  : value < N2 ? 2
  : value < N3 ? 3
  : value < N4 ? 4
  : value < N5 ? 5
  : value < N6 ? 6
  : value < N7 ? 7
  : value < N8 ? 8
  : value < N9 ? 9
  :              10
  )
};

var index = {
    encode: encode_1
  , decode: decode$1
  , encodingLength: length
};

function __extends(d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

/** @internal */
var Iterator = (function () {
    function Iterator() {
        this.index = 0;
    }
    Iterator.prototype.next = function (repeat) {
        if (repeat === void 0) { repeat = 1; }
        this.index += repeat;
    };
    return Iterator;
}());
/** @internal */
var BufferWriter = (function (_super) {
    __extends(BufferWriter, _super);
    function BufferWriter() {
        var _this = _super.call(this) || this;
        _this.buffer = [];
        return _this;
    }
    BufferWriter.prototype.null = function () {
        this.buffer[this.index] = 0;
        this.next();
    };
    BufferWriter.prototype.varint = function (value) {
        index.encode(value, this.buffer, this.index);
        this.next(index.encode.bytes);
    };
    BufferWriter.prototype.toString = function () {
        var buffer = String.fromCharCode.apply(String, this.buffer);
        return btoa(buffer);
    };
    return BufferWriter;
}(Iterator));
/** @internal */
var BufferReader = (function (_super) {
    __extends(BufferReader, _super);
    function BufferReader(string) {
        var _this = _super.call(this) || this;
        var binary = atob(string);
        var buffer = new Uint8Array(binary.length);
        for (var i = 0; i < binary.length; i++) {
            buffer[i] = binary.charCodeAt(i);
        }
        _this.buffer = buffer;
        return _this;
    }
    BufferReader.prototype.nextByte = function () {
        var value = this.buffer[this.index];
        this.next();
        return value;
    };
    BufferReader.prototype.nextVarint = function () {
        var value = index.decode(this.buffer, this.index);
        this.next(index.decode.bytes);
        return value;
    };
    return BufferReader;
}(Iterator));

var DECKSTRING_VERSION = 1;
function verifyDbfId(id, name) {
    name = name ? name : "dbf id";
    if (!isPositiveNaturalNumber(id)) {
        throw new Error("Invalid " + name + " " + id + " (expected valid dbf id)");
    }
}
function isPositiveNaturalNumber(n) {
    if (typeof n !== "number" || !isFinite(n)) {
        return false;
    }
    if (Math.floor(n) !== n) {
        return false;
    }
    return n > 0;
}
function trisort_cards(cards) {
    var single = [], double = [], n = [];
    for (var _i = 0, cards_1 = cards; _i < cards_1.length; _i++) {
        var tuple = cards_1[_i];
        var list = void 0;
        var card = tuple[0], count = tuple[1];
        verifyDbfId(card, "card");
        if (count === 0) {
            continue;
        }
        if (count === 1) {
            list = single;
        }
        else if (count === 2) {
            list = double;
        }
        else if (isPositiveNaturalNumber(count)) {
            list = n;
        }
        else {
            throw new Error("Invalid count " + count + " (expected positive natural number)");
        }
        list.push(tuple);
    }
    return [
        single,
        double,
        n,
    ];
}
function encode(deck) {
    if (typeof deck !== "object" ||
        (deck.format !== 1 && deck.format !== 2) ||
        !Array.isArray(deck.heroes) ||
        !Array.isArray(deck.cards)) {
        throw new Error("Invalid deck definition");
    }
    var writer = new BufferWriter();
    var format = deck.format;
    var heroes = deck.heroes;
    var cards = deck.cards;
    writer.null();
    writer.varint(DECKSTRING_VERSION);
    writer.varint(format);
    writer.varint(heroes.length);
    for (var _i = 0, heroes_1 = heroes; _i < heroes_1.length; _i++) {
        var hero = heroes_1[_i];
        verifyDbfId(hero, "hero");
        writer.varint(hero);
    }
    for (var _a = 0, _b = trisort_cards(cards); _a < _b.length; _a++) {
        var list = _b[_a];
        writer.varint(list.length);
        for (var _c = 0, list_1 = list; _c < list_1.length; _c++) {
            var tuple = list_1[_c];
            var card = tuple[0], count = tuple[1];
            writer.varint(card);
            if (count !== 1 && count !== 2) {
                writer.varint(count);
            }
        }
    }
    return writer.toString();
}

function decode(deckstring) {
    var reader = new BufferReader(deckstring);
    if (reader.nextByte() !== 0) {
        throw new Error("Invalid deckstring");
    }
    var version = reader.nextVarint();
    if (version !== DECKSTRING_VERSION) {
        throw new Error("Unsupported deckstring version " + version);
    }
    var format = reader.nextVarint();
    if (format !== 1 && format !== 2) {
        throw new Error("Unsupported format " + format + " in deckstring");
    }
    var heroes = new Array(reader.nextVarint());
    for (var i = 0; i < heroes.length; i++) {
        heroes[i] = reader.nextVarint();
    }
    var cards = [];
    for (var i = 1; i <= 3; i++) {
        for (var j = 0, c = reader.nextVarint(); j < c; j++) {
            cards.push([reader.nextVarint(), (i === 1 || i === 2) ? i : reader.nextVarint()]);
        }
    }
    return {
        cards: cards,
        heroes: heroes,
        format: format,
    };
}
