# Game widget assets and activity

GTA VI cover artwork: [Rockstar Games, Official Cover Art](https://www.rockstargames.com/VI/media/artwork-wallpapers).
Downloaded 19 November 2026 and resized to 1024px wide for the portfolio card.

The compact slideshow uses Rockstar's [Jason and Lucia 01 artwork](https://www.rockstargames.com/VI/media/artwork-wallpapers)
in `game-gta-vi-palms.jpg`, without embedded lettering, to retain the sunset and palms.
GTA VI holds for 16 seconds; other games hold for 4 seconds each. Hover, keyboard
focus, offscreen state, and reduced-motion preference pause the slideshow.

Activity is manually reported, not connected to PSN. In `about.html`, update a game's
`time[data-game-last-played]` datetime only when a new play session is reported.
Use an ISO 8601 timestamp with a timezone. Total play hours are also manually recorded.
The GTA VI entry records the user's 19 November 2026 update. Its new-player label
changes to “Started … ago” after the first day.

Older dates are estimates reconstructed from the original 27 January 2026 commit's
relative labels (2 days, 1 week, 3 days, 5 days, and 4 weeks ago). They are not newly
verified play sessions. The widget recalculates elapsed time on load, every 30 seconds
while visible, and when the page returns to the foreground.
