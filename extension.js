/********************************
 *                              *
 *        4chan Extension       *
 *                              *
 ********************************/

/**
 * Helpers
 */
$ = {};

$.id = function(id) {
  return document.getElementById(id);
};

$.cls = function(klass, root) {
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

$.get = function(url, callbacks, headers) {
  var key, xhr;
  
  xhr = new XMLHttpRequest();
  xhr.open('GET', url);
  if (callbacks) {
    for (key in callbacks) {
      xhr[key] = callbacks[key];
    }
  }
  if (headers) {
    for (key in headers) {
      xhr.setRequestHeader(key, headers[key]);
    }
  }
  xhr.send(null);
  return xhr;
};

$.hash = function(str) {
  var i, j, msg = 0;
  for (i = 0, j = str.length; i < j; ++i) {
    msg = ((msg << 5) - msg) + str.charCodeAt(i);
  }
  return msg;
};

/**
 * Parser
 */
var Parser = {};

Parser.init = function() {
  var o, a, h, m;
  
  if (Config.filter || Config.embedSoundCloud || Config.embedYoutube) {
    this.needMsg = true;
  }
  
  if (Config.localTime) {
    if (o = (new Date).getTimezoneOffset()) {
      a = Math.abs(o);
      h = (0 | (a / 60));
      
      this.utcOffset = ' UTC' + (o < 0 ? '+' : '-')
        + h + ((m = a - h * 60) ? (':' + m) : '');
    }
    else {
      this.utcOffset = ' UTC';
    }
    
    this.weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  }
};

Parser.buildHTMLFromJSON = function(data, board) {
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
    fileThumb,
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
    noFilename,
      
    staticPath = '//static.4chan.org',
    imgDir = '//images.4chan.org/' + board + '/src';
  
  if (data.resto == 0) {
    isOP = true;
    data.resto = data.no;
  }
  
  var noLink = data.resto + '#p' + data.no;
  var quoteLink = noLink.replace('p', 'q');

  if ((data.capcode == 'none') && data.id) {
    userId = ' <span class="posteruid id_'
      + data.id + '">(ID: <span class="hand" title="Highlight posts by this ID">'
      + data.id + '</span>)</span> ';
  }
  else {
    userId = '';
  }
  
  switch (data.capcode) {
    case 'admin':
      capcodeStart = ' <strong class="capcode hand id_admin"'
        + 'title="Highlight posts by the Administrator">## Admin</strong>';
      capcodeClass = ' capcodeAdmin';
    
      capcode = ' <img src="' + staticPath + '/image/adminicon.gif" '
        + 'alt="This user is the 4chan Administrator." '
        + 'title="This user is the 4chan Administrator." class="identityIcon"/>';
      break;
    
    case 'mod':
      capcodeStart = ' <strong class="capcode hand id_mod" '
        + 'title="Highlight posts by Moderators">## Moderator</strong>';
      capcodeClass = ' capcodeMod';
    
      capcode = ' <img src="' + staticPath + '/image/modicon.gif" '
        + 'alt="This user is a 4chan Moderator." '
        + 'title="This user is a 4chan Moderator." class="identityIcon"/>';
      break;
    
    case 'developer':
      capcodeStart = ' <strong class="capcode hand id_developer" '
        + 'title="Highlight posts by Developers">## Developer</strong>';
      capcodeClass = ' capcodeDeveloper';
    
      capcode = ' <img src="' + staticPath + '/image/developericon.gif" '
        + 'alt="This user is a 4chan Developer." '
        + 'title="This user is a 4chan Developer." class="identityIcon"/>';
      break;
    
    default:
      break;
  }

  if (data.email) {
    emailStart = '<a href="mailto:' + data.email.replace(/ /g, '%20') + '" class="useremail">';
    emailEnd = '</a>';
  }
  
  if (data.country) {
    flag = '<img src="' + staticPath + '/image/country/'
      + data.country.toLowerCase() + '.gif" alt="' + data.country + '" title="'
      + data.country_name + '" class="countryFlag"> ';
  }
  else {
    flag = '';
  }

  if (data.ext) {
    shortFile = longFile = data.filename + data.ext;
    if (data.filename.length > 40) {
      shortFile = data.filename.slice(0, 35) + '(...)' + data.ext;
    }

    if (!data.tn_w && !data.tn_h && data.ext == '.gif') {
      data.tn_w = data.w;
      data.tn_h = data.h;
    }
    if (data.fsize >= 1048576) {
      fileSize = ((0 | (data.fsize / 1048576 * 100 + 0.5)) / 100) + ' M';
    }
    else if (data.fsize > 1024) {
      fileSize = (0 | (data.fsize / 1024 + 0.5)) + ' K';
    }
    else {
      fileSize = data.fsize + ' ';
    }
    
    if (data.spoiler) {
      fileSize = 'Spoiler Image, ' + fileSize;
      if (!Config.revealSpoilers) {
        fileClass = ' imgspoiler';
        
        fileThumb = '//static.4chan.org/image/spoiler.png';
        data.tn_w = 100;
        data.tn_h = 100;
        
        noFilename = true;
      }
    }
    
    if (!fileThumb) {
      fileThumb = '//thumbs.4chan.org/' + board + '/thumb/' + data.tim + 's.jpg';
    }
    
    imgSrc = '<a class="fileThumb' + fileClass + '" href="' + imgDir + '/'
      + data.tim + data.ext + '" target="_blank"><img src="' + fileThumb
      + '" alt="' + fileSize + 'B" data-md5="' + data.md5
      + '" style="height: ' + data.tn_h + 'px; width: '
      + data.tn_w + 'px;"></a>';
    
    if (data.filedeleted) {
      imgSrc = '<span class="fileThumb"><img src="' + staticPath
      + '/image/filedeleted-res.gif" alt="File deleted."></span>';
      fileInfo = '';
    }
    else {
      fileDims = data.ext == '.pdf' ? 'PDF' : data.w + 'x' + data.h;
      fileInfo = '<span class="fileText" id="fT' + data.no
        + '">File: <a href="' + imgDir + '/' + data.tim + data.ext
        + '" target="_blank">' + data.tim + data.ext + '</a>-(' + fileSize
        + 'B, ' + fileDims
        + (noFilename ? '' : (', <span title="' + longFile + '">'
        + shortFile + '</span>')) + ')</span>';
    }
    
    fileBuildStart = fileInfo ? '<div class="fileInfo">' : '';
    fileBuildEnd = fileInfo ? '</div>' : '';
    
    fileHtml = '<div id="f' + data.no + '" class="file">'
      + fileBuildStart + fileInfo + fileBuildEnd + imgSrc + '</div>';
  }
  
  if (shortSubject = data.sub) {
    if (shortSubject.length > 28) {
      shortSubject = data.sub.replace('&#44;', ',');
      shortSubject = '<span title="' + shortSubject + '">'
        + shortSubject.slice(0, 23) + '(...)</span>';
    }
  }
  else {
    data.sub = '';
  }
  
  container.className = 'postContainer replyContainer';
  container.id = 'pc' + data.no;
  
  container.innerHTML =
    '<div class="sideArrows" id="sa' + data.no + '">&gt;&gt;</div>' +
    '<div id="p' + data.no + '" class="post ' + (isOP ? 'op' : 'reply') + highlight + '">' +
      '<div class="postInfoM mobile" id="pim' + data.no + '">' +
        '<span class="nameBlock' + capcodeClass + '"> ' + emailStart +
        '<span class="name">' + data.name + '</span>' +
        emailEnd + capcodeStart + emailEnd + userId + flag +
        '<br><span class="subject">' + data.sub +
        '</span></span><span class="dateTime postNum" data-utc="' + data.time + '">' +
        data.now + '<br><em><a href="' + data.no + '#p' + data.no + '">No.</a>' +
        '<a href="javascript:quote(\'' + data.no + '\');">' + data.no + '</a></em></span>' +
      '</div>' +
      (isOP ? fileHtml : '') +
      '<div class="postInfo desktop" id="pi' + data.no + '">' +
        '<input type="checkbox" name="' + data.no + '" value="delete"> ' +
        '<span class="subject">' + data.sub + '</span> ' +
        '<span class="nameBlock' + capcodeClass + '"> ' +
          emailStart + '<span class="name">' + data.name + '</span>' + emailEnd
          + capcodeStart + emailEnd + userId + flag +
        '</span> ' +
  
        '<span class="dateTime" data-utc="' + data.time + '">' + data.now + '</span> ' +
  
        '<span class="postNum desktop">' +
          '<a href="' + noLink + '" title="Highlight this post">No.</a><a href="' +
          quoteLink + '">' + data.no + '</a>' +
        '</span>' +
      '</div>' +
      (isOP ? '' : fileHtml) +
      '<blockquote class="postMessage" id="m' + data.no + '">' + data.com + '</blockquote> ' +
    '</div>';
    
  return container;
};

Parser.parseBoard = function()
{
  var i, threads = document.getElementsByClassName('thread');
  
  for (i = 0; threads[i]; ++i) {
    Parser.parseThread(threads[i].id.slice(1));
  }
  
  if (UA.hasCustomEventCtor) {
    document.dispatchEvent(new CustomEvent('4chanParsingDone'));
  }
};

Parser.parseThread = function(tid, offset, limit) {
  var i, j, thread, posts, pi, el, frag, summary, omitted, key, filtered;
  
  thread = $.id('t' + tid);
  posts = thread.getElementsByClassName('post');
  
  if (!offset) {
    pi = document.getElementById('pi' + tid);
    
    if (!Main.tid) {
      if (Config.filter) {
        filtered = Filter.exec(
          thread,
          pi, 
          thread.getElementsByClassName('nameBlock')[0],
          document.getElementById('m' + tid)
        );
      }
      
      if (Config.threadHiding && !filtered) {
        el = document.createElement('span');
        el.id = 'sa' + tid;
        el.alt = 'H';
        el.innerHTML = '<img class="extButton threadHideButton"'
          + 'data-cmd="hide" data-id="' + tid + '" src="'
          + Main.icons.minus + '" title="Hide thread">';
        posts[0].insertBefore(el, posts[0].firstChild);
        if (ThreadHiding.hidden[tid]) {
          ThreadHiding.hidden[tid] = Main.now;
          ThreadHiding.hide(tid);
        }
      }
      
      if (Config.threadExpansion
          && (summary = thread.children[1])
          && $.hasClass(summary, 'summary')) {
        frag = document.createDocumentFragment();
        
        omitted = summary.cloneNode(true);
        omitted.className = '';
        summary.textContent = '';
        
        el = document.createElement('img');
        el.className = 'extButton expbtn';
        el.title = 'Expand thread';
        el.alt = '+';
        el.setAttribute('data-cmd', 'expand');
        el.setAttribute('data-id', tid);
        el.src = Main.icons.plus;
        frag.appendChild(el);
        
        frag.appendChild(omitted);
        
        el = document.createElement('span');
        el.style.display = 'none';
        el.textContent = 'Showing all replies.'
        frag.appendChild(el);
        
        summary.appendChild(frag);
      }
    }
    
    if (Config.threadWatcher) {
      el = document.createElement('img');
      el.className = 'extButton wbtn';
      if (ThreadWatcher.watched[key = tid + '-' + Main.board]) {
        el.src = Main.icons.watched;
        el.setAttribute('data-active', '1');
      }
      else {
        el.src = Main.icons.notwatched;
      }
      el.id = 'wbtn-' + key;
      el.setAttribute('data-cmd', 'watch');
      el.setAttribute('data-id', tid);
      el.alt = 'W';
      el.title = 'Add to watch list';
      pi.insertBefore(el, pi.firstChild);
    }
  }
  
  j = offset ? offset < 0 ? posts.length + offset : offset : 0;
  limit = limit ? j + limit : posts.length;
  
  for (i = j; i < limit; ++i) {
    Parser.parsePost(posts[i].id.slice(1), tid);
  }
  
  if (offset && Main.prettify) {
    for (i = j; i < limit; ++i) {
      Parser.parseMarkup(posts[i]);
    }
  }
  
  if (Main.tid && UA.hasCustomEventCtor) {
    document.dispatchEvent(new CustomEvent('4chanParsingDone', { detail: j }));
  }
};

Parser.parseMarkup = function(post) {
  var i, pre, el;
  
  if ((pre = post.getElementsByClassName('prettyprint'))[0]) {
    for (i = 0; el = pre[i]; ++i) {
      el.innerHTML = prettyPrintOne(el.innerHTML);
    }
  }
};

Parser.parsePost = function(pid, tid) {
  var cnt, el, pi, href, img, file, msg, filtered;
  
  if (tid) {
    pi = document.getElementById('pi' + pid);
    
    if (Parser.needMsg) {
      msg = document.getElementById('m' + pid);
    }
    
    if (pid != tid) {
      if (Config.filter) {
        filtered = Filter.exec(pi.parentNode, pi, pi.children[2], msg);
      }
      
      if (Config.replyHiding && !filtered) {
        el = document.getElementById('sa' + pid);
        el.innerHTML = '<img class="extButton"'
          + 'data-cmd="hide-r" data-id="' + pid + '" src="'
          + Main.icons.minus + '" title="Hide reply">';
        if (ReplyHiding.hidden[pid]) {
          ReplyHiding.hidden[pid] = Main.now;
          ReplyHiding.hide(pid);
        }
      }
      
      if (Config.backlinks) {
        Parser.parseBacklinks(pid, tid);
      }
    }
    
    if (Main.tid) {
      if (Config.embedSoundCloud) {
        Media.parseSoundCloud(msg);
      }
      
      if (Config.embedYouTube) {
        Media.parseYouTube(msg);
      }
    }
    
    cnt = document.createElement('div');
    cnt.className = 'extControls';
    
    if (QR.enabled) {
      el = document.createElement('img');
      el.className = 'extButton';
      el.src = Main.icons.quote;
      el.setAttribute('data-cmd', 'qr');
      el.setAttribute('data-id', tid + '-' + pid);
      el.title = 'Quick reply';
      el.alt = 'Q';
      cnt.appendChild(el);
    }
    
    if (Config.reportButton) {
      el = document.createElement('img');
      el.className = 'extButton';
      el.src = Main.icons.report;
      el.setAttribute('data-cmd', 'report');
      el.setAttribute('data-id', pid);
      el.title = 'Report post';
      el.alt = '!';
      cnt.appendChild(el);
    }
    
    if (cnt.firstChild) {
      pi.appendChild(cnt);
    }
    
    if (Config.imageSearch && (file = document.getElementById('fT' + pid))) {
      href = file.firstElementChild.href;
      el = document.createElement('div');
      el.className = 'extControls';
      el.innerHTML =
        '<a href="//www.google.com/searchbyimage?image_url=' + href
        + '" target="_blank" title="Google Image Search"><img class="extButton" src="'
        + Main.icons.gis + '" alt="G"></a><a href="http://iqdb.org/?url='
        + href + '" target="_blank" title="iqdb"><img class="extButton" src="'
        + Main.icons.iqdb + '" alt="I"></a>';
      file.parentNode.appendChild(el);
    }
  }
  else {
    pi = pid.getElementsByClassName('postInfo')[0];
    pid = pi.id.slice(2);
  }
  
  if (Config.revealSpoilers
      && (file = document.getElementById('f' + pid))
      && (file = file.children[1])
    ) {
    img = file.firstChild;
    file.removeChild(img);
    img.removeAttribute('style');
    if ($.hasClass(file, 'imgspoiler')) {
      img.style.maxWidth = img.style.maxHeight
        = $.hasClass(pi.parentNode, 'op') ? '250px' : '125px';
      
      img.src = '//thumbs.4chan.org'
        + (file.pathname.replace(/src(\/[0-9]+).+$/, 'thumb$1s.jpg'))
      
      filename = file.previousSibling.firstChild;
      filename.lastChild.textContent
        = filename.lastChild.textContent.slice(0, -1) + ', ' + filename.title + ')';
    }
    file.appendChild(img);
  }
  
  if (Config.localTime) {
    el = pi.getElementsByClassName('dateTime')[0];
    el.textContent
      = Parser.getLocaleDate(new Date(el.getAttribute('data-utc') * 1000))
      + this.utcOffset;
  }
  
};

Parser.getLocaleDate = function(date) {
  return ('0' + date.getMonth()).slice(-2) + '/'
    + ('0' + date.getDate()).slice(-2) + '/'
    + ('0' + date.getFullYear()).slice(-2) + '/('
    + this.weekdays[date.getDay()] + ')'
    + ('0' + date.getHours()).slice(-2) + ':'
    + ('0' + date.getMinutes()).slice(-2) + ':'
    + ('0' + date.getSeconds()).slice(-2);
};

Parser.parseBacklinks = function(pid, tid)
{
  var i, j, msg, backlinks, linklist, ids, target, bid, html, bl, el;
  
  msg = document.getElementById('m' + pid);
  
  if (!(backlinks = msg.getElementsByClassName('quotelink'))) {
    return;
  }
  
  linklist = {};
  
  for (i = 0; j = backlinks[i]; ++i) {
    // [tid, pid]
    ids = j.getAttribute('href').split('#p');
    
    if (!ids[1]) {
      continue;
    }
    
    if (ids[1] == Main.tid) {
      j.textContent += ' (OP)';
    }
    
    if (!(target = document.getElementById('m' + ids[1]))) {
      if (Main.tid && ids[0].charAt(0) != '/') {
        j.textContent += ' →';
      }
      continue;
    }
    
    // Already processed?
    if (linklist[ids[1]]) {
      continue;
    }
    
    linklist[ids[1]] = true;
    
    // Backlink node
    bl = document.createElement('span');
    bl.innerHTML =
      '<a href="#p' + pid + '" class="quotelink">&gt;&gt;' + pid + '</a> ';
    
    // Backlinks container
    if (!(el = document.getElementById('bl_' + ids[1]))) {
      el = document.createElement('div');
      el.id = 'bl_' + ids[1];
      el.className = 'backlink';
      el.innerHTML = 'Replies: ';
      target.parentNode.insertBefore(el, target);
    }
    
    el.appendChild(bl);
  }
};

/**
 * Quote preview
 */
var QuotePreview = {};

QuotePreview.init = function() {
  var thread;
  
  this.debounce = 250;
  this.timeout = null;
  this.xhr = null;
  this.cachedKey = null;
  this.cachedNode = null;
  this.highlight = null;
};

QuotePreview.resolve = function(link) {
  var self, t, post, ids, offset;
  
  self = QuotePreview;
  
  // [ string, board, tid, pid ]
  t = link.getAttribute('href')
    .match(/^(?:\/([^\/]+)\/)?(?:res\/)?([0-9]+)?#p([0-9]+)$/);
  
  if (!t) {
    return;
  }
  
  // Quoted post in scope
  if (post = document.getElementById('p' + t[3])) {
    // Visible and not filtered out?
    offset = post.getBoundingClientRect();
    if (offset.top > 0
        && offset.bottom < document.documentElement.clientHeight
        && !$.hasClass(post.parentNode, 'post-hidden')) {
      this.highlight = post;
      $.addClass(post, 'highlight');
      return;
    }
    // Nope
    self.show(link, post);
  }
  // Quoted post out of scope
  else {
    if (!t[1]) {
      t[1] = Main.board;
    }
    if (self.cachedKey == [t[1], t[2], t[3]].join('-')) {
      self.show(link, self.cachedNode, true);
    }
    else {
      self.timeout = setTimeout(
        self.showRemote,
        self.debounce,
        link, t[1] || Main.board, t[2], t[3]
      );
    }
  }
};

QuotePreview.showRemote = function(link, board, tid, pid) {
  var onload, onerror;
  
  link.style.cursor = 'wait';
  
  onload = function() {
    var i, j, el, posts;
    
    link.style.cursor = '';
    
    if (this.status == 200 || this.status == 304 || this.status == 0) {
      if (!QuotePreview.xhr) {
        return;
      }
      
      posts = JSON.parse(this.responseText).posts;
      
      for (i = 0; j = posts[i]; ++i) {
        if (j.no != pid) {
          continue;
        }
        el = $.cls('post', Parser.buildHTMLFromJSON(j, board))[0];
        el.className = 'post preview';
        el.style.display = 'none';
        el.id = 'quote-preview';
        
        QuotePreview.cachedKey = [board, tid, pid].join('-');
        QuotePreview.cachedNode = el;
        
        document.body.appendChild(el);
        
        QuotePreview.show(link, el, true);
        
        return;
      }
    }
    else if (this.status == 404) {
      $.addClass(link, 'deadlink');
    }
  };
  
  onerror = function() {
    link.style.cursor = '';
  };
  
  QuotePreview.xhr =
    $.get('//api.4chan.org/' + board + '/res/' + tid + '.json',
      {
        onload: onload,
        onerror: onerror
      }
    );
};

QuotePreview.show = function(link, post, remote) {
    var rect, docWidth, offsetLimit, style, pos;
    
    if (remote) {
      Parser.parsePost(post);
      post.style.display = '';
    }
    else {
      post = post.cloneNode(true);
      post.id = 'quote-preview';
      post.className += ' preview';
    }
    
    rect = link.getBoundingClientRect();
    docWidth = document.documentElement.offsetWidth;
    style = post.style;
    
    document.body.appendChild(post);
    
    if ((docWidth - rect.right) < (0 | (docWidth * 0.3))) {
      pos = docWidth - rect.left;
      style.right = pos + 5 + 'px'
    }
    else {
      pos = rect.left + rect.width;
      style.left = pos + 5 + 'px';
    }
    
    style.top =
      rect.top + link.offsetHeight + window.scrollY -
      post.offsetHeight / 2 - rect.height / 2 + 'px';
};

QuotePreview.remove = function(el) {
  var cnt;
  
  if (QuotePreview.highlight) {
    $.removeClass(QuotePreview.highlight, 'highlight');
  }
  
  clearTimeout(QuotePreview.timeout);
  el.style.cursor = '';
  if (QuotePreview.xhr) {
    QuotePreview.xhr.abort();
    QuotePreview.xhr = null;
  }
  
  if (cnt = document.getElementById('quote-preview')) {
    document.body.removeChild(cnt);
  }
};

/**
 * Image expansion
 */
var ImageExpansion = {};

ImageExpansion.expand = function(thumb) {
  var img;
  
  img = document.createElement('img');
  img.alt = 'Image';
  img.className = 'fitToPage';
  img.setAttribute('src', thumb.parentNode.getAttribute('href'));
  img.style.display = 'none';
  thumb.parentNode.appendChild(img);
  setTimeout(ImageExpansion.checkLoadStart, 15, img, thumb);
};

ImageExpansion.contract = function(img) {
  var p = img.parentNode;
  
  p.parentNode.style.display = '';
  p.firstChild.style.display = '';
  p.removeChild(img);
};

ImageExpansion.toggle = function(t) {
  if (t.hasAttribute('data-md5')) {
    ImageExpansion.expand(t);
  }
  else {
    ImageExpansion.contract(t);
  }
};

ImageExpansion.checkLoadStart = function(img, thumb) {
  if (img.naturalWidth) {
    thumb.parentNode.parentNode.style.display = 'table';
    img.style.display = '';
    thumb.style.display = 'none';
  }
  else {
    setTimeout(ImageExpansion.checkLoadStart, 15, img, thumb);
  }
};

ImageExpansion.onExpanded = function(e) {
  this.onload = this.onerror = null;
  this.style.opacity = 1;
  $.addClass(this, 'fitToPage');
};

/**
 * Quick reply
 */
var QR = {};

QR.init = function() {
  if (!UA.hasCORS || !document.forms.post) {
    this.enabled = false;
    return;
  }
  this.enabled = true;
  this.currentTid = null;
  this.cooldown = null;
  this.auto = false;
  this.baseDelay = 30500;
  this.sageDelay = 60500;
  this.captchaDelay = 240500;
  this.captchaInterval = null;
  this.pulse = null;
  this.xhr = null;
};

QR.quotePost = function(pid, qr) {
  var q, pos, sel, ta;
  
  if (qr) {
    ta = $.tag('textarea', document.forms.qrPost)[0];
  }
  else {
    ta = $.tag('textarea', document.forms.post)[0];
  }
  
  pos = ta.selectionStart;
  
  if (UA.isOpera) {
    sel = document.getSelection();
  }
  else {
    sel = window.getSelection().toString()
  }
  
  q = '>>' + pid + '\n';
  if (sel) {
    q += '>' + sel.replace(/\n/g, '\n>') + '\n';
  }
  
  if (ta.value) {
    ta.value = ta.value.slice(0, pos)
      + q + ta.value.slice(ta.selectionEnd);
  }
  else {
    ta.value = q;
  }
  
  if (UA.isOpera) {
    pos += q.split('\n').length;
  }
  
  ta.selectionStart = ta.selectionEnd = pos + q.length;
  
  if (qr) {
    ta.focus();
  }
};

QR.show = function(tid, pid) {
  var i, j, cnt, postForm, form, table, fields, tr, tbody, spoiler, file,
    el, cd, qrError;
  
  if (QR.currentTid) {
    if (!Main.tid && QR.currentTid != tid) {
      $.id('qrTid').textContent = $.id('qrResto').value = QR.currentTid = tid;
      $.byName('com')[1].value = '';
    }
    return;
  }
  
  QR.currentTid = tid;
  
  postForm = $.id('postForm');
  
  cnt = document.createElement('div');
  cnt.id = 'quickReply';
  cnt.className = 'extPanel reply';
  cnt.setAttribute('data-trackpos', 'QR-position');
  
  if (Config['QR-position']) {
    cnt.style.cssText = Config['QR-position'];
  }
  else {
    cnt.style.right = '0px';
    cnt.style.top = '50px';
  }
  
  cnt.innerHTML =
    '<div id="qrHeader" class="drag postblock">Quick Reply - Thread No.<span id="qrTid">'
    + tid + '</span><img alt="X" src="' + Main.icons.cross + '" id="qrClose" '
    + 'class="extButton" title="Close Window"></div>';
  
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
      el = tr.firstChild;
      if (el.textContent == 'File') {
        file = el.nextSibling.firstChild
        file.id = 'qrFile';
        
        el = document.createElement('input');
        el.id = 'qrDummyFile';
        el.type = 'text';
        el.title = 'Shift + Click to remove the file';
        el.readOnly = true;
        el.setAttribute('autocomplete', 'off');
        file.parentNode.insertBefore(el, file);
        
        el = document.createElement('button');
        el.id = 'qrBrowse';
        el.setAttribute('type', 'button');
        el.textContent = 'Browse';
        file.parentNode.insertBefore(el, file);
        
        file.addEventListener('change', QR.onFileChanged, false);
      }
      else if (el.textContent == 'Password') {
        el.nextSibling.firstChild.id = 'qrPassword';
      }
    }
    tbody.appendChild(tr);
  }
  
  if (spoiler = tbody.querySelector('input[name="spoiler"]')) {
    spoiler = spoiler.parentNode.parentNode;
    spoiler.parentNode.removeChild(spoiler);
    spoiler.innerHTML
      = '<label>[<input type="checkbox" value="on" name="spoiler">Spoiler?]</label>';
    file.parentNode.insertBefore(spoiler, file.nextSibling);
    $.tag('textarea', tbody)[0].addEventListener('keydown', QR.spoilerText, false);
  }
  
  form.appendChild(table);
  cnt.appendChild(form);
  
  qrError = document.createElement('div');
  qrError.id = 'qrError';
  cnt.appendChild(qrError);
  
  cnt.addEventListener('click', QR.onClick, false);
  
  document.body.appendChild(cnt);
  
  if (cd = localStorage.getItem('4chan-cd-' + Main.board)) {
    QR.startCooldown(cd);
  }
  
  QR.reloadCaptcha();
  
  Draggable.set($.id('qrHeader'));
};

