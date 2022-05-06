

# HDML


<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [HDML](#hdml)
  - [API](#api)
  - [Compact Tagnames](#compact-tagnames)
  - [Notes](#notes)
  - [To Do](#to-do)
  - [Is Done](#is-done)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# HDML

HDML is a very simplistic HTML tag generation library for NodeJS

## API

* **`escape_text: ( text ) ->`**—Escape `text` for use in HTML (by turning all occurrences of `<`, `>`, and
  `&` into `&lt;`, `&gt;`, and `&amp;`, respectively).

* **`escape_atr_text: ( x ) ->`**—apply `escape_text x` and then replace all occurrences of single quotation
  mark and newline characters by `&#39;` and `&#10;`, respectively.

* **`create_tag: ( sigil, tag, atrs = null ) ->`**—Given a `sigil` to mark the role of the tag, a tagname,
  and an optional attributes object, return a HTML tag literal.

* **`create_opening_tag:     ( tag, atrs = null ) ->`**—Create an opening tag like `<div atr='value'>`.

* **`create_selfclosing_tag: ( tag, atrs = null ) ->`**—Create an self-closing tag like `<path
  atr='value'/>` (not used in HTML5 but in SVG).

* **`create_closing_tag: ( tag ) ->`**—Create a closing tag like `</div>`.

## Compact Tagnames

* **`parse_compact_tagname: ( compact_tagname ) ->`**
* **`hdml = new Hdml { use_compact_tags: true, strict_compact_tags: true, }`**

`<div#c432.foo.bar>...</div>` => `<div id=c432 class='foo bar'>...</div>`
`<p.noindent>...</p>` => `<p class=noindent>...</p>`


## Notes

* All tag names will be written as passed-in; this may result in illegal tag names. This may change in the
  future.

* All attributes are always written with single quotes.


## To Do

* **[–]** parse short tags?
* **[–]** return objects not strings?
* **[–]** see simpler interface in webscraper
* **[–]** add `cfg.default_tag` which allows to get e.g. `<div id='c1' class='bar baz'>` from `#c1.bar.baz`
* **[–]** implement recommendations, standard as explained in
  https://mathiasbynens.be/notes/unquoted-attribute-values

## Is Done

* **[+]** validate that attribute values are texts, do not implicitly convert non-text attribute values
* **[+]** validate that tag names are texts, do not implicitly convert non-text values

