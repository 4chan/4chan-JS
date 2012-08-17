/********************************
 *                              *
 *        4chan Extension       *
 *                              *
 ********************************/

$ = function( selector, root )
{
	if( !/ /.test(selector) ) {
		if( selector.charAt(0) === '#' && !root ) return document.getElementById(selector.substr(1));

		if( selector.charAt(0) === '.' ) {
			if( root == null ) root = document.body;
			return root.getElementsByClassName(selector.substr(1))[0];
		}
	}

	if( root == null ) root = document.body;
	return root.querySelector( selector );
};

$.id = function(id) {
  return document.getElementById(id);
};

$.class = function(klass, root) {
  return (root || document).getElementsByClassName(klass);
};

$.byName = function(name) {
  return document.getElementsByName(name);
};

$.tag = function(tag, root) {
  return (root || document).getElementsByTagName(tag);
};

$.extend = function(destination, source) {
  for (var key in source) {
    destination[key] = source[key];
  }
};

if (!document.documentElement.classList) {
  $.hasClass = function(el, klass) {
    return (' ' + el.className + ' ').indexOf(' ' + klass + ' ') != -1;
  };
  
  $.addClass = function(el, klass) {
    el.className = (el.className == '') ? klass : el.className + ' ' + klass;
  };
  
  $.removeClass = function(el, klass) {
    el.className = (' ' + el.className + ' ').replace(' ' + klass + ' ', '');
  }
}
else {
  $.hasClass = function(el, klass) {
    return el.classList.contains(klass);
  };
  
  $.addClass = function(el, klass) {
    el.classList.add(klass);
  };
  
  $.removeClass = function(el, klass) {
    el.classList.remove(klass);
  }
}

$.ga = function( selector, root )
{
	if( typeof selector != 'string' ) return selector;
	if( typeof root == 'string' ) root = $(root);

	if( root == null ) root = document.body;

	if( !/ /.test(selector) && selector.charAt(0) === '.' ) return root.getElementsByClassName(selector.substr(1));
	return root.querySelectorAll( selector );
};

$.get = function( url, callbacks, headers )
{
	var key, x = new XMLHttpRequest();
	x.open( 'GET', url );
	x.onload = onload;
	x.onerror = onerror;
	x.timeout = 25000;
	if (callbacks) {
		for (key in callbacks) {
			x[key] = callbacks[key];
		}
	}
	if (headers) {
		for (key in headers) {
			x.setRequestHeader(key, headers[key]);
		}
	}
	x.send(null);
};

$.remove = function( selector, remove )
{
	var remove = $.ga( remove, selector );
	var len = remove.length;

	for( var i = 0; i < len; i++ ) {
		if( remove[i] ) remove[i].parentNode.removeChild(remove[i]);
	}
};

$.css = function( selector, css )
{
	selector = $.ga( selector );
	var len = selector.length;
	var key = css[0];
	var val = css[1];
	var regKey = new RegExp(key);
	var repReg = new RegExp("(" + key + "): ?([^;]);?" );

	for( var i = 0; i < len; i++ ) {
		var cur = selector[i];
		var style = cur.getAttribute('style') ? cur.getAttribute('style') : '';
		if( style != '' && style.substr(style.length-1) != ';' ) style += ';';


		if( regKey.test(style) ) {
			cur.setAttribute('style', style.replace(repReg, key + ':' + val + ';'));
		} else {
			cur.setAttribute('style', style + key + ':' + val + ';');
		}
	}
};

$.round = function( value, precision )
{
	// From php.js
	// http://phpjs.org/functions/round:505
	var m, f, isHalf, sgn; // Helper variables
    precision |= 0; // Making sure precision is integer
    m = Math.pow(10, precision);
    value *= m;
    sgn = (value > 0) | -(value < 0); // Sign of the number
    isHalf = value % 1 === 0.5 * sgn;
    f = Math.floor(value);

	if( isHalf ) {
		value = f + (sgn > 0);
	}

	return (isHalf ? value: Math.round(value)) / m;
};

$.click = function( elem, bindFunction )
{
	elem.addEventListener('click', bindFunction, true);
};

$.unbind = function( elem, bind )
{
	elem.removeEventListener(bind);
};

$.bind = function( elem, bind, bindTo )
{
	elem.addEventListener(bind, bindTo, true);
};

$.submit = function( elem, bindFunction )
{
	elem.addEventListener('submit', bindFunction, true);
};

$.load = function( elem, bindFunction )
{
	elem.addEventListener('load', bindFunction, true);
};

$.mouseover = function( elem, bindFunction )
{
	elem.addEventListener('mouseover', bindFunction, true);
};

$.mouseout = function( elem, bindFunction )
{
	elem.addEventListener('mouseout', bindFunction, true);
};

$.mousemove = function( elem, bindFunction )
{
	elem.addEventListener( 'mousemove', bindFunction, true );
};

$.mousedown = function( elem, bindFunction )
{
	elem.addEventListener( 'mousedown', bindFunction, true );
};

$.mouseup = function( elem, bindFunction )
{
	elem.addEventListener( 'mouseup', bindFunction, true );
};

$.keydown = function( elem, bindFunction )
{
	elem.addEventListener( 'keydown', bindFunction, true );
};

$.scroll = function( elem, bindFunction )
{
	elem.addEventListener( 'DOMMouseScroll', bindFunction, true );
};

$.parseNo = function(id)
{
	var no = id.match(/(\d+)$/);
	if( !no ) {
		console.log('Could not parse id from ' + id);
		return false;
	}

	return no[1];
};

$.parseButton = function(id)
{
	var button = id.match(/_(\d+)_(\d+)$/);
	if( !button ) {
		console.log('Could not parse thread/id from ' + id);
		return false;
	}

	return [button[1], button[2]];
};

$.prepend = function( selector, prepend )
{
	if( typeof selector == 'string' ) selector = $(selector);
	if( typeof prepend == 'string' ) prepend = $.parseHtml(prepend);

	var nodeSelect = 0;

	if( prepend.length > 1 && prepend.nodeType != 3 ) {
		var len = prepend.length;
		for( var i = 0; i < len; i++ ) {
			if( typeof prepend[i] == 'string' ) prepend[i] = $.parseHtml(prepend[i]);
			selector.insertBefore(prepend[i], selector.childNodes[nodeSelect]);
			nodeSelect++;
		}

		return;
	}

	selector.insertBefore(prepend, selector.childNodes[nodeSelect]);
};

$.append = function( selector, append )
{
	if( typeof selector == 'string' ) selector = $(selector);
	if( typeof append == 'string' ) append = $.parseHtml(append);

	if( append.length > 1 && append.nodeType != 3 ) {
		var len = append.length;
		for( var i = 0; i < len; i++ ) {
			if( typeof append[i] == 'string' ) append[i] = $.parseHtml(append[i]);
			selector.appendChild(append[i]);
		}

		return;
	}

	selector.appendChild(append);
};

$.after = function( selector, after )
{
	if( typeof selector == 'string' ) selector = $(selector);
	if( typeof after == 'string' ) after = $.parseHtml(after);

	var parent = selector.parentNode;

	if( parent.lastChild == selector ) {
		parent.appendChild(after);
	} else {
		parent.insertBefore(after, selector.nextSibling);
	}
};

$.html = function( selector, html )
{
	if( typeof selector == 'string' ) selector = $(selector);
	if( typeof html == 'string' ) html = $.parseHtml(html);

	// first scrap anything we have
	selector.innerHTML = '';

	// start appending!
	$.append( selector, html );
};


$.parseHtml = function(html)
{
	var root;

	if( html.match(/</) ) {
		root = document.createElement('div');
		root.innerHTML = html;

		return root.childNodes[0];
	} else {
		root = document.createTextNode( html );
	}

	return root;
};