QR.spoilerText = function(e) {
  if (e.ctrlKey && e.keyCode == 83) {
    var ta, start, end, spoiler;
    
    e.stopPropagation();
    e.preventDefault();
    
    ta = e.target;
    start = ta.selectionStart;
    end = ta.selectionEnd;
  
    if (ta.value) {
      spoiler = '[spoiler]' + ta.value.slice(start, end) + '[/spoiler]';
      ta.value = ta.value.slice(0, start) + spoiler + ta.value.slice(end);
      ta.setSelectionRange(end + 19, end + 19);
    }
    else {
      ta.value = '[spoiler][/spoiler]';
      ta.setSelectionRange(9, 9);
    }
  }
};

QR.close = function() {
  var cnt = $.id('quickReply');
  
  QR.currentTid = null;
  
  clearInterval(QR.captchaInterval);
  clearInterval(QR.pulse);
  
  if (QR.xhr) {
    QR.xhr.abort();
    QR.xhr = null;
  }
  
  cnt.removeEventListener('click', QR.onClick, false);
  Draggable.unset($.id('qrHeader'));
  $.id('qrFile').removeEventListener('change', QR.onFileChanged, false);
  $.tag('textarea', cnt)[0].removeEventListener('keydown', QR.spoilerText, false);
  
  document.body.removeChild(cnt);
};

