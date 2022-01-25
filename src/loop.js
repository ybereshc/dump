let loop = ( v, l, h ) => ( v = v % ( h - l ) ) + ( v < 0 ? ( v ? h : 0 ) : l );

module.exports = loop;