// Take a JSON array and spit out 4chan HTML
$.buildHTMLFromJSON = function( arr, board )
{
	var
		container = document.createElement('div'),
		isOP = false,
		
		userId,
		fileDims = '',
		imgSrc = '',
		fileBuildStart = '',
		fileBuildEnd = '',
		fileInfo = '',
		fileHtml = '',
		shortSubject = '',
		fileSize = '',
		fileClass = '',
		shortFile = '',
		longFile = '',
		capcodeStart = '',
		capcodeClass = '',
		capcode = '',
		flag,
		highlight = '',
		emailStart = '',
		emailEnd = '',
			
		staticPath = '//static.4chan.org',
		imgDir = '//images.4chan.org/' + board + '/src';
	
	if (arr.resto == 0) {
		isOP = true;
		arr.resto = arr.no;
	}
	
	var noLink = arr.resto + '#p' + arr.no;
	var quoteLink = noLink.replace('p', 'q');

	if ((arr.capcode == 'none') && arr.id) {
		userId = ' <span class="posteruid id_'
			+ arr.id + '">(ID: <span class="hand" title="Highlight posts by this ID">'
			+ arr.id + '</span>)</span> ';
	}
	else {
		userId = '';
	}
	
	switch( arr.capcode ) {
		case 'admin':
			capcodeStart = ' <strong class="capcode hand id_admin" title="Highlight posts by the Administrator">## Admin</strong>';
			capcodeClass = ' capcodeAdmin';

			capcode = ' <img src="' + staticPath + '/image/adminicon.gif" alt="This user is the 4chan Administrator." title="This user is the 4chan Administrator." class="identityIcon"/>';
			break;
		
		case 'mod':
			capcodeStart = ' <strong class="capcode hand id_mod" title="Highlight posts by Moderators">## Moderator</strong>';
			capcodeClass = ' capcodeMod';

			capcode = ' <img src="' + staticPath + '/image/modicon.gif" alt="This user is a 4chan Moderator." title="This user is a 4chan Moderator." class="identityIcon"/>';
			break;

		case 'developer':
			capcodeStart = ' <strong class="capcode hand id_developer" title="Highlight posts by Developers">## Developer</strong>';
			capcodeClass = ' capcodeDeveloper';

			capcode = ' <img src="' + staticPath + '/image/developericon.gif" alt="This user is a 4chan Developer." title="This user is a 4chan Developer." class="identityIcon"/>';
			break;

		default:
			break;

	}

	if( arr.email ) {
		emailStart = '<a href="mailto:' + arr.email.replace(/ /g, '%20') + '" class="useremail">';
		emailEnd = '</a>';
	}
	
	if (arr.country) {
		flag = '<img src="' + staticPath + '/image/country/'
			+ arr.country.toLowerCase() + '.gif" alt="' + arr.country + '" title="'
			+ arr.country_name + '" class="countryFlag"> ';
	}
	else {
		flag = '';
	}

	if( arr.ext ) {
		shortFile = longFile = arr.filename + arr.ext;
		if( arr.filename.length > 40 ) {
			shortFile = arr.filename.slice(0, 35) + '(...)' + arr.ext;
		}

		if( !arr.tn_w && !arr.tn_h && arr.ext == '.gif' ) {
			arr.tn_w = arr.w;
			arr.tn_h = arr.h;
		}

		if( arr.fsize >= 1048576 ) {
			fileSize = $.round( arr.fsize/1048576, 2 ) + ' M';
		} else if( arr.fsize > 1024 ) {
			fileSize = $.round( arr.fsize / 1024 ) + ' K';
		} else {
			fileSize = arr.fsize + ' ';
		}

		if( arr.spoiler ) {
			fileSize = 'Spoiler Image, ' + fileSize;
			fileClass = ' imgspoiler';

			var fileThumb = '//static.4chan.org/image/spoiler-' + board + '.png';
			arr.tn_w = 100;
			arr.tn_h = 100;
		} else {
			fileThumb = '//thumbs.4chan.org/' + board + '/thumb/' + arr.tim + 's.jpg';
		}

		imgSrc = '<a class="fileThumb' + fileClass + '" href="' + imgDir + '/' + arr.tim + arr.ext + '" target="_blank"><img src="' + fileThumb + '" alt="' + fileSize + 'B" data-md5="' + arr.md5 + '" style="height: ' + arr.tn_h + 'px; width: ' + arr.tn_w + 'px;"></a>';

		if( arr.filedeleted ) {
			imgSrc = '<span class="fileThumb"><img src="' + staticPath + '/image/filedeleted-res.gif" alt="File deleted."></span>';
			fileInfo = '';
		} else {
			fileDims = arr.ext == '.pdf' ? 'PDF' : arr.w + 'x' + arr.h;
			fileInfo = '<span class="fileText" id="fT' + arr.no + '">File: <a href="' + imgDir + '/' + arr.tim + arr.ext + '" target="_blank">' + arr.tim + arr.ext + '</a>-(' + fileSize + 'B, ' + fileDims + ', <span title="' + longFile + '">' + shortFile + '</span>)</span>';
		}

		fileBuildStart = fileInfo ? '<div class="fileInfo">' : '';
		fileBuildEnd = fileInfo ? '</div>' : '';

		fileHtml = '<div id="f' + arr.no + '" class="file">'
			+ fileBuildStart + fileInfo + fileBuildEnd + imgSrc + '</div>';
	}

	shortSubject = arr.sub;
	if( shortSubject.length > 28 ) {
		shortSubject = arr.sub.replace('&#44;', ',');
		shortSubject = '<span title="' + shortSubject + '">' + shortSubject.substring(0, 23) + '(...)</span>';
	}

	container.className = 'postContainer replyContainer';
	container.id = 'pc' + arr.no;
	
	container.innerHTML =
		'<div class="sideArrows" id="sa' + arr.no + '">&gt;&gt;</div>' +
		'<div id="p' + arr.no + '" class="post ' + (isOP ? 'op' : 'reply') + highlight + '">' +
			'<div class="postInfoM mobile" id="pim' + arr.no + '">' +
				'<span class="nameBlock' + capcodeClass + '"> ' + emailStart +
				'<span class="name">' + arr.name + '</span>' +
				emailEnd + capcodeStart + emailEnd + userId + flag +
				'<br><span class="subject">' + arr.sub +
				'</span></span><span class="dateTime postNum" data-utc="' + arr.time + '">' +
				arr.now + '<br><em><a href="' + arr.no + '#p' + arr.no + '">No.</a>' +
				'<a href="javascript:quote(\'' + arr.no + '\');">' + arr.no + '</a></em></span>' +
			'</div>' +
			(isOP ? fileHtml : '') +
			'<div class="postInfo desktop" id="pi' + arr.no + '">' +
				'<input type="checkbox" name="' + arr.no + '" value="delete"> ' +
				'<span class="subject">' + arr.sub + '</span> ' +
				'<span class="nameBlock' + capcodeClass + '"> ' +
					emailStart + '<span class="name">' + arr.name + '</span>' + emailEnd
					+ capcodeStart + emailEnd + userId + flag +
				'</span> ' +
	
				'<span class="dateTime" data-utc="' + arr.time + '">' + arr.now + '</span> ' +
	
				'<span class="postNum desktop">' +
					'<a href="' + noLink + '" title="Highlight this post">No.</a><a href="' +
					quoteLink + '">' + arr.no + '</a>' +
				'</span>' +
			'</div>' +
			(isOP ? '' : fileHtml) +
			'<blockquote class="postMessage" id="m' + arr.no + '">' + arr.com + '</blockquote> ' +
		'</div>';
		
	return container;
};

$.findPos = function( elem )
{
	if( typeof elem == 'string' ) elem = $(elem);

	var leftpos = 0, toppos = 0;
	if (elem.offsetParent) {
		do {
			leftpos += elem.offsetLeft;
			toppos += elem.offsetTop;
		} while (elem = elem.offsetParent);
	}

	return [ toppos, leftpos ];
};

$.cursorToEnd = function( el )
{
	if (typeof el.selectionStart == "number") {
		el.selectionStart = el.selectionEnd = el.value.length;
	} else if (typeof el.createTextRange != "undefined") {
		el.focus();
		var range = el.createTextRange();
		range.collapse(false);
		range.select();
	}
};

var drag = new Object();
drag.dragging = false;
drag.currentDraggingObject = null;
drag.curleft = null;
drag.curtop = null;
drag.x = null;
drag.y = null;

$.drag = function(e)
{
	var elem = e.target;
	while( elem.tagName != 'body' ) {
		if( elem.className && elem.className.match('draggable') ) break;
		elem = elem.parentNode;
	}

	if( !elem.className ) return false;

	if( elem.className.match( 'draggable' ) ) {
		drag.dragging = true;
		drag.currentDraggingObject = elem;

		drag.curleft = parseInt( elem.style.left + 0 );
		drag.curtop  = parseInt( elem.style.top );

		drag.x = e.clientX;
		drag.y = e.clientY;

		$.mousemove(document, function(e) {
			$.doDrag(e);
			return false;
		});
	}
};

$.doDrag = function(e)
{
	if( !drag.dragging ) return true;

	var obj = drag.currentDraggingObject;
	obj.style.left = (drag.curleft + e.clientX - drag.x + 'px');
	obj.style.top  = (drag.curtop + e.clientY - drag.y + 'px');

	return false;
};

$.endDrag = function()
{
	drag.dragging = false;
};

/**
 * Parser
 */

var parser = new Object();

parser.parseBoard = function()
{
  var i, threads = document.getElementsByClassName('thread');
  
  for (i = 0; threads[i]; ++i) {
    parser.parseThread(threads[i].id.slice(1));
  }
};

