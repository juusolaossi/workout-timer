# Toe Hook brand guide (for the timer app)

The full brand book lives in the Toe Hook design system on Claude. This file is the part the app needs.

## The brand

Toe Hook is a climbing and outdoors brand: modern, accessible, non-invasive, nature and sustainability driven. It started because every timer app on the store had poor design, broken behaviour, ads everywhere or pushy subscriptions. Toe Hook is the opposite of that.

- **Tagline:** Hang on.
- **Promise in every product:** no clutter, no ads in the way, no pushy subscriptions.
- **Portfolio:** Toe Hook is the parent brand; this timer is its first product (Toe Hook Timer). Products are named "Toe Hook" plus a plain descriptor.

## Voice

Like a good belay partner: short, calm, encouraging, never shouty.

- Plain verbs on buttons: Start, Stop, Done.
- Climbing words only where they fit naturally (send, hang, chalk up). A beginner at a commercial gym must understand every label.
- No exclamation marks stacked, no hype words, no emoji in the product.
- Numbers as the screen shows them: 10 sets, 0:45, Set 4 of 10.

### Microcopy in the app

| Moment | Text |
| --- | --- |
| App title | Toe Hook |
| Countdown label | Chalk up |
| Countdown helper | First set in 3 |
| Work / Rest labels | Work / Rest |
| Paused | Paused, with "Tap to resume" below |
| Finished | Sent, with "10 sets done" below |
| Finish button | Done |

## Colour

Tokens are defined in `src/index.css` (light and dark) and used as Tailwind colours.

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `chalk` | #f3f4f1 | #121517 | Page background |
| `chalk-raised` | #ffffff | #1b1f22 | Cards on chalk |
| `line` | #d9ddd8 | #2c3236 | Hairlines, card outlines, off switches |
| `granite` | #15191c | #eef1ed | Main text |
| `granite-muted` | #586067 | #a1a9ae | Secondary text |
| `send` | #22c55e | #3ddc84 | Brand green; work phase; Start button |
| `send-ink` | #137a3c | #5ee39a | Green as text on chalk |
| `rest` | #f5a524 | #ffb84d | Rest phase |
| `rest-ink` | #9a5b00 | #ffc46b | Amber as text on chalk |
| `ready` | #4f8cff | #6ea0ff | Get ready countdown |
| `pause` | #a9b0b5 | #4b5358 | Paused screen |
| `stop` | #d7383d | #f0575c | Stop button only, never a phase |

Each fill has an `on-` colour for text, digits and rings on top of it (`on-send`, `on-rest`, `on-ready`, `on-pause`, `on-stop`). On a phase screen everything (digits, ring, ring track, labels, set dots) uses that phase's `on-` colour; faint parts are the same colour at 22–25% opacity.

### Phase screens

| Phase | Fill | Label |
| --- | --- | --- |
| Countdown | `ready` | Chalk up |
| Work | `send` | Work |
| Rest | `rest` | Rest |
| Paused | `pause` | Paused |
| Finished | `send` | Sent |

Phase screens are flat fills: no gradients, no shadows. Colour is never the only signal: the label always names the phase.

## Type

- **Bebas Neue** (display): timer digits, phase labels, set count, titles, button labels. Tabular figures for anything that counts.
- **Inter** (text): anything read as a sentence: helper lines, settings copy, totals.
- Never a sentence in Bebas Neue; never the timer in Inter.

## Shape

- Rings are the signature: the progress ring starts at 12 o'clock and fills clockwise, thick stroke, round caps, a faint track in the same colour.
- Rounded corners: 24px for setting cards and Start, 16px for Stop and Done, 8px for preset chips.
- Shadows only on setting cards and the Start button.

## Set progress (SetDots)

One dot per set under "Set X of Y". Done sets are solid, upcoming sets faint, the current set larger with a soft radiating pulse during work. During rest the finished set counts as done and the next dot is larger but faint. Nothing pulses while paused. Above 15 sets it becomes one segment per set; above 30 a single bar.

## Logo

The current mark, wordmark and app icon are **placeholders**. The real logo will be designed by a human designer. Don't build anything that depends on the current logo's shape, and don't add it to new places without asking.
