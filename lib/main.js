(function() {
  'use strict';
  var CND, GUY, badge, debug, rpr, types;

  //###########################################################################################################
  CND = require('cnd');

  rpr = CND.rpr;

  badge = 'HDML';

  debug = CND.get_logger('debug', badge);

  // warn                      = CND.get_logger 'warn',      badge
  // info                      = CND.get_logger 'info',      badge
  // urge                      = CND.get_logger 'urge',      badge
  // help                      = CND.get_logger 'help',      badge
  // whisper                   = CND.get_logger 'whisper',   badge
  // echo                      = CND.echo.bind CND
  //...........................................................................................................
  types = new (require('intertype')).Intertype();

  GUY = require('guy');

  //===========================================================================================================

  //-----------------------------------------------------------------------------------------------------------
  types.declare('constructor_cfg', {
    tests: {
      "@isa.object x": function(x) {
        return this.isa.object(x);
      },
      "@isa.nonempty_text x.open": function(x) {
        return this.isa.nonempty_text(x.open);
      },
      "@isa.nonempty_text x.selfclose": function(x) {
        return this.isa.nonempty_text(x.selfclose);
      },
      "@isa.nonempty_text x.close": function(x) {
        return this.isa.nonempty_text(x.close);
      },
      "@isa.boolean x.use_compact_tags": function(x) {
        return this.isa.boolean(x.use_compact_tags);
      },
      "@isa.boolean x.strict_compact_tags": function(x) {
        return this.isa.boolean(x.strict_compact_tags);
      }
    }
  });

  //===========================================================================================================

  //-----------------------------------------------------------------------------------------------------------
  this.Hdml = (function() {
    var compact_tagname_re;

    class Hdml {
      //---------------------------------------------------------------------------------------------------------
      constructor(cfg) {
        var clasz;
        clasz = this.constructor;
        GUY.props.hide(this, 'types', types);
        this.types.validate.constructor_cfg(cfg = {...clasz.C.defaults.constructor_cfg, ...cfg});
        this.cfg = GUY.lft.freeze(cfg);
        return void 0;
      }

      //---------------------------------------------------------------------------------------------------------
      escape_text(text) {
        var R;
        this.types.validate.text(text);
        R = text;
        R = R.replace(/&/g, '&amp;');
        R = R.replace(/</g, '&lt;');
        R = R.replace(/>/g, '&gt;');
        return R;
      }

      //---------------------------------------------------------------------------------------------------------
      escape_atr_text(text) {
        var R;
        R = this.escape_text(text);
        R = R.replace(/'/g, '&#39;');
        R = R.replace(/\n/g, '&#10;');
        return `'${R}'`;
      }

      //---------------------------------------------------------------------------------------------------------
      create_tag(sigil, tag, atrs = null) {
        this.types.validate.text(tag);
        switch (sigil) {
          case this.cfg.open:
            return this._create_opening_or_selfclosing_tag(false, tag, atrs);
          case this.cfg.selfclose:
            return this._create_opening_or_selfclosing_tag(true, tag, atrs);
          case this.cfg.close:
            return this.create_closing_tag(tag);
        }
        throw new Error(`^45487^ illegal sigil ${rpr(sigil)}`);
      }

      //---------------------------------------------------------------------------------------------------------
      create_opening_tag(tag, atrs = null) {
        return this._create_opening_or_selfclosing_tag(false, tag, atrs);
      }

      create_selfclosing_tag(tag, atrs = null) {
        return this._create_opening_or_selfclosing_tag(true, tag, atrs);
      }

      //---------------------------------------------------------------------------------------------------------
      _create_opening_or_selfclosing_tag(is_selfclosing, tag, atrs = null) {
        return (this._create_opening_or_selfclosing_tag_extra(is_selfclosing, tag, atrs)).html;
      }

      //---------------------------------------------------------------------------------------------------------
      _create_opening_or_selfclosing_tag_extra(is_selfclosing, tag, atrs = null) {
        /* TAINT validate or escape tag, atr keys */
        var atrs_txt, d, html, k, s, tag_, v;
        s = is_selfclosing ? '/' : '';
        tag_ = tag;
        if (this.cfg.use_compact_tags && /[:\.#]/.test(tag)) {
          d = this.parse_compact_tagname(tag);
          if (d.prefix != null) {
            tag = `${d.prefix}:${d.tag}`;
          } else {
            tag = d.tag;
          }
          if (d.id != null) {
            if ((atrs != null ? atrs.id : void 0) != null) {
              throw new Error(`^HDML@1^ cannot give two values for ID, got ${d.id}, ${atrs.id}`);
            }
            if (atrs == null) {
              atrs = {};
            }
            atrs.id = d.id;
          }
          if (d.class != null) {
            if (atrs == null) {
              atrs = {};
            }
            atrs.class = this._join_classes(atrs.class, d.class);
          }
        }
        /* TAINT code duplication */
        if ((tag == null) || (tag === '')) {
          throw new Error(`^HDML@2^ illegal compact tag syntax in ${rpr(tag_)}`);
        }
        //.......................................................................................................
        if ((atrs == null) || ((Object.keys(atrs)).length === 0)) {
          html = `<${tag}${s}>`;
        } else {
          atrs_txt = ((function() {
            var results;
            results = [];
            for (k in atrs) {
              v = atrs[k];
              results.push(`${k}=${this.escape_atr_text(v)}`);
            }
            return results;
          }).call(this)).join(' ');
          html = `<${tag} ${atrs_txt}${s}>`;
        }
        //.......................................................................................................
        return {tag, html};
      }

      //---------------------------------------------------------------------------------------------------------
      /* TAINT validate or escape tag */
      /* TAINT should be legal to pass in a compact tag */
      create_closing_tag(tag) {
        return `</${tag}>`;
      }

      //---------------------------------------------------------------------------------------------------------
      _join_classes(atrs_class, d_class) {
        var type;
        if (atrs_class == null) {
          atrs_class = [];
        }
        switch ((type = this.types.type_of(atrs_class))) {
          case 'text':
            atrs_class = atrs_class.split(/\s/);
            break;
          case 'list':
            null;
        }
        return [...(new Set([atrs_class, d_class].flat()))].join(' ');
      }

      //---------------------------------------------------------------------------------------------------------
      parse_compact_tagname(compact_tagname) {
        /* TAINT name -> tag */
        var R, groups, k, ref, target, v, y;
        R = {};
        ref = compact_tagname.matchAll(compact_tagname_re);
        for (y of ref) {
          ({groups} = y);
          for (k in groups) {
            v = groups[k];
            if ((v == null) || (v === '')) {
              continue;
            }
            if (k === 'class') {
              (R.class != null ? R.class : R.class = []).push(v);
            } else {
              if ((target = R[k]) != null) {
                throw new Error(`^HDML@3^ found duplicate values for ${rpr(k)}: ${rpr(target)}, ${rpr(v)}`);
              }
              R[k] = v;
            }
          }
        }
        if (this.cfg.strict_compact_tags) {
          if ((R.tag == null) || (R.tag === '')) {
            throw new Error(`^HDML@4^ illegal compact tag syntax in ${rpr(compact_tagname)}`);
          }
        }
        return R;
      }

      //=========================================================================================================
      // V2 API
      //---------------------------------------------------------------------------------------------------------
      open(tag, atrs) {
        return this._create_opening_or_selfclosing_tag(false, tag, atrs);
      }

      close(tag) {
        return this.create_closing_tag(tag);
      }

      single(tag, atrs) {
        return this._create_opening_or_selfclosing_tag(true, tag, atrs);
      }

      text(text) {
        return this.escape_text(text);
      }

      //---------------------------------------------------------------------------------------------------------
      pair(tag, atrs = {}, content = '') {
        var arity, open_html, type;
        switch (arity = arguments.length) {
          case 1:
            null;
            break;
          case 2:
            switch ((type = types.type_of(atrs))) {
              case 'null':
                null;
                break;
              case 'text':
                [tag, atrs, content] = [tag, null, atrs];
                break;
              case 'object':
                null;
                break;
              default:
                throw new Error(`^hdml2@1^ expected null, a text or an object, got ${type}`);
            }
            break;
          case 3:
            null;
            break;
          default:
            throw new Error(`^hdml2@1^ expected 2 or 3 arguments, got ${arity}`);
        }
        ({
          // types.validate.nonempty_text tag
          // types.validate.text content
          tag,
          html: open_html
        } = this._create_opening_or_selfclosing_tag_extra(false, tag, atrs));
        return open_html + content + (this.close(tag));
      }

    };

    //---------------------------------------------------------------------------------------------------------
    Hdml.C = GUY.lft.freeze({
      //.......................................................................................................
      defaults: {
        constructor_cfg: {
          open: '<',
          selfclose: '^',
          close: '>',
          use_compact_tags: true,
          strict_compact_tags: true
        }
      }
    //.......................................................................................................
    }, compact_tagname_re = /(?<prefix>[^\s.:#]+(?=:))|(?<id>(?<=#)[^\s.:#]+)|(?<class>(?<=\.)[^\s.:#]+)|(?<tag>[^\s.:#]+)/ug);

    return Hdml;

  }).call(this);

  /* NOTE default instance: */
  this.HDML = new this.Hdml();

}).call(this);

//# sourceMappingURL=main.js.map