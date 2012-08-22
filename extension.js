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

/**
 * Parser
 */
var Parser = {};

Parser.init = function() {
  this.initIcons();
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
      fileClass = ' imgspoiler';
      
      fileThumb = '//static.4chan.org/image/spoiler.png';
      data.tn_w = 100;
      data.tn_h = 100;
    }
    else {
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
        + 'B, ' + fileDims + ', <span title="' + longFile + '">'
        + shortFile + '</span>)</span>';
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
};

Parser.parseThread = function(tid, offset, limit) {
  var i, thread, posts, pi, el, frag, summary, omitted, key;
  
  thread = $.id('t' + tid);
  posts = thread.getElementsByClassName('post');
  
  if (!offset) {
    if (!Main.tid) {
      if (Config.threadHiding) {
        el = document.createElement('span');
        el.id = 'sa' + tid;
        el.alt = 'H';
        el.innerHTML = '<img class="extButton threadHideButton"'
          + 'data-cmd="hide" data-tid="' + tid + '" src="'
          + Main.icons.minus + '" title="Hide thread">';
        posts[0].insertBefore(el, posts[0].firstChild);
        if (ThreadHiding.hidden[tid]) {
          ThreadHiding.hidden[tid] = ThreadHiding.now;
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
        el.setAttribute('data-tid', tid);
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
      el.setAttribute('data-tid', tid);
      el.alt = 'W';
      el.title = 'Add to watch list';
      pi = document.getElementById('pi' + tid);
      pi.insertBefore(el, pi.firstChild);
    }
  }
  
  i = offset ? offset < 0 ? posts.length + offset : offset : 0;
  limit = limit ? i + limit : posts.length;
  
  for (; i < limit; ++i) {
    Parser.parsePost(posts[i].id.slice(1), tid);
  }
};

Parser.parsePost = function(pid, tid) {
  var cnt, quickReply, el, pi, href, a, img;
  
  pi = document.getElementById('pi' + pid);
  
  cnt = document.createElement('div');
  cnt.className = 'extControls';
  
  if (QR.enabled) {
    el = document.createElement('img');
    el.className = 'extButton';
    el.src = Main.icons.quote;
    el.setAttribute('data-cmd', 'qr');
    el.setAttribute('data-tid', tid + '-' + pid);
    el.title = 'Quick reply';
    el.alt = 'Q';
    cnt.appendChild(el);
  }
  
  if (Config.reportButton) {
    el = document.createElement('img');
    el.className = 'extButton';
    el.src = Main.icons.report;
    el.setAttribute('data-cmd', 'report');
    el.setAttribute('data-tid', pid);
    el.title = 'Report post';
    el.alt = '!';
    cnt.appendChild(el);
  }
  
  if (cnt.firstChild) {
    pi.appendChild(cnt);
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
    }
    file.appendChild(img);
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
  
  if (Config.backlinks && pid != tid) {
    Parser.parseBacklinks(pid, tid);
  }
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
      el.innerHTML = 'Quoted by: ';
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
  
  thread = $.id('delform');
  thread.addEventListener('mouseover', Main.onThreadMouseOver, false);
  thread.addEventListener('mouseout', Main.onThreadMouseOut, false);
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
    // Visible?
    offset = post.getBoundingClientRect();
    if (offset.top > 0
        && offset.bottom < document.documentElement.clientHeight) {
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
      console.log('From cache');
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
  
  //console.log(board + ' ' + tid + ' ' + pid);
  
  link.style.cursor = 'wait';
  
  onload = function() {
    var i, j, el, posts;
    
    link.style.cursor = null;
    
    if (this.status == 200 || this.status == 304 || this.status == 0) {
      if (!QuotePreview.xhr) {
        return;
      }
      
      posts = JSON.parse(this.responseText).posts;
      
      for (i = 0; j = posts[i]; ++i) {
        if (j.no != pid) {
          continue;
        }
        el = $.class('post', Parser.buildHTMLFromJSON(j, board))[0];
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
    link.style.cursor = null;
  };
  
  QuotePreview.xhr =
    //$.get('//localtest.4chan.org/' + board + '/res/' + tid + '.json',
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
      post.style.display = null;
    }
    else {
      post = post.cloneNode(true);
      post.id = 'quote-preview';
    }
    
    if ($.hasClass(post, 'op')) {
      $.addClass(post, 'reply');
    }
    
    rect = link.getBoundingClientRect();
    docWidth = document.documentElement.offsetWidth;
    style = post.style;
    
    document.body.appendChild(post);
    
    if ((docWidth - rect.right) < (0 | (docWidth * 0.3))) {
      pos = docWidth - rect.left;
      style.right = pos + 10 + 'px'
    }
    else {
      pos = rect.left + rect.width;
      style.left = pos + 10 + 'px';
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
  el.style.cursor = null;
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
ImageExpansion = {};

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
    img.style.display = null;
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
var QR = {
  enabled: false
};

QR.init = function() {
  this.enabled = !!document.forms.post
  if (!this.enabled) {
    return;
  }
  this.currentTid = null;
  this.cooldown = null;
  this.auto = false;
  this.baseDelay = 30500;
  this.sageDelay = 60500;
  this.captchaDelay = 240500;
  this.captchaInterval = null;
};

QR.show = function(tid, pid) {
  var i, j, cnt, postForm, form, table, fields, tr, tbody, pos, spoiler, file,
    cd, qrError;
  
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
  cnt.className = 'reply';
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

QR.close = function() {
  var cnt = $.id('quickReply');
  clearInterval(QR.captchaInterval);
  QR.currentTid = null;
  cnt.removeEventListener('click', QR.onClick, false);
  Draggable.unset($.id('qrHeader'));
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
  
  if (t.id == 'qrCaptcha') {
    QR.reloadCaptcha(true);
  }
  else if (t.type == 'submit') {
    e.preventDefault();
    QR.submit();
  }
  else if (t.id == 'qrClose') {
    QR.close();
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

QR.submit = function(e) {
  var i, btn, cd, xhr, email, field;
  
  QR.hidePostError();
  
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
  
  if ((field = $.id('qrCapField')).value == '') {
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
  
  xhr = new XMLHttpRequest();
  xhr.open('POST', document.forms.qrPost.action, true);
  xhr.withCredentials = true;
  xhr.upload.onprogress = function(e) {
    btn.value = (0 | (e.loaded / e.total * 100)) + '%';
  };
  xhr.onerror = function() {
    btn.value = 'Submit';
    console.log('Error');
    QR.showPostError('Connection error. Are you <a href="https://www.4chan.org/banned">banned</a>?');
  };
  xhr.onload = function() {
    var resp, qrFile;
    
    btn.value = 'Submit';
    
    if (this.status == 200) {
      if (resp = xhr.responseText.match(/"errmsg"[^>]*>(.*?)<\/span/)) {
        QR.reloadCaptcha();
        QR.showPostError(resp[1]);
        return;
      }
      
      if (/You are banned! ;_;/.test(xhr.responseText)) {
        if (/heeding this warning/.test(xhr.responseText)) {
          resp = xhr.responseText
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
        if (Main.tid) {
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
      localStorage.setItem('4chan-cd-' + Main.board, cd);
      QR.startCooldown(cd);
      
      if (Main.tid) {
        $.byName('com')[1].value = '';
        QR.reloadCaptcha();
        qrFile = document.getElementById('qrFile').parentNode;
        qrFile.innerHTML = qrFile.innerHTML;
        if (Config.threadUpdater) {
          setTimeout(ThreadUpdater.update, 500);
        }
        return;
      }
    }
    else {
      QR.showPostError('Error: ' + xhr.status + ' ' + xhr.statusText);
    };
  }
  btn.value = 'Sending';
  xhr.send(new FormData(document.forms.qrPost));
};

QR.startCooldown = function(ms) {
  var btn, interval;
  
  ms = parseInt(ms, 10);
  
  btn = $.id('quickReply').querySelector('input[type="submit"]');
  
  if ((QR.cooldown = 0 | ((ms - Date.now()) / 1000)) <= 0) {
    QR.cooldown = false;
    localStorage.removeItem('4chan-cd-' + Main.board);
    return;
  }
  btn.value = 'CD: ' + QR.cooldown + 's';
  interval = setInterval(function() {
    if ((QR.cooldown = 0 | ((ms - Date.now()) / 1000)) <= 0) {
      clearInterval(interval);
      btn.value = 'Submit';
      QR.cooldown = false;
      localStorage.removeItem('4chan-cd-' + Main.board);
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
var ThreadHiding = {};

ThreadHiding.init = function() {
  this.threshold = 7 * 86400000;
  this.now = Date.now();
  this.hidden = {};
  this.load();
};

ThreadHiding.toggle = function(tid) {
  if ($.id('sa' + tid).hasAttribute('data-hidden')) {
    this.show(tid);
  } else {
    this.hide(tid);
  }
  this.save();
};

ThreadHiding.show = function(tid) {
  var post, message, stub, thread, sa;
  
  post = $.id('p' + tid);
  message = $.id('m' + tid);
  stub = $.id('stub-' + tid);
  thread = $.id('t' + tid);
  sa = $.id('sa' + tid);
  
  sa.removeAttribute('data-hidden');
  sa.firstChild.src = Main.icons.minus;
  post.insertBefore(sa, post.firstChild);
  if ($.hasClass(message.previousSibling, 'backlink')) {
    post.insertBefore(stub.firstChild, message.previousSibling);
  }
  else {
    post.insertBefore(stub.firstChild, message);
  }
  
  thread.parentNode.removeChild(stub);
  thread.style.display = 'block';
  
  delete this.hidden[tid];
};

ThreadHiding.hide = function(tid) {
  var stub, sa, thread;
  
  thread = $.id('t' + tid);
  thread.style.display = 'none';
  
  sa = $.id('sa' + tid);
  sa.setAttribute('data-hidden', tid);
  sa.firstChild.src = Main.icons.plus;
  
  stub = document.createElement('div');
  stub.id = 'stub-' + tid;
  stub.className = 'stub post';
  stub.appendChild(sa);
  stub.appendChild(document.getElementById('pi' + tid));
  
  thread.parentNode.insertBefore(stub, thread);
  
  this.hidden[tid] = Date.now();
};

ThreadHiding.load = function() {
  var storage;
  
  if (storage = localStorage.getItem('4chan-hide-' + Main.board)) {
    this.hidden = JSON.parse(storage);
  }
};

ThreadHiding.purge = function() {
  var tid, now;
  
  now = Date.now();
  
  for (tid in this.hidden) {
    if (now - this.hidden[tid] > this.threshold) {
      console.log('Purging hidden thread: ' + (now - this.hidden[tid]) + ' vs ' + this.threshold);
      delete this.hidden[tid];
    }
  }
  
  this.save();
};

ThreadHiding.save = function() {
  for (var i in this.hidden) {
    localStorage.setItem('4chan-hide-' + Main.board,
      JSON.stringify(this.hidden)
    );
    return;
  }
  localStorage.removeItem('4chan-hide-' + Main.board);
};

/**
 * Thread watcher
 */
var ThreadWatcher = {
  listNode: null,
  charLimit: 40,
  watched: {},
};

ThreadWatcher.watched = {};

ThreadWatcher.init = function() {
  var cnt, html;
  
  cnt = document.createElement('div');
  cnt.id = 'threadWatcher';
  cnt.className = 'reply';
  cnt.setAttribute('data-trackpos', 'TW-position');
  
  if (Config['TW-position']) {
    cnt.style.cssText = Config['TW-position'];
  }
  else {
    cnt.style.left = '10px';
    cnt.style.top = '100px';
  }
  
  if (Config.fixedThreadWatcher) {
    cnt.style.position = 'fixed';
  }
  else {
    cnt.style.position = null;
  }
  
  cnt.innerHTML = '<div class="drag" id="twHeader">Thread Watcher</div>';
  
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
        + '"><span class="pointer" data-cmd="unwatch" data-tid="'
        + tuid[0] + '" data-board="' + tuid[1] + '">&times;</span> <a href="'
        + Main.linkToThread(tuid[0], tuid[1]) + '">/'
        + tuid[1] + '/ - '
        + ThreadWatcher.watched[key] + '</a></li>';
    }
    
    if (full) {
      buttons = $.class('wbtn', $.id('delform'));
      for (i = 0; btn = buttons[i]; ++i) {
        key = btn.getAttribute('data-tid') + '-' + Main.board;
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
  if (t.hasAttribute('data-tid')) {
    ThreadWatcher.toggle(
      t.getAttribute('data-tid'),
      t.getAttribute('data-board')
    );
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
    if (label = $.class('subject', $.id('pi' + tid))[0].textContent) {
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
          tail = +$.class('reply', thread)[0].id.slice(1);
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
          if ((abbr = $.class('abbr', msg)[0])
            && /^Comment/.test(abbr.textContent)) {
            thread.setAttribute('data-truncated', '1');
            expmsg = document.createElement('div');
            expmsg.style.display = 'none';
            expmsg.textContent = msg.innerHTML;
            msg.parentNode.insertBefore(expmsg, msg.nextSibling);
            if (metacap = $.class('capcodeReplies', msg)[0]) {
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
  this.unread = false;
  this.auto = false;
  this.delay = 0;
  this.step = 5;
  this.range = [ 5, 300 ];
  this.lastModified = '0';
  
  this.iconNode = (document.head || $.tag('head')[0])
    .querySelector('link[rel="shortcut icon"]');
  
  this.defaultIcon = this.iconNode.getAttribute('href');
  
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
    
    if (navlinks = $.class('navLinks' + j)[0]) {
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
  this.delay = this.range[0];
  document.addEventListener('scroll', this.onScroll, false);
  this.updateInterval = setTimeout(this.update, this.delay * 1000);
  this.pulse();
};

ThreadUpdater.stop = function() {
  this.auto = this.updating = this.force = false;
  this.autoNode.removeAttribute('checked');
  this.autoNodeBot.removeAttribute('checked');
  this.setStatus('');
  this.setIcon(this.defaultIcon);
  document.removeEventListener('scroll', this.onScroll, false);
  clearTimeout(this.updateInterval);
  clearTimeout(this.pulseInterval);
};

ThreadUpdater.pulse = function() {
	var self = ThreadUpdater;
	self.setStatus(self.delay - (0 | (Date.now() - self.lastUpdated) / 1000));
	self.pulseInterval = setTimeout(self.pulse, 1000);
};

ThreadUpdater.adjustDelay = function(postCount, force)
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

ThreadUpdater.onScroll = function(e) {
  if (document.documentElement.scrollTopMax ==
    document.documentElement.scrollTop) {
    ThreadUpdater.setIcon(ThreadUpdater.defaultIcon);
    ThreadUpdater.unread = false;
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
		console.log('Already updating');
		return;
	}
	
	if (self.auto) {
		clearTimeout(self.pulseInterval);
		clearTimeout(self.updateInterval);	
	}
	
	self.updating = true;
	
	console.log('Updating thread at ' + new Date().toString());
	
	self.setStatus('Updating...');
	
	//$.get('http://localtest.4chan.org/' + Main.board + '/res/' + Main.tid + '.json',
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
    
    thread = document.getElementById('t' + Main.tid);
    
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
      if (!self.unread && !self.force) {
        self.setIcon(self.icons[Main.type]);
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
    self.setStatus('Not Found');
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
  self.setStatus('Connection Error');
  self.lastUpdated = Date.now();
  self.adjustDelay(0, self.force);
  self.updating = self.force = false;
};

ThreadUpdater.setStatus = function(msg) {
  this.statusNode.textContent = this.statusNodeBot.textContent = msg;
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
      style.right = null;
    }
    else if (Draggable.right < left) {
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
    else if (Draggable.bottom < top) {
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
 * Config
 */
var Config = {
  threadHiding: true,
  threadWatcher: true,
  threadExpansion: true,
  fixedThreadWatcher: false,
  threadUpdater: true,
  imageExpansion: true,
  pageTitle: true,
  backlinks: true,
  quotePreview: true,
  quickReply: true,
  reportButton: true,
  stickyNav: true,
  imageSearch: true,
  revealSpoilers: true
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
  threadHiding: 'Thread hiding',
  threadWatcher: 'Thread watcher',
  threadExpansion: 'Thread expansion',
  fixedThreadWatcher: 'Fixed thread watcher',
  threadUpdater: 'Thread updater',
  imageExpansion: 'Image expansion',
  pageTitle: 'Excerpts in page title',
  backlinks: 'Backlinks',
  quotePreview: 'Quote preview',
  quickReply: 'Quick reply',
  reportButton: 'Report button',
  stickyNav: 'Sticky navigation arrows',
  imageSearch: 'Image search',
  revealSpoilers: 'Reveal spoilers'
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
};

SettingsMenu.toggle = function(e) {
  e.preventDefault();
  if ($.id('settingsMenu')) {
    SettingsMenu.close();
  }
  else {
    SettingsMenu.open(this.id == 'settingsWindowLinkBot');
  }
};

SettingsMenu.open = function(bottom) {
  var key, html, btn;
  
  cnt = document.createElement('div');
  cnt.id = 'settingsMenu';
  cnt.className = 'reply';
  cnt.style[bottom ? 'bottom' : 'top'] = '20px';
  
  html = '';
  for (key in SettingsMenu.options) {
    html += '<label><input type="checkbox" class="menuOption" data-option="'
      + key + '"' + (Config[key] ? ' checked="checked">' : '>')
      + SettingsMenu.options[key] + '</label>';
  }
  
  cnt.innerHTML = html + '<hr>';
  
  btn = document.createElement('button');
  btn.id = 'settingsSave';
  btn.textContent = 'Save';
  btn.addEventListener('click', SettingsMenu.save, false);
  cnt.appendChild(btn);
  
  btn = document.createElement('button');
  btn.id = 'settingsClose';
  btn.textContent = 'Close';
  btn.addEventListener('click', SettingsMenu.close, false);
  cnt.appendChild(btn);
  
  btn = document.createElement('button');
  btn.textContent = 'Clear Local Storage';
  btn.addEventListener('click', function() { localStorage.clear(); }, false);
  cnt.appendChild(btn);
  
  document.body.appendChild(cnt);
};

SettingsMenu.close = function() {
  $.id('settingsSave').removeEventListener('click', SettingsMenu.save, false);
  $.id('settingsClose').removeEventListener('click', SettingsMenu.close, false);
  document.body.removeChild($.id('settingsMenu'));
};

/**
 * Main
 */
var Main = {};

Main.init = function()
{
  //var start = Date.now();
  var params, storage, cnt, el;
  
  document.removeEventListener('DOMContentLoaded', Main.init, false);
  
  Config.load();
  
  if (Main.stylesheet = Main.getCookie(style_group)) {
    Main.stylesheet = Main.stylesheet.toLowerCase().replace(/ /g, '_');
  }
  else {
    Main.stylesheet =
      style_group == 'nws_style' ? 'yotsuba_new' : 'yotsuba_b_new';
  }
  
  Main.type = style_group.split('_')[0];
  
  $.addClass(document.body, Main.stylesheet);
  $.addClass(document.body, Main.type);
  
  params = location.pathname.split(/\//);
  Main.board = params[1];
  Main.tid = params[3];
  
  Main.addCSS();
  Main.initIcons();
  
  if (Config.stickyNav) {
    Main.setStickyNav();
  }
  
  if (Config.quickReply) {
    if (!window.FormData) {
      console.log("This browser doesn't support XHR2");
      Config.quickReply = false;
    }
    else {
      QR.init();
    }
  }
  
  if (Config.threadWatcher) {
    ThreadWatcher.init();
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
    if (Config.threadHiding) {
      ThreadHiding.init();
      Parser.parseBoard();
      ThreadHiding.purge();
    }
    else {
      Parser.parseBoard();
    }
  }
  
  if (Config.quotePreview) {
    QuotePreview.init();
  }
  
  document.addEventListener('click', Main.onclick, false);
  window.addEventListener('storage', Main.syncStorage, false);
  
  $.id('settingsWindowLink').addEventListener('click', SettingsMenu.toggle, false);
  $.id('settingsWindowLinkBot').addEventListener('click', SettingsMenu.toggle, false);
  
  //console.info('4chanJS took: ' + (Date.now() - start) + 'ms');
};

Main.icons = {
  up: 'arrow_up.png',
  down: 'arrow_down.png',
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

Main.setStickyNav = function() {
  var cnt;
  
  cnt = document.createElement('div');
  cnt.id = 'stickyNav';
  cnt.innerHTML
    = '<img class="extButton" src="' +  Main.icons.up
      + '" data-cmd="totop" alt="▲" title="Top">'
    + '<img class="extButton" src="' +  Main.icons.down
      + '" data-cmd="tobottom" alt="▼" title="Bottom">';
  
  document.body.appendChild(cnt);
};

Main.setTitle = function() {
  var title, entities;
  
  if (!(title = $.class('subject', $.id('pi' + Main.tid))[0].textContent)) {
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

Main.quotePost = function(pid, qr) {
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
  
  t = e.target;
  
  if (cmd = t.getAttribute('data-cmd')) {
    tid = t.getAttribute('data-tid');
    switch (cmd) {
      case 'qr':
        e.preventDefault();
        ids = tid.split('-'); // tid, pid
        QR.show(ids[0], ids[1]);
        Main.quotePost(ids[1], true);
        break;
      case 'update':
        e.preventDefault();
        ThreadUpdater.forceUpdate();
        break;
      case 'auto':
        ThreadUpdater.toggleAuto();
        break;
      case 'hide':
        ThreadHiding.toggle(tid);
        break;
      case 'watch':
        ThreadWatcher.toggle(tid);
        break;
      case 'expand':
        ThreadExpansion.toggle(tid);
        break;
      case 'report':
        Main.reportPost(tid);
        break;
      case 'totop':
        location.href = '#top';
        break;
      case 'tobottom':
        location.href = '#bottom';
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
  if (Config.quotePreview && $.hasClass(e.target, 'quotelink')) {
    QuotePreview.resolve(e.target);
  }
}

Main.onThreadMouseOut = function(e) {
  if (Config.quotePreview && $.hasClass(e.target, 'quotelink')) {
    QuotePreview.remove(e.target);
  }
}

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
.preview div.post div.file div.fileInfo {\
  margin-left: 0px !important;\
}\
.threadHideButton {\
  float: left;\
  margin-right: 5px;\
}\
div.op > span .postHideButtonCollapsed {\
  margin-right: 1px;\
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
.stub .extControls,\
.stub .postNum,\
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
#settingsMenu {\
  position: fixed;\
  display: inline-block;\
  right: 20px;\
  box-shadow: 0px 0px 3px rgba(0, 0, 0, 0.35);\
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
#quickReply {\
  position: fixed;\
  box-shadow: 0px 0px 3px rgba(0, 0, 0, 0.35);\
}\
#qrHeader {\
  text-align: center;\
  padding: 0;\
  margin-left: 1px;\
  height: 20px;\
}\
#qrClose {\
  top: 1px;\
  float: right;\
}\
#qrCaptcha {\
  width: 300px;\
  cursor: pointer;\
  border: 1px solid #DFDFDF;\
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
  max-width: 265px;\
  display: block;\
  position: absolute;\
  padding: 3px;\
  box-shadow: 0px 0px 3px rgba(0, 0, 0, 0.35);\
}\
#watchList {\
  margin: 0;\
  padding: 0;\
  user-select: none;\
  -moz-user-select: none;\
  -webkit-user-select: none;\
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
#qrError {\
  display: none;\
  padding: 5px;\
  font-family: monospace;\
  background-color: #E62020;\
  color: white;\
  padding: 3px 5px;\
  text-shadow: 0 1px rgba(0, 0, 0, 0.20);\
  font-size: 0.8em;\
}\
#qrError a {\
  color: white;\
}\
.fitToPage {\
  width: 100%;\
  max-width: 100%;\
}\
#quote-preview {\
  display: block;\
  position: absolute;\
  box-shadow: 0px 0px 3px rgba(0, 0, 0, 0.35);\
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
  text-decoration: line-through;\
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
  margin-left: 0;\
}\
.tCollapsed .rExpanded {\
  display: none;\
}\
#stickyNav {\
  position: fixed;\
  top: 60px;\
  right: 0;\
}\
';

  style = document.createElement('style');
  style.setAttribute('type', 'text/css');
  style.textContent = css;
  (document.head || $.tag('head')[0]).appendChild(style);
};

Main.reportPost = function(pid) {
  window.open('https://sys.4chan.org/'
    + Main.board + '/imgboard.php?mode=report&no=' + pid
    , Date.now(),
    "toolbar=0,scrollbars=0,location=0,status=1,menubar=0,resizable=1,width=680,height=200");
};

Main.linkToThread = function(tid, board) {
  return '//' + location.host + '/' + (board || Main.board) + '/res/' + tid;
};

if (['interactive', 'complete'].indexOf(document.readyState) != -1) {
  Main.init();
}
else {
  document.addEventListener('DOMContentLoaded', Main.init, false); 
}
