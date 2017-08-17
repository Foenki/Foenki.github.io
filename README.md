# Hearthstone Acrostics

A tool to generate Hearthstone decks based on acrostics.

Just enter a word and run the acrostics finder, the algorithm generates all possible decks to match your acrostic.

Example : KRIPPARIAN

<p align="center">
  <img src="https://i.imgur.com/eE3HBxe.png">
</p>

## Results

The results are ordered by class. By default some random ones are selected but you can sort the results by :

- Low dust cost : for poor people out there
- High dust cost : for wallet players
- Max mana diff : a bit more complicated but probably the most useful. This sorts decks by max mana difference between first and last card, so that you can more easily build a deck that contains this acrostic

You can also re-roll the results to get another set of randomly selected decks.

<aside class="success">
  New with 2.0 : deckstring support. Directly copy the deckstring of your deck to your clipboard with the button next to it. 
</aside>

<aside class="warning">
  If the deck does not contain 30 cards it cannot be imported into Hearthstone.
</aside>

## Filters

You can add filters to your research : 

- Class filter : enable or disable certain classes to accelerate generation
- Standard / Wild toggle : choose your game mode

The default language for the cards name is English, but a few others languages are available.