QR.onFileChanged = function(e) {
  $.id('qrDummyFile').value = e.target.files[0].name;
};

QR.cloneCaptcha = function() {
  $.id('qrCaptcha').src = $.id('recaptcha_image').firstChild.src;
  $.id('qrChallenge').value = $.id('recaptcha_challenge_field').value;
  $.id('qrCapField').value = '';
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
        = setInterval(QR.cloneCaptcha, QR.captchaDelay);
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
  
  if (t.type == 'submit') {
    e.preventDefault();
    QR.submit(e.shiftKey);
  }
  else {
    switch (t.id) {
      case 'qrBrowse':
      case 'qrDummyFile':
        if (e.shiftKey) {
          QR.resetFile();
        }
        else {
          $.id('qrFile').click();
        }
        break;
      case 'qrCaptcha':
        QR.reloadCaptcha(true);
        break;
      case 'qrClose':
        QR.close();
        break;
    }    
  }
};

QR.showPostError = function(msg) {
  var qrError;
  
  qrError = $.id('qrError');
  qrError.innerHTML = msg;
  qrError.style.display = 'block';
  if (document.hidden
    || document.mozHidden
    || document.webkitHidden
    || document.msHidden) {
    alert('Posting Error');
  }
};

QR.hidePostError = function() {
  $.id('qrError').style.display = 'none';
};

QR.resetFile = function() {
  var file, el;
  
  el = document.createElement('input');
  el.id = 'qrFile';
  el.type = 'file';
  el.name = 'upfile';
  el.addEventListener('change', QR.onFileChanged, false);
  
  file = $.id('qrFile');
  file.removeEventListener('change', QR.onFileChanged, false);
  
  file.parentNode.replaceChild(el, file);
  
  $.id('qrDummyFile').value = '';
};

QR.submit = function(force) {
  var i, btn, cd, email, field;
  
  QR.hidePostError();
  btn = $.id('quickReply').querySelector('input[type="submit"]');
  
  if (QR.xhr) {
    QR.xhr.abort();
    QR.xhr = null;
    QR.showPostError('Aborted');
    btn.value = 'Submit';
    return;
  }
  
  if (!force && QR.cooldown) {
    if (QR.auto = !QR.auto) {
      btn.value = QR.cooldown + 's (auto)';
    }
    else {
      btn.value = QR.cooldown + 's';
    }
    return;
  }
  
  QR.auto = false;
  
  if (!force && (field = $.id('qrCapField')).value == '') {
    QR.showPostError('You forgot to type in the CAPTCHA.');
    field.focus();
    return;
  }
  
  if (field = $.byName('name')[1]) {
    Main.setCookie('4chan_name', field.value);
  }
  if (field = $.byName('pwd')[1]) {
    Main.setCookie('4chan_pass', field.value);
  }
  if ((email = $.byName('email')[1]) && email.value != 'sage') {
    Main.setCookie('4chan_email', email.value);
  }
  
  QR.xhr = new XMLHttpRequest();
  QR.xhr.open('POST', document.forms.qrPost.action, true);
  QR.xhr.withCredentials = true;
  QR.xhr.upload.onprogress = function(e) {
    if (e.loaded >= e.total) {
      btn.value = '100%';
    }
    else {
      btn.value = (0 | (e.loaded / e.total * 100)) + '%';
    }
  };
  QR.xhr.onerror = function() {
    btn.value = 'Submit';
    QR.xhr = null;
    QR.showPostError('Connection error. Are you <a href="https://www.4chan.org/banned">banned</a>?');
  };
  QR.xhr.onload = function() {
    var resp;
    
    QR.xhr = null;
    
    btn.value = 'Submit';
    
    if (this.status == 200) {
      if (resp = this.responseText.match(/"errmsg"[^>]*>(.*?)<\/span/)) {
        QR.reloadCaptcha();
        QR.showPostError(resp[1]);
        return;
      }
      
      if (/You are banned! ;_;/.test(this.responseText)) {
        if (/heeding this warning/.test(this.responseText)) {
          resp = this.responseText
            .split(/<br\/><br\/>\n<b>/)[1]
            .split(/<\/b><br\/><br\/>/)[0];
          QR.showPostError('<h3>You were issued a warning:<h3>' + resp);
        }
        else {
          QR.showPostError('You are <a href="https://www.4chan.org/banned">banned</a>! ;_;');
        }
        QR.reloadCaptcha();
        return;
      }
      
      if (/sage/i.test(email.value)) {
        cd = Main.tid ? QR.sageDelay : QR.baseDelay;
      }
      else {
        cd = QR.baseDelay;
      }
      
      cd += Date.now();
      localStorage.setItem('4chan-cd-' + Main.board, cd);
      QR.startCooldown(cd);
      
      if (Main.tid) {
        $.byName('com')[1].value = '';
        QR.reloadCaptcha();
        if ($.id('qrFile').value) {
          QR.resetFile();
        }
        if (Config.threadUpdater) {
          setTimeout(ThreadUpdater.forceUpdate, 500);
        }
        return;
      }
    }
    else {
      QR.showPostError('Error: ' + this.status + ' ' + this.statusText);
    };
  }
  clearInterval(QR.pulse);
  btn.value = 'Sending';
  QR.xhr.send(new FormData(document.forms.qrPost));
};

QR.startCooldown = function(ms) {
  var btn, interval;
  
  if (!(btn = $.id('quickReply')) || QR.xhr) {
    return;
  }
  
  btn = btn.querySelector('input[type="submit"]');
  
  ms = parseInt(ms, 10);
  
  if ((QR.cooldown = 0 | ((ms - Date.now()) / 1000)) <= 0) {
    QR.cooldown = false;
    localStorage.removeItem('4chan-cd-' + Main.board);
    return;
  }
  btn.value = QR.cooldown + 's';
  QR.pulse = setInterval(function() {
    if ((QR.cooldown = 0 | ((ms - Date.now()) / 1000)) <= 0) {
      clearInterval(QR.pulse);
      btn.value = 'Submit';
      QR.cooldown = false;
      localStorage.removeItem('4chan-cd-' + Main.board);
      if (QR.auto) {
        QR.submit();
      }
    }
    else {
      btn.value = QR.cooldown + (QR.auto ? 's (auto)' : 's');
    }
  }, 1000);
};

/**
 * Thread hiding
 */
var ThreadHiding = {};

ThreadHiding.init = function() {
  this.threshold = 7 * 86400000;
  this.hidden = {};
  this.load();
};

ThreadHiding.toggle = function(tid) {
  if ($.id('sa' + tid).hasAttribute('data-hidden')) {
    this.show(tid);
  }
  else {
    this.hide(tid);
  }
  this.save();
};

ThreadHiding.show = function(tid) {
  var sa;
  
  sa = $.id('sa' + tid);
  sa.removeAttribute('data-hidden');
  sa.firstChild.src = Main.icons.minus;
  
 $.removeClass( $.id('t' + tid), 'post-hidden');
  
  delete this.hidden[tid];
};

ThreadHiding.hide = function(tid) {
  var sa;
  
  sa = $.id('sa' + tid);
  sa.setAttribute('data-hidden', tid);
  sa.firstChild.src = Main.icons.plus;
  
  $.id('t' + tid).className += ' post-hidden';
  
  this.hidden[tid] = Date.now();
};

ThreadHiding.load = function() {
  var storage;
  
  if (storage = localStorage.getItem('4chan-hide-t-' + Main.board)) {
    this.hidden = JSON.parse(storage);
  }
};

ThreadHiding.purge = function() {
  var tid, now;
  
  now = Date.now();
  
  for (tid in this.hidden) {
    if (now - this.hidden[tid] > this.threshold) {
      delete this.hidden[tid];
    }
  }
  this.save();
};

ThreadHiding.save = function() {
  for (var i in this.hidden) {
    localStorage.setItem('4chan-hide-t-' + Main.board,
      JSON.stringify(this.hidden)
    );
    return;
  }
  localStorage.removeItem('4chan-hide-t-' + Main.board);
};

/**
 * Reply hiding
 */
var ReplyHiding = {};

ReplyHiding.init = function() {
  this.threshold = 7 * 86400000;
  this.hidden = {};
  this.load();
};

ReplyHiding.toggle = function(pid) {
  if ($.id('sa' + pid).hasAttribute('data-hidden')) {
    this.show(pid);
  }
  else {
    this.hide(pid);
  }
  this.save();
};

ReplyHiding.show = function(pid) {
  var post, sa;
  
  post = $.id('pc' + pid);
  
  $.removeClass(post, 'post-hidden');
  
  sa = $.id('sa' + pid);
  sa.removeAttribute('data-hidden');
  sa.firstChild.src = Main.icons.minus;
  
  delete this.hidden[pid];
};

ReplyHiding.hide = function(pid) {
  var post, sa;
  
  post = $.id('pc' + pid);
  post.className += ' post-hidden';
  
  sa = $.id('sa' + pid);
  sa.setAttribute('data-hidden', pid);
  sa.firstChild.src = Main.icons.plus;
  
  this.hidden[pid] = Date.now();
};

