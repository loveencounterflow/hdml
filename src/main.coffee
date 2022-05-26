
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
  "@isa.object x":                            ( x ) -> @isa.object x
  "@isa.nonempty_text x.open":                ( x ) -> @isa.nonempty_text x.open
  "@isa.nonempty_text x.selfclose":           ( x ) -> @isa.nonempty_text x.selfclose
  "@isa.nonempty_text x.close":               ( x ) -> @isa.nonempty_text x.close
  "@isa.boolean x.use_compact_tags":          ( x ) -> @isa.boolean x.use_compact_tags
  "@isa.boolean x.strict_compact_tags":       ( x ) -> @isa.boolean x.strict_compact_tags



#===========================================================================================================
#
#-----------------------------------------------------------------------------------------------------------
class @Hdml

  #---------------------------------------------------------------------------------------------------------
  @C: GUY.lft.freeze
    #.......................................................................................................
    defaults:
      constructor_cfg:
        open:                 '<'
        selfclose:            '^'
        close:                '>'
        use_compact_tags:     true
        strict_compact_tags:  true
    #.......................................................................................................
    compact_tagname_re        = ///
      (?<prefix>[^\s.:#]+(?=:)) |
      (?<id>(?<=#)[^\s.:#]+) |
      (?<class>(?<=\.)[^\s.:#]+) |
      (?<tag>[^\s.:#]+)
      ///ug

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
    return ( @_create_opening_or_selfclosing_tag_extra is_selfclosing, tag, atrs ).html

  #---------------------------------------------------------------------------------------------------------
  _create_opening_or_selfclosing_tag_extra: ( is_selfclosing, tag, atrs = null ) ->
    ### TAINT validate or escape tag, atr keys ###
    s     = if is_selfclosing then '/' else ''
    tag_  = tag
    if @cfg.use_compact_tags and /[:\.#]/.test tag
      d   = @parse_compact_tagname tag
      if d.prefix? then tag = "#{d.prefix}:#{d.tag}"
      else              tag = d.tag
      if d.id?
        throw new Error "^HDML@1^ cannot give two values for ID, got #{d.id}, #{atrs.id}" if atrs?.id?
        atrs       ?= {}
        atrs.id     = d.id
      if d.class?
        atrs       ?= {}
        atrs.class  = @_join_classes atrs.class, d.class
    ### TAINT code duplication ###
    if ( not tag? ) or ( tag is '' )
      throw new Error "^HDML@2^ illegal compact tag syntax in #{rpr tag_}"
    #.......................................................................................................
    if ( not atrs? ) or ( ( Object.keys atrs ).length is 0 )
      html      = "<#{tag}#{s}>"
    else
      atrs_txt  = []
      for k, v of atrs
        if v in [ false, null, undefined, ] then continue
        if v in [ true, '', ]               then atrs_txt.push k; continue
        atrs_txt.push "#{k}=#{@escape_atr_text v}"
      atrs_txt  = atrs_txt.join ' '
      if atrs_txt is ''
        html  = "<#{tag}#{s}>"
      else
        html  = "<#{tag} #{atrs_txt}#{s}>"
    #.......................................................................................................
    return { tag, html, }

  #---------------------------------------------------------------------------------------------------------
  ### TAINT validate or escape tag ###
  ### TAINT should be legal to pass in a compact tag ###
  create_closing_tag: ( tag ) -> "</#{tag}>"

  #---------------------------------------------------------------------------------------------------------
  _join_classes: ( atrs_class, d_class ) ->
    atrs_class ?= []
    switch ( type = @types.type_of atrs_class )
      when 'text' then atrs_class = atrs_class.split /\s/
      when 'list' then null
    return [ ( new Set [ atrs_class, d_class, ].flat() )... ].join ' '

  #---------------------------------------------------------------------------------------------------------
  parse_compact_tagname: ( compact_tagname ) ->
    ### TAINT name -> tag ###
    R = {}
    for { groups, } from compact_tagname.matchAll compact_tagname_re
      for k, v of groups
        continue if ( not v? ) or ( v is '' )
        if k is 'class'
          ( R.class ?= [] ).push v
        else
          if ( target = R[ k ] )?
            throw new Error "^HDML@3^ found duplicate values for #{rpr k}: #{rpr target}, #{rpr v}"
          R[ k ] = v
    if @cfg.strict_compact_tags
      if ( not R.tag? ) or ( R.tag is '' )
        throw new Error "^HDML@4^ illegal compact tag syntax in #{rpr compact_tagname}"
    return R


  #=========================================================================================================
  # V2 API
  #---------------------------------------------------------------------------------------------------------
  open:     ( tag, atrs           ) -> @_create_opening_or_selfclosing_tag false, tag, atrs
  close:    ( tag                 ) -> @create_closing_tag tag
  single:   ( tag, atrs           ) -> @_create_opening_or_selfclosing_tag true,  tag, atrs
  text:     ( text                ) -> @escape_text text

  #---------------------------------------------------------------------------------------------------------
  pair:     ( tag, atrs = {}, content = '' ) ->
    switch arity = arguments.length
      when 1 then null
      when 2
        switch ( type = types.type_of atrs )
          when 'null'   then null
          when 'text'   then [ tag, atrs, content, ] = [ tag, null, atrs, ]
          when 'object' then null
          else throw new Error "^hdml2@1^ expected null, a text or an object, got #{type}"
      when 3 then null
      else throw new Error "^hdml2@1^ expected 2 or 3 arguments, got #{arity}"
    # types.validate.nonempty_text tag
    # types.validate.text content
    { tag, html: open_html, } = @_create_opening_or_selfclosing_tag_extra false, tag, atrs
    return open_html + content + ( @close tag )

### NOTE default instance: ###
@HDML = new @Hdml()



