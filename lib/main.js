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
      }
    }
  });

  //===========================================================================================================

  //-----------------------------------------------------------------------------------------------------------
  this.Hdml = (function() {
    class Hdml {
      //-----------------------------------------------------------------------------------------------------------
      constructor(cfg) {
        var clasz;
        clasz = this.constructor;
        GUY.props.hide(this, 'types', types);
        this.types.validate.constructor_cfg(cfg = {...clasz.C.defaults.constructor_cfg, ...cfg});
        this.cfg = GUY.lft.freeze(cfg);
        return void 0;
      }

      //-----------------------------------------------------------------------------------------------------------
      escape_text(text) {
        this.types.validate.text(text);
        return this._escape_text(text);
      }

      //-----------------------------------------------------------------------------------------------------------
      _escape_text(text) {
        var R;
        R = text;
        R = R.replace(/&/g, '&amp;');
        R = R.replace(/</g, '&lt;');
        R = R.replace(/>/g, '&gt;');
        return R;
      }

      //-----------------------------------------------------------------------------------------------------------
      escape_atr_text(x) {
        var R;
        this.types.validate.text(x);
        R = x;
        R = this.escape_text(R);
        R = R.replace(/'/g, '&#39;');
        R = R.replace(/\n/g, '&#10;');
        return `'${R}'`;
      }

      //-----------------------------------------------------------------------------------------------------------
      create_tag(sigil, tag, atrs = null) {
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

      //-----------------------------------------------------------------------------------------------------------
      create_opening_tag(tag, atrs = null) {
        return this._create_opening_or_selfclosing_tag(false, tag, atrs);
      }

      create_selfclosing_tag(tag, atrs = null) {
        return this._create_opening_or_selfclosing_tag(true, tag, atrs);
      }

      //-----------------------------------------------------------------------------------------------------------
      _create_opening_or_selfclosing_tag(is_selfclosing, tag, atrs = null) {
        /* TAINT validate or escape tag, atr keys */
        var atrs_txt, k, s, v;
        s = is_selfclosing ? '/' : '';
        if ((atrs == null) || ((Object.keys(atrs)).length === 0)) {
          return `<${tag}${s}>`;
        }
        atrs_txt = ((function() {
          var results;
          results = [];
          for (k in atrs) {
            v = atrs[k];
            results.push(`${k}=${this.escape_atr_text(v)}`);
          }
          return results;
        }).call(this)).join(' ');
        return `<${tag} ${atrs_txt}${s}>`;
      }

      //-----------------------------------------------------------------------------------------------------------
      /* TAINT validate or escape tag */
      create_closing_tag(tag) {
        return `</${tag}>`;
      }

    };

    //-----------------------------------------------------------------------------------------------------------
    Hdml.C = GUY.lft.freeze({
      defaults: {
        constructor_cfg: {
          open: '<',
          selfclose: '^',
          close: '>'
        }
      }
    });

    return Hdml;

  }).call(this);

  /* NOTE default instance: */
  this.HDML = new this.Hdml();

}).call(this);

//# sourceMappingURL=main.js.map