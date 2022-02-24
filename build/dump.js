/**
 * @author Yurii Bereshchneko <ybereshc@gmail.com>
 * @company flat.show
 * @since 4.0
 */

;( () => {
	let gsa = ( key ) => document.currentScript.getAttribute( key );
	let root = eval( gsa( 'init-root' ) ) || window;
	let name = eval( gsa( 'init-name' ) ) || 'Dump';



	let Dump = {};

	let isArray = ( arg ) => Array.isArray( arg );
	let isUndefined = ( arg ) => arg === undefined;
	let isNull = ( arg ) => arg === null;
	let isSet = ( arg ) => arg !== null && arg !== undefined;
	let isString = ( arg ) => typeof arg === 'string';
	let isInfinity = ( arg ) => arg === Infinity ? 1 : arg === -Infinity ? -1 : 0;
	let isNumber = ( arg ) => typeof arg === 'number' && isFinite( arg );
	let isNumeric = ( arg ) => /^[-+]?\d+(\.\d+)?$/.test( arg );
	let isInt = ( arg ) => isNumber( arg ) && arg % 1 === 0;
	let isFloat = ( arg ) => isNumber( arg ) && arg % 1 !== 0;
	let isBoolean = ( arg ) => arg === true || arg === false;
	let isObject = ( arg ) => typeof arg === 'object' && !isNull( arg );
	let isFunction = ( arg ) => typeof arg === 'function';
	let isNode = ( arg ) => arg instanceof Node;
	let isElement = ( arg ) => arg instanceof Element;

	let clamp = ( v, l, h ) => v < l ? l : ( v > h ? h : v );
	let map = ( v, l1, h1, l2, h2 ) => ( v - l1 ) * ( h2 - l2 ) / ( h1 - l1 ) + l2;
	let loop = ( v, l, h ) => ( v = v % ( h - l ) ) + ( v < 0 ? ( v ? h : 0 ) : l );
	let delay = ( ms ) => new Promise( resolve => setTimeout( resolve, ms ) );

	function createFormData( data ) {
		let formData = data;

		if ( data && !( data instanceof FormData ) ) {
			if ( data instanceof HTMLFormElement ) {
				formData = new FormData( data );
			} else {
				formData = new FormData();

				;( function parse( data, i ) {
					for ( let key in data ) {
						let k = i ? `${i}[${key}]` : key;
						let d = data[key];

						if ( d instanceof File ) {
							formData.append( k, d, d.name );
						} else if ( !isObject( d ) ) {
							formData.append( k, d );
						} else {
							parse( d, i ? k : key );
						}
					}
				} )( data );
			}
		}

		return formData;
	}

	/* Object */
	let _Array = {
		forEach( target, func, thisArg = target ) {
			let i = 0;

			for ( let val of target ) {
				func.call( thisArg, val, i++, target );
			}
		},

		find( target, func, thisArg = target ) {
			let i = 0;

			for ( let val of target ) {
				if ( func.call( thisArg, val, i++, target ) ) {
					return val;
				}
			}
		},

		filter( target, func, thisArg = target ) {
			let res = [];

			let i = 0;
			for ( let val of target ) {
				if ( func.call( thisArg, val, i++, target ) ) {
					res.push( val );
				}
			}

			return res;
		},

		map( target, func, thisArg = target ) {
			let res = [];
			let i = 0;

			for ( let val of target ) {
				res.push( func.call( thisArg, val, i++, target ) );
			}

			return res;
		},

		toObject( target, func, thisArg = target ) {
			let res = [];
			let i = 0;

			for ( let val of target ) {
				res[ func.call( thisArg, val, i++, target ) ] = val;
			}

			return res;
		},

		includes( target, data ) {
			for ( let val of target ) {
				if ( val === data ) {
					return true;
				}
			}

			return false;
		},
	};

	/* Object */
	let _Object = {
		defineProperty( target, key, value, writable = true, enumerable = 'auto' ) {
			if ( enumerable === 'auto' ) {
				enumerable = !isFunction( value );
			}

			target[ key ] = value;

			Object.defineProperty( target, key, { enumerable, writable } );
			return target;
		},

		defineReadonly( target, key, value, enumerable ) {
			ObjectMethods.defineProperty( target, key, value, false, enumerable );
			return target;
		},

		defineClosure( target, key, get, set, enumerable = true ) {
			if ( !isFunction( get ) || ( set && !isFunction( set ) ) ) {
				throw "not a function";
			}

			Object.defineProperty( target, key, { get, set, enumerable } );
			return target;
		},

		merge( target, ...objects ) {
			objects.forEach( object => {
				Object.keys( object ).forEach( key => {
					if ( isObject( target[ key ] ) && isObject( object[ key ] ) ) {
						_Object.merge( target[ key ], object[ key ] );
					} else {
						target[ key ] = object[ key ];
					}
				} );
			} );

			return target;
			
		},

		copy( target ) {
			let res = target;

			if ( isArray( target ) ) {
				res = [];
				target.forEach( ( val, i ) => res[ i ] = _Object.copy( val ) );
			} else if ( isObject( target ) ) {
				res = {};
				Object.keys( target ).forEach( key => res[ key ] = _Object.copy( target[ key ] ) );
			}

			return res;
		},
	};

	function setExtends( targetClass, proto, name = targetClass.name ) {
		if ( proto ) {
			targetClass.prototype = Object.create( proto.prototype );
		}

		Object.defineProperties( targetClass.prototype, {
			constructor: { value: targetClass },
			[Symbol.toStringTag]: { value: name },
		} );

		return targetClass;
	}

	/* Element */
	let tagRegExp = /^\s*</;
	let childTagRegExp = /^\s*<(\w+)/;

	let _Element = {
		appendElement( el, child ) {
			if ( !isObject( el ) ) {
				if ( tagRegExp.test( el ) ) {
					el = _Element.appendHTML.call( this, el, child );
				} else {
					el = document.createElementNS( this.namespaceURI, isString( el ) ? el : 'div' );
				}
			}

			child ? this.insertBefore( el, child ) : this.appendChild( el );

			return el;
		},

		appendHTML( html, child ) {
			let el = document.createElementNS( this.namespaceURI, this.localName );

			el.insertAdjacentHTML( 'beforeend', html );
			el = el.querySelector( html.match( childTagRegExp )[ 1 ].toLowerCase() );

			child ? this.insertBefore( el, child ) : this.appendChild( el );
			return el;
		},

		appendText( text, child ) {
			return _Element.appendElement.call( this, document.createTextNode( text ), child );
		},

		insertElement( el, child ) {
			_Element.appendElement.call( this, ...arguments );
			return this;
		},

		insertHTML( html, child ) {
			_Element.appendHTML.call( this, ...arguments );
			return this;
		},

		insertText( text, child ) {
			_Element.appendText.call( this, ...arguments );
			return this;
		},



		css( ...clasesName ) {
			clasesName = clasesName.join( ' ' );

			if ( this instanceof SVGElement ) {
				this.className.baseVal = clasesName;
			} else {
				this.className = clasesName;
			}

			return this;
		},

		acss( ...clasesName ) {
			clasesName.forEach( cn => this.classList.add( cn ) );
			return this;
		},

		rcss( ...clasesName ) {
			clasesName.forEach( cn => this.classList.remove( cn ) );
			return this;
		},

		tcss( ...clasesName ) {
			clasesName.forEach( cn => this.classList.toggle( cn ) );
			return this;
		},

		hcss( ...clasesName ) {
			let i = 0;
			clasesName.forEach( cn => this.classList.contains( cn ) && i++ );
			return i;
		},

		attr( attrs ) {
			if ( isArray( attrs ) ) {
				attrs.forEach( attr => _Element.sattr.call( this, attr[0], attr[1] ) );
			} else {
				Object.keys( attrs ).forEach( k => _Element.sattr.call( this, k, attrs[ k ] ) );
			}

			return this;
		},

		sattr( attr, value = '' ) {
			this.setAttribute( attr, value );
			return this;
		},

		gattr( attr ) {
			return this.getAttribute( attr );
		},

		rattr( ...attrs ) {
			attrs.forEach( attr => this.removeAttribute( attr ) );
			return this;
		},

		hattr( attr, value )  {
			return this.hasAttribute( attr ) && ( !isUndefined( value ) ? this.getAttribute( attr ) === value : true );
		},



		snatch() {
			this.remove();
			return this;
		},

		setDisabled( n = 1 ) {
			if ( isUndefined( this.__setDisabled__count ) ) {
				_Object.defineProperty( this, '__setDisabled__count', 0, true, false );
			}

			this.disabled = this.__setDisabled__count += n;

			return () => {
				if ( !n ) {
					return n;
				}

				this.disabled = --this.__setDisabled__count;
				return --n;
			};
		},
	};



	/* EventDispatcher */
	class EventDispatcher {
		static create( name, events = [] ) {
			return setExtends( class ExtendedEventDispatcher extends EventDispatcher {
				constructor() {
					super();

					events.forEach( e => {
						let callback = null;

						Object.defineProperty( this, `on${e}`, {
							enumerable: true,
							get: () => callback,
							set: ( cb ) => {
								if ( isFunction( callback ) ) {
									this.removeEventListener( e, callback );
								}

								if ( isFunction( cb ) ) {
									callback = cb.bind( this );
									this.addEventListener( e, callback );
								} else {
									callback = null;
								}
							},
						} );
					} );
				}
			}, EventDispatcher, name + 'EventDispatcher' );
		}

		constructor() {
			Object.defineProperty( this, '_listeners', { enumerated: false, writable: true } );
			this._listeners = {};
		}

		dispatchEvent( events, props = {} ) {
			isArray( events ) || ( events = [ events ] );

			events.forEach( e => {
				isObject( e ) || ( e = { type: e, target: this } );
				Object.assign( e, props );
				isArray( this._listeners[ e.type ] ) || ( this._listeners[ e.type ] = [] );
				let listeners = this._listeners[ e.type ];

				listeners._lastEvent = e;

				for ( let j = 0; j < listeners.length; j++ ) {
					listeners[ j ][ 0 ].call( this, e );
					listeners[ j ][ 1 ] && listeners.splice( j--, 1 );
				}
			} );
		}

		addEventListener( events, callbacks, options = false ) {
			isArray( events ) || ( events = [ events ] );
			isArray( callbacks ) || ( callbacks = [ callbacks ] );

			let _options = { lastEvent: true };
			isObject( options ) ? Object.assign( _options, options ) : ( _options.once = options );

			events.forEach( e => {
				isArray( this._listeners[ e ] ) || ( this._listeners[ e ] = [] );
				let listeners = this._listeners[ e ];

				callbacks.forEach( cb => {
					if ( _options.lastEvent && listeners._lastEvent ) {
						cb.call( this, listeners._lastEvent );

						if ( _options.once ) {
							return;
						}
					}

					listeners.push( [ cb, _options.once ] );
				} );
			} );
		}

		removeEventListener( events, callbacks ) {
			isArray( events ) || ( events = [ events ] );
			isArray( callbacks ) || ( callbacks = [ callbacks ] );

			events.forEach( e => {
				isArray( this._listeners[e] ) || ( this._listeners[e] = [] );
				let listeners = this._listeners[e];

				for ( let i = 0; i < callbacks.length; i++ ) {
					for ( let j = 0; j < listeners.length; j++ ) {
						callbacks[i] === listeners[j][0] && listeners.splice( j--, 1 );
					}
				}
			} );
		}
	}

	setExtends( EventDispatcher );


	class FileDrop extends EventDispatcher.create( 'FileDrop', [ 'drop' ] ) {
		static readDir( entry, path = '' ) {
			return new Promise( resolve => {
				let res = [];

				function readEntries( reader ) {
					reader.readEntries( async entries => {
						if ( !entries.length ) {
							return resolve( res );
						}

						for ( let i = 0, len = entries.length; i < len; i++ ) {
							let entry = entries[ i ];

							if ( entry.isFile ) {
								res.push( await new Promise( resolve => {
									entry.file( file => {
										Object.defineProperty( file, 'path', { value: `${path}/${file.name}`, enumerable: true } );
										resolve( file );
									});
								} ) );
							} else if ( entry.isDirectory ) {
								res.push( ...await FileDrop.readDir( entry, `${path}/${entry.name}` ) );
							}
						}

						readEntries( reader );
					} );
				}

				readEntries( entry.createReader() );
			} );
		}

		constructor( domElement, className = 'drag' ) {
			super();

			if ( className ) {
				className += '-hover';
			}

			let drop = async ( e ) => {
				e.preventDefault();

				let files = [];

				for ( let item of e.dataTransfer.items ) {
					let entry;

					if ( item.webkitGetAsEntry != null && ( entry = item.webkitGetAsEntry() ) ) {
						if ( entry.isFile ) {
							files.push( item.getAsFile() );
						} else if ( entry.isDirectory ) {
							files.push( ...await FileDrop.readDir( entry, entry.name ) );
						}
					} else if ( item.getAsFile != null ) {
						if ( item.kind == null || item.kind === 'file' ) {
							files.push( item.getAsFile() );
						}
					}
				}

				this.dispatchEvent( e, { files } );
			};

			let dragover = ( e ) => e.preventDefault();
			let removeCss = () => domElement.classList.remove( className );
			let addCss = () => domElement.classList.add( className );

			domElement.addEventListener( 'drop', drop );
			domElement.addEventListener( 'drop', removeCss );
			domElement.addEventListener( 'dragover', dragover );

			if ( className ) {
				domElement.addEventListener( 'dragenter', addCss );
				domElement.addEventListener( 'dragover', addCss );
				domElement.addEventListener( 'dragend', removeCss );
				domElement.addEventListener( 'dragleave', removeCss );
			}

			this.dispose = () => {
				domElement.removeEventListener( 'drop', drop );
				domElement.removeEventListener( 'drop', removeCss );
				domElement.removeEventListener( 'dragover', dragover );

				if ( className ) {
					domElement.removeEventListener( 'dragenter', addCss );
					domElement.removeEventListener( 'dragover', addCss );
					domElement.removeEventListener( 'dragend', removeCss );
					domElement.removeEventListener( 'dragleave', removeCss );
				}
			};
		}
	}

	setExtends( FileDrop );



	function Limiter( limit = 1, func ) {
		let queue = [];
		let i = 0;

		let run = () => {
			while ( i < limit && i < queue.length ) {
				next();
			}
		};

		let next = async () => {
			i++;

			let { func, args, res } = queue.shift();
			res( await func( ...args ) );

			i--;

			run();
		};

		this.setLimit = ( newLimit = 1 ) => ( limit = newLimit, run() );
		this.push = ( ...args ) => new Promise( res => ( queue.push( { func: func || args.shift(), args, res } ), run() ) );
	}

	setExtends( Limiter );



	class Fetch {
		constructor( domain, headers ) {
			this.domain = domain || null;
			this.headers = headers || {};
			this.bodyCallback = null;
			this.responseCallback = null;
			this.cache = {};
		}

		fetch( url, method, options, force = false ) {
			let { bodyCallback, responseCallback } = ( options = options || {} );

			delete options.bodyCallback;
			delete options.responseCallback;
			options.method = method || 'GET';
			options.headers = Object.assign( {}, this.headers || {}, options.headers || {} );

			if ( bodyCallback === undefined && this.bodyCallback ) {
				options.body = this.bodyCallback( options.body );
			} else if ( bodyCallback ) {
				options.body = bodyCallback( options.body );
			}

			url = new URL( url, this.domain ).toString();

			if ( options.method === 'GET' && !force && url in this.cache ) {
				return this.cache[ url ];
			}

			return this.cache[ url ] = fetch( url, options ).then( res => {
				if ( responseCallback === undefined && this.responseCallback ) {
					res = this.responseCallback( res );
				} else if ( responseCallback ) {
					res = responseCallback( res );
				}

				return res;
			} );
		}

		get( url, options = {}, force = false ) {
			return this.fetch( url, 'GET', options, force );
		}

		post( url, options = {}, force = false ) {
			return this.fetch( url, 'POST', options, force );
		}

		patch( url, options = {}, force = false ) {
			return this.fetch( url, 'PATCH', options, force );
		}

		delete( url, options = {}, force = false ) {
			return this.fetch( url, 'DELETE', options, force );
		}

		update( url, options = {}, force = false ) {
			return this.fetch( url, 'UPDATE', options, force );
		}

		put( url, options = {}, force = false ) {
			return this.fetch( url, 'PUT', options, force );
		}
	}



	function Img( src, callback ) {
		let img = new Image();

		if ( callback ) {
			img.onload = img.onerror = img.onabort = ( e ) => {
				img.onload = img.onerror = img.onabort = null;
				callback( ( e.type === 'error' || e.type === 'abort' ) && e, img );
			};
		}

		if ( src ) {
			img.src = src;
		}

		return img;
	}

	Img.load = async ( src ) => {
		if ( src ) {
			let promise, resolve, reject;
			promise = new Promise( ( res, rej ) => ( resolve = res, reject = rej ) );
			promise.image = new Img( src, ( err, img ) => err ? reject( err ) : resolve( img ) );
			return promise;
		} else {
			throw 'Unexpected src';
		}
	};



	function debounce( func, ms ) {
		let isCooldown = false;

		return function() {
			if ( !isCooldown ) {
				isCooldown = true;
				func.apply( this, arguments );
				setTimeout( () => isCooldown = false, ms );
			}
		};
	}

	function throttle( func, ms ) {
		let isThrottled = false;
		let savedThis = null;
		let savedArgs = null;

		function wrapper() {
			if ( !isThrottled ) {
				isThrottled = true;

				func.apply( this, arguments );

				setTimeout( () => {
					isThrottled = false;

					if ( savedArgs ) {
						wrapper.apply( savedThis, savedArgs );
						savedThis = savedArgs = null;
					}
				}, ms );
			} else {
				savedThis = this;
				savedArgs = arguments;
			}
		}

		return wrapper;
	}

	function defer( func, ms ) {
		let timer = 0;

		return function() {
			clearTimeout( timer );
			timer = setTimeout( () => func.apply( this, arguments ), ms );
		}
	}

	function parseUrl( path = '', base = location.href ) {
		let url = new URL( path, base );
		let res = {};

		[ 'host', 'hostname', 'href', 'origin', 'password', 'pathname', 'port', 'protocol' ].forEach( key => res[ key ] = url[ key ] );

		res.hash = url.hash.slice( 1 );
		res.search = {};

		for ( let key of url.searchParams.keys() ) {
			res.search[ key ] = url.searchParams.get( key );
		}

		return res;
	}

	function createPromise() {
		let promise, resolve, reject;
		promise = new Promise( ( res, rej ) => ( resolve = res, reject = rej ) );
		return { promise, resolve, reject };
	}

	function arrayToObject( keys, ary ) {
		let res = {};

		if ( isString( keys ) ) {
			keys = keys.split( /\,?\s*/ );
		}

		keys.forEach( ( key, i ) => res[ key ] = ary[ i ] );

		return res;
	}



	Dump.Img = Img;
	Dump.FileDrop = FileDrop;
	Dump.Limiter = Limiter;
	Dump.Fetch = Fetch;
	Dump.EventDispatcher = EventDispatcher;

	Dump.clamp = clamp;
	Dump.map = map;
	Dump.loop = loop;
	Dump.delay = delay;
	Dump.createFormData = createFormData;
	Dump.debounce = debounce;
	Dump.throttle = throttle;
	Dump.defer = defer;
	Dump.parseUrl = parseUrl;
	Dump.createPromise = createPromise;
	Dump.arrayToObject = arrayToObject;

	Dump.Element = _Element;
	Dump.Object = _Object;
	Dump.Array = _Array;

	Dump.is = {
		isArray,
		isUndefined,
		isNull,
		isSet,
		isString,
		isInfinity,
		isNumber,
		isNumeric,
		isInt,
		isFloat,
		isBoolean,
		isObject,
		isFunction,
		isNode,
		isElement,
	};

	root[name] = Dump;
} )();