ReplyHiding.load = function() {
  var storage;
  
  if (storage = localStorage.getItem('4chan-hide-r-' + Main.board)) {
    this.hidden = JSON.parse(storage);
  }
};

ReplyHiding.purge = function() {
  var tid, now;
  
  now = Date.now();
  
  for (tid in this.hidden) {
    if (now - this.hidden[tid] > this.threshold) {
      delete this.hidden[tid];
    }
  }
  this.save();
};

ReplyHiding.save = function() {
  for (var i in this.hidden) {
    localStorage.setItem('4chan-hide-r-' + Main.board,
      JSON.stringify(this.hidden)
    );
    return;
  }
  localStorage.removeItem('4chan-hide-r-' + Main.board);
};

/**
 * Thread watcher
 */
var ThreadWatcher = {};

ThreadWatcher.init = function() {
  var cnt, html;
  
  this.listNode = null;
  this.charLimit = 40;
  this.watched = {};
  
  cnt = document.createElement('div');
  cnt.id = 'threadWatcher';
  cnt.className = 'extPanel reply';
  cnt.setAttribute('data-trackpos', 'TW-position');
  
  if (Config['TW-position']) {
    cnt.style.cssText = Config['TW-position'];
  }
  else {
    cnt.style.left = '10px';
    cnt.style.top = '380px';
  }
  
  if (Config.fixedThreadWatcher) {
    cnt.style.position = 'fixed';
  }
  else {
    cnt.style.position = '';
  }
  
  cnt.innerHTML = '<div class="drag" id="twHeader">Thread Watcher'
    + '<img id="twPrune" class="pointer right" src="'
    + Main.icons.down2 + '" alt="R" title="Prune"></div>';
  
  ThreadWatcher.listNode = document.createElement('ul');
  ThreadWatcher.listNode.id = 'watchList';
  ThreadWatcher.reload();
  cnt.appendChild(ThreadWatcher.listNode);
  
  document.body.appendChild(cnt);
  
  cnt.addEventListener('click', ThreadWatcher.onClick, false);
  Draggable.set($.id('twHeader'));
};

ThreadWatcher.reload = function(full) {
  var i, storage, html, tuid, key, buttons, bn;
  
  html = '';
  if (storage = localStorage.getItem('4chan-watch')) {
    ThreadWatcher.watched = JSON.parse(storage);
    
    for (key in ThreadWatcher.watched) {
      tuid = key.split('-');
      html += '<li id="watch-' + key
        + '"><span class="pointer" data-cmd="unwatch" data-id="'
        + tuid[0] + '" data-board="' + tuid[1] + '">&times;</span> <a href="'
        + Main.linkToThread(tuid[0], tuid[1]) + '">/'
        + tuid[1] + '/ - '
        + ThreadWatcher.watched[key] + '</a></li>';
    }
    
    if (full) {
      buttons = $.cls('wbtn', $.id('delform'));
      for (i = 0; btn = buttons[i]; ++i) {
        key = btn.getAttribute('data-id') + '-' + Main.board;
        if (ThreadWatcher.watched[key]) {
          if (!btn.hasAttribute('data-active')) {
            btn.src = Main.icons.watched;
            btn.setAttribute('data-active', '1')
          }
        }
        else {
          if (btn.hasAttribute('data-active')) {
            btn.src = Main.icons.notwatched;
            btn.removeAttribute('data-active')
          }
        }
      }
    }
  }
  
  ThreadWatcher.listNode.innerHTML = html;
};

ThreadWatcher.onClick = function(e) {
  var t = e.target;
  if (t.hasAttribute('data-id')) {
    ThreadWatcher.toggle(
      t.getAttribute('data-id'),
      t.getAttribute('data-board')
    );
  }
  else if (t.src) {
    ThreadWatcher.prune();
  }
};

ThreadWatcher.toggle = function(tid, board, synced) {
  var key, label, btn;
  
  key = tid + '-' + (board || Main.board);
  
  if (ThreadWatcher.watched[key]) {
    delete ThreadWatcher.watched[key];
    if (btn = $.id('wbtn-' + key)) {
      btn.src = Main.icons.notwatched;
      btn.removeAttribute('data-active');
    }
  }
  else {
    if (label = $.cls('subject', $.id('pi' + tid))[0].textContent) {
      label = label.slice(0, ThreadWatcher.charLimit);
    }
    else if (label = $.id('m' + tid).innerHTML) {
      label = label.replace(/<br>/g, ' ')
        .replace(/<[^>]*?>/g, '').slice(0, ThreadWatcher.charLimit);
    }
    else {
      label = tid;
    }
    ThreadWatcher.watched[key] = label;
    if (btn = $.id('wbtn-' + key)) {
      btn.src = Main.icons.watched;
      btn.setAttribute('data-active', '1');
    }
  }
  ThreadWatcher.save();
  ThreadWatcher.reload();
};

ThreadWatcher.save = function() {
  localStorage.setItem('4chan-watch', JSON.stringify(ThreadWatcher.watched));
};

ThreadWatcher.prune = function() {
  var i, to, key, total, img;
  
  if (total = $.id('watchList').childElementCount) {
    i = to = 0;
    img = $.id('twPrune');
    img.src = Main.icons.rotate;
    for (key in ThreadWatcher.watched) {
      ++i;
      setTimeout(ThreadWatcher.fetch, to, key, i == total ? img : null);
      to += 200;
    }
  }
};

ThreadWatcher.fetch = function(key, img) {
  var tuid, xhr;
  
  tuid = key.split('-'); // tid, board
  xhr = new XMLHttpRequest();
  xhr.onload = function() {
    if (this.status == 404) {
      $.addClass($.id('watch-' + key).lastChild, 'deadLink');
    }
    if (img) {
      img.src = Main.icons.down2;
    }
  };
  if (img) {
    xhr.onerror = function() {
      img.src = Main.icons.down2;
    };
  }
  xhr.open('HEAD', 'https://api.4chan.org/'
    + tuid[1] + '/res/' + tuid[0] + '.json');
  xhr.send(null);
};

/**
 * Thread expansion
 */
var ThreadExpansion = {};

ThreadExpansion.toggle = function(tid) {
  var thread, msg, expmsg, summary, tmp;
  
  thread = $.id('t' + tid);
  summary = thread.children[1];
  if (thread.hasAttribute('data-truncated')) {
    msg = $.id('m' + tid);
    expmsg = msg.nextSibling;
  }
  
  if ($.hasClass(thread, 'tExpanded')) {
    thread.className = thread.className.replace(' tExpanded', ' tCollapsed');
    summary.children[0].src = Main.icons.plus;
    summary.children[1].style.display = 'inline';
    summary.children[2].style.display = 'none';
    if (msg) {
      tmp = msg.innerHTML;
      msg.innerHTML = expmsg.textContent;
      expmsg.textContent = tmp;
    }
  }
  else if ($.hasClass(thread, 'tCollapsed')) {
    thread.className = thread.className.replace(' tCollapsed', ' tExpanded');
    summary.children[0].src = Main.icons.minus;
    summary.children[1].style.display = 'none';
    summary.children[2].style.display = 'inline';
    if (msg) {
      tmp = msg.innerHTML;
      msg.innerHTML = expmsg.textContent;
      expmsg.textContent = tmp;
    }
  }
  else {
    summary.children[0].src = Main.icons.rotate;
    ThreadExpansion.fetch(tid);
  }
};

ThreadExpansion.fetch = function(tid) {
  $.get('//api.4chan.org/' + Main.board + '/res/' + tid + '.json',
    {
      onload: function() {
        var i, p, n, frag, thread, tail, posts, count, msg, metacap,
          expmsg, summary, abbr;
        
        thread = $.id('t' + tid);
        summary = thread.children[1];
        
        if (this.status == 200) {
          tail = +$.cls('reply', thread)[0].id.slice(1);
          posts = JSON.parse(this.responseText).posts;
          frag = document.createDocumentFragment();
          
          for (i = 1; p = posts[i]; ++i) {
            if (p.no < tail) {
              n = Parser.buildHTMLFromJSON(p, Main.board);
              n.className += ' rExpanded';
              frag.appendChild(n);
            }
            else {
              break;
            }
          }
          
          msg = $.id('m' + tid);
          if ((abbr = $.cls('abbr', msg)[0])
            && /^Comment/.test(abbr.textContent)) {
            thread.setAttribute('data-truncated', '1');
            expmsg = document.createElement('div');
            expmsg.style.display = 'none';
            expmsg.textContent = msg.innerHTML;
            msg.parentNode.insertBefore(expmsg, msg.nextSibling);
            if (metacap = $.cls('capcodeReplies', msg)[0]) {
              msg.innerHTML = posts[0].com + '<br><br>';
              msg.appendChild(metacap);
            }
            else {
              msg.innerHTML = posts[0].com;
            }
          }
          
          thread.insertBefore(frag, summary.nextSibling);
          Parser.parseThread(tid, 1, i - 1);
          
          thread.className += ' tExpanded';
          summary.children[0].src = Main.icons.minus;
          summary.children[1].style.display = 'none';
          summary.children[2].style.display = 'inline';
        }
        else if (this.status == 404) {
          summary.children[0].display = 'none';
          summary.children[1].textContent = "This thread doesn't exist anymore.";
        }
        else {
          summary.children[0].src = Main.icons.plus;
          console.log('ThreadExpansion: ' + this.status + ' ' + this.statusText);
        }
      },
      onerror: function() {
        $.id('t' + tid).children[1].children[0].src = Main.icons.plus;
        console.log('ThreadExpansion: xhr failed');
      }
    }
  );
};

/**
 * Thread updater
 */
var ThreadUpdater = {};

ThreadUpdater.init = function() {
  var visibility;
  
  this.unread = false;
  this.auto = false;
  
  this.delayId = 0;
  this.delayIdHidden = 4;
  this.delayRange = [ 10, 15, 20, 30, 60, 90, 120, 180, 240, 300 ];
  
  this.lastModified = '0';
  this.lastReply = null;
  this.lastFocusUpdate = 0;
  
  this.iconNode = document.head.querySelector('link[rel="shortcut icon"]');
  this.iconNode.type = 'image/x-icon';
  this.defaultIcon = this.iconNode.getAttribute('href');
  
  if (!document.hidden) {
    if ('mozHidden' in document) {
      this.hidden = 'mozHidden';
      this.visibilitychange = 'mozvisibilitychange';
    }
    else if ('webkitHidden' in document) {
      this.hidden = 'webkitHidden';
      this.visibilitychange = 'webkitvisibilitychange';
    }
    else if ('msHidden' in document) {
      this.hidden = 'msHidden';
      this.visibilitychange = 'msvisibilitychange';
    }
  }
  
  this.initControls();
};

ThreadUpdater.initControls = function() {
  var i, j, frag, el, label, navlinks;
  
  for (i = 0; i < 2; ++i) {
    j = i ? '' : 'Bot';
    
    frag = document.createDocumentFragment();
    
    // Update button
    frag.appendChild(document.createTextNode(' ['));
    el = document.createElement('a');
    el.href = '';
    el.textContent = 'Update';
    el.setAttribute('data-cmd', 'update');
    frag.appendChild(el);
    frag.appendChild(document.createTextNode(']'));
    
    // Auto checkbox
    frag.appendChild(document.createTextNode(' ['));
    label = document.createElement('label');
    el = document.createElement('input');
    el.type = 'checkbox';
    el.title = 'Fetch new replies automatically';
    el.setAttribute('data-cmd', 'auto');
    this['autoNode' + j] = el;
    label.appendChild(el);
    label.appendChild(document.createTextNode('Auto'));
    frag.appendChild(label);
    frag.appendChild(document.createTextNode('] '));
    
    // Status span
    frag.appendChild(
      this['statusNode' + j] = document.createElement('span')
    );
    
    if (navlinks = $.cls('navLinks' + j)[0]) {
      navlinks.appendChild(frag);
    }
  }
};

ThreadUpdater.start = function() {
  this.auto = true;
  this.autoNode.setAttribute('checked', 'checked');
  this.autoNodeBot.setAttribute('checked', 'checked');
  this.force = this.updating = false;
  this.lastUpdated = Date.now();
  if (this.hidden) {
    document.addEventListener(this.visibilitychange,
      this.onVisibilityChange, false);
  }
  document.addEventListener('scroll', this.onScroll, false);
  this.delayId = 0;
  this.updateInterval = setTimeout(this.update, this.delayRange[0] * 1000);
  this.pulse();
};

