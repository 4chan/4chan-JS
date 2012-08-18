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
  xhr.timeout = 25000;
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
      
      var fileThumb = '//static.4chan.org/image/spoiler-' + board + '.png';
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

Parser.parseThread = function(tid, offset) {
  var i, thread, posts, pi, el, key;
  
  thread = $.id('t' + tid);
  posts = thread.getElementsByClassName('post');
  
  if (!offset) {
    if (Config.threadHiding) {
      el = document.createElement('span');
      el.id = 'sa' + tid;
      el.alt = 'H';
      el.innerHTML = '<img class="extButton threadHideButton"'
        + 'data-cmd="hide" data-tid="' + tid + '" src="'
        + Parser.icons.minus + '" title="Hide thread">';
      posts[0].insertBefore(el, posts[0].firstChild);
      if (ThreadHiding.hidden[tid]) {
        ThreadHiding.hide(tid);
      }
    }
    if (Config.threadWatcher) {
      el = document.createElement('img');
      el.className = 'extButton wbtn';
      if (ThreadWatcher.watched[key = tid + '-' + Main.board]) {
        el.src = Parser.icons.watched;
        el.setAttribute('data-active', '1');
      }
      else {
        el.src = Parser.icons.notwatched;
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
  
  for (i = offset ? posts.length - offset : 0 ; posts[i]; ++i) {
    Parser.parsePost(posts[i].id.slice(1), tid);
  }
};

Parser.parsePost = function(pid, tid) {
  var cnt, quickReply, el, pi, href, fileText;
  
  pi = document.getElementById('pi' + pid);
  
  cnt = document.createElement('div');
  cnt.className = 'extControls';
  
  if (QR.enabled) {
    el = document.createElement('img');
    el.className = 'extButton';
    el.src = Parser.icons.quote;
    el.setAttribute('data-cmd', 'qr');
    el.setAttribute('data-tid', tid + '-' + pid);
    el.title = 'Quick reply';
    el.alt = 'Q';
    cnt.appendChild(el);
  }
  
  if (Config.reportButton) {
    el = document.createElement('img');
    el.className = 'extButton';
    el.src = Parser.icons.report;
    el.setAttribute('data-cmd', 'report');
    el.setAttribute('data-tid', pid);
    el.title = 'Report post';
    el.alt = '!';
    cnt.appendChild(el);
  }
  
  if (Config.toTopButton) {
    el = document.createElement('img');
    el.className = 'extButton';
    el.src = Parser.icons.up;
    el.setAttribute('data-cmd', 'totop');
    el.title = 'Back to top';
    el.alt = '▴';
    cnt.appendChild(el);
  }
  
  if (cnt.firstChild) {
    pi.appendChild(cnt);
  }
  
  if (Config.imageSearch && (fileText = document.getElementById('fT' + pid))) {
    href = fileText.firstElementChild.href;
    el = document.createElement('div');
    el.className = 'extControls';
    el.innerHTML =
      '<a href="//www.google.com/searchbyimage?image_url=' + href
      + '" target="_blank" title="Google Image Search"><img class="extButton" src="'
      + Parser.icons.gis + '" alt="G"></a><a href="http://iqdb.org/?url='
      + href + '" target="_blank" title="iqdb"><img class="extButton" src="'
      + Parser.icons.iqdb + '" alt="I"></a>';
    fileText.parentNode.appendChild(el);
  }
  
  if (Config.backlinks) {
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
      j.textContent = '>>OP';
      //j.textContent += ' (OP)';
    }
    
    if (!(target = document.getElementById('m' + ids[1]))) {
      if (Main.tid && ids[0].charAt(0) != '/') {
        j.className += ' crosslink';
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
      '<a href="#p' + pid + '" class="quotelink">&gt;&gt;' + pid + '</a>';
    
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

Parser.icons = {
  up: 'arrow_up.png',
  cross: 'cross.png',
  gis: 'gis.png',
  iqdb: 'iqdb.png',
  minus: 'post_expand_minus.png',
  plus: 'post_expand_plus.png',
  quote: 'quote.png',
  report: 'report.png',
  notwatched: 'watch_thread_off.png',
  watched: 'watch_thread_on.png'
};

Parser.initIcons = function() {
  var key, paths, url;
  
  paths = {
    yotsuba_new: 'futaba/',
    futaba_new: 'futaba/',
    yotsuba_b_new: 'burichan/',
    burichan_new: 'burichan/',
    tomorrow: 'burichan/',
    photon: 'futaba/'
  };
  
  url = '//static.4chan.org/image/buttons/' + paths[Main.stylesheet];
  
  for (key in Parser.icons) {
    Parser.icons[key] = url + Parser.icons[key];
  }
};

/**
 * Quote preview
 */
var QuotePreview = {};

QuotePreview.init = function() {
  var thread;
  
  this.maxWidth = 500;
  this.debounce = 250;
  this.timeout = null;
  this.xhr = null;
  this.cachedKey = null;
  this.cachedNode = null;
  
  thread = $.id('delform');
  thread.addEventListener('mouseover', Main.onThreadMouseOver, false);
  thread.addEventListener('mouseout', Main.onThreadMouseOut, false);
};

QuotePreview.resolve = function(link) {
  var self, t, post, ids;
  
  self = QuotePreview;
  
  // [ string, board, tid, pid ]
  t = link.getAttribute('href')
    .match(/^(?:\/([^\/]+)\/)?(?:res\/)?([0-9]+)?#p([0-9]+)$/);
  
  if (!t) {
    return;
  }
  
  // Quoted post in scope
  if (post = document.getElementById('p' + t[3])) {
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
    var t, out, clr, rect, left, d, width;
    
    width = post.offsetWidth;
    if (width > QuotePreview.maxWidth) {
      width = QuotePreview.maxWidth;
    }
    
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
    left = rect.left;
    if ((d = document.documentElement.offsetWidth - rect.left - width) < 0) {
      left += d;
    }
    
    post.style.left = left + 'px';
    post.style.top = (rect.top + link.offsetHeight + window.scrollY) + 'px';
    
    document.body.appendChild(post);
};

QuotePreview.remove = function(el) {
  var cnt;
  
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

ImageExpansion.expand = function(img)
{
  img.onload = img.onerror = null;
  if (img.hasAttribute('style')) {
    img.removeAttribute('style');
  }
  if (!$.hasClass(img, 'fitToPage')) {
    img.style.opacity = 0.5;
    img.setAttribute('data-thumburl', img.getAttribute('src'));
    img.onload = ImageExpansion.onExpanded;
    img.onerror = ImageExpansion.onExpanded;
    img.setAttribute('src', img.parentNode.getAttribute('href'));
  }
  else {
    img.setAttribute('src', img.getAttribute('data-thumburl'));
    $.removeClass(img, 'fitToPage');
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
    + tid + '</span><img alt="X" src="' + Parser.icons.cross + '" id="qrClose" '
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
  xhr.upload.onprogress = function(e) {
    btn.value = (0 | (e.loaded / e.total * 100)) + '%';
  };
  xhr.onerror = function() {
    btn.value = 'Submit';
    console.log('Error');
    QR.showPostError('Connection error. Are you <a href="https//www.4chan.org/banned">banned</a>?');
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
          QR.showPostError('You are <a href="https//www.4chan.org/banned">banned</a>! ;_;');
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
        setTimeout(ThreadUpdater.update, 500);
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

ThreadHiding.hidden = {};

ThreadHiding.toggle = function(tid) {
  if ($.id('sa' + tid).hasAttribute('data-hidden')) {
    ThreadHiding.show(tid);
  } else {
    ThreadHiding.hide(tid);
  }
  ThreadHiding.save();
};

ThreadHiding.show = function(tid) {
  var post, message, summary, thread, sa;
  
  post = $.id('p' + tid);
  message = $.id('m' + tid);
  summary = $.id('summary-' + tid);
  thread = $.id('t' + tid);
  sa = $.id('sa' + tid);
  
  sa.removeAttribute('data-hidden');
  sa.firstChild.src = Parser.icons.minus;
  post.insertBefore(sa, post.firstChild);
  post.insertBefore(summary.firstChild, message);
  
  thread.parentNode.removeChild(summary);
  thread.style.display = 'block';
  
  delete ThreadHiding.hidden[tid];
};

ThreadHiding.hide = function(tid) {
  var summary, sa, thread;
  
  thread = $.id('t' + tid);
  thread.style.display = 'none';
  
  sa = $.id('sa' + tid);
  sa.setAttribute('data-hidden', tid);
  sa.firstChild.src = Parser.icons.plus;
  
  summary = document.createElement('summary');
  summary.id = 'summary-' + tid;
  summary.className = 'summary';
  summary.appendChild(sa);
  summary.appendChild(document.getElementById('pi' + tid));
  
  thread.parentNode.insertBefore(summary, thread);
  
  ThreadHiding.hidden[tid] = Date.now();
};

ThreadHiding.load = function() {
  var now, tid, storage, purgeThreshold, purgeCount;
  
  now = Date.now();
  purgeThreshold = 7 * 86400000;
  purgeCount = 0;
  
  if (storage = localStorage.getItem('4chan-hide-' + Main.board)) {
    ThreadHiding.hidden = JSON.parse(storage);
  }
  
  for (tid in ThreadHiding.hidden) {
    if (now - ThreadHiding.hidden[tid] > purgeThreshold) {
      ++purgeCount;
      delete ThreadHiding.hidden[tid];
    }
  }
  
  if (purgeCount) {
    console.log('Purged ' + purgeCount + ' hidden threads');
    ThreadHiding.save();
  }
};

ThreadHiding.save = function() {
  for (var i in ThreadHiding.hidden) {
    localStorage.setItem('4chan-hide-' + Main.board,
      JSON.stringify(ThreadHiding.hidden)
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
            btn.src = Parser.icons.watched;
            btn.setAttribute('data-active', '1')
          }
        }
        else {
          if (btn.hasAttribute('data-active')) {
            btn.src = Parser.icons.notwatched;
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
      btn.src = Parser.icons.notwatched;
      btn.removeAttribute('data-active');
    }
  }
  else {
    if (label = $.class('subject', $.id('pi' + tid))[0].textContent) {
      label = label.slice(0, 35);
    }
    else if (label = $.id('m' + tid).innerHTML) {
      label = label.replace(/<br>/, ' ').replace(/<[^>]*?>/, '').slice(0, 35);
    }
    else {
      label = tid;
    }
    ThreadWatcher.watched[key] = label;
    if (btn = $.id('wbtn-' + key)) {
      btn.src = Parser.icons.watched;
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
 * Thread updater
 */
var ThreadUpdater = {
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

ThreadUpdater.init = function() {
	var frag, navlinks, el, label, postCount, head;
	
	postCount = document.getElementsByClassName('reply').length;
	navlinks = document.getElementsByClassName('navLinksBot')[0];
	
	frag = document.createDocumentFragment();
	
	head = document.head || $.tag('head')[0];
	this.iconNode = head.querySelector('link[rel="shortcut icon"]');
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

ThreadUpdater.start = function() {
	this.auto = true;
	this.force = this.updating = false;
	this.lastUpdated = Date.now();
	this.delay = this.range[0];
	document.addEventListener('scroll', this.onScroll, false);
	this.updateInterval = setTimeout(this.update, this.delay * 1000);
	this.pulse();
};

ThreadUpdater.stop = function() {
	this.auto = this.updating = this.force = false;
	this.statusNode.textContent = '';
	this.setIcon(this.defaultIcon);
	document.removeEventListener('scroll', this.onScroll, false);
	clearTimeout(this.updateInterval);
	clearTimeout(this.pulseInterval);
};

ThreadUpdater.pulse = function() {
	var self = ThreadUpdater;
	self.statusNode.textContent =
		self.delay - (0 | (Date.now() - self.lastUpdated) / 1000);
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

ThreadUpdater.onUpdateClick = function(e) {
	e.preventDefault();
	ThreadUpdater.force = true;
	ThreadUpdater.update();
};

ThreadUpdater.onAutoClick = function(e) {
	if (this.hasAttribute('checked')) {
		this.removeAttribute('checked');
		ThreadUpdater.stop();
	}
	else {
		this.setAttribute('checked', 'checked');
		ThreadUpdater.start();
	}
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
	
	self.statusNode.textContent = 'Updating...';
	
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
  
  self.statusNode.textContent = '';
  
  if (this.status == 200) {
    self.lastModified = this.getResponseHeader('Last-Modified');
    
    thread = document.getElementById('t' + Main.tid);
    
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
      if (!self.unread && !self.force) {
        self.setIcon(self.icons[Main.type]);
      }
      
      frag = document.createDocumentFragment();
      for (i = nodes.length - 1; i >= 0; i--) {
        frag.appendChild(Parser.buildHTMLFromJSON(nodes[i], Main.board));
      }
      thread.appendChild(frag);
      Parser.parseThread(thread.id.slice(1), nodes.length);
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

ThreadUpdater.onerror = function() {
  var self = ThreadUpdater;
  self.statusNode.textContent = 'Connection Error';
  self.lastUpdated = Date.now();
  self.adjustDelay(0, self.force);
  self.updating = self.force = false;
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
  dx: null, dy: null, right: null, bottom: null,
  
  set: function(handle) {
    handle.addEventListener('mousedown', Draggable.startDrag, false);
  },
  
  unset: function(handle) {
    handle.removeEventListener('mousedown', Draggable.startDrag, false);
  },
  
  startDrag: function(e) {
    var offs;
    e.preventDefault();
    Draggable.el = this.parentNode;
    Draggable.key = Draggable.el.getAttribute('data-trackpos');
    offs = Draggable.el.getBoundingClientRect();
    Draggable.dx = e.clientX - offs.left;
    Draggable.dy = e.clientY - offs.top;
    Draggable.right = document.documentElement.clientWidth - offs.width;
    Draggable.bottom = document.documentElement.clientHeight - offs.height;
    document.addEventListener('mouseup', Draggable.endDrag, false);
    document.addEventListener('mousemove', Draggable.onDrag, false);
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
    left = e.clientX - Draggable.dx;
    top = e.clientY - Draggable.dy;
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
  threadUpdater: true,
  imageExpansion: true,
  pageTitle: true,
  backlinks: true,
  quotePreview: true,
  quickReply: true,
  reportButton: true,
  toTopButton: true,
  imageSearch: true
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
  threadUpdater: 'Thread updater',
  imageExpansion: 'Image expansion',
  pageTitle: 'Excerpts in page title',
  backlinks: 'Backlinks',
  quotePreview: 'Quote preview',
  quickReply: 'Quick reply',
  reportButton: 'Report button',
  toTopButton: 'To top button',
  imageSearch: 'Image search'
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
  var params, storage;
  
  document.removeEventListener('DOMContentLoaded', Main.init, false);
  
  if (Main.stylesheet = Main.getCookie(style_group)) {
    Main.stylesheet = Main.stylesheet.toLowerCase().replace(/ /g, '_');
  }
  else {
    Main.stylesheet =
      style_group == 'nws_style' ? 'yotsuba_new' : 'yotsuba_b_new';
  }
  
  Main.addCSS();
  
  Parser.init();
  
  Main.type = style_group.split('_')[0];
  
  params = location.pathname.split(/\//);
  Main.board = params[1];
  Main.tid = params[3];
  
  Config.load();
  
  if (Config.quickReply) {
    if (!window.FormData) {
      console.log("This browser doesn't support XHR2");
      Config.quickReply = false;
    }
    else {
      QR.init();
    }
  }
  
  if (Config.threadHiding) {
    ThreadHiding.load();
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
    Parser.parseBoard();
  }
  
  if (Config.quotePreview) {
    QuotePreview.init();
  }
  
  $.id('delform').addEventListener('click', Main.onThreadClick, false);
  window.addEventListener('storage', Main.syncStorage, false);
  
  $.id('settingsWindowLink').addEventListener('click', SettingsMenu.toggle, false);
  $.id('settingsWindowLinkBot').addEventListener('click', SettingsMenu.toggle, false);
	
	//console.info('4chanJS took: ' + (Date.now() - start) + 'ms');
};

Main.setTitle = function() {
  var title;
  
  title = $.class('subject', $.id('pi' + Main.tid))[0].textContent ||
    $.id('m' + Main.tid).textContent.replace(/<br>/g, ' ').slice(0, 30) ||
    Main.tid;
  
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

Main.onThreadClick = function(e) {
  var t, ids, cmd;
  
  t = e.target;
  
  if (cmd = t.getAttribute('data-cmd')) {
    e.preventDefault();
    switch (cmd) {
      case 'qr':
        ids = t.getAttribute('data-tid').split('-'); // tid, pid
        QR.show(ids[0], ids[1]);
        Main.quotePost(ids[1], true);
        break;
      case 'hide':
        ThreadHiding.toggle(t.getAttribute('data-tid'));
        break;
      case 'watch':
        ThreadWatcher.toggle(t.getAttribute('data-tid'));
        break;
      case 'report':
        Main.reportPost(t.getAttribute('data-tid'));
        break;
      case 'totop':
        location.href = '#top';
        break;
    }
  }
  else if (Config.imageExpansion && e.which == 1
    && t.hasAttribute('data-md5')) {
    e.preventDefault();
    ImageExpansion.expand(t);
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
.postInfo,\
.file {\
  white-space: nowrap;\
  text-overflow: ellipsis;\
}\
.extControls {\
  display: inline;\
  margin-left: 5px;\
}\
.extButton {\
  cursor: pointer;\
  vertical-align: bottom;\
}\
#threadUpdateStatus {\
  margin-left: 0.5ex;\
}\
.summary .postInfo {\
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
  height: 18px;\
  text-align: center;\
}\
#qrClose {\
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
  max-width: 250px;\
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
.crosslink:after {\
  content: " →";\
}\
#quote-preview {\
  position: absolute;\
  box-shadow: 0px 0px 3px rgba(0, 0, 0, 0.35);\
  padding: 3px 6px 6px 3px;\
}\
.deadlink {\
  text-decoration: line-through;\
}\
div.backlink {\
  margin-left: 15px;\
  font-size: 0.8em !important;\
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

Config.firstRun = function()
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

Config.gs = function( opt )
{
	var setting = localStorage['4chanext_' + opt];
	if( setting === 'true' ) return true;
	if( setting === 'false' ) return false;

	return setting;
};

Config.ss = function( opt, setting )
{
	localStorage['4chanext_' + opt] = setting;
};

if (['interactive', 'complete'].indexOf(document.readyState) != -1) {
  Main.init();
}
else {
  document.addEventListener('DOMContentLoaded', Main.init, false);
}