parser.parseThread = function(tid, offset) {
  var i, thread, posts, el, key;
  
  thread = $.id('t' + tid);
  posts = thread.getElementsByClassName('post');
  
  if (!offset) {
    if (config.threadHiding) {
      el = document.createElement('span');
      el.id = 'sa' + tid;
      el.innerHTML = '<a class="extButton threadHideButton"'
        + 'data-cmd="hide" data-tid=" href="javascript:;"'
        + tid + '" title="Hide thread">[ - ]</a>';
      posts[0].insertBefore(el, posts[0].firstChild);
      if (threadHiding.hidden[tid]) {
        threadHiding.hide(tid);
      }
    }
    if (config.threadWatcher) {
      el = document.createElement('a');
      el.className = 'extButton wbtn';
      if (threadWatcher.watched[key = tid + '-' + main.board]) {
        el.className += ' active';
        el.setAttribute('data-active', '1');
      }
      el.id = 'wbtn-' + key;
      el.setAttribute('data-cmd', 'watch');
      el.setAttribute('data-tid', tid);
      el.href = 'javascript:;';
      el.title = 'Add to watch list';
      el.textContent = '[ W ]';
      document.getElementById('pi' + tid).appendChild(el);
    }
  }
  
  for (i = offset ? posts.length - offset : 0 ; posts[i]; ++i) {
    parser.parsePost(posts[i].id.slice(1), tid);
  }
};

parser.parsePost = function(pid, tid) {
  var img, quickReply, el, pi;
  
  pi = document.getElementById('pi' + pid);
  
  if (config.quickReply) {
    el = document.createElement('a');
    el.className = 'extButton';
    el.setAttribute('data-cmd', 'qr');
    el.setAttribute('data-tid', tid + '-' + pid);
    el.href = "javascript:;";
    el.title = 'Quick reply';
    el.textContent = '[ Q ]';
    pi.appendChild(el);
  }
  
  el = document.createElement('a');
  el.className = 'extButton';
  el.setAttribute('data-cmd', 'report');
  el.setAttribute('data-tid', pid);
  el.href = "javascript:;";
  el.title = 'Report post';
  el.textContent = '[ ! ]';
  pi.appendChild(el);

  el = document.createElement('a');
  el.className = 'extButton';
  el.setAttribute('data-cmd', 'totop');
  el.href = "javascript:;";
  el.title = 'Back to top';
  el.textContent = '[ ↑ ]';
  pi.appendChild(el);
  
  if (config.backlinks) {
    parser.parseBacklink(pid);
  }
};