ThreadUpdater.stop = function() {
  this.auto = this.updating = this.force = false;
  this.autoNode.removeAttribute('checked');
  this.autoNodeBot.removeAttribute('checked');
  this.setStatus('');
  this.setIcon(this.defaultIcon);
  if (this.hidden) {
    document.removeEventListener(this.visibilitychange,
      this.onVisibilityChange, false);
  }
  document.removeEventListener('scroll', this.onScroll, false);
  clearTimeout(this.updateInterval);
  clearTimeout(this.pulseInterval);
};

ThreadUpdater.pulse = function() {
  var self = ThreadUpdater;
  self.setStatus(self.delayRange[self.delayId]
    - (0 | (Date.now() - self.lastUpdated) / 1000));
  self.pulseInterval = setTimeout(self.pulse, 1000);
};

ThreadUpdater.resetDelay = function() {
  //console.log('TU: resetting delay to: ' + this.delayRange[this.delayId]);
  clearTimeout(this.updateInterval);
  clearTimeout(this.pulseInterval);
  this.lastUpdated = Date.now();
  this.updateInterval
    = setTimeout(this.update, this.delayRange[this.delayId] * 1000);
  this.pulse();
};

ThreadUpdater.adjustDelay = function(postCount, force)
{
  if (postCount == 0) {
    if (!force) {
      if (this.delayId < this.delayRange.length - 1) {
        ++this.delayId;
      }
    }
  }
  else {
    this.delayId = document[this.hidden] ? this.delayIdHidden : 0;
  }
  if (this.auto) {
    this.updateInterval
      = setTimeout(this.update, this.delayRange[this.delayId] * 1000);
    this.pulse();
  }
  //console.log('TU: ' + postCount + ' : ' + this.delayRange[this.delayId]);
};

ThreadUpdater.onVisibilityChange = function(e) {
  var self, now;
  
  self = ThreadUpdater;
  now = Date.now();
  
  if (document[self.hidden] && self.delayId < self.delayIdHidden) {
    self.delayId = self.delayIdHidden;
  }
  else {
    self.delayId = 0;
  }
  self.resetDelay();
};

ThreadUpdater.onScroll = function(e) {
  var self;
  
  if (document.documentElement.scrollHeight ==
    (document.documentElement.clientHeight + window.scrollY)) {
    self = ThreadUpdater;
    self.setIcon(self.defaultIcon);
    self.unread = false;
    if (self.lastReply) {
      $.removeClass(self.lastReply, 'newPostsMarker');
      self.lastReply = null;
    }
  }
};

ThreadUpdater.forceUpdate = function() {
  ThreadUpdater.force = true;
  ThreadUpdater.update();
};

ThreadUpdater.toggleAuto = function() {
  this.auto ? this.stop() : this.start();
};

ThreadUpdater.update = function() {
  var self, now = Date.now();
  
  self = ThreadUpdater;
  
  if (self.updating) {
    return;
  }
  
  if (self.auto) {
    clearTimeout(self.pulseInterval);
    clearTimeout(self.updateInterval);  
  }
  
  self.updating = true;
  
  self.setStatus('Updating...');
  
  $.get('//api.4chan.org/' + Main.board + '/res/' + Main.tid + '.json',
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

ThreadUpdater.onload = function() {
  var i, self, nodes, thread, newposts, frag, postcount, lastrep, lastid, lastoffset;
  
  self = ThreadUpdater;
  nodes = [];
  
  self.setStatus('');
  
  if (this.status == 200) {
    self.lastModified = this.getResponseHeader('Last-Modified');
    
    thread = $.id('t' + Main.tid);
    
    lastrep = thread.childNodes[thread.childElementCount - 1];
    lastid = +lastrep.id.slice(2);
    lastoffset = lastrep.offsetTop;
    
    try {
      newposts = JSON.parse(this.responseText).posts;
    }
    catch (e) {
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
      if (!self.force) {
        if (!self.lastReply && lastid != Main.tid) {
          (self.lastReply = lastrep.lastChild).className += ' newPostsMarker';
        }
        if (!self.unread) {
          self.setIcon(self.icons[Main.type]);
        }
      }
      frag = document.createDocumentFragment();
      for (i = nodes.length - 1; i >= 0; i--) {
        frag.appendChild(Parser.buildHTMLFromJSON(nodes[i], Main.board));
      }
      thread.appendChild(frag);
      Parser.parseThread(thread.id.slice(1), -nodes.length);
      window.scrollBy(0, lastrep.offsetTop - lastoffset);
    }
  }
  else if (this.status == 304 || this.status == 0) {
    self.setStatus('Not Modified');
  }
  else if (this.status == 404) {
    self.setIcon(self.icons.dead);
    self.setError('Not Found - Thread has been pruned or deleted');
    if (self.auto) {
      self.stop();
    }
  }
  
  self.lastUpdated = Date.now();
  self.adjustDelay(nodes.length, self.force);
  self.updating = self.force = false;
};

ThreadUpdater.onerror = function() {
  var self = ThreadUpdater;
  self.setError('Connection Error');
  self.lastUpdated = Date.now();
  self.adjustDelay(0, self.force);
  self.updating = self.force = false;
};

ThreadUpdater.setStatus = function(msg) {
  this.statusNode.textContent = this.statusNodeBot.textContent = msg;
};

ThreadUpdater.setError = function(msg) {
  this.statusNode.innerHTML
    = this.statusNodeBot.innerHTML
    = '<span class="tw-error">' + msg + '</span>';
};

ThreadUpdater.setIcon = function(data) {
  this.iconNode.href = data;
  document.head.appendChild(this.iconNode);
};

ThreadUpdater.icons = {
  ws: '//static.4chan.org/image/favicon-ws-newposts.ico',
  nws: '//static.4chan.org/image/favicon-nws-newposts.ico',
  dead: '//static.4chan.org/image/adminicon.gif'
};

/**
 * Filter
 */
var Filter = {};

Filter.init = function() {
  this.entities = document.createElement('div');
  Filter.load();
};

Filter.onClick = function(e) {
  var cmd;
  
  if (cmd = e.target.getAttribute('data-cmd')) {
    switch (cmd) {
      case 'filters-add':
        Filter.add();
        break;
      case 'filters-save':
        Filter.save();
        Filter.close();
        break;
      case 'filters-close':
        Filter.close();
        break;
      case 'filters-del':
        Filter.remove(e.target.parentNode.parentNode);
        break;
      case 'filters-help-open':
        Filter.openHelp();
        break;
      case 'filters-help-close':
        Filter.closeHelp();
        break;
    }
  }
};

Filter.exec = function(cnt, pi, nb, msg) {
  var trip, name, com, f, filters = Filter.activeFilters, hit = false;
  
  for (i = 0; f = filters[i]; ++i) {
    if (f.type == 0) {
      if ((trip || (trip = nb.getElementsByClassName('postertrip')[0]))
        && f.pattern == trip.textContent) {
        hit = true;
        break;
      }
    }
    else if (f.type == 1) {
      if ((name || (name = nb.getElementsByClassName('name')[0]))
        && f.pattern == name.textContent) {
        hit = true;
        break;
      }
    }
    else if ((com ||
      (com = (this.entities.innerHTML = msg.innerHTML.replace(/<br>/g, '\n')).textContent))
      && f.pattern.test(com)) {
      hit = true;
      break;
    }
  }
  if (hit) {
    if (f.hide) {
      cnt.className += ' post-hidden';
      el = document.createElement('span');
      el.setAttribute('data-filtered', '1');
      el.textContent = '+';
      el.className = 'filter-preview';
      pi.appendChild(el);
      return true;
    }
    else {
      cnt.className += ' filter-hl';
      cnt.style.boxShadow = '10px 0 ' + f.color;
    }
  }
  return false;
};

Filter.load = function() {
  var i, w, f, rawFilters, rawPattern, fid, regexEscape, regexType,
    wordSepS, wordSepE, words, inner, regexWildcard, replaceWildcard;
  
  this.activeFilters = [];
  
  if (!(rawFilters = localStorage.getItem('4chan-filters'))) {
    return;
  }
  
  rawFilters = JSON.parse(rawFilters);
  
  regexEscape = new RegExp('(\\'
    + ['/', '.', '*', '+', '?', '(', ')', '[', ']', '{', '}', '\\' ].join('|\\')
    + ')', 'g');
  regexType = /^\/(.*)\/(i?)$/;
  wordSepS = '(?=.*\\b';
  wordSepE = '\\b)';
  regexWildcard = /\\\*/g;
  replaceWildcard = '[^\\s]*';
  
  try {
    for (fid = 0; f = rawFilters[fid]; ++fid) {
      if (f.active && f.pattern != '') {
        rawPattern = f.pattern;
        // Name or Tripcode, string comparison
        if (!f.type || f.type == 1) {
          pattern = rawPattern;
        }
        // /RegExp/
        else if (match = rawPattern.match(regexType)) {
          pattern = new RegExp(match[1], match[2]);
        }
        // "Exact match"
        else if (rawPattern[0] == '"' && rawPattern[rawPattern.length - 1] == '"') {
          pattern = new RegExp(rawPattern.slice(1, -1).replace(regexEscape, '\\$1'));
        }
        // Full words, AND operator
        else {
          words = rawPattern.split(' ');
          pattern = '';
          for (i = 0, j = words.length; i < j; ++i) {
            inner = words[i]
              .replace(regexEscape, '\\$1')
              .replace(regexWildcard, replaceWildcard);
            pattern += wordSepS + inner + wordSepE;
          }
          pattern = new RegExp('^' + pattern, 'i');
        }
        //console.log('Resulting pattern: ' + pattern);
        this.activeFilters.push({
          type: f.type,
          pattern: pattern,
          color: f.color,
          hide: f.hide
        });
      }
    }
  }
  catch (e) {
    alert('There was an error processing one of the filters: '
      + e + ' in: ' + rawPattern);
  }
};

Filter.openHelp = function() {
  var cnt;
  
  if ($.id('filtersHelp')) {
    return;
  }
  
  cnt = document.createElement('div');
  cnt.id = 'filtersHelp';
  cnt.className = 'UIPanel';
  cnt.setAttribute('data-cmd', 'filters-help-close');
  cnt.innerHTML = '\
<div class="extPanel reply"><div class="panelHeader">Help</div>\
<h4>Tripcode and Name filters:</h4>\
<ul><li>Those use simple string comparison.</li>\
<li>Type them exactly as they appear on 4chan, including the exclamation mark for tripcode filters.</li>\
<li>Example: <code>!Ep8pui8Vw2</code></li></ul>\
<h4>Comment filters:</h4>\
<ul><li><strong>Matching whole words:</strong></li>\
<li><code>feel</code> &mdash; will match <em>"feel"</em> but not <em>"feeling"</em>. This search is case-insensitive.</li></ul>\
<ul><li><strong>AND operator:</strong></li>\
<li><code>feel girlfriend</code> &mdash; will match <em>"feel"</em> AND <em>"girlfriend"</em> in any order.</li></ul>\
<ul><li><strong>Exact match:</strong></li>\
<li><code>"that feel when"</code> &mdash; place double quotes around the pattern to search for an exact string</li></ul>\
<ul><li><strong>Wildcards:</strong></li>\
<li><code>feel*</code> &mdash; matches expressions such as <em>"feel"</em>, <em>"feels"</em>, <em>"feeling"</em>, <em>"feeler"</em>, etc…</li>\
<li><code>idolm*ster</code> &mdash; this can match <em>"idolmaster"</em> or <em>"idolm@ster"</em>, etc…</li></ul>\
<ul><li><strong>Regular expressions:</strong></li>\
<li><code>/feel when no (girl|boy)friend/i</code></li>\
<li><code>/^(?!.*touhou).*$/i</code> &mdash; NOT operator.</li>\
<li><code>/^>/</code> &mdash; comments starting with a quote.</li>\
<li><code>/^$/</code> &mdash; comments with no text.</li></ul>\
<h4>Colors:</h4>\
<ul><li>The color field can accept any valid CSS color:</li>\
<li><code>red</code>, <code>#0f0</code>, <code>#00ff00</code>, <code>rgba( 34, 12, 64, 0.3)</code>, etc…</li></ul>';

  document.body.appendChild(cnt);
  cnt.addEventListener('click', this.onClick, false);
};

Filter.closeHelp = function() {
  var cnt;
  
  if (cnt = $.id('filtersHelp')) {
    cnt.removeEventListener('click', this.onClick, false);
    document.body.removeChild(cnt);
  }
};

Filter.open = function() {
  var i, f, cnt, menu, html, rawFilters, filterId, filterList;
  
  if ($.id('filtersMenu')) {
    return;
  }
  
  cnt = document.createElement('div');
  cnt.id = 'filtersMenu';
  cnt.className = 'UIPanel';
  cnt.style.display = 'none';
  cnt.setAttribute('data-cmd', 'filters-close');
  cnt.innerHTML = '\
<div class="extPanel reply"><div class="panelHeader">Filters and Highlighters\
<a data-cmd="filters-help-open" href="javascript:;">Help</a></div>\
<table><thead><tr>\
<th>On</th>\
<th>Pattern</th>\
<th>Type</th>\
<th>Color</th>\
<th>Hide</th>\
<th>Del</th>\
</tr></thead><tbody id="filter-list"></tbody><tfoot><tr><td colspan="6">\
<button data-cmd="filters-add">Add</button>\
<span class="right">\
<button data-cmd="filters-save">Save</button>\
<button data-cmd="filters-close">Close</button>\
</span></td></tr></tfoot></table></div>';
  
  document.body.appendChild(cnt);
  cnt.addEventListener('click', this.onClick, false);
  
  filterList = $.id('filter-list');
  
  if (rawFilters = localStorage.getItem('4chan-filters')) {
    rawFilters = JSON.parse(rawFilters);
    for (i = 0; f = rawFilters[i]; ++i) {
      filterList.appendChild(this.buildEntry(f, i));
    }
  }
  cnt.style.display = '';
};

Filter.close = function() {
  var cnt;
  
  if (cnt = $.id('filtersMenu')) {
    cnt.removeEventListener('click', this.onClick, false);
    document.body.removeChild(cnt);
  }
};

Filter.add = function() {
  var filter;
  filter = { active: true, type: 0, pattern: '',  color: '', hide: false };
  $.id('filter-list').appendChild(this.buildEntry(filter));
};

Filter.remove = function(tr) {
  $.id('filter-list').removeChild(tr);
};

Filter.save = function() {
  var i, rawFilters, entries, tr;
  
  rawFilters = [];
  entries = $.id('filter-list').children;
  
  for (i = 0; tr = entries[i]; ++i) {
    rawFilters.push({
      active: tr.children[0].firstChild.checked,
      pattern: tr.children[1].firstChild.value,
      type: tr.children[2].firstChild.selectedIndex,
      color: tr.children[3].firstChild.value,
      hide: tr.children[4].firstChild.checked
    });
  }
  
  if (rawFilters[0]) {
    localStorage.setItem('4chan-filters', JSON.stringify(rawFilters));
  }
  else {
    localStorage.removeItem('4chan-filters');
  }
};

Filter.buildEntry = function(filter) {
  var tr, html, sel;
  
  tr = document.createElement('tr');
  
  html = '';
  
  // On
  html += '<td><input type="checkbox"'
    + (filter.active ? ' checked="checked"></td>' : '></td>');
  
  // Pattern
  html += '<td><input class="fPattern" type="text" value="'
    + filter.pattern.replace(/"/g, '&quot;') + '"></td>';
  
  // Type
  sel = [ '', '', '' ];
  sel[filter.type] = 'selected="selected"';
  html += '<td><select size="1"><option value="0"'
    + sel[0] + '>Tripcode</option><option value="1"'
    + sel[1] + '>Name</option><option value="2"'
    + sel[2] + '>Comment</option></select></td>';
  
  // Color
  html += '<td><input type="text" class="fColor" value="'
    + filter.color + '"></td>';
  
  // Hide
  html += '<td><input type="checkbox"'
    + (filter.hide ? ' checked="checked"></td>' : '></td>');
  
  // Del
  html += '<td><span data-cmd="filters-del" class="pointer fDel">&#x2716;</span></td>';
  
  tr.innerHTML = html;
  
  return tr;
}

/**
 * Media
 */
var Media = {};

Media.init = function() {
  this.active = true;
  this.debounce = false;
  
  this.matchSC = /(?:http:\/\/)?soundcloud\.com\/[^\s<]+/g;
  this.nodesSC = [];

  this.testYT = /youtube\.com|youtu\.be/;
  this.matchYT = /(?:https?:\/\/)?(?:www\.youtube\.com\/watch\?v=|youtu\.be\/)([^\s<&]+)[^\s<]*/g;
  this.urlYT = "<iframe width=\"640\" height=\"360\" "
    + "src=\"//www.youtube.com/embed/$1\" frameborder=\"0\" allowfullscreen></iframe>"
  this.nodesYT = [];
};

Media.clearDebounce = function() {
  Media.debounce = false;
};

Media.checkEmbeds = function(e) {
  var i, j, n, nodes, limit, height;
  
  if (Media.debounce) {
    return;
  }
  
  limit = document.documentElement.clientHeight + window.scrollY;
  
  if (Config.embedSoundCloud) {
    dHeight = document.documentElement.offsetHeight - Media.baseHeight;
    nodes = Media.nodesSC;
    i = nodes.length - 1;
    while ((n = nodes[i]) && (n[0] + dHeight) < limit) {
      for (j = 0; n[2][j]; ++j) {
        Media.embedSoundCloud(n[1], n[2][j]);
      }
      nodes.length--;
      i--;
    }
  }
  
  if (Config.embedYouTube) {
    dHeight = document.documentElement.offsetHeight - Media.baseHeight;
    nodes = Media.nodesYT;
    i = nodes.length - 1;
    while ((n = nodes[i]) && (n[0] + dHeight) < limit) {
      Media.embedYouTube(n[1]);
      nodes.length--;
      i--;
    }
  }
  
  Media.debounce = true;
  setTimeout(Media.clearDebounce, 250);
};

Media.finalize = function() {
  if (this.active) {
    this.baseHeight = document.documentElement.offsetHeight;
    window.addEventListener('scroll', Media.checkEmbeds, false);
    if (this.nodesSC[1]) {
      this.nodesSC.reverse();
    }
    if (this.nodesYT[1]) {
      this.nodesYT.reverse();
    }
  }
};

Media.parseSoundCloud = function(msg) {
  var matches;
  
  if (matches = msg.innerHTML.match(this.matchSC)) {
    if (!this.active) {
      this.active = true;
    }
    this.nodesSC.push([ msg.getBoundingClientRect().top, msg, matches ]);
  }
};

Media.embedSoundCloud = function(msg, url) {
  var xhr;
  
  xhr = new XMLHttpRequest();
  xhr.open('GET', 'http://soundcloud.com/oembed?show_artwork=false&'
    + '&maxwidth=500px&show_comments=false&format=json&url='
    + (url.charAt(0) != 'h' ? ('http://' + url) : url));
  xhr.onload = function() {
    if (this.status == 200 || this.status == 304) {
      msg.innerHTML
        = msg.innerHTML.replace(url, JSON.parse(this.responseText).html);
    }
  };
  xhr.send(null);
};


Media.parseYouTube = function(msg) {
  var matches;
  
  if (this.testYT.test(msg.innerHTML)) {
    if (!this.active) {
      this.active = true;
    }
    this.nodesYT.push([ msg.getBoundingClientRect().top, msg ]);
  }
};

Media.embedYouTube = function(msg) {
  msg.innerHTML = msg.innerHTML.replace(this.matchYT, this.urlYT);
};

/**
 * Custom CSS
 */
var CustomCSS = {};

CustomCSS.init = function() {
  var style, css;
  if (css = localStorage.getItem('4chan-css')) {
    style = document.createElement('style');
    style.id = 'customCSS';
    style.setAttribute('type', 'text/css');
    style.textContent = css;
    document.head.appendChild(style);
  }
};

CustomCSS.open = function() {
  var cnt;
  
  if ($.id('customCSSMenu')) {
    return;
  }
  
  cnt = document.createElement('div');
  cnt.id = 'customCSSMenu';
  cnt.className = 'UIPanel';
  cnt.setAttribute('data-cmd', 'css-close');
  cnt.innerHTML = '\
<div class="extPanel reply"><div class="panelHeader">Custom CSS</div>\
<textarea id="customCSSBox">'
+ (localStorage.getItem('4chan-css') || '') + '</textarea>\
<span class="right">\
<button data-cmd="css-save">Save</button>\
<button data-cmd="css-close">Close</button>\
</span></td></tr></tfoot></table></div>';
  
  document.body.appendChild(cnt);
  cnt.addEventListener('click', this.onClick, false);
};

CustomCSS.save = function() {
  var ta, style;
  
  if (ta = $.id('customCSSBox')) {
    localStorage.setItem('4chan-css', ta.value);
    if (Config.customCSS && (style = $.id('customCSS'))) {
      document.head.removeChild(style);
      CustomCSS.init();
    }
  }
};

CustomCSS.close = function() {
  var cnt;
  
  if (cnt = $.id('customCSSMenu')) {
    cnt.removeEventListener('click', this.onClick, false);
    document.body.removeChild(cnt);
  }
};

CustomCSS.onClick = function(e) {
  var cmd;
  
  if (cmd = e.target.getAttribute('data-cmd')) {
    switch (cmd) {
      case 'css-close':
        CustomCSS.close();
        break;
      case 'css-save':
        CustomCSS.save();
        CustomCSS.close();
        break;
    }
  }
};

/**
 * Draggable helper
 */
var Draggable = {
  el: null,
  key: null,
  scrollX: null,
  scrollY: null,
  dx: null, dy: null, right: null, bottom: null,
  
  set: function(handle) {
    handle.addEventListener('mousedown', Draggable.startDrag, false);
  },
  
  unset: function(handle) {
    handle.removeEventListener('mousedown', Draggable.startDrag, false);
  },
  
  startDrag: function(e) {
    var self, doc, offs;
    
    if (this.parentNode.hasAttribute('data-shiftkey') && !e.shiftKey) {
      return;
    }
    
    e.preventDefault();
    
    self = Draggable;
    doc = document.documentElement;
    
    self.el = this.parentNode;
    
    self.key = self.el.getAttribute('data-trackpos');
    offs = self.el.getBoundingClientRect();
    self.dx = e.clientX - offs.left;
    self.dy = e.clientY - offs.top;
    self.right = doc.clientWidth - offs.width;
    self.bottom = doc.clientHeight - offs.height;
    
    if (getComputedStyle(self.el, null).position != 'fixed') {
      self.scrollX = window.scrollX;
      self.scrollY = window.scrollY;
    }
    else {
      self.scrollX = self.scrollY = 0;
    }
    
    document.addEventListener('mouseup', self.endDrag, false);
    document.addEventListener('mousemove', self.onDrag, false);
  },
  
  endDrag: function(e) {
    document.removeEventListener('mouseup', Draggable.endDrag, false);
    document.removeEventListener('mousemove', Draggable.onDrag, false);
    if (Draggable.key) {
      Config[Draggable.key] = Draggable.el.style.cssText;
      Config.save();
    }
    delete Draggable.el;
  },
  
  onDrag: function(e) {
    var left, top, style;
    
    left = e.clientX - Draggable.dx + Draggable.scrollX;
    top = e.clientY - Draggable.dy + Draggable.scrollY;
    style = Draggable.el.style;
    if (left < 1) {
      style.left = '0px';
      style.right = '';
    }
    else if (Draggable.right < left) {
      style.left = '';
      style.right = '0px';
    }
    else {
      style.left = left + 'px';
      style.right = '';
    }
    if (top < 1) {
      style.top = '0px';
      style.bottom = '';
    }
    else if (Draggable.bottom < top) {
      style.bottom = '0px';
      style.top = '';
    }
    else {
      style.top = top + 'px';
      style.bottom = '';
    }
  }
};

/**
 * User Agent
 */
var UA = {};

UA.init = function() {
  document.head = document.head || $.tag('head')[0];
  this.isOpera = Object.prototype.toString.call(window.opera) == '[object Opera]';
  this.hasCORS = 'withCredentials' in new XMLHttpRequest;
  this.hasCustomEventCtor = typeof window.CustomEvent == 'function';
};

/**
 * Config
 */
var Config = {
  quotePreview: true,
  backlinks: true,
  quickReply: true,
  threadUpdater: true,
  threadWatcher: true,
  pageTitle: true,
  
  filter: false,
  threadHiding: false,
  replyHiding: false,
  threadExpansion: false,
  imageExpansion: false,
  imageSearch: false,
  reportButton: false,
  localTime: false,
  revealSpoilers: false,
  embedSoundCloud: false,
  embedYouTube: false,
  hideGlobalMsg: false,
  
  stickyNav: false,
  topPageNav: false,
  dropDownNav: false,
  fixedThreadWatcher: false,
  customCSS: false
};

Config.load = function() {
  if (storage = localStorage.getItem('4chan-settings')) {
    storage = JSON.parse(storage);
    $.extend(Config, storage);
  }
};

Config.save = function() {
  localStorage.setItem('4chan-settings', JSON.stringify(Config));
};

/**
 * Settings menu
 */
var SettingsMenu = {};

SettingsMenu.options = {
    'Essentials': {
      quotePreview: 'Quote preview',
      backlinks: 'Backlinks',
      quickReply: 'Quick reply',
      threadUpdater: 'Thread updater',
      threadWatcher: 'Thread watcher',
      pageTitle: 'Excerpts in page title'
    },
    'Advanced': {
      filter: 'Filter (<a href="javascript:;" data-cmd="filters-open">edit</a>)',
      threadHiding: 'Thread hiding',
      replyHiding: 'Reply hiding',
      threadExpansion: 'Thread expansion',
      imageExpansion: 'Image expansion',
      imageSearch: 'Image search',
      reportButton: 'Report button',
      localTime: 'Convert dates to local time',
      revealSpoilers: "Don't spoiler images",
      embedSoundCloud: 'Embed SoundCloud',
      embedYouTube: 'Embed YouTube',
      hideGlobalMsg: 'Enable announcement hiding'
    },
    'Customisations': {
      stickyNav: 'Navigation arrows',
      topPageNav: 'Page navigation at the top',
      dropDownNav: 'Use drop-down navigation',
      fixedThreadWatcher: 'Fixed thread watcher',
      customCSS: 'Custom CSS (<a href="javascript:;" data-cmd="css-open">edit</a>)'
    }
};

SettingsMenu.save = function() {
  var i, options, el, key;
  
  options = $.id('settingsMenu').getElementsByClassName('menuOption');
  
  for (i = 0; el = options[i]; ++i) {
    key = el.getAttribute('data-option');
    Config[key] = el.type == 'checkbox' ? el.checked : el.value;
  }
  
  Config.save();
  SettingsMenu.close();
  location.href = location.href.replace(/#.+$/, '');
};

SettingsMenu.toggle = function() {
  if ($.id('settingsMenu')) {
    SettingsMenu.close();
  }
  else {
    SettingsMenu.open();
  }
};

SettingsMenu.open = function() {
  var cat, key, html, cnt, opts;
  
  cnt = document.createElement('div');
  cnt.id = 'settingsMenu';
  cnt.className = 'UIPanel';
  
  html = '<div class="extPanel reply"><div class="panelHeader">Settings</div><ul>';
  
  for (cat in SettingsMenu.options) {
    opts = SettingsMenu.options[cat];
    html += '<li class="settings-cat">' + cat + '</li>';
    for (key in opts) {
      html += '<li><label><input type="checkbox" class="menuOption" data-option="'
        + key + '"' + (Config[key] ? ' checked="checked">' : '>')
        + opts[key] + '</label></li>';
    }
  }
  
  html += '</ul><span class="right"><button data-cmd="settings-save">Save</button>'
    + '<button data-cmd="settings-toggle">Close</button></div>';
  
  cnt.innerHTML = html;
  cnt.addEventListener('click', SettingsMenu.onClick, false);
  document.body.appendChild(cnt);
};

SettingsMenu.onClick = function(e) {
  var el;
  
  if (e.target.id == 'settingsMenu' && (el = $.id('settingsMenu'))) {
    e.preventDefault();
    e.stopPropagation();
    SettingsMenu.close(el);
  }
};

SettingsMenu.close = function(el) {
  if (el = (el || $.id('settingsMenu'))) {
    el.removeEventListener('click', SettingsMenu.onClick, false);
    document.body.removeChild(el);
  }
};

/**
 * Main
 */
var Main = {};

Main.init = function()
{
  var params;
  
  document.addEventListener('DOMContentLoaded', Main.run, false);
  
  Main.now = Date.now();
  
  UA.init();
  
  Config.load();
  
  if (Main.stylesheet = Main.getCookie(style_group)) {
    Main.stylesheet = Main.stylesheet.toLowerCase().replace(/ /g, '_');
  }
  else {
    Main.stylesheet =
      style_group == 'nws_style' ? 'yotsuba_new' : 'yotsuba_b_new';
  }
  
  Main.initIcons();
  
  Main.addCSS();
  
  if (Config.customCSS) {
    CustomCSS.init();
  }
  
  Main.type = style_group.split('_')[0];
  
  params = location.pathname.split(/\//);
  Main.board = params[1];
  Main.tid = params[3];
  
  Main.prettify = Main.board == 'g';
  
  if (UA.hasCustomEventCtor) {
    document.dispatchEvent(new CustomEvent('4chanMainInit'));
  }
};

Main.run = function() {
  //console.profile('4chan JS');
  
  document.removeEventListener('DOMContentLoaded', Main.run, false);
  
  if (Config.dropDownNav) {
    $.id('boardNavDesktop').style.display = 'none';
    $.id('boardNavDesktopFoot').style.display = 'none';
    $.removeClass($.id('boardNavMobile'), 'mobile');
  }
  
  $.addClass(document.body, Main.stylesheet);
  $.addClass(document.body, Main.type);
  
  if (Config.quotePreview || Config.filter) {
    thread = $.id('delform');
    thread.addEventListener('mouseover', Main.onThreadMouseOver, false);
    thread.addEventListener('mouseout', Main.onThreadMouseOut, false);
  }
  
  if (Config.hideGlobalMsg) {
    Main.initGlobalMessage();
  }
  
  if (Config.stickyNav) {
    Main.setStickyNav();
  }
  
  if (Config.quickReply) {
    QR.init();
  }
  
  if (Config.threadWatcher) {
    ThreadWatcher.init();
  }
  
  if (Config.filter) {
    Filter.init();
  }
  
  if (Config.embedSoundCloud || Config.embedYouTube) {
    Media.init();
  }
  
  Parser.init();
  
  if (Config.replyHiding) {
    ReplyHiding.init();
  }
  
  if (Main.tid) {
    if (Config.pageTitle) {
      Main.setTitle();
    }
    Parser.parseThread(Main.tid);
    if (Config.threadUpdater) {
      ThreadUpdater.init();
    }
  }
  else {
    if (Config.topPageNav) {
      Main.setPageNav();
    }
    if (Config.threadHiding) {
      ThreadHiding.init();
      Parser.parseBoard();
      ThreadHiding.purge();
    }
    else {
      Parser.parseBoard();
    }
  }
  
  if (Media.active) {
    Media.finalize();
  }
  
  if (Config.replyHiding) {
    ReplyHiding.purge();
  }
  
  if (Config.quotePreview) {
    QuotePreview.init();
  }
  
  document.addEventListener('click', Main.onclick, false);
  window.addEventListener('storage', Main.syncStorage, false);
  
  $.id('settingsWindowLink').addEventListener('click', SettingsMenu.toggle, false);
  $.id('settingsWindowLinkBot').addEventListener('click', SettingsMenu.toggle, false);
  
  //console.profileEnd();
};

Main.icons = {
  up: 'arrow_up.png',
  down: 'arrow_down.png',
  down2: 'arrow_down2.png',
  cross: 'cross.png',
  gis: 'gis.png',
  iqdb: 'iqdb.png',
  minus: 'post_expand_minus.png',
  plus: 'post_expand_plus.png',
  rotate: 'post_expand_rotate.gif',
  quote: 'quote.png',
  report: 'report.png',
  notwatched: 'watch_thread_off.png',
  watched: 'watch_thread_on.png'
};

Main.initIcons = function() {
  var key, paths, url;
  
  paths = {
    yotsuba_new: 'futaba/',
    futaba_new: 'futaba/',
    yotsuba_b_new: 'burichan/',
    burichan_new: 'burichan/',
    tomorrow: 'tomorrow/',
    photon: 'photon/'
  };
  
  url = '//static.4chan.org/image/buttons/' + paths[Main.stylesheet];
  
  for (key in Main.icons) {
    Main.icons[key] = url + Main.icons[key];
  }
};

Main.setPageNav = function() {
  var el, cnt;
  
  cnt = document.createElement('div');
  cnt.setAttribute('data-shiftkey', '1');
  cnt.setAttribute('data-trackpos', 'TN-position');
  cnt.className = 'topPageNav';
  
  if (Config['TN-position']) {
    cnt.style.cssText = Config['TN-position'];
  }
  else {
    cnt.style.left = '10px';
    cnt.style.top = '50px';
  }

  el = $.cls('pagelist')[0].cloneNode(true);
  cnt.appendChild(el);
  Draggable.set(el);
  document.body.appendChild(cnt);
};

Main.initGlobalMessage = function() {
  var msg, btn, oldHash;
  
  if ((msg = $.id('globalMessage')) && msg.textContent) {
    btn = document.createElement('img');
    btn.id = 'toggleMsgBtn';
    btn.className = 'extButton';
    btn.setAttribute('data-cmd', 'toggleMsg');
    btn.alt = 'Toggle';
    btn.title = 'Toggle announcement';
    if ((oldHash = localStorage.getItem('4chan-msg'))
      && (Main.msgHash = $.hash(msg.textContent)) == oldHash) {
      msg.style.display = 'none';
      btn.style.opacity = '0.5';
      btn.src = Main.icons.plus;
    }
    else {
      btn.src = Main.icons.minus;
    }
    msg.parentNode.insertBefore(btn, msg);
  }
};

Main.toggleGlobalMessage = function() {
  var msg, btn;
  
  msg = $.id('globalMessage');
  btn = $.id('toggleMsgBtn');
  if (msg.style.display == 'none') {
    msg.style.display = '';
    btn.src = Main.icons.minus;
    btn.style.opacity = '1';
    localStorage.removeItem('4chan-msg');
  }
  else {
    msg.style.display = 'none';
    btn.src = Main.icons.plus;
    btn.style.opacity = '0.5';
    localStorage.setItem('4chan-msg', Main.msgHash || $.hash(msg.textContent));
  }
  console.log(btn.style.opacity);
};

Main.setStickyNav = function() {
  var cnt, hdr;
  
  cnt = document.createElement('div');
  cnt.id = 'stickyNav';
  cnt.className = 'extPanel reply';
  cnt.setAttribute('data-shiftkey', '1');
  cnt.setAttribute('data-trackpos', 'SN-position');
  
  if (Config['SN-position']) {
    cnt.style.cssText = Config['SN-position'];
  }
  else {
    cnt.style.right = '10px';
    cnt.style.top = '50px';
  }
  
  hdr = document.createElement('div');
  hdr.innerHTML = '<img class="pointer" src="'
    +  Main.icons.up + '" data-cmd="totop" alt="▲" title="Top">'
    + '<img class="pointer" src="' +  Main.icons.down
    + '" data-cmd="tobottom" alt="▼" title="Bottom">';
  Draggable.set(hdr);
  
  cnt.appendChild(hdr);
  document.body.appendChild(cnt);
};

Main.setTitle = function() {
  var title, entities;
  
  if (!(title = $.cls('subject', $.id('pi' + Main.tid))[0].textContent)) {
    if (title = $.id('m' + Main.tid).innerHTML) {
      entities = document.createElement('span');
      entities.innerHTML = title.replace(/<br>/g, ' ');
      title = entities.textContent.slice(0, 50);
    }
    else {
      title = Main.tid;
    }
  }
  
  document.title = '/' + Main.board + '/ - ' + title;
};

Main.setCookie = function(key, value) {
  var d = new Date();
  d.setTime(d.getTime() + 7 * 86400000);
  document.cookie =
    encodeURIComponent(key) + '=' + encodeURIComponent(value) + '; ' +
    'expires=' + d.toUTCString() + '; ' +
    'path=/; domain=.4chan.org';
};

Main.getCookie = function(name) {
  var i, c, ca, key;
  
  key = name + "=";
  ca = document.cookie.split(';');
  
  for (i = 0; c = ca[i]; ++i) {
    while (c.charAt(0) == ' ') {
      c = c.substring(1, c.length);
    }
    if (c.indexOf(key) == 0) {
      return c.substring(key.length, c.length);
    }
  }
  return null;
};

Main.syncStorage = function(e) {
  var key;
  
  if (!e.key) {
    return;
  }
  
  key = e.key.split('-');
  
  if (key[0] != '4chan') {
    return;
  }
  
  if (key[1] == 'watch' && e.newValue) {
    ThreadWatcher.reload(true);
  }
  else if (key[1] == 'cd' && e.newValue && Main.board == key[2]) {
    QR.startCooldown(e.newValue);
  }
}

Main.onclick = function(e) {
  var t, ids, cmd, tid, attr;
  
  if ((t = e.target) == document) {
    return;
  }
  
  if (cmd = t.getAttribute('data-cmd')) {
    id = t.getAttribute('data-id');
    switch (cmd) {
      case 'qr':
        e.preventDefault();
        ids = id.split('-'); // tid, pid
        QR.show(ids[0], ids[1]);
        QR.quotePost(ids[1], true);
        break;
      case 'update':
        e.preventDefault();
        ThreadUpdater.forceUpdate();
        break;
      case 'auto':
        ThreadUpdater.toggleAuto();
        break;
      case 'totop':
      case 'tobottom':
        if (!e.shiftKey) {
          location.href = '#' + cmd.slice(2);
        }
        break;
      case 'hide':
        ThreadHiding.toggle(id);
        break;
      case 'watch':
        ThreadWatcher.toggle(id);
        break;
      case 'hide-r':
        ReplyHiding.toggle(id);
        break;
      case 'expand':
        ThreadExpansion.toggle(id);
        break;
      case 'report':
        Main.reportPost(id);
        break;
      case 'toggleMsg':
        Main.toggleGlobalMessage();
        break;
      case 'settings-toggle':
        SettingsMenu.toggle();
        break;
      case 'settings-save':
        SettingsMenu.save();
        break;
      case 'filters-open':
        Filter.open();
        break;
      case 'css-open':
        CustomCSS.open();
        break;
    }
  }
  else if (Config.imageExpansion && e.which == 1
      && $.hasClass(t.parentNode, 'fileThumb')) {
    e.preventDefault();
    ImageExpansion.toggle(t);
  }
}

Main.onThreadMouseOver = function(e) {
  var t = e.target;
  
  if (Config.quotePreview && $.hasClass(t, 'quotelink')) {
    QuotePreview.resolve(e.target);
  }
  else if (Config.filter && t.hasAttribute('data-filtered')) {
    QuotePreview.show(t, t.parentNode.parentNode);
  }
}

Main.onThreadMouseOut = function(e) {
  var t = e.target;
  
  if (Config.quotePreview && $.hasClass(t, 'quotelink')) {
    QuotePreview.remove(t);
  }
  else if (Config.filter && t.hasAttribute('data-filtered')) {
    QuotePreview.remove(t);
  }
}

Main.reportPost = function(pid) {
  window.open('https://sys.4chan.org/'
    + Main.board + '/imgboard.php?mode=report&no=' + pid
    , Date.now(),
    "toolbar=0,scrollbars=0,location=0,status=1,menubar=0,resizable=1,width=680,height=200");
};

Main.linkToThread = function(tid, board) {
  return '//' + location.host + '/' + (board || Main.board) + '/res/' + tid;
};

Main.addCSS = function()
{
  var style, css = '\
.postHidden blockquote,\
.postHidden hr,\
.postHidden > div:not(.postInfo),\
.postHidden .file,\
.postHidden .buttons {\
  display: none !important;\
}\
.postHidden {\
  padding-right: 5px!important;\
}\
.threadHideButton {\
  float: left;\
  margin-right: 5px;\
}\
div.op > span .postHideButtonCollapsed {\
  margin-right: 1px;\
}\
.dropDownNav #boardNavMobile, {\
  display: block !important;\
}\
.extPanel {\
  border: 1px solid rgba(0, 0, 0, 0.20);\
}\
.tomorrow .extPanel {\
  border: 1px solid #111;\
}\
.extControls {\
  display: inline;\
  margin-left: 5px;\
}\
.extButton {\
  cursor: pointer;\
  margin-bottom: -4px;\
}\
.threadUpdateStatus {\
  margin-left: 0.5ex;\
}\
.futaba_new .stub,\
.burichan_new .stub {\
  line-height: 1;\
  padding-bottom: 1px;\
}\
.stub .extControls,\
.stub .wbtn,\
.stub input {\
  display: none;\
}\
.stub .threadHideButton {\
  float: none;\
  margin-right: 2px;\
}\
div.post div.postInfo {\
  width: auto;\
  display: inline;\
}\
.right {\
  float: right;\
}\
.pointer {\
  cursor: pointer;\
}\
.drag {\
  cursor: move !important;\
  user-select: none !important;\
  -moz-user-select: none !important;\
  -webkit-user-select: none !important;\
}\
#quickReply {\
  display: block;\
  position: fixed;\
  padding: 0;\
  font-size: 14px;\
}\
#quickReply tr > td:first-child {\
  padding: 0 2px;\
}\
.futaba_new #quickReply tr > td:first-child,\
.burichan_new #quickReply tr > td:first-child {\
  padding: 0 3px;\
}\
#qrHeader {\
  text-align: center;\
  margin: 1px 1px 0 1px;\
  padding: 0;\
  height: 18px;\
  line-height: 18px;\
}\
#qrClose {\
  float: right;\
}\
#quickReply table {\
  border-spacing: 1px;\
}\
#quickReply input[type="text"],\
#quickReply textarea {\
  width: 296px;\
  padding: 2px;\
}\
#quickReply input[type="text"],\
#quickReply textarea {\
  width: 296px;\
  margin: 0;\
}\
#quickReply textarea {\
  min-width: 296px;\
}\
#quickReply input[name="sub"] {\
  width: 208px;\
}\
#quickReply input[type="submit"] {\
  width: 85px;\
  margin-left: 3px;\
}\
#quickReply #qrCapField {\
  width: 296px;\
  padding: 0;\
  margin-bottom: 2px;\
  font-size: 11pt;\
  display: block;\
  padding: 0 2px;\
}\
#quickReply #qrDummyFile {\
  cursor: pointer;\
  width: 135px;\
  padding: 1px 2px;\
}\
#qrFile {\
  visibility: hidden;\
  position: absolute;\
}\
#qrBrowse {\
  margin-left: 3px;\
  width: 65px;\
}\
#qrPassword {\
  width: 85px;\
  padding: 2px;\
}\
#qrCaptcha {\
  width: 300px;\
  cursor: pointer;\
  border: 1px solid #DFDFDF;\
}\
#qrCapField:invalid {\
  box-shadow: none;\
}\
#qrError {\
  width: 373px;\
  display: none;\
  font-family: monospace;\
  background-color: #E62020;\
  font-size: 12px;\
  color: white;\
  padding: 3px 5px;\
  text-shadow: 0 1px rgba(0, 0, 0, 0.20);\
}\
#qrError a {\
  color: white;\
}\
#twHeader {\
  font-weight: bold;\
  text-align: center;\
}\
.futaba_new #twHeader,\
.burichan_new #twHeader {\
  line-height: 1;\
}\
#twHeader img {\
  margin-left: 3px;\
}\
#threadWatcher {\
  max-width: 265px;\
  display: block;\
  position: absolute;\
  padding: 3px;\
}\
#watchList {\
  margin: 0;\
  padding: 0;\
  user-select: none;\
  -moz-user-select: none;\
  -webkit-user-select: none;\
}\
#watchList li:first-child {\
  margin-top: 3px;\
  padding-top: 2px;\
  border-top: 1px solid rgba(0, 0, 0, 0.20);\
}\
.photon #watchList li:first-child {\
  border-top: 1px solid #ccc;\
}\
.yotsuba_new #watchList li:first-child {\
  border-top: 1px solid #d9bfb7;\
}\
.yotsuba_b_new #watchList li:first-child {\
  border-top: 1px solid #b7c5d9;\
}\
.tomorrow #watchList li:first-child {\
  border-top: 1px solid #111;\
}\
#watchList a {\
  text-decoration: none;\
}\
#watchList li {\
  overflow: hidden;\
  white-space: nowrap;\
  text-overflow: ellipsis;\
}\
.fitToPage {\
  width: 100%;\
  max-width: 100%;\
}\
#quote-preview {\
  display: block;\
  position: absolute;\
  padding: 3px 6px 6px 3px;\
}\
#quote-preview img {\
  max-width: 125px;\
  max-height: 125px;\
}\
#quote-preview .extButton,\
#quote-preview .extControls,\
#quote-preview .postNum {\
  display: none;\
}\
.deadlink {\
  text-decoration: line-through !important;\
}\
div.backlink {\
  margin-left: 15px;\
  font-size: 0.8em !important;\
}\
.backlink span {\
  padding: 0;\
  margin-left: 2px;\
}\
.expbtn {\
  margin-right: 3px;\
  margin-left: 2px;\
}\
.tCollapsed .rExpanded {\
  display: none;\
}\
#stickyNav {\
  position: fixed;\
  font-size: 0;\
}\
#stickyNav img {\
  vertical-align: middle;\
}\
.tw-error {\
  color: red;\
}\
.topPageNav {\
  position: absolute;\
}\
.yotsuba_b_new .topPageNav {\
  border-top: 1px solid rgba(255, 255, 255, 0.25);\
  border-left: 1px solid rgba(255, 255, 255, 0.25);\
}\
.newPostsMarker {\
  box-shadow: 0 3px red;\
}\
.panelHeader {\
  font-weight: bold;\
  font-size: 16px;\
  text-align: center;\
  margin-bottom: 5px;\
  margin-top: 5px;\
  padding-bottom: 5px;\
  border-bottom: 1px solid rgba(0, 0, 0, 0.20);\
}\
.panelHeader a {\
  text-decoration: none;\
  font-size: 14px;\
  font-weight: none;\
  position: absolute;\
  right: 10px;\
}\
.UIPanel {\
  position: fixed;\
  line-height: 14px;\
  font-size: 14px;\
  top: 0;\
  left: 0;\
  width: 100%;\
  height: 100%;\
  background-color: rgba(0, 0, 0, 0.25);\
}\
.UIPanel:after {\
  display: inline-block;\
  height: 100%;\
  vertical-align: middle;\
  content: "";\
}\
.UIPanel > div {\
  -moz-box-sizing: border-box;\
  box-sizing: border-box;\
  display: inline-block;\
  height: auto;\
  max-height: 100%;\
  position: relative;\
  width: 400px;\
  left: 50%;\
  margin-left: -200px;\
  overflow: auto;\
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.25);\
  vertical-align: middle;\
}\
.UIPanel input[type="text"],\
.UIPanel textarea {\
  border: 1px solid #AAA;\
  outline: none;\
}\
#settingsMenu ul {\
  list-style: none;\
  padding: 0 0 10px 0;\
  margin: 0;\
}\
.tomorrow #settingsMenu ul {\
  border-bottom: 1px solid #282a2e;\
}\
.settings-cat {\
  font-weight: bold;\
  padding-left: 5px;\
  margin: 10px 0 5px 0;\
}\
#customCSSMenu textarea {\
  display: block;\
  max-width: 100%;\
  min-width: 100%;\
  -moz-box-sizing: border-box;\
  box-sizing: border-box;\
  height: 100px;\
  margin: 0;\
}\
#customCSSMenu .right,\
#settingsMenu .right {\
  margin-top: 2px;\
}\
#settingsMenu label {\
  display: block;\
  user-select: none;\
  -moz-user-select: none;\
  -webkit-user-select: none;\
}\
#filtersHelp > div {\
  width: 600px;\
  left: 50%;\
  margin-left: -300px;\
}\
#filtersHelp h4 {\
  font-size: 15px;\
  margin: 20px 0 0 10px;\
}\
#filtersHelp h4:before {\
  content: "»";\
  margin-right: 3px;\
}\
#filtersHelp ul {\
  padding: 0;\
  margin: 10px;\
}\
#filtersHelp li {\
  padding: 3px 0;\
  list-style: none;\
}\
#filtersHelp code {\
  background-color: #eee;\
  color: #000000;\
  padding: 1px 4px;\
  font-size: 12px;\
}\
#filtersMenu table {\
  width: 100%;\
}\
#filtersMenu th {\
  font-size: 12px;\
}\
#filtersMenu tbody {\
  text-align: center;\
}\
#filtersMenu select,\
.fPattern,\
.fColor {\
  padding: 1px;\
  font-size: 11px;\
}\
#filtersMenu select {\
  width: 75px;\
}\
#filtersMenu tfoot td {\
  padding-top: 10px;\
}\
.fPattern {\
  width: 160px;\
}\
.fColor {\
  width: 60px;\
}\
.fDel {\
  font-size: 12px;\
  line-height: 1.5;\
}\
.filter-preview {\
  cursor: default;\
  margin-left: 3px;\
}\
#quote-preview .filter-preview {\
  display: none;\
}\
.post-hidden:not(#quote-preview) {\
  opacity: 0.5;\
}\
.post-hidden:not(.thread) .postInfo {\
  padding-left: 5px;\
}\
.post-hidden:not(#quote-preview) input,\
.post-hidden:not(#quote-preview) .replyContainer,\
.post-hidden:not(#quote-preview) .summary,\
.post-hidden:not(#quote-preview) .op .file,\
.post-hidden:not(#quote-preview) .file,\
.post-hidden .wbtn,\
.post-hidden .postNum span,\
.post-hidden .extControls,\
.post-hidden:not(#quote-preview) .backlink,\
div.post-hidden:not(#quote-preview) div.file,\
div.post-hidden:not(#quote-preview) blockquote.postMessage {\
  display: none;\
}\
div.post div.file .fileThumb img {\
  position: relative;\
  z-index: 1;\
}\
';

  style = document.createElement('style');
  style.setAttribute('type', 'text/css');
  style.textContent = css;
  document.head.appendChild(style);
};

Main.init(); 
