
'use strict'


############################################################################################################
CND                       = require 'cnd'
rpr                       = CND.rpr
badge                     = 'HDML'
debug                     = CND.get_logger 'debug',     badge
# warn                      = CND.get_logger 'warn',      badge
# info                      = CND.get_logger 'info',      badge
# urge                      = CND.get_logger 'urge',      badge
# help                      = CND.get_logger 'help',      badge
# whisper                   = CND.get_logger 'whisper',   badge
# echo                      = CND.echo.bind CND
#...........................................................................................................
types                     = new ( require 'intertype' ).Intertype
GUY                       = require 'guy'


#===========================================================================================================
#
#-----------------------------------------------------------------------------------------------------------
types.declare 'constructor_cfg', tests:
  "@isa.object x":                  ( x ) -> @isa.object x
  "@isa.nonempty_text x.open":      ( x ) -> @isa.nonempty_text x.open
  "@isa.nonempty_text x.selfclose": ( x ) -> @isa.nonempty_text x.selfclose
  "@isa.nonempty_text x.close":     ( x ) -> @isa.nonempty_text x.close


#===========================================================================================================
#
#-----------------------------------------------------------------------------------------------------------
class @Hdml

  #---------------------------------------------------------------------------------------------------------
  @C: GUY.lft.freeze
    defaults:
      constructor_cfg:
        open:       '<'
        selfclose:  '^'
        close:      '>'

  #---------------------------------------------------------------------------------------------------------
  constructor: ( cfg ) ->
    clasz = @constructor
    GUY.props.hide @, 'types', types
    @types.validate.constructor_cfg cfg = { clasz.C.defaults.constructor_cfg..., cfg..., }
    @cfg  = GUY.lft.freeze cfg
    return undefined

  #---------------------------------------------------------------------------------------------------------
  escape_text: ( text ) ->
    @types.validate.text text
    R = text
    R = R.replace /&/g,   '&amp;'
    R = R.replace /</g,   '&lt;'
    R = R.replace />/g,   '&gt;'
    return R

  #---------------------------------------------------------------------------------------------------------
  escape_atr_text: ( text ) ->
    R = @escape_text text
    R = R.replace /'/g,   '&#39;'
    R = R.replace /\n/g,  '&#10;'
    return "'#{R}'"

  #---------------------------------------------------------------------------------------------------------
  create_tag: ( sigil, tag, atrs = null ) ->
    @types.validate.text tag
    return switch sigil
      when @cfg.open      then @_create_opening_or_selfclosing_tag false, tag, atrs
      when @cfg.selfclose then @_create_opening_or_selfclosing_tag true,  tag, atrs
      when @cfg.close     then @create_closing_tag tag
    throw new Error "^45487^ illegal sigil #{rpr sigil}"

  #---------------------------------------------------------------------------------------------------------
  create_opening_tag:     ( tag, atrs = null ) -> @_create_opening_or_selfclosing_tag false, tag, atrs
  create_selfclosing_tag: ( tag, atrs = null ) -> @_create_opening_or_selfclosing_tag true,  tag, atrs

  #---------------------------------------------------------------------------------------------------------
  _create_opening_or_selfclosing_tag: ( is_selfclosing, tag, atrs = null ) ->
    ### TAINT validate or escape tag, atr keys ###
    s = if is_selfclosing then '/' else ''
    return "<#{tag}#{s}>" if ( not atrs? ) or ( ( Object.keys atrs ).length is 0 )
    atrs_txt = ( "#{k}=#{@escape_atr_text v}" for k, v of atrs ).join ' '
    return "<#{tag} #{atrs_txt}#{s}>"

  #---------------------------------------------------------------------------------------------------------
  ### TAINT validate or escape tag ###
  create_closing_tag: ( tag ) -> "</#{tag}>"


### NOTE default instance: ###
@HDML = new @Hdml()