parser.parseBacklink = function( postno )
{
	var len;

	// Get all links
	var links = $.ga('.quotelink', $('#m' + postno));
	if( !(len = links.length) ) return;


	var currentLink, href, info, board, thread, post, parent, bl, append;
	board = main.board;

	for( var i = 0; i < len; i++ ) {
		currentLink = links[i];
		href = currentLink.getAttribute('href');

		// Is it this board?
		if( !/(\d+)#p(\d+)$/.test(href) ) continue;

		info = href.match( /(\d+)#p(\d+)$/ );
		if( !info ) continue;

		thread = info[1];
		post = info[2];

		// Can we see the post we're trying to put this backlink onto
		parent = config.gs('x_compat') ? $('#pi' + post) : $('#p' + post);
		if( !parent ) continue; // no.

		// Yes, do we have a backlink struct already?
		if( $('#bl_' + postno + '_' + post) ) continue;

		bl = config.gs('x_compat') ? $('#pi' + post) : $('#bl' + post);
		append = [ '<span id="bl_' + postno + '_' + post + '"><a href="#p' + postno + '" class="quotelink">&gt;&gt;' + postno + '</a></span>', ' ' ];

		if( !bl && !config.gs( 'x_compat' ) ) {
			$.append( parent, ['<hr class="backlinkHr">', '<div class="backlink" id="bl' + post + '"><strong>Replies to this post:</strong><br></div>' ] );
			bl = $('#bl' + post);
		}

		$.append( bl, append );
	}

};

/** IMAGE RELATED FUNCTIONS **/

parser.imageSearchButton = function( e )
{
	var post = $.parseButton(e.target.getAttribute('id'))[1];
	var name = e.target.getAttribute('id').match( /^(\w+?)_/ )[1].toLowerCase();

	var image = 'https:' + $('#f' + post + ' .fileThumb img').getAttribute('src');
	var url = '';

	switch( name )
	{
		case 'google':
			url = 'https://www.google.com/searchbyimage?image_url=' + image;
			break;

		case 'iqdb':

			break;

		case 'tineye':
			url = 'https://www.tineye.com/search?url=' + image;
			break;
	}

	window.open( url );
};

parser.imageClick = function( e )
{
	obj = e.target;
	if( !obj.getAttribute('data-md5') ) return true;

	var id = $.parseNo(obj.parentNode.parentNode.getAttribute('id'));

	if( e.button == 1 || e.button == 2 ) return true;
	e.preventDefault();
	parser.expandImage(id);

};

parser.expandImage = function(id)
{
	var img = $('#f' + id + ' .fileThumb img');

	if( img.getAttribute('src').match(/(\/thumb\/|spoiler)/) ) {
		img.removeAttribute('style');

		if( !img.getAttribute('data-thumburl') ) {
			img.style.opacity = 0.5;
		}

		img.setAttribute('data-thumburl', img.getAttribute('src'));
		img.setAttribute('src', img.parentNode.getAttribute('href'));

		$.load(img, function() {
			this.style.opacity = 1;

			this.parentNode.className += ' fitToPage';
		});
	} else {
		img.onload = null;
		img.setAttribute('src', img.getAttribute('data-thumburl'));
		img.parentNode.className = img.parentNode.className.replace(' fitToPage', '');
	}
};

parser.openQuickReply = function(tid, pid)
{
	var threadId = tid;
	var postNo = pid;

	var comment = null, position, float = config.gs('float_qr_box'), form, qrResto, qrForm, calcLeft, calcTop;

	var qrWindow = $('#qrWindow_' + threadId);

	// Do we have a qrWindow already open?
	if( qrWindow ) {
		comment = $('textarea[name=com]', qrWindow).innerText;

		// Do we already have content?
		if( comment ) {
			comment += config.gs('always_quote_on_new_line') ? "\n" : '';
			comment += ">>" + post + "\n";
		} else {
			comment = '>>' + postNo;
		}

		if( config.gs('move_qr_window_on_click') && qrWindow.style.position != 'fixed' ) {

		}
	} else {
		comment = '>>' + postNo + "\n";
	}

	position = $.findPos( $('#p' + postNo) );

	form = $('form[name=post]').cloneNode(true);
	form.setAttribute( 'name', 'qr_' + threadId );
	form.setAttribute( 'id', 'qr_' + threadId );

	qrResto = document.createElement('input');
	qrResto.setAttribute( 'type', 'hidden' );
	qrResto.setAttribute( 'name', 'resto' );
	qrResto.setAttribute( 'value', threadId );

	form.appendChild( qrResto );

	qrForm =
		'<div id="qrWindow_' + threadId + '" class="reply qrWindow preview draggable">' +
			'<div id="qrHeader_' + threadId + '" class="postblock qrHeader">' +
				'Quick Reply - Thread No.' + threadId +
					'<span class="qrButtonHolder">' +
						'<a id="qrFloat_' + threadId + '" title="Scroll With Page" href="javascript:void(0);">[ &gt; ]</a> ' +
						'<a id="qrClose_' + threadId + '" title="Close Window" href="javascript:void(0);">[ X ]</a>' +
					'</span>' +
			'</div>' +

			'<div id="qrForm_' + threadId + '" class="qrForm"></div>' +
			'<div id="qrMessage_' + threadId + '"></div>' +
		'</div>';

	$('#bottom').innerHTML += qrForm;
	$('#qrForm_' + threadId).appendChild(form);

	qrWindow = $('#qrWindow_' + threadId);

	calcLeft = ((window.innerWidth/2) - (qrWindow.offsetWidth/2));
	calcTop = (position[0] + 40);

	qrWindow.setAttribute( 'style', 'left: ' + calcLeft + 'px; top: ' + calcTop + 'px;' );

	$.remove( '#qrWindow_' + threadId, '.rules' );

	$.click( $('#qrFloat_' + threadId), function() {
		var id = $.parseNo(this.getAttribute('id'));

	});

	$.click( $('#qrClose_' + threadId), function() {
		var id = $.parseNo(this.getAttribute('id'));
		parser.closeQrWindow(id);
	});

	$.submit($('#qrForm_' + threadId), function(e) {
		e.preventDefault();

		var id = $.parseNo(this.getAttribute('id'));
		var form = $('#qr_' + id);
		$.html('#qrMessage_' + id, '<div class="postblock qrMessage">Submitting post... <span id="upload_progress_' + id + '"></span></div>');

		var formData = new FormData(form);

		var xhr = new XMLHttpRequest();
		xhr.open( 'POST', form.getAttribute('action') );
		xhr.onload = function(event)
		{
			if( this.status == 200 ) {
				extra.parseResponse( this.responseText, id );
			}
		};

		var previousPercent = 0, percent = 0;

		if( typeof xhr.upload.onprogress == 'object' ) {
			var upl = $('#upload_progress_' + id);
			xhr.upload.onprogress = function(e)
			{
				if( e.lengthComputable ) {
					percent = parseInt( ((e.loaded / e.total) * 100).toString().split('.')[0]);

					if( previousPercent != percent ) {
						upl.innerText = percent + '%';
					}
				}
			};
		}

		xhr.send(formData);
		return false;
	});

	var textarea = $('#qrWindow_' + threadId + ' textarea[name=com]');
	textarea.value = comment;
	textarea.focus();

	$.cursorToEnd(textarea);
	$.mousedown($('#qrHeader_' + threadId), function(e) {
		$.drag(e);
	});

	$.mouseup(document, function(e) {
		$.endDrag(e);
	});
};

parser.closeQrWindow = function(id)
{
	$.remove('#bottom', '#qrWindow_' + id);
};

parser.topButtonClick = function(e)
{
	var info = $.parseButton(e.target.getAttribute('id'));

	window.location.hash = '';
	window.location.hash = 't' + info[0];
};

parser.lastHoverPreview = null;
parser.showHoverPreview = function(e)
{
	var href = e.target.getAttribute('href');

	//console.log(e);

	if( href == parser.lastHoverPreview && parser.hoverPreviewOpen ) return;
	if( href != parser.lastHoverPreview && parser.hoverPreviewOpen ) parser.closeAllHoverPreviews();

	parser.lastHoverPreview = href;
	parser.hoverPreviewOpen = true;

	var id = href.match(/#p([0-9]+)$/)[1];

	var postPreview = $('#postPreview' + id);

	if( !postPreview ) {
		$.append(
			document.body,
			'<div id="postPreview' + id + '" class="tooltip" style="max-width: 400px; display: none"></div>'
		);

		postPreview = $('#postPreview' + id);
	}

	if( $('#hp' + id) ) {
		parser.showTooltip( e.target, id );
		return true;
	}

	$.html('#postPreview' + id, '<div class="post reply preview posthover" id="hpl' + id + '">Loading...</div>');
	parser.showTooltip(e.target, id );

	var board = href.match(/([a-z0-9]+)\/res/);
	board = board ? board[1] : main.board;

	var post = $('#p' + id);
	var clone = '';

	if( post ) {
		clone = post.innerHTML;

		$.html(
			postPreview,
			'<div id="hp' + id + '" class="post reply preview posthover" style="max-width: 400px;">' + clone + '</div>'
		);

		$.remove(
			postPreview,
			'.sideArrows, input, .buttons, .replyLink, .backlink, hr, a[id], span[id^=bl], .postNum'
		);

		$.append(
			$('#hp' + id + ' .postInfo'),
			'<span class="postNum"></span>'
		);

		$.html(
			$('#hp' + id + ' .postInfo .postNum'),
			[
				$('#p' + id + ' .postNum a:nth-of-type(1)'),
				$('#p' + id + ' .postNum a:nth-of-type(2)')
			]
		);

		//console.log('trying to show tooltip');

		parser.showTooltip(e.target, id );
		return true;
	}

	// We can't find it, find it and display it.
	var threadId = href.match(/([0-9]+)#/)[1];

	// Open the thread
	$.get( '//boards.4chan.org/' + board + '/res/' + threadId + '.json', function(data) {
		data = JSON.parse(data).posts;
		var len = data.length;

		for( var i = 0; i < len; i++ ) {
			if( data[i].no != id ) continue;

			$.html(
				postPreview,
				'<div id="hp' + id + '" class="post reply preview posthover" style="max-width: 400px;">' + $.buildHTMLFromJSON( data[i], board ) + '</div>'
			);

			parser.showTooltip(e.target, id);
			return true;
		}
	});

};

parser.showTooltip = function( target, id )
{
	var p = $('#postPreview' + id);
	var hp = $('#hp' + id) || $('#hpl' + id);

	p.setAttribute('style', 'display: inline; visibility: hidden;');

	var linkOffset = $.findPos(target);
	var linkWidth = target.offsetWidth;
	var linkHeight = target.offsetHeight;
	var eHeight = hp.offsetHeight;
	var eWidth = hp.offsetWidth > 400 ? 400 : hp.offsetWidth;


	var win = [ window.innerWidth, window.innerHeight ];
	if ( ( linkOffset[1] + linkWidth + eWidth ) > (win[0] - 200)) {
		var toppos = (linkOffset[0] - eHeight / 2);
		var leftpos = (linkOffset[1] - (eWidth+30));
		p.setAttribute('style', 'max-width: 400px; top: ' + (toppos) + 'px; left: ' + leftpos + 'px; position: absolute;');
	} else {
		toppos = (linkOffset[0] - eHeight / 2) - (linkHeight/2);
		leftpos = (linkOffset[1] + linkWidth);
		p.setAttribute('style', 'max-width: 400px; top: ' + (toppos) + 'px; left: ' + leftpos + 'px; position: absolute;');
	}
};

parser.hoverPreviewOpen = false;
parser.closeAllHoverPreviews = function()
{
	var tooltips = $.ga('.tooltip');
	var len = tooltips.length;

	for( var i = 0; i < len; i++ ) {
		tooltips[i].setAttribute('style', 'display: none');
	}

	parser.hoverPreviewOpen = false;
};

parser.handleMouseMove = function(e)
{
	if( e.target.className && e.target.className === 'quotelink' ) {
		parser.showHoverPreview(e);
	} else {
		if( parser.hoverPreviewOpen ) {
			parser.closeAllHoverPreviews();
		}
	}
};

/**
 * Quick reply
 */
var QR = {
  currentTid: null,
  cooldown: null,
  auto: false,
  baseDelay: 30500,
  sageDelay: 60500,
  captchaInterval: null
};

QR.show = function(tid, pid) {
  var i, j, cnt, postForm, form, table, fields, tr, tbody, pos, spoiler, file, cd;
  
  if (QR.currentTid) {
    if (!main.tid && QR.currentTid != tid) {
      $.id('qrTid').textContent = QR.currentTid = tid;
      $.byName('com')[1].value = '';
    }
    return;
  }
  
  QR.currentTid = tid;
  
  postForm = $.id('postForm');
  
  cnt = document.createElement('div');
  cnt.id = 'quickReply';
  cnt.className = 'reply';
  cnt.setAttribute('data-trackpos', 'QR-position');
  
  if (config['QR-position']) {
    cnt.style.cssText = config['QR-position'];
  }
  else {
    cnt.style.right = '0px';
    cnt.style.top = '50px';
  }
  
  cnt.innerHTML =
    '<div id="qrHeader" class="drag postblock">Quick Reply - Thread No.<span id="qrTid">'
    + tid + '</span><a id="qrClose" href="javascript:;" '
    + 'class="pointer" title="Close Window">&times;</a></div>';
  
  form = postForm.parentNode.cloneNode(false);
  form.setAttribute('name', 'qrPost');
  form.innerHTML =
    '<input type="hidden" value="'
    + $.byName('MAX_FILE_SIZE')[0].value + '" name="MAX_FILE_SIZE">'
    + '<input type="hidden" value="regist" name="mode">'
    + '<input id="qrResto" type="hidden" value="' + tid + '" name="resto">';
  
  table = document.createElement('table');
  table.className = 'postForm';
  table.appendChild(tbody = document.createElement('tbody'));
  
  fields = postForm.firstChild.children;
  for (i = 0, j = fields.length - 1; i < j; ++i) {
    if (fields[i].id == 'captchaFormPart') {
      tr = document.createElement('tr');
      tr.innerHTML = '<td class="desktop">Verification</td><td>'
        + '<img id="qrCaptcha" title="Reload" width="300" height="57" src="'
        + $.id('recaptcha_image').firstChild.src + '" alt="reCAPTCHA challenge image">'
        + '<input id="qrCapField" name="recaptcha_response_field" '
        + 'required="required" type="text" autocomplete="off">'
        + '<input id="qrChallenge" name="recaptcha_challenge_field" type="hidden" value="'
        + $.id('recaptcha_challenge_field').value + '">'
        + '</td>';
    }
    else {
      tr = fields[i].cloneNode(true);
    }
    tbody.appendChild(tr);
  }
  
  if (spoiler = tbody.querySelector('input[name="spoiler"]')) {
    spoiler = spoiler.parentNode.parentNode;
    spoiler.parentNode.removeChild(spoiler);
    file = tbody.querySelector('input[id="postFile"]');
    file.id = 'qrFile';
    file.parentNode.insertBefore(spoiler, file.nextSibling);
  }
  
  form.appendChild(table);
  cnt.appendChild(form);
  cnt.addEventListener('click', QR.onClick, false);
  document.body.appendChild(cnt);
  
  if (cd = localStorage.getItem('4chan-cd-' + main.board)) {
    QR.startCooldown(cd);
  }
  
  QR.reloadCaptcha();
  
  draggable.set($.id('qrHeader'));
};

QR.close = function() {
  var cnt = $.id('quickReply');
  clearInterval(QR.captchaInterval);
  QR.currentTid = null;
  cnt.removeEventListener('click', QR.onClick, false);
  draggable.unset($.id('qrHeader'));
  document.body.removeChild(cnt);
};

QR.cloneCaptcha = function() {
  $.id('qrCaptcha').src = $.id('recaptcha_image').firstChild.src;
  $.id('qrChallenge').value = $.id('recaptcha_challenge_field').value;
  $.id('qrCapField').value = '';
  console.log('Cloning Captcha ' + (new Date).toString());
};

QR.reloadCaptcha = function(focus) {
  var pulse, func, el;
  
  el = $.id('recaptcha_image')
  el.firstChild.setAttribute('data-loading', '1');
  
  poll = function() {
    clearTimeout(pulse);
    if (!el.firstChild.hasAttribute('data-loading')) {
      el.firstChild.setAttribute('data-loading', '1');
      QR.captchaInterval
        = setInterval(QR.cloneCaptcha, 240500);
      QR.cloneCaptcha();
      if (focus) {
        $.id('qrCapField').focus();
      }
    }
    else {
      pulse = setTimeout(poll, 100);
    }
  };
  clearInterval(QR.captchaInterval);
  Recaptcha.reload('t');
  pulse = setTimeout(poll, 100);
};

QR.onClick = function(e) {
  var t = e.target;
  
  if (t.id == 'qrCaptcha') {
    QR.reloadCaptcha(true);
  }
  else if (t.type == 'submit') {
    QR.submit(e);
  }
  else if (t.id == 'qrClose') {
    QR.close();
  }
};

QR.submit = function(e) {
  var i, btn, cd, xhr, email, field;
  
  //hidePostError();
  
  if (e) {
    e.preventDefault();
  }
  
  btn = $.id('quickReply').querySelector('input[type="submit"]');
  
  if (QR.cooldown) {
    if (QR.auto = !QR.auto) {
      btn.value = 'CD: ' + QR.cooldown + 's (auto)';
    }
    else {
      btn.value = 'CD: ' + QR.cooldown + 's';
    }
    return;
  }
  
  QR.auto = false;
  
  if (field = $.byName('name')[1]) {
    main.setCookie('4chan_name', field.value);
  }
  if (field = $.byName('pwd')[1]) {
    main.setCookie('4chan_pass', field.value);
  }
  if ((email = $.byName('email')[1]) && email.value != 'sage') {
    main.setCookie('4chan_email', email.value);
  }
  
  xhr = new XMLHttpRequest();
  xhr.open('POST', document.forms.qrPost.action, true);
  xhr.upload.onprogress = function(e) {
    btn.value = (0 | (e.loaded / e.total * 100)) + '%';
  };
  xhr.onerror = function() {
    btn.value = 'Submit';
    console.log('Error');
    //showPostError('Connection error. Are you banned?');
  };
  xhr.onload = function() {
    var resp, qrFile;
    
    btn.value = 'Submit';
    
    if (this.status == 200) {
      if (resp = xhr.responseText.match(/"errmsg"[^>]*>(.*?)<\/span/)) {
        QR.reloadCaptcha();
        console.log(resp[1]);
        //showPostError(resp[1]);
        return;
      }
      
      if (/sage/i.test(email.value)) {
        if (main.tid) {
          cd = QR.sageDelay;
        }
        else {
          cd = QR.baseDelay;
        }
      }
      else {
        cd = QR.baseDelay;
      }
      
      cd += Date.now();
      localStorage.setItem('4chan-cd-' + main.board, cd);
      QR.startCooldown(cd);
      
      if (main.tid) {
        $.byName('com')[1].value = '';
        QR.reloadCaptcha();
        qrFile = document.getElementById('qrFile').parentNode;
        qrFile.innerHTML = qrFile.innerHTML;
        setTimeout(threadUpdater.update, 500);
        return;
      }
    }
    else {
      console.log(xhr.statusText);
      //showPostError(xhr.statusText);
    };
  }
  xhr.send(new FormData(document.forms.qrPost));
  btn.value = 'Sending';

};

QR.startCooldown = function(ms) {
  var btn, interval;
  
  ms = parseInt(ms, 10);
  
  btn = $.id('quickReply').querySelector('input[type="submit"]');
  
  if ((QR.cooldown = 0 | ((ms - Date.now()) / 1000)) <= 0) {
    QR.cooldown = false;
    localStorage.removeItem('4chan-cd-' + main.board);
    return;
  }
  btn.value = 'CD: ' + QR.cooldown + 's';
  interval = setInterval(function() {
    if ((QR.cooldown = 0 | ((ms - Date.now()) / 1000)) <= 0) {
      clearInterval(interval);
      btn.value = 'Submit';
      QR.cooldown = false;
      localStorage.removeItem('4chan-cd-' + main.board);
      if (QR.auto) {
        QR.submit();
      }
    }
    else {
      btn.value = 'CD: ' + QR.cooldown + (QR.auto ? 's (auto)' : 's');
    }
  }, 1000);
};

/**
 * Thread hiding
 */
var threadHiding = {};

threadHiding.hidden = {};

threadHiding.toggle = function(tid) {
  if ($.id('sa' + tid).hasAttribute('data-hidden')) {
    threadHiding.show(tid);
  } else {
    threadHiding.hide(tid);
  }
  threadHiding.save();
};

threadHiding.show = function(tid) {
  var post, message, summary, thread, sa;
  
  post = $.id('p' + tid);
  message = $.id('m' + tid);
  summary = $.id('summary-' + tid);
  thread = $.id('t' + tid);
  sa = $.id('sa' + tid);
  
  sa.removeAttribute('data-hidden');
  sa.firstChild.textContent = '[ - ]';
  post.insertBefore(sa, post.firstChild);
  post.insertBefore(summary.firstChild, message);
  
  thread.parentNode.removeChild(summary);
  thread.style.display = 'block';
  
  delete threadHiding.hidden[tid];
};

threadHiding.hide = function(tid) {
  var summary, sa, thread;
  
  thread = $.id('t' + tid);
  thread.style.display = 'none';
  
  sa = $.id('sa' + tid);
  sa.setAttribute('data-hidden', tid);
  sa.firstChild.textContent = '[ + ]';
  
  summary = document.createElement('summary');
  summary.id = 'summary-' + tid;
  summary.className = 'summary';
  summary.appendChild(sa);
  summary.appendChild(document.getElementById('pi' + tid));
  
  thread.parentNode.insertBefore(summary, thread);
  
  threadHiding.hidden[tid] = Date.now();
};

threadHiding.load = function() {
  var now, tid, storage, purgeThreshold, purgeCount;
  
  now = Date.now();
  purgeThreshold = 7 * 86400000;
  purgeCount = 0;
  
  if (storage = localStorage.getItem('4chan-hide-' + main.board)) {
    threadHiding.hidden = JSON.parse(storage);
  }
  
  for (tid in threadHiding.hidden) {
    if (now - threadHiding.hidden[tid] > purgeThreshold) {
      ++purgeCount;
      delete threadHiding.hidden[tid];
    }
  }
  
  if (purgeCount) {
    console.log('Purged ' + purgeCount + ' hidden threads');
    threadHiding.save();
  }
};

threadHiding.save = function() {
  for (var i in threadHiding.hidden) {
    localStorage.setItem('4chan-hide-' + main.board,
      JSON.stringify(threadHiding.hidden)
    );
    return;
  }
  localStorage.removeItem('4chan-hide-' + main.board);
};

/**
 * Thread watcher
 */
var threadWatcher = {
  listNode: null,
  watched: {},
};

threadWatcher.watched = {};

threadWatcher.init = function() {
  var cnt, html;
  
  cnt = document.createElement('div');
  cnt.id = 'threadWatcher';
  cnt.setAttribute('data-trackpos', 'TW-position');
  
  if (config['TW-position']) {
    cnt.style.cssText = config['TW-position'];
  }
  else {
    cnt.style.left = '10px';
    cnt.style.top = '100px';
  }
  
  cnt.innerHTML = '<div class="drag" id="twHeader">Thread Watcher</div>';
  
  threadWatcher.listNode = document.createElement('ul');
  threadWatcher.listNode.id = 'watchList';
  threadWatcher.reload();
  cnt.appendChild(threadWatcher.listNode);
  
  document.body.appendChild(cnt);
  
  cnt.addEventListener('click', threadWatcher.onClick, false);
  draggable.set($.id('twHeader'));
};

threadWatcher.reload = function(full) {
  var i, storage, html, tuid, key, buttons, bn;
  
  html = '';
  if (storage = localStorage.getItem('4chan-watch')) {
    threadWatcher.watched = JSON.parse(storage);
    
    for (key in threadWatcher.watched) {
      tuid = key.split('-');
      html += '<li id="watch-' + key
        + '"><span class="pointer" data-cmd="unwatch" data-tid="'
        + tuid[0] + '" data-board="' + tuid[1] + '">&times;</span> <a href="'
        + main.linkToThread(tuid[0], tuid[1]) + '">/'
        + tuid[1] + '/ - '
        + threadWatcher.watched[key] + '</a></li>';
    }
    
    if (full) {
      buttons = $.class('wbtn', $.id('delform'));
      for (i = 0; btn = buttons[i]; ++i) {
        key = btn.getAttribute('data-tid') + '-' + main.board;
        if (threadWatcher.watched[key]) {
          if (!btn.hasAttribute('data-active')) {
            btn.className += ' active';
            btn.setAttribute('data-active', '1')
          }
        }
        else {
          if (btn.hasAttribute('data-active')) {
            btn.className = btn.className.replace(/ active/, '');
            btn.removeAttribute('data-active')
          }
        }
      }
    }
  }
  
  threadWatcher.listNode.innerHTML = html;
};

threadWatcher.onClick = function(e) {
  var t = e.target;
  if (t.hasAttribute('data-tid')) {
    threadWatcher.toggle(
      t.getAttribute('data-tid'),
      t.getAttribute('data-board')
    );
  }
};

threadWatcher.toggle = function(tid, board, synced) {
  var key, label, btn;
  
  key = tid + '-' + (board || main.board);
  
  if (threadWatcher.watched[key]) {
    delete threadWatcher.watched[key];
    if (btn = $.id('wbtn-' + key)) {
      btn.className = btn.className.replace(/ active/, '');
      btn.removeAttribute('data-active');
    }
  }
  else {
    if ((label = $.class('subject', $.id('pi' + tid))[0].textContent)
      || (label = $.id('m' + tid).textContent)) {
      label = label.slice(0, 35);
    }
    else {
      label = tid;
    }
    threadWatcher.watched[key] = label;
    if (btn = $.id('wbtn-' + key)) {
      btn.className += ' active';
      btn.setAttribute('data-active', '1');
    }
  }
  threadWatcher.save();
  threadWatcher.reload();
};

threadWatcher.save = function() {
  localStorage.setItem('4chan-watch', JSON.stringify(threadWatcher.watched));
};

/**
 * Thread updater
 */
threadUpdater = {
  unread: false,
  iconNode: null,
  defaultIcon: '',
	updateInterval: null,
	pulseInterval: null,
	force: false,
	auto: false,
	updating: false,
	delay: 0,
	step: 5,
	range: [ 10, 60 ], // in seconds
	lastUpdated: 0,
	lastModified: '0',
	statusNode: null
};

threadUpdater.init = function() {
	var frag, navlinks, el, label, postCount;
	
	postCount = document.getElementsByClassName('reply').length;
	navlinks = document.getElementsByClassName('navLinksBot')[0];
	
	frag = document.createDocumentFragment();
	
	this.iconNode = document.head.querySelector('link[rel="shortcut icon"]');
	this.defaultIcon = this.iconNode.getAttribute('href');
	//this.iconNode.type = 'image/x-icon';
	
	// Update button
	frag.appendChild(document.createTextNode(' ['));
	el = document.createElement('a');
	el.id = 'threadUpdateBtn';
	el.href = '';
	el.textContent = 'Update';
	el.addEventListener('click', this.onUpdateClick, false);
	frag.appendChild(el);
	frag.appendChild(document.createTextNode(']'));
	
	// Auto checkbox
	frag.appendChild(document.createTextNode(' ['));
	label = document.createElement('label');
	el = document.createElement('input');
	el.type = 'checkbox';
	el.title = 'Fetch new replies automatically';
	el.id = 'threadUpdateAuto';
	el.addEventListener('click', this.onAutoClick, false);
	label.appendChild(el);
	label.appendChild(document.createTextNode('Auto'));
	frag.appendChild(label);
	frag.appendChild(document.createTextNode(']'));
	
	// Status span
	this.statusNode = document.createElement('span');
	
	this.statusNode.id = 'threadUpdateStatus';
	frag.appendChild(this.statusNode);
	
	navlinks.appendChild(frag);
};

threadUpdater.start = function() {
	this.auto = true;
	this.force = this.updating = false;
	this.lastUpdated = Date.now();
	this.delay = this.range[0];
	document.addEventListener('scroll', this.onScroll, false);
	this.updateInterval = setTimeout(this.update, this.delay * 1000);
	this.pulse();
};

threadUpdater.stop = function() {
	this.auto = this.updating = this.force = false;
	this.statusNode.textContent = '';
	this.setIcon(this.defaultIcon);
	document.removeEventListener('scroll', this.onScroll, false);
	clearTimeout(this.updateInterval);
	clearTimeout(this.pulseInterval);
};

threadUpdater.pulse = function() {
	var self = threadUpdater;
	self.statusNode.textContent =
		self.delay - (0 | (Date.now() - self.lastUpdated) / 1000);
	self.pulseInterval = setTimeout(self.pulse, 1000);
};

threadUpdater.adjustDelay = function(postCount, force)
{
	if (!force) {
		if (postCount == 0) {
			if ((this.delay += this.step) > this.range[1]) {
				this.delay = this.range[1];
			}
		}
		else {
			if ((this.delay -= postCount * this.step) < this.range[0]) {
				this.delay = this.range[0]
			}
		}
	}
	if (this.auto) {
		this.updateInterval = setTimeout(this.update, this.delay * 1000);
		this.pulse();
	}
	console.log(postCount + ' new post(s), delay is ' + this.delay + ' seconds');
};

threadUpdater.onScroll = function() {
  if (document.documentElement.scrollTopMax ==
    document.documentElement.scrollTop) {
    threadUpdater.setIcon(threadUpdater.defaultIcon);
    threadUpdater.unread = false;
  }
};

threadUpdater.onUpdateClick = function(e) {
	e.preventDefault();
	threadUpdater.force = true;
	threadUpdater.update();
};

threadUpdater.onAutoClick = function(e) {
	if (this.hasAttribute('checked')) {
		this.removeAttribute('checked');
		threadUpdater.stop();
	}
	else {
		this.setAttribute('checked', 'checked');
		threadUpdater.start();
	}
};

threadUpdater.update = function() {
	var self, now = Date.now();
	
	self = threadUpdater;
	
	if (self.updating) {
		console.log('Already updating');
		return;
	}
	
	if (self.auto) {
		clearTimeout(self.pulseInterval);
		clearTimeout(self.updateInterval);	
	}
	
	self.updating = true;
	
	console.log('Updating thread at ' + new Date().toString());
	
	self.statusNode.textContent = 'Updating...';
	
	//$.get('http://localtest.4chan.org/' + main.board + '/res/' + main.tid + '.json',
	$.get('//api.4chan.org/' + main.board + '/res/' + main.tid + '.json',
		{
			onload: self.onload,
			onerror: self.onerror,
			ontimeout: self.onerror
		},
		{
			'If-Modified-Since': self.lastModified
		}
	);
};

threadUpdater.onload = function() {
  var i, self, nodes, thread, newposts, frag, postcount, lastrep, lastid, lastoffset;
  
  self = threadUpdater;
  nodes = [];
  
  self.statusNode.textContent = '';
  
  if (this.status == 200) {
    self.lastModified = this.getResponseHeader('Last-Modified');
    
    thread = document.getElementById('t' + main.tid);
    
    lastrep = thread.childNodes[thread.childElementCount - 1];
    lastid = +lastrep.id.slice(2);
    lastoffset = lastrep.offsetTop;
    
    try {
      newposts = JSON.parse(this.responseText).posts;
    }
    catch(e) {
      console.log(e);
      newposts = [];
    }
    
    for (i = newposts.length - 1; i >= 0; i--) {
      if (newposts[i].no <= lastid) {
        break;
      }
      nodes.push(newposts[i]);
    }
    
    if (nodes[0]) {
      if (!self.unread) {
        self.setIcon(self.icons[main.type]);
      }
      
      frag = document.createDocumentFragment();
      for (i = nodes.length - 1; i >= 0; i--) {
        frag.appendChild($.buildHTMLFromJSON(nodes[i], main.board));
      }
      thread.appendChild(frag);
      parser.parseThread(thread.id.slice(1), nodes.length);
      window.scrollBy(0, lastrep.offsetTop - lastoffset);
    }
  }
  else if (this.status == 304 || this.status == 0) {
    self.statusNode.textContent = 'Not Modified';
  }
  else if (this.status == 404) {
    self.setIcon(self.icons.dead);
    self.statusNode.textContent = 'Not Found';
    if (self.auto) {
      self.stop();
    }
  }
  
  self.lastUpdated = Date.now();
  self.adjustDelay(nodes.length, self.force);
  self.updating = self.force = false;
};

threadUpdater.onerror = function() {
	var self = threadUpdater;
	self.statusNode.textContent = 'Connection Error';
	self.lastUpdated = Date.now();
	self.adjustDelay(0, self.force);
	self.updating = self.force = false;
};

threadUpdater.onabort = function() {
	// body...
};

threadUpdater.ontimeout = function() {
	// body...
};

threadUpdater.setIcon = function(data) {
  this.iconNode.href = data;
  document.head.appendChild(this.iconNode);
};

threadUpdater.icons = {
  ws: 'data:image/gif;base64,R0lGODlhEAAQAJEDAC6Xw////wAAAAAAACH5BAEAAAMALAAAAAAQABAAAAI2nI+pq+L9jABUoFkPBs5Rrn1cEGyg1Alkai1qyVxrPLCdW63Z9aU9v9u0JJzT5JiwDGtMGqMAADs=',
  nws: 'data:image/gif;base64,R0lGODlhEAAQAJEDAP///2bMMwAAAAAAACH5BAEAAAMALAAAAAAQABAAAAI2nI+pq+L9jAhUoFkPDs5Rrn0cAGyg1Alkai1qyVxrPLCdW63Z9aU9v9u0JJzT5JiwDGtMGqMAADs=',
  dead: 'data:image/gif;base64,R0lGODlhEAAQAJECAAAAAPAAAAAAAAAAACH5BAEAAAIALAAAAAAQABAAAAIvlI+pq+P9zAh0oFkPDlbs7lFZKIJOJJ3MyraoB14jFpOcVMpzrnF3OKlZYsMWowAAOw=='
};

/**
 * Draggable helper
 */
draggable = {
  el: null,
  key: null,
  dx: null, dy: null, right: null, bottom: null,
  
  set: function(handle) {
    handle.addEventListener('mousedown', draggable.startDrag, false);
  },
  
  unset: function(handle) {
    handle.removeEventListener('mousedown', draggable.startDrag, false);
  },
  
  startDrag: function(e) {
    var offs;
    e.preventDefault();
    draggable.el = e.target.parentNode;
    draggable.key = draggable.el.getAttribute('data-trackpos');
    offs = draggable.el.getBoundingClientRect();
    draggable.dx = e.clientX - offs.left;
    draggable.dy = e.clientY - offs.top;
    draggable.right = document.documentElement.clientWidth - offs.width;
    draggable.bottom = document.documentElement.clientHeight - offs.height;
    document.addEventListener('mouseup', draggable.endDrag, false);
    document.addEventListener('mousemove', draggable.onDrag, false);
  },
  
  endDrag: function(e) {
    document.removeEventListener('mouseup', draggable.endDrag, false);
    document.removeEventListener('mousemove', draggable.onDrag, false);
    if (draggable.key) {
      config[draggable.key] = draggable.el.style.cssText;
      config.save();
    }
    delete draggable.el;
  },
  
  onDrag: function(e) {
    var left, top, style;
    left = e.clientX - draggable.dx;
    top = e.clientY - draggable.dy;
    style = draggable.el.style;
    if (left < 1) {
      style.left = '0px';
      style.right = null;
    }
    else if (draggable.right < left) {
      style.left = null;
      style.right = '0px';
    }
    else {
      style.left = left + 'px';
      style.right = null;
    }
    if (top < 1) {
      style.top = '0px';
      style.bottom = null;
    }
    else if (draggable.bottom < top) {
      style.bottom = '0px';
      style.top = null;
    }
    else {
      style.top = top + 'px';
      style.bottom = null;
    }
  }
};

/**
 * Settings menu
 */
var settingsMenu = {};

settingsMenu.options = {
  threadHiding: 'Thread hiding',
  threadWatcher: 'Thread watcher',
  threadUpdater: 'Thread updater',
  pageTitle: 'Excerpts in page title',
  backlinks: 'Backlinks',
  quotePreview: 'Quote previews',
  quickReply: 'Quick reply'
};

settingsMenu.save = function() {
  var i, options, el, key;
  
  options = $.id('settingsMenu').getElementsByClassName('menuOption');
  
  for (i = 0; el = options[i]; ++i) {
    key = el.getAttribute('data-option');
    config[key] = el.type == 'checkbox' ? el.checked : el.value;
  }
  
  config.save();
  settingsMenu.close();
};

settingsMenu.toggle = function(e) {
  e.preventDefault();
  if ($.id('settingsMenu')) {
    settingsMenu.close();
  }
  else {
    settingsMenu.open(this.id == 'settingsWindowLinkBot');
  }
};

settingsMenu.open = function(bottom) {
  var key, html, btn;
  
  cnt = document.createElement('div');
  cnt.id = 'settingsMenu';
  cnt.style[bottom ? 'bottom' : 'top'] = '20px';
  
  html = '';
  for (key in settingsMenu.options) {
    html += '<label><input type="checkbox" class="menuOption" data-option="'
      + key + '"' + (config[key] ? ' checked="checked">' : '>')
      + settingsMenu.options[key] + '</label>';
  }
  
  cnt.innerHTML = html + '<hr>';
  
  btn = document.createElement('button');
  btn.id = 'settingsSave';
  btn.textContent = 'Save';
  btn.addEventListener('click', settingsMenu.save, false);
  cnt.appendChild(btn);
  
  btn = document.createElement('button');
  btn.id = 'settingsClose';
  btn.textContent = 'Close';
  btn.addEventListener('click', settingsMenu.close, false);
  cnt.appendChild(btn);
  
  btn = document.createElement('button');
  btn.textContent = 'Clear Local Storage';
  btn.addEventListener('click', function() { localStorage.clear(); }, false);
  cnt.appendChild(btn);
  
  document.body.appendChild(cnt);
};

settingsMenu.close = function() {
  $.id('settingsSave').removeEventListener('click', settingsMenu.save, false);
  $.id('settingsClose').removeEventListener('click', settingsMenu.close, false);
  document.body.removeChild($.id('settingsMenu'));
};

/**
 * Config
 */
var config = {
  threadHiding: true,
  threadWatcher: true,
  threadUpdater: true,
  pageTitle: true,
  backlinks: true,
  quotePreview: true,
  quickReply: true
};

config.load = function() {
  if (storage = localStorage.getItem('4chan-settings')) {
    storage = JSON.parse(storage);
    $.extend(config, storage);
  }
};

config.save = function() {
  localStorage.setItem('4chan-settings', JSON.stringify(config));
};

/**
 * Main
 */
var main = {};

main.init = function()
{
  //var start = Date.now();
  var params, storage;
  
  document.removeEventListener('DOMContentLoaded', main.init, false);
  
  injCss();
  
  main.type = style_group.split('_')[0];
  
  params = location.pathname.split(/\//);
  main.board = params[1];
  main.tid = params[3];
  
  config.load();
  
  if (config.threadHiding) {
    threadHiding.load();
  }
  
  if (config.threadWatcher) {
    threadWatcher.init();
  }
  
  if (main.tid) {
    if (config.pageTitle) {
      main.setTitle();
    }
    parser.parseThread(main.tid);
    if (config.threadUpdater) {
      threadUpdater.init();
    }
  }
  else {
    parser.parseBoard();
  }
  
  if (config.quotePreview) {
    $.mousemove(document, parser.handleMouseMove);
  }
  
  $.id('delform').addEventListener('click', main.onThreadClick, false);
  window.addEventListener('storage', main.syncStorage, false);
  
  $.id('settingsWindowLink').addEventListener('click', settingsMenu.toggle, false);
  $.id('settingsWindowLinkBot').addEventListener('click', settingsMenu.toggle, false);
	
	//console.info('4chanJS took: ' + (Date.now() - start) + 'ms');
};

main.setTitle = function() {
  var title;
  
  title = $.class('subject', $.id('pi' + main.tid))[0].textContent ||
    $.id('m' + main.tid).textContent.replace(/<br>/g, ' ').slice(0, 30) ||
    main.tid;
  
  document.title = '/' + main.board + '/ - ' + title;
};

main.quotePost = function(pid, qr) {
  var q, pos, sel, ta;
  
  if (qr) {
    ta = $.tag('textarea', document.forms.qrPost)[0];
  }
  else {
    ta = $.tag('textarea', document.forms.post)[0];
  }
  
  pos = ta.selectionStart;
  
  q = '>>' + pid + '\n';
  if (sel = window.getSelection().toString()) {
    q += '>' + sel.replace(/\n/g, '\n>') + '\n';
  }
  
  if (ta.value) {
    ta.value = ta.value.slice(0, pos)
      + q + ta.value.slice(ta.selectionEnd);
    ta.selectionStart = ta.selectionEnd = pos + q.length;
  }
  else {
    ta.value = q;
  }
  
  if (qr) {
    ta.focus();
  }
};

main.setCookie = function(key, value) {
  var d = new Date();
  d.setTime(d.getTime() + 7 * 86400000);
  document.cookie =
    encodeURIComponent(key) + '=' + encodeURIComponent(value) + '; ' +
    'expires=' + d.toUTCString() + '; ' +
    'path=/; domain=.4chan.org';
};

main.syncStorage = function(e) {
  var key = e.key.split('-');
  
  if (key[0] != '4chan') {
    return;
  }
  
  if (key[1] == 'watch' && e.newValue) {
    threadWatcher.reload(true);
  }
  else if (key[1] == 'cd' && e.newValue && main.board == key[2]) {
    QR.startCooldown(e.newValue);
  }
}

main.onThreadClick = function(e) {
  var t, ids, cmd;
  
  t = e.target;
  cmd = t.getAttribute('data-cmd');
  
  if (cmd) {
    e.preventDefault();
    if (cmd == 'qr') {
      ids = t.getAttribute('data-tid').split('-'); // tid, pid
      QR.show(ids[0], ids[1]);
      main.quotePost(ids[1], true);
    }
    else if (cmd == 'hide') {
      threadHiding.toggle(t.getAttribute('data-tid'));
    }
    else if (cmd == 'watch') {
      threadWatcher.toggle(t.getAttribute('data-tid'));
    }
    else if (cmd == 'report') {
      main.reportPost(t.getAttribute('data-tid'));
    }
    else if (cmd == 'totop') {
      location.href += '#top';
    }
  }
  // image expansion temporary fix
  else if (/fileThumb/.test(t.parentNode.className)) {
    e.preventDefault();
    parser.expandImage(t.parentNode.parentNode.id.slice(1));
  }
  else if (t.href && t.href.indexOf('quote') != -1) {
    //
  }
}

main.reportPost = function(pid) {
  window.open('https://sys.4chan.org/'
    + main.board + '/imgboard.php?mode=report&no=' + pid
    , Date.now(),
    "toolbar=0,scrollbars=0,location=0,status=1,menubar=0,resizable=1,width=680,height=200");
};

main.linkToThread = function(tid, board) {
  return '//' + location.host + '/' + (board || main.board) + '/res/' + tid;
};

config.firstRun = function()
{
	var settings = {
		"disable_all_features":"false",
		"enable_thread_expansion":"true",
		"enable_trunc_post_expansion":"true",
		"show_nav_buttons":"true",
		"show_jump_to_start_button":"true",
		"post_hiding":"true",
		"show_frames":"false",
		"show_report_button":"true",
		"show_bottom_space":"true",

		"show_button":"true",
		"show_right_click_menu":"true",
		"hide_closed_boards":"false",

		"show_browser_button":"true",

		"enable_inline_image_expanding":"true",
		"enable_spoiler_image_expanding":"true",
		"image_expand_method": "original",
		"limit_image_size":"false",
		"limit_image_size_x":"1000",
		"limit_image_size_y":"1000",
		"move_post_comment_under":"500",

		"disable_adding_after_x_replies":"1000",
		"enable_runtime_parsing":"true",

		"enable_thread_watcher":"true",
		"show_inline_view":"true",

		"enable_quick_reply":"true",

		"enable_quick_quote":"true",
		"show_in_replies":"true",
		"focus_textbox_after_quote":"true",
		"always_quote_on_new_line":"true",

		"user_data_username":"",
		"user_data_email":"",

		"move_qr_window_on_click": "true",
		"float_qr_box": "false",

		"thread_autoupdate_interval": "15",
		"enable_thread_autoupdater": "false",
		"enable_link_hover_preview": "true",

		"enable_backlinking": "true",
		"enable_link_hover_rescue": "true",

		"enable_thread_toolbox": "true",
		"show_sage_count_in_toolbox": "false",

		"enable_overlord": "false",

		"stop_parsing_after_x_replies": "500",

		"enable_thread_autoupdater_unread_style": "true",
		"unread_post_border_color": "#d9b7b7",
		"unread_post_bg_color": "#f0d6d6",

		"update_titlebar_with_new_posts": "true",
		"touch_bottom_to_clear_new_posts": "true",

		"enable_context_menu": "true",
		"enable_watched_threads": "true",

		"enable_youtube_embedding": "false",
		"youtube_embed_width": "500",
		"youtube_embed_height": "281",
		"youtube_embed_extra": "",

		"enable_soundcloud_embedding": "false",
		"soundcloud_embed_width": "400",
		"soundcloud_embed_height": "80",
		"soundcloud_embed_extra": "",

		"enable_vimeo_embedding": "false",
		"vimeo_embed_width": "500",
		"vimeo_embed_height": "281",
		"vimeo_embed_extra": "",

		"enable_vocaroo_embedding": "false",
		"vocaroo_embed_width": "148",
		"vocaroo_embed_height": "44",
		"vocaroo_embed_extra": "",


		"enable_media_embedding": "false",


		"enable_image_expansion_rescue": "false",
		"focus_captcha_on_tab": "true",

		"enable_image_search": "false",
		"enable_image_search_google": "true",
		"enable_image_search_iqdb": "false",
		"enable_image_search_tineye": "false",

		"do_update_check": "true",
		"last_xml_check": "0",
		"board_list_size": "0",

		"use_text_buttons": "false",
		"convert_date": "false",
		"timezone": "GMT",
		"date_format_noseconds": "l, jS F Y - g:ia",
		"date_format_seconds": "l, jS F Y - G:i:s",
		"enable_filter": "false",

		"reveal_spoilers": "false",

		"force_show_buttons": "true",
		"force_https": "false",

		"show_hide_button_in_reply": "false",

		"x_compat" : "false"
	};

	for( key in settings ) {
		localStorage[ '4chanext_' + key ] = settings[key];
	}

	localStorage['4chanext_firstrun'] = 'true';
};

config.gs = function( opt )
{
	var setting = localStorage['4chanext_' + opt];
	if( setting === 'true' ) return true;
	if( setting === 'false' ) return false;

	return setting;
};

config.ss = function( opt, setting )
{
	localStorage['4chanext_' + opt] = setting;
};

/********************************
 *                              *
 *          END: CONFIG         *
 *                              *
 ********************************/

if (['interactive', 'complete'].indexOf(document.readyState) != -1) {
  main.init();
}
else {
  document.addEventListener('DOMContentLoaded', main.init, false);
}

injCss = function()
{
	var css = '\
<style type="text/css">\
.postHidden blockquote, .postHidden hr, .postHidden > div:not(.postInfo), .postHidden .file, .postHidden .buttons {\
	display: none!important;\
}\
.postHidden {\
	padding-right: 5px!important;\
}\
.preview div.post div.file div.fileInfo {\
	margin-left: 0px!important;\
}\
.threadHideButton {\
	float: left;\
	margin-right: 5px;\
}\
\
div.op > span .postHideButtonCollapsed {\
	margin-right: 1px;\
}\
.extButton {\
  cursor: pointer;\
  color: inherit;\
	text-decoration: none;\
	font-size: 0.9em;\
	margin-left: 5px;\
}\
.ext_fourohfour {\
	padding: 5px;\
	text-align: center;\
}\
#threadUpdateStatus {\
  margin-left: 0.5ex;\
}\
.summary .postInfo {\
	display: inline;\
}\
.qrHeader {\
  cursor: move;\
  user-select: none;\
  -moz-user-select: none;\
  -webkit-user-select: none;\
}\
#settingsMenu {\
  position: fixed;\
  display: inline-block;\
  right: 20px;\
  background: #D9BFB7;\
  border: 1px solid gray;\
  padding: 3px;\
}\
#settingsMenu label {\
  display: block;\
  user-select: none;\
  -moz-user-select: none;\
  -webkit-user-select: none;\
}\
.pointer {\
  cursor: pointer;\
}\
.drag {\
  cursor: move;\
  user-select: none;\
  -moz-user-select: none;\
  -webkit-user-select: none;\
}\
.active {\
  font-weight: bold;\
}\
#qrCaptcha {\
  width: 300px;\
  cursor: pointer;\
}\
#quickReply {\
  position: fixed;\
}\
#qrHeader {\
  padding: 5px;\
  text-align: center;\
  line-height: 1em;\
}\
#qrClose {\
  float: right;\
  font-size: 1.5em;\
  text-decoration: none;\
}\
#qrCaptcha {\
  border: 1px solid #DFDFDF; \
}\
#qrCapField {\
  border: 1px solid #aaa;\
  width: 300px;\
  padding: 0;\
  margin-bottom: 2px;\
  font-size: 11pt;\
  display: block;\
}\
#threadWatcher {\
  max-width: 250px;\
  position: absolute;\
  background: #D9BFB7;\
  border: 1px solid gray;\
  padding: 3px;\
}\
#watchList {\
  margin: 0;\
  padding: 0;\
}\
#watchList a {\
  text-decoration: none;\
}\
#watchList li {\
  overflow: hidden;\
  white-space: nowrap;\
  text-overflow: ellipsis;\
}\
#qrCapField:invalid {\
  box-shadow: none;\
}\
</style>\
';

	$.append(document.body, css);
};