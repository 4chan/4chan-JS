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
  };
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
  };
}

$.get = function(url, callbacks, headers) {
  var key, xhr;
  
  xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
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

$.cache = {};

/**
 * Parser
 */
var Parser = {};

Parser.init = function() {
  var o, a, h, m, tail, staticPath, tracked;
  
  if (Config.filter || Config.embedSoundCloud || Config.embedYouTube) {
    this.needMsg = true;
  }
  
  if (Config.imageSearch || Config.downloadFile) {
    this.needFile = true;
  }
  
  staticPath = '//static.4chan.org/image/';
  
  tail = window.devicePixelRatio >= 2 ? '@2x.gif' : '.gif';
  
  this.icons = {
    admin: staticPath + 'adminicon' + tail,
    mod: staticPath + 'modicon' + tail,
    dev: staticPath + 'developericon' + tail,
    del: staticPath + 'filedeleted-res' + tail
  };
  
  this.prettify = typeof prettyPrint == 'function';
  
  this.customSpoiler = {};
  
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
    
    this.weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  }
  
  if (Main.tid) {
    this.trackedReplies = this.getTrackedReplies(Main.tid) || {};
  }
};

Parser.getTrackedReplies = function(tid) {
  var tracked = null;
  
  if (tracked = sessionStorage.getItem('4chan-track-' + Main.board + '-' + tid)) {
    tracked = JSON.parse(tracked);
  }
  
  return tracked;
};

Parser.saveTrackedReplies = function(tid, replies) {
  sessionStorage.setItem(
    '4chan-track-' + Main.board + '-' + tid,
    JSON.stringify(replies)
  );
};

Parser.parseThreadJSON = function(data) {
  var thread;
  
  try {
    thread = JSON.parse(data).posts;
  }
  catch (e) {
    console.log(e);
    thread = [];
  }
  
  return thread;
};

Parser.setCustomSpoiler = function(board, val) {
  var s;
  if (!this.customSpoiler[board] && (val = parseInt(val))) {
    if (board == Main.board && (s = $.cls('imgspoiler')[0])) {
      this.customSpoiler[board] =
        s.firstChild.src.match(/spoiler(-[a-z0-9]+)\.png$/)[1];
    }
    else {
      this.customSpoiler[board] = '-' + board
        + (Math.floor(Math.random() * val) + 1);
    }
  }
};

Parser.buildPost = function(thread, board, pid) {
  var i, j, el = null;
  
  for (i = 0; j = thread[i]; ++i) {
    if (j.no != pid) {
      continue;
    }
    
    if (!Config.revealSpoilers && thread[0].custom_spoiler) {
      Parser.setCustomSpoiler(board, thread[0].custom_spoiler);
    }
    
    el = Parser.buildHTMLFromJSON(j, board).lastElementChild;
    
    if (Config.IDColor && IDColor.boards[board]
      && (uid = $.cls('posteruid', el)[1])) {
      IDColor.applyRemote(uid.firstElementChild);
    }
  }
  
  return el;
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
    filePath,
    fileSize = '',
    size = '',
    fileClass = '',
    shortFile = '',
    longFile = '',
    tripcode = '',
    capcodeStart = '',
    capcodeClass = '',
    capcode = '',
    flag,
    highlight = '',
    emailStart = '',
    emailEnd = '',
    name,
    subject,
    noLink,
    quoteLink,
    noFilename,
    
    i, q, href, quotes,
    
    imgDir = '//images.4chan.org/' + board + '/src';
  
  if (data.resto == 0) {
    isOP = true;
    data.resto = data.no;
  }
  
  noLink = data.resto + '#p' + data.no;
  
  if (!Main.tid || board != Main.board) {
    noLink = 'res/' + noLink;
    quoteLink = 'res/' + data.resto + '#q' + data.no;;
  }
  else {
    quoteLink = 'javascript:quote(\'' + data.no + '\')';
  }
  
  if (!data.capcode && data.id) {
    userId = ' <span class="posteruid id_'
      + data.id + '">(ID: <span class="hand" title="Highlight posts by this ID">'
      + data.id + '</span>)</span> ';
  }
  else {
    userId = '';
  }
  
  switch (data.capcode) {
    case 'admin_highlight':
      highlight = ' highlightPost';
    case 'admin':
      capcodeStart = ' <strong class="capcode hand id_admin"'
        + 'title="Highlight posts by the Administrator">## Admin</strong>';
      capcodeClass = ' capcodeAdmin';
      
      capcode = ' <img src="' + Parser.icons.admin + '" '
        + 'alt="This user is the 4chan Administrator." '
        + 'title="This user is the 4chan Administrator." class="identityIcon">';
      break;
    case 'mod':
      capcodeStart = ' <strong class="capcode hand id_mod" '
        + 'title="Highlight posts by Moderators">## Mod</strong>';
      capcodeClass = ' capcodeMod';
      
      capcode = ' <img src="' + Parser.icons.mod + '" '
        + 'alt="This user is a 4chan Moderator." '
        + 'title="This user is a 4chan Moderator." class="identityIcon">';
      break;
    case 'developer':
      capcodeStart = ' <strong class="capcode hand id_developer" '
        + 'title="Highlight posts by Developers">## Developer</strong>';
      capcodeClass = ' capcodeDeveloper';
      
      capcode = ' <img src="' + Parser.icons.dev + '" '
        + 'alt="This user is a 4chan Developer." '
        + 'title="This user is a 4chan Developer." class="identityIcon">';
      break;
  }
  
  if (data.email) {
    emailStart = '<a href="mailto:' + data.email.replace(/ /g, '%20') + '" class="useremail">';
    emailEnd = '</a>';
  }
  
  if (data.country) {
    flag = ' <img src="//static.4chan.org/image/country/'
      + (board == 'pol' ? 'troll/' : '')
      + data.country.toLowerCase() + '.gif" alt="'
      + data.country + '" title="' + data.country_name + '" class="countryFlag">';
  }
  else {
    flag = '';
  }
  
  if (data.filedeleted) {
    fileHtml = '<div id="f' + data.no + '" class="file"><span class="fileThumb"><img src="'
      + Parser.icons.del + '" class="fileDeletedRes" alt="File deleted."></span></div>';
  }
  else if (data.ext) {
    shortFile = longFile = data.filename + data.ext;
    if (data.filename.length > (isOP ? 40 : 30)) {
      shortFile = data.filename.slice(0, isOP ? 35 : 25) + '(...)' + data.ext;
    }

    if (!data.tn_w && !data.tn_h && data.ext == '.gif') {
      data.tn_w = data.w;
      data.tn_h = data.h;
    }
    if (data.fsize >= 1048576) {
      size = ((0 | (data.fsize / 1048576 * 100 + 0.5)) / 100) + ' M';
    }
    else if (data.fsize > 1024) {
      size = (0 | (data.fsize / 1024 + 0.5)) + ' K';
    }
    else {
      size = data.fsize + ' ';
    }
    
    if (data.spoiler) {
      fileSize = 'Spoiler Image, ' + size;
      if (!Config.revealSpoilers) {
        fileClass = ' imgspoiler';
        
        fileThumb = '//static.4chan.org/image/spoiler'
          + (Parser.customSpoiler[board] || '') + '.png';
        data.tn_w = 100;
        data.tn_h = 100;
        
        noFilename = true;
      }
    }
    else {
      fileSize = size;
    }
    
    if (!fileThumb) {
      fileThumb = '//thumbs.4chan.org/' + board + '/thumb/' + data.tim + 's.jpg';
    }
    
    if (board != 'f') {
      filePath = imgDir + '/' + data.tim + data.ext;
      imgSrc = '<a class="fileThumb' + fileClass + '" href="' + filePath
        + '" target="_blank"><img src="' + fileThumb
        + '" alt="' + fileSize + 'B" data-md5="' + data.md5
        + '" style="height: ' + data.tn_h + 'px; width: '
        + data.tn_w + 'px;">'
        + '<div class="mFileInfo mobile">' + size + 'B '
        + data.ext.slice(1).toUpperCase()
        + '</div></a>';
    }
    else {
      filePath = imgDir + '/' + data.filename + data.ext;
    }
    
    fileDims = data.ext == '.pdf' ? 'PDF' : data.w + 'x' + data.h;
    fileInfo = '<span class="fileText" id="fT' + data.no
      + (data.spoiler ? ('" title="' + longFile + '"') : '"')
      + '>File: <a href="' + filePath + '" target="_blank">'
      + data.tim + data.ext + '</a>-(' + fileSize + 'B, ' + fileDims
      + (noFilename ? '' : (', <span title="' + longFile + '">'
      + shortFile + '</span>')) + ')</span>';
    
    fileBuildStart = fileInfo ? '<div class="fileInfo">' : '';
    fileBuildEnd = fileInfo ? '</div>' : '';
    
    fileHtml = '<div id="f' + data.no + '" class="file">'
      + fileBuildStart + fileInfo + fileBuildEnd + imgSrc + '</div>';
  }
  
  if (data.trip) {
    tripcode = ' <span class="postertrip">' + data.trip + '</span>';
  }
  
  name = data.name || '';
  
  subject = data.sub || '';
  
  container.className = 'postContainer replyContainer';
  container.id = 'pc' + data.no;
  
  container.innerHTML =
    '<div class="sideArrows" id="sa' + data.no + '">&gt;&gt;</div>' +
    '<div id="p' + data.no + '" class="post ' + (isOP ? 'op' : 'reply') + highlight + '">' +
      '<div class="postInfoM mobile" id="pim' + data.no + '">' +
        '<span class="nameBlock' + capcodeClass + '">' +
        '<span class="name">' + name + '</span>' + tripcode +
        capcodeStart + capcode + userId + flag +
        '<br><span class="subject">' + subject +
        '</span></span><span class="dateTime postNum" data-utc="' + data.time + '">' +
        data.now + ' <a href="' + data.no + '#p' + data.no + '">No.</a>' +
        '<a href="javascript:quote(\'' + data.no + '\');" title="Quote this post">' +
        data.no + '</a></span>' +
      '</div>' +
      (isOP ? fileHtml : '') +
      '<div class="postInfo desktop" id="pi' + data.no + '">' +
        '<input type="checkbox" name="' + data.no + '" value="delete"> ' +
        '<span class="subject">' + subject + '</span> ' +
        '<span class="nameBlock' + capcodeClass + '">' + emailStart +
          '<span class="name">' + name + '</span>' +
          tripcode + capcodeStart + emailEnd + capcode + userId + flag +
        ' </span> ' +
        '<span class="dateTime" data-utc="' + data.time + '">' + data.now + '</span> ' +
        '<span class="postNum desktop">' +
          '<a href="' + noLink + '" title="Highlight this post">No.</a><a href="' +
          quoteLink + '" title="Quote this post">' + data.no + '</a>' +
        '</span>' +
      '</div>' +
      (isOP ? '' : fileHtml) +
      '<blockquote class="postMessage" id="m' + data.no + '">'
      + (data.com || '') + '</blockquote> ' +
    '</div>';
  
  if (!Main.tid || board != Main.board) {
    quotes = container.getElementsByClassName('quotelink');
    for (i = 0; q = quotes[i]; ++i) {
      href = q.getAttribute('href');
      if (href.charAt(0) != '/') {
        q.href = '/' + board + '/res/' + href;
      }
    }
  }
  
  return container;
};

Parser.parseBoard = function() {
  var i, threads = document.getElementsByClassName('thread');
  
  for (i = 0; threads[i]; ++i) {
    Parser.parseThread(threads[i].id.slice(1));
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
          document.getElementById('m' + tid),
          tid
        );
      }
      
      if (Config.threadHiding && !filtered) {
        if (Main.hasMobileLayout) {
          el = document.createElement('a');
          el.href = 'javascript:;';
          el.setAttribute('data-cmd', 'hide');
          el.setAttribute('data-id', tid);
          el.className = 'mobileHideButton button';
          el.textContent = 'Hide';
          posts[0].nextElementSibling.appendChild(el);
        }
        else {
          el = document.createElement('span');
          el.innerHTML = '<img alt="H" class="extButton threadHideButton"'
            + 'data-cmd="hide" data-id="' + tid + '" src="'
            + Main.icons.minus + '" title="Toggle thread">';
          posts[0].insertBefore(el, posts[0].firstChild);
        }
        el.id = 'sa' + tid;
        if (ThreadHiding.hidden[tid]) {
          ThreadHiding.hidden[tid] = Main.now;
          ThreadHiding.hide(tid);
        }
      }
      
      if (ThreadExpansion.enabled
          && (summary = $.cls('summary', thread)[0])) {
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
  
  if (Main.isMobileDevice && Config.quotePreview) {
    for (i = j; i < limit; ++i) {
      Parser.parseMobileQuotelinks(posts[i]);
    }
  }
  
  if (Parser.trackedReplies) {
    for (i = j; i < limit; ++i) {
      Parser.parseTrackedReplies(posts[i]);
    }
  }
  
  for (i = j; i < limit; ++i) {
    Parser.parsePost(posts[i].id.slice(1), tid);
  }
  
  if (offset) {
    if (Parser.prettify) {
      for (i = j; i < limit; ++i) {
        Parser.parseMarkup(posts[i]);
      }
    }
    if (window.jsMath) {
      if (window.jsMath.loaded) {
        for (i = j; i < limit; ++i) {
          window.jsMath.ProcessBeforeShowing(posts[i]);
        }
      }
      else {
        Parser.loadJSMath();
      }
    }
  }
  
  UA.dispatchEvent('4chanParsingDone', { threadId: tid, offset: j, limit: limit });
};

Parser.loadJSMath = function(root) {
  if ($.cls('math', root)[0]) {
    window.jsMath.Autoload.Script.Push('ProcessBeforeShowing', [ null ]);
    window.jsMath.Autoload.LoadJsMath();
  }
};

Parser.parseMathOne = function(node) {
  if (window.jsMath.loaded) {
    window.jsMath.ProcessBeforeShowing(node);
  }
  else {
    Parser.loadJSMath(node);
  }
};

Parser.parseTrackedReplies = function(post) {
  var i, link, quotelinks;
  
  quotelinks = $.cls('quotelink', post);
  
  for (i = 0; link = quotelinks[i]; ++i) {
    if (Parser.trackedReplies[link.textContent]) {
      $.addClass(link, 'ownpost');
      Parser.hasYouMarkers = true;
    }
  }
};

Parser.parseMobileQuotelinks = function(post) {
  var i, link, quotelinks, t, el;
  
  quotelinks = $.cls('quotelink', post);
  
  for (i = 0; link = quotelinks[i]; ++i) {
    t = link.getAttribute('href').match(/^(?:\/([^\/]+)\/)?(?:res\/)?([0-9]+)?#p([0-9]+)$/);
    
    if (!t) {
      continue;
    }
    
    el = document.createElement('a');
    el.href = link.href;
    el.textContent = ' #';
    el.className = 'quoteLink';
    
    link.parentNode.insertBefore(el, link.nextSibling);
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
  var cnt, el, pi, href, img, file, msg, filtered, html, filename, txt, finfo, isOP, uid;
  
  if (tid) {
    pi = document.getElementById('pi' + pid);
    
    if (Parser.needMsg) {
      msg = document.getElementById('m' + pid);
    }
    
    html = '';
    
    if (Config.reportButton) {
      html += '<img class="extButton" alt="!" data-cmd="report" data-id="'
        + pid + '" src="' + Main.icons.report + '" title="Report">'
    }
    
    if (html) {
      cnt = document.createElement('div');
      cnt.className = 'extControls';
      cnt.innerHTML = html;
      pi.appendChild(cnt);
    }
    
    if (Parser.needFile && (file = document.getElementById('fT' + pid))) {
      html = '';
      
      if (Config.downloadFile) {
        txt = ((el = file.children[1]) ? el : file).getAttribute('title');
        html +=
          '<a href="' + file.firstElementChild.href
          + '" download="' + txt + '" title="Download file"><img class="extButton" src="'
          + Main.icons.download + '" alt="D"></a>';
      }
      
      if (Config.imageSearch) {
        href = file.firstElementChild.href;
        html +=
          '<a href="//www.google.com/searchbyimage?image_url=' + href
          + '" target="_blank" title="Google Image Search"><img class="extButton" src="'
          + Main.icons.gis + '" alt="G"></a><a href="http://iqdb.org/?url='
          + href + '" target="_blank" title="iqdb"><img class="extButton" src="'
          + Main.icons.iqdb + '" alt="I"></a>';
      }
      
      if (html) {
        cnt = document.createElement('div');
        cnt.className = 'extControls';
        cnt.innerHTML = html;
        file.parentNode.appendChild(cnt);
      }
    }
    
    if (pid != tid) {
      if (Config.filter) {
        filtered = Filter.exec(pi.parentNode, pi, msg);
      }
      
      if (Config.replyHiding && !filtered) {
        el = document.getElementById('sa' + pid);
        el.innerHTML = '<img class="extButton replyHideButton" '
          + 'data-cmd="hide-r" data-id="' + pid + '" src="'
          + Main.icons.minus + '" title="Toggle reply">';
        if (ReplyHiding.hidden[pid]) {
          ReplyHiding.hidden[pid] = Main.now;
          ReplyHiding.hide(pid);
        }
      }
      
      if (Config.backlinks) {
        Parser.parseBacklinks(pid, tid);
      }
    }
    
    if (IDColor.enabled && (uid = $.cls('posteruid', pi)[0])) {
      IDColor.apply(uid.firstElementChild);
    }
    
    if (Config.embedSoundCloud) {
      Media.parseSoundCloud(msg);
    }
    
    if (Config.embedYouTube) {
      Media.parseYouTube(msg);
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
    if ($.hasClass(file, 'imgspoiler')) {
      img = file.firstChild;
      file.removeChild(img);
      img.removeAttribute('style');
      isOP = $.hasClass(pi.parentNode, 'op');
      img.style.maxWidth = img.style.maxHeight = isOP ? '250px' : '125px';
      img.src = '//thumbs.4chan.org'
        + (file.pathname.replace(/src(\/[0-9]+).+$/, 'thumb$1s.jpg'))
      
      filename = file.previousElementSibling.firstElementChild;
      finfo = filename.title.split('.');
      if (finfo[0].length > (isOP ? 40 : 30)) {
        txt = finfo[0].slice(0, isOP ? 35 : 25) + '(...)' + finfo[1];
      }
      else {
        txt = filename.title;
      }
      filename.lastChild.textContent
        = filename.lastChild.textContent.slice(0, -1) + ', ' + txt + ')';
      file.insertBefore(img, file.firstElementChild);
    }
  }
  
  if (Config.localTime) {
    el = pi.getElementsByClassName('dateTime')[0];
    el.textContent
      = Parser.getLocaleDate(new Date(el.getAttribute('data-utc') * 1000))
      + this.utcOffset;
  }
  
};

Parser.getLocaleDate = function(date) {
  return ('0' + (1 + date.getMonth())).slice(-2) + '/'
    + ('0' + date.getDate()).slice(-2) + '/'
    + ('0' + date.getFullYear()).slice(-2) + '('
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
    
    if (ids[1] == tid) {
      j.textContent += ' (OP)';
    }
    
    if (!(target = document.getElementById('pi' + ids[1]))) {
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
      target.appendChild(el);
    }
    
    el.appendChild(bl);
  }
};


/**
 * Quote inlining
 */
var QuoteInline = {};

QuoteInline.isSelfQuote = function(node, pid, board) {
  var cnt;
  
  if (board && board != Main.board) {
    return false;
  }
  
  node = node.parentNode;
  
  if ((node.nodeName == 'BLOCKQUOTE' && node.id.split('m')[1] == pid)
      || node.parentNode.id.split('_')[1] == pid) {
    return true;
  }
  
  return false;
};

QuoteInline.toggle = function(link, e) {
  var t, pfx, src, el, count;
  
  t = link.getAttribute('href').match(/^(?:\/([^\/]+)\/)?(?:res\/)?([0-9]+)?#p([0-9]+)$/);
  
  if (!t || t[1] == 'rs' || QuoteInline.isSelfQuote(link, t[3], t[1])) {
    return;
  }
  
  e && e.preventDefault();
  
  if (pfx = link.getAttribute('data-pfx')) {
    link.removeAttribute('data-pfx');
    $.removeClass(link, 'linkfade');
    
    el = $.id(pfx + 'p' + t[3]);
    el.parentNode.removeChild(el);
    
    if (link.parentNode.parentNode.className == 'backlink') {
      el = $.id('pc' + t[3]);
      count = +el.getAttribute('data-inline-count') - 1;
      if (count == 0) {
        el.style.display = '';
        el.removeAttribute('data-inline-count');
      }
      else {
        el.setAttribute('data-inline-count', count);
      }
    }
    
    return;
  }
  
  if (src = $.id('p' + t[3])) {
    QuoteInline.inline(link, src, t[3]);
  }
  else {
    QuoteInline.inlineRemote(link, t[1] || Main.board, t[2], t[3]);
  }
};

QuoteInline.inlineRemote = function(link, board, tid, pid) {
  var xhr, onload, onerror, cached, key, el, dummy;
  
  if (link.hasAttribute('data-loading')) {
    return;
  }
  
  key = board + '-' + tid;
  
  if ((cached = $.cache[key]) && (el = Parser.buildPost(cached, board, pid))) {
    QuoteInline.inline(link, el);
    return;
  }
  
  if ((dummy = link.nextElementSibling) && $.hasClass(dummy, 'spinner')) {
    dummy.parentNode.removeChild(dummy);
    return;
  }
  else {
    dummy = document.createElement('div');
  }
  
  dummy.className = 'preview spinner inlined';
  dummy.textContent = 'Loading...';
  link.parentNode.insertBefore(dummy, link.nextSibling);
  
  onload = function() {
    var el, thread;
    
    link.removeAttribute('data-loading');
    
    if (this.status == 200 || this.status == 304 || this.status == 0) {
      thread = Parser.parseThreadJSON(this.responseText);
      
      $.cache[key] = thread;
      
      if (el = Parser.buildPost(thread, board, pid)) {
        dummy.parentNode && dummy.parentNode.removeChild(dummy);
        QuoteInline.inline(link, el);
      }
      else {
        $.addClass(link, 'deadlink');
        dummy.textContent = 'This post doesn\'t exist anymore';
      }
    }
    else if (this.status == 404) {
      $.addClass(link, 'deadlink');
      dummy.textContent = 'This thread doesn\'t exist anymore';
    }
    else {
      this.onerror();
    }
  };
  
  onerror = function() {
    dummy.textContent = 'Error: ' + this.statusText + ' (' + this.status + ')';
    link.removeAttribute('data-loading');
  };
  
  link.setAttribute('data-loading', '1');
  
  $.get('//api.4chan.org/' + board + '/res/' + tid + '.json',
    {
      onload: onload,
      onerror: onerror
    }
  );
};

QuoteInline.inline = function(link, src, id) {
  var i, j, now, el, blcnt, isBl, inner, tblcnt, pfx, dest, count;
  
  now = Date.now();
  
  if (id) {
    if ((blcnt = link.parentNode.parentNode).className == 'backlink') {
      el = blcnt.parentNode.parentNode.parentNode;
      isBl = true;
    }
    else {
      el = blcnt.parentNode;
    }
    
    while (el.parentNode !== document) {
      if (el.id.split('m')[1] == id) {
        return;
      }
      el = el.parentNode;
    }
  }
  
  link.className += ' linkfade';
  link.setAttribute('data-pfx', now);
  
  el = src.cloneNode(true);
  el.id = now + el.id;
  el.setAttribute('data-pfx', now);
  el.className += ' preview inlined';
  $.removeClass(el, 'highlight');
  $.removeClass(el, 'highlight-anti');
  
  if ((inner = $.cls('inlined', el))[0]) {
    while (j = inner[0]) {
      j.parentNode.removeChild(j);
    }
    inner = $.cls('quotelink', el);
    for (i = 0; j = inner[i]; ++i) {
      j.removeAttribute('data-pfx');
      $.removeClass(j, 'linkfade');
    }
  }
  
  for (i = 0; j = el.children[i]; ++i) {
    j.id = now + j.id;
  }
  
  if (tblcnt = $.cls('backlink', el)[0]) {
    tblcnt.id = now + tblcnt.id;
  }
  
  if (isBl) {
    pfx = blcnt.parentNode.parentNode.getAttribute('data-pfx') || '';
    dest = $.id(pfx + 'm' + blcnt.id.split('_')[1]);
    dest.insertBefore(el, dest.firstChild);
    if (count = src.parentNode.getAttribute('data-inline-count')) {
      count = +count + 1;
    }
    else {
      count = 1;
      src.parentNode.style.display = 'none';
    }
    src.parentNode.setAttribute('data-inline-count', count);
  }
  else {
    link.parentNode.insertBefore(el, link.nextSibling);
  }
};

/**
 * Quote preview
 */
var QuotePreview = {};

QuotePreview.init = function() {
  var thread;
  
  this.regex = /^(?:\/([^\/]+)\/)?(?:res\/)?([0-9]+)?#p([0-9]+)$/;
  this.debounce = 200;
  this.timeout = null;
  this.highlight = null;
  this.highlightAnti = null;
  this.out = true;
};

QuotePreview.resolve = function(link) {
  var self, t, post, ids, offset;
  
  self = QuotePreview;
  self.out = false;
  
  t = link.getAttribute('href').match(self.regex);
  
  if (!t || t[1] == 'rs') {
    return;
  }
  
  // Quoted post in scope
  if (post = document.getElementById('p' + t[3])) {
    // Visible and not filtered out?
    offset = post.getBoundingClientRect();
    if (offset.top > 0
        && offset.bottom < document.documentElement.clientHeight
        && !$.hasClass(post.parentNode, 'post-hidden')) {
      if (!$.hasClass(post, 'highlight') && location.hash.slice(1) != post.id) {
        self.highlight = post;
        $.addClass(post, 'highlight');
      }
      else if (!$.hasClass(post, 'op')) {
        self.highlightAnti = post;
        $.addClass(post, 'highlight-anti');
      }
      return;
    }
    // Nope
    self.show(link, post);
  }
  // Quoted post out of scope
  else {
    if (!UA.hasCORS) {
      return;
    }
    if (Main.isMobileDevice) {
      self.showRemote(link, t[1] || Main.board, t[2], t[3]);
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
  var xhr, onload, onerror, el, cached, key;
  
  key = board + '-' + tid;
  
  if ((cached = $.cache[key]) && (el = Parser.buildPost(cached, board, pid))) {
    QuotePreview.show(link, el);
    return;
  }
  
  link.style.cursor = 'wait';
  
  onload = function() {
    var el, thread;
    
    link.style.cursor = '';
    
    if (this.status == 200 || this.status == 304 || this.status == 0) {
      thread = Parser.parseThreadJSON(this.responseText);
      
      $.cache[key] = thread;
      
      if ($.id('quote-preview') || QuotePreview.out) {
        return;
      }
      
      if (el = Parser.buildPost(thread, board, pid)) {
        el.className = 'post preview';
        el.style.display = 'none';
        el.id = 'quote-preview';
        document.body.appendChild(el);
        QuotePreview.show(link, el, true);
      }
      else {
        $.addClass(link, 'deadlink');
      }
    }
    else if (this.status == 404) {
      $.addClass(link, 'deadlink');
    }
  };
  
  onerror = function() {
    link.style.cursor = '';
  };
  
  $.get('//api.4chan.org/' + board + '/res/' + tid + '.json',
    {
      onload: onload,
      onerror: onerror
    }
  );
};

QuotePreview.show = function(link, post, remote) {
    var rect, postHeight, doc, docWidth, style, pos, quotes, i, j, qid, top,
      scrollTop, margin, img;
    
    if (remote) {
      Parser.parsePost(post);
      post.style.display = '';
    }
    else {
      post = post.cloneNode(true);
      if (location.hash && location.hash == ('#' + post.id)) {
        post.className += ' highlight';
      }
      post.id = 'quote-preview';
      post.className += ' preview';
      
      if (Config.imageExpansion && (img = $.cls('fitToPage', post)[0])) {
        ImageExpansion.contract(img);
      }
    }
    
    if (!link.parentNode.className) {
      quotes = post.querySelectorAll(
        '#' + $.cls('postMessage', post)[0].id + ' > .quotelink'
      );
      if (quotes[1]) {
        qid = '>>' + link.parentNode.parentNode.id.split('_')[1];
        for (i = 0; j = quotes[i]; ++i) {
          if (j.textContent == qid) {
            $.addClass(j, 'dotted');
            break;
          }
        }
      }
    }
    
    rect = link.getBoundingClientRect();
    doc = document.documentElement;
    docWidth = doc.offsetWidth;
    style = post.style;
    
    document.body.appendChild(post);
    
    if (Main.isMobileDevice) {
      style.top = rect.top + link.offsetHeight + window.pageYOffset + 'px';
      style.left = rect.left + 'px';
      margin = post.offsetWidth - docWidth + rect.left;
      if (margin > 0) {
        style.marginLeft = -margin + 'px';
      }
    }
    else {
      if ((docWidth - rect.right) < (0 | (docWidth * 0.3))) {
        pos = docWidth - rect.left;
        style.right = pos + 5 + 'px';
      }
      else {
        pos = rect.left + rect.width;
        style.left = pos + 5 + 'px';
      }
      
      top = rect.top + link.offsetHeight + window.pageYOffset
        - post.offsetHeight / 2 - rect.height / 2;
      
      postHeight = post.getBoundingClientRect().height;
      
      if (doc.scrollTop != document.body.scrollTop) {
        scrollTop = doc.scrollTop + document.body.scrollTop;
      } else {
        scrollTop = document.body.scrollTop;
      }
      
      if (top < scrollTop) {
        style.top = scrollTop + 'px';
      }
      else if (top + postHeight > scrollTop + doc.clientHeight) {
        style.top = scrollTop + doc.clientHeight - postHeight + 'px';
      }
      else {
        style.top = top + 'px';
      }
    }
};

QuotePreview.remove = function(el) {
  var self, cnt;
  
  self = QuotePreview;
  self.out = true;
  
  if (self.highlight) {
    $.removeClass(self.highlight, 'highlight');
    self.highlight = null;
  }
  else if (self.highlightAnti) {
    $.removeClass(self.highlightAnti, 'highlight-anti');
    self.highlightAnti = null
  }
  
  clearTimeout(self.timeout);
  if (el) {
    el.style.cursor = '';
  }
  
  if (cnt = $.id('quote-preview')) {
    document.body.removeChild(cnt);
  }
};

/**
 * Image expansion
 */
var ImageExpansion = {};

ImageExpansion.expand = function(thumb) {
  var img, el, href;
  
  if (Config.imageHover && (el = $.id('image-hover'))) {
    document.body.removeChild(el);
  }
  
  href = thumb.parentNode.getAttribute('href');
  
  if (href.slice(-3) == 'pdf') {
    return;
  }
  
  thumb.setAttribute('data-expanding', '1');
  img = document.createElement('img');
  img.alt = 'Image';
  img.className = 'fitToPage';
  img.setAttribute('src', href);
  img.style.display = 'none';
  thumb.parentNode.appendChild(img);
  if (UA.hasCORS) {
    thumb.style.opacity = '0.75';
    this.timeout = ImageExpansion.checkLoadStart(img, thumb);
  }
  else {
    this.onLoadStart(img, thumb);
  }
};

ImageExpansion.contract = function(img) {
  var cnt, p;
  clearTimeout(this.timeout);
  p = img.parentNode;
  cnt = p.parentNode.parentNode;
  $.removeClass(p.parentNode, 'image-expanded');
  if (!Main.tid && Config.threadHiding) {
    $.removeClass(p, 'image-expanded-anti');
  }
  p.firstChild.style.display = '';
  p.removeChild(img);
  if (cnt.offsetTop < window.pageYOffset) {
    cnt.scrollIntoView();
  }
};

ImageExpansion.toggle = function(t) {
  if (t.hasAttribute('data-md5')) {
    if (!t.hasAttribute('data-expanding')) {
      ImageExpansion.expand(t);
    }
  }
  else {
    ImageExpansion.contract(t);
  }
};

ImageExpansion.onLoadStart = function(img, thumb) {
  thumb.removeAttribute('data-expanding');
  $.addClass(thumb.parentNode.parentNode, 'image-expanded');
  if (!Main.tid && Config.threadHiding) {
    $.addClass(thumb.parentNode, 'image-expanded-anti');
  }
  img.style.display = '';
  thumb.style.display = 'none';
};

ImageExpansion.checkLoadStart = function(img, thumb) {
  if (img.naturalWidth) {
    ImageExpansion.onLoadStart(img, thumb);
    thumb.style.opacity = '';
  }
  else {
    return setTimeout(ImageExpansion.checkLoadStart, 15, img, thumb);
  }
};

ImageExpansion.onExpanded = function(e) {
  this.onload = this.onerror = null;
  this.style.opacity = 1;
  $.addClass(this, 'fitToPage');
};

/**
 * Image hover
 */
var ImageHover = {};

ImageHover.show = function(thumb) {
  var img, href;
  
  href = thumb.parentNode.getAttribute('href');
  
  if (href.slice(-3) == 'pdf') {
    return;
  }
  
  img = document.createElement('img');
  img.id = 'image-hover';
  img.alt = 'Image';
  img.className = 'fitToScreen';
  img.setAttribute('src', href);
  document.body.appendChild(img);
  if (UA.hasCORS) {
    img.style.display = 'none';
    this.timeout = ImageHover.checkLoadStart(img, thumb);
  }
  else {
    img.style.left = thumb.getBoundingClientRect().right + 10 + 'px';
  }
};

ImageHover.hide = function() {
  var img;
  clearTimeout(this.timeout);
  if (img = $.id('image-hover')) {
    document.body.removeChild(img);
  }
};

ImageHover.onLoadStart = function(img, thumb) {
  var bounds, limit;
  
  bounds = thumb.getBoundingClientRect();
  limit = window.innerWidth - bounds.right;
  
  if (img.naturalWidth > limit) {
    img.style.maxWidth = limit - 20 + 'px';
  }
  
  img.style.display = '';
};

ImageHover.checkLoadStart = function(img, thumb) {
  if (img.naturalWidth) {
    ImageHover.onLoadStart(img, thumb);
  }
  else {
    return setTimeout(ImageHover.checkLoadStart, 15, img, thumb);
  }
};

/**
 * Quick reply
 */
var QR = {};

QR.init = function() {
  if (!UA.hasFormData) {
    return;
  }
  
  this.enabled = true;
  this.currentTid = null;
  this.cooldown = null;
  this.timestamp = null;
  this.auto = false;
  
  this.btn = null;
  this.comField = null;
  this.comLength = window.comlen;
  this.lenCheckTimeout = null;
  
  this.sagePost = 2;
  this.filePost = 4;
  
  this.cdElapsed = 0;
  this.cdType = 0;
  this.activeDelay = 0;
  
  if (Main.board == 'q') {
    this.baseDelay = 60500;
    this.fileDelay = 300500;
    this.sageDelay = 600500;
  }
  else {
    this.baseDelay = 30500;
    this.fileDelay = 30500;
    this.sageDelay = 60500;
  }
  
  this.captchaDelay = 240500;
  this.captchaInterval = null;
  this.pulse = null;
  this.xhr = null;
  this.banXhr = null;
  this.dndFile = null;
  
  this.fileDisabled = !!window.imagelimit;
  
  this.tracked = {};
  
  QR.purgeCooldown();
  
  if (UA.hasDragAndDrop) {
    document.addEventListener('drop', QR.onDrop, false);
    document.addEventListener('dragover', QR.onDragOver, false);
    document.addEventListener('dragstart', QR.toggleDropHandlers, false);
    document.addEventListener('dragend', QR.toggleDropHandlers, false);
  }
  
  window.addEventListener('storage', this.syncStorage, false);
};

QR.lock = function() {
  QR.showPostError('This thread is closed.', 'closed', true);
};

QR.unlock = function() {
  QR.hidePostError('closed');
};

QR.syncStorage = function(e) {
  var key;
  
  if (!e.key) {
    return;
  }
  
  key = e.key.split('-');
  
  if (key[0] == '4chan'
    && key[1] == 'cd'
    && e.newValue
    && Main.board == key[2]) {
    QR.startCooldown(e.newValue);
  }
};

QR.quotePost = function(tid, pid) {
  if (Main.threadClosed || (!Main.tid && Main.isThreadClosed(tid))) {
    alert('Thread closed. You may not reply at this time.');
    return;
  }
  QR.show(tid);
  QR.addQuote(pid);
};

QR.addQuote = function(pid) {
  var q, pos, sel, ta;
  
  ta = $.tag('textarea', document.forms.qrPost)[0];
  
  pos = ta.selectionStart;
  
  sel = UA.getSelection();
  
  if (pid) {
    q = '>>' + pid + '\n';
  }
  else {
    q = '';
  }
  
  if (sel) {
    q += '>' + sel.trim().replace(/[\r\n]+/g, '\n>') + '\n';
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
  
  if (ta.selectionStart == ta.value.length) {
    ta.scrollTop = ta.scrollHeight;
  }
  ta.focus();
};

QR.show = function(tid) {
  var i, j, cnt, postForm, form, qrForm, fields, row, spoiler, file,
    el, placeholder, cd, qrError, cookie;
  
  if (QR.currentTid) {
    if (!Main.tid && QR.currentTid != tid) {
      $.id('qrTid').textContent = $.id('qrResto').value = QR.currentTid = tid;
      $.byName('com')[1].value = '';
    }
    if (Main.hasMobileLayout) {
      $.id('quickReply').style.top = window.pageYOffset + 25 + 'px';
    }
    return;
  }
  
  QR.currentTid = tid;
  
  postForm = $.id('postForm');
  
  cnt = document.createElement('div');
  cnt.id = 'quickReply';
  cnt.className = 'extPanel reply';
  cnt.setAttribute('data-trackpos', 'QR-position');
  
  if (Main.hasMobileLayout) {
    cnt.style.top = window.pageYOffset + 28 + 'px';
  }
  else if (Config['QR-position']) {
    cnt.style.cssText = Config['QR-position'];
  }
  else {
    cnt.style.right = '0px';
    cnt.style.top = '10%';
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
  
  qrForm = document.createElement('div');
  qrForm.id = 'qrForm';
  
  fields = postForm.firstElementChild.children;
  for (i = 0, j = fields.length - 1; i < j; ++i) {
    row = document.createElement('div');
    if (fields[i].id == 'captchaFormPart') {
      if (QR.noCaptcha) {
        continue;
      }
      row.innerHTML = '<img id="qrCaptcha" title="Reload" width="300" height="57" src="'
        + $.id('recaptcha_image').firstChild.src + '" alt="reCAPTCHA challenge image">'
        + '<input id="qrCapField" name="recaptcha_response_field" '
        + 'placeholder="reCAPTCHA Challenge (Required)" '
        + 'type="text" autocomplete="off" autocorrect="off" autocapitalize="off">'
        + '<input id="qrChallenge" name="recaptcha_challenge_field" type="hidden" value="'
        + $.id('recaptcha_challenge_field').value + '">';
    }
    else {
      placeholder = fields[i].firstElementChild.textContent;
      if (placeholder == 'Password' || placeholder == 'Spoilers') {
        continue;
      }
      else if (placeholder == 'File') {
        file = fields[i].children[1].firstChild.cloneNode(false);
        file.id = 'qrFile';
        file.size = '19';
        file.addEventListener('change', QR.onFileChange, false);
        row.appendChild(file);
        
        if (UA.hasDragAndDrop) {
          $.addClass(file, 'qrRealFile');
          
          file = document.createElement('div');
          file.id = 'qrDummyFile';
          
          el = document.createElement('button');
          el.id = 'qrDummyFileButton';
          el.type = 'button';
          el.textContent = 'Browse…';
          file.appendChild(el);
          
          el = document.createElement('span');
          el.id = 'qrDummyFileLabel';
          el.textContent = 'No file selected.';
          file.appendChild(el);
          
          row.appendChild(file);
        }
        
        file.title = 'Shift + Click to remove the file';
      }
      else {
        row.innerHTML = fields[i].children[1].innerHTML;
        if (row.firstChild.type == 'hidden') {
          el = row.lastChild.previousSibling;
        }
        else {
          el = row.firstChild;
        }
        if (el.nodeName == 'INPUT' || el.nodeName == 'TEXTAREA') {
          if (el.name == 'name') {
            QR.noCaptcha && (el.tabIndex = 1);
            if (cookie = Main.getCookie('4chan_name')) {
              el.value = cookie;
            }
          }
          else if (el.name == 'email') {
            QR.noCaptcha && (el.tabIndex = 2);
            el.id = 'qrEmail';
            el.addEventListener('change', QR.checkCDType, false);
            if (cookie = Main.getCookie('4chan_email')) {
              el.value = cookie;
            }
          }
          else if (el.name == 'sub') {
            QR.noCaptcha && (el.tabIndex = 3);
          }
          else if (el.name == 'com') {
            QR.noCaptcha && (el.tabIndex = 4);
            QR.comField = el;
            el.addEventListener('keydown', QR.onKeyDown, false);
            el.addEventListener('paste', QR.onKeyDown, false);
            el.addEventListener('cut', QR.onKeyDown, false);
            if (row.children[1]) {
              row.removeChild(el.nextSibling);
            }
          }
          el.setAttribute('placeholder', placeholder);
        }
      }
    }
    qrForm.appendChild(row);
  }
  
  this.btn = qrForm.querySelector('input[type="submit"]');
  this.btn.previousSibling.className = 'presubmit';
  QR.noCaptcha && (this.btn.tabIndex = 5) && (file.tabIndex = 5);
  
  if (spoiler = postForm.querySelector('input[name="spoiler"]')) {
    spoiler = document.createElement('span');
    spoiler.id = 'qrSpoiler';
    spoiler.innerHTML
      = '<label>[<input type="checkbox" value="on" name="spoiler">Spoiler?]</label>';
    file.parentNode.insertBefore(spoiler, file.nextSibling);
  }
  
  form.appendChild(qrForm);
  cnt.appendChild(form);
  
  qrError = document.createElement('div');
  qrError.id = 'qrError';
  cnt.appendChild(qrError);
  
  cnt.addEventListener('click', QR.onClick, false);
  
  document.body.appendChild(cnt);
  
  if (cd = localStorage.getItem('4chan-cd-' + Main.board)) {
    QR.startCooldown(cd);
  }
  
  if (Main.threadClosed) {
    QR.lock();
  }
  
  QR.reloadCaptcha();
  
  if (!Main.hasMobileLayout) {
    Draggable.set($.id('qrHeader'));
  }
};

QR.onFileChange = function(e) {
  if (this.value && QR.fileDisabled) {
    QR.showPostError('Image limit reached.', 'imagelimit', true);
  }
  else {
    QR.hidePostError();
  }
  
  if (UA.hasDragAndDrop) {
    QR.dndFile = null;
    $.id('qrDummyFileLabel').textContent = this.files[0].name;
  }
  
  QR.checkCDType();
};

QR.onKeyDown = function(e) {
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
  else if (e.keyCode == 27 && !e.ctrlkey && !e.altkey && !e.shiftkey && !e.metakey) {
    QR.close();
    return;
  }
  
  clearTimeout(QR.lenCheckTimeout);
  QR.lenCheckTimeout = setTimeout(QR.checkComLength, 500);
};

QR.checkComLength = function() {
  var byteLength, qrError;
  
  if (QR.comLength) {
    byteLength = encodeURIComponent(QR.comField.value).split(/%..|./).length - 1;
    
    if (byteLength > QR.comLength) {
      QR.showPostError('Comment too long ('
        + byteLength + '/' + QR.comLength + ')', 'length');
    }
    else {
      QR.hidePostError('length');
    }
  }
};

QR.close = function() {
  var el, cnt = $.id('quickReply');
  
  QR.comField = null;
  QR.currentTid = null;
  
  clearInterval(QR.captchaInterval);
  clearInterval(QR.pulse);
  
  if (QR.xhr) {
    QR.xhr.abort();
    QR.xhr = null;
  }
  
  if (QR.banXhr) {
    QR.banXhr.abort();
    QR.banXhr = null;
  }
  
  cnt.removeEventListener('click', QR.onClick, false);
  
  (el = $.id('qrFile')) && el.removeEventListener('change', QR.checkCDType, false);
  (el = $.id('qrEmail')) && el.removeEventListener('change', QR.checkCDType, false);
  $.tag('textarea', cnt)[0].removeEventListener('keydown', QR.onKeyDown, false);
  
  Draggable.unset($.id('qrHeader'));
  
  document.body.removeChild(cnt);
};

QR.cloneCaptcha = function() {
  $.id('qrCaptcha').src = $.id('recaptcha_image').firstChild.src;
  $.id('qrChallenge').value = $.id('recaptcha_challenge_field').value;
  $.id('qrCapField').value = '';
};

QR.reloadCaptcha = function(focus) {
  var pulse, poll, el;
  
  if (QR.noCaptcha || !(el = $.id('recaptcha_image'))) {
    return;
  }
  
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

QR.checkCDType = function(e) {
  var cd, el;
  
  if ((QR.cdType & QR.sagePost) && (el = $.id('qrEmail')) && /sage/i.test(el.value)) {
    QR.activeDelay = QR.sageDelay;
  }
  else if ((QR.cdType & QR.filePost) && (el = $.id('qrFile')) && el.value) {
    QR.activeDelay = QR.fileDelay;
  }
  else {
    QR.activeDelay = QR.baseDelay;
  }
  if (!QR.cooldown && (cd = QR.purgeCooldown())) {
    QR.startCooldown(cd);
  }
};

QR.onClick = function(e) {
  var t = e.target;
  
  if (t.type == 'submit') {
    e.preventDefault();
    QR.submit(e.shiftKey);
  }
  else {
    switch (t.id) {
      case 'qrFile':
        if (e.shiftKey) {
          e.preventDefault();
          QR.resetFile();
        }
        break;
      case 'qrDummyFile':
      case 'qrDummyFileButton':
      case 'qrDummyFileLabel':
        e.preventDefault();
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

QR.onDragStart = function(e) {
  document.removeEventListener('drop', QR.onDrop, false);
  document.removeEventListener('dragover', QR.onDragOver, false);
};

QR.onDragEnd = function(e) {
  document.addEventListener('drop', QR.onDrop, false);
  document.addEventListener('dragover', QR.onDragOver, false);
};

QR.onDrop = function(e) {
  var file;
  
  if (!e.dataTransfer.files.length) {
    return;
  }
  
  e.preventDefault();
  
  file = e.dataTransfer.files[0];
  
  QR.dndFile = file;
  
  if (Main.tid) {
    QR.quotePost(Main.tid);
  }
  else if (!QR.currentTid) {
    return;
  }
  
  $.id('qrDummyFileLabel').textContent = file.name;
};

QR.onDragOver = function(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'copy';
};

QR.showPostError = function(msg, type, silent) {
  var qrError;
  
  qrError = $.id('qrError');
  
  if (!qrError) {
    return;
  }
  
  qrError.innerHTML = msg;
  qrError.style.display = 'block';
  
  qrError.setAttribute('data-type', type || '');
  
  if (!silent && (document.hidden
    || document.mozHidden
    || document.webkitHidden
    || document.msHidden)) {
    alert('Posting Error');
  }
};

QR.hidePostError = function(type) {
  var el = $.id('qrError');
  
  if (!el.hasAttribute('style')) {
    return;
  }
  
  if (!type || el.getAttribute('data-type') == type) {
    el.removeAttribute('style');
  }
};

QR.resetFile = function() {
  var file, el;
  
  el = document.createElement('input');
  el.id = 'qrFile';
  el.type = 'file';
  el.size = '19';
  el.name = 'upfile';
  el.addEventListener('change', QR.onFileChange, false);
  
  if (UA.hasDragAndDrop) {
    el.className = 'qrRealFile';
    QR.dndFile = null;
    $.id('qrDummyFileLabel').textContent = 'No file selected.';
  }
  
  file = $.id('qrFile');
  file.removeEventListener('change', QR.onFileChange, false);
  
  file.parentNode.replaceChild(el, file);
  
  QR.hidePostError('imagelimit');
  QR.checkCDType();
};

QR.checkBan = function() {
  QR.banXhr = new XMLHttpRequest();
  QR.banXhr.open('GET', '//api.4chan.org/banned?' + Date.now(), true);
  QR.banXhr.timeout = 3000;
  QR.banXhr.onload = function() {
    if (this.status == 403) {
      QR.showPostError('You are <a href="https://www.4chan.org/banned" target="_blank">banned</a> ;_;');
    }
    else {
      QR.showPostError('Connection error.');
    }
    QR.banXhr = null;
    QR.btn.value = 'Submit';
  };
  QR.banXhr.onerror = QR.banXhr.ontimeout = function() {
    QR.banXhr = null;
    QR.btn.value = 'Submit';
    QR.showPostError('Connection error.');
  };
  QR.banXhr.send(null);
};

QR.submit = function(force) {
  var field, formdata, file;
  
  if (QR.banXhr) {
    QR.banXhr.abort();
    QR.banXhr = null;
  }
  
  QR.hidePostError();
  
  if (QR.xhr) {
    QR.xhr.abort();
    QR.xhr = null;
    QR.showPostError('Aborted');
    QR.btn.value = 'Submit';
    return;
  }
  
  if (!force && QR.cooldown) {
    if (QR.auto = !QR.auto) {
      QR.btn.value = QR.cooldown + 's (auto)';
    }
    else {
      QR.btn.value = QR.cooldown + 's';
    }
    return;
  }
  
  QR.auto = false;
  
  if (!force && (field = $.id('qrCapField')) && field.value == '') {
    QR.showPostError('You forgot to type in the CAPTCHA.');
    field.focus();
    return;
  }
  
  QR.xhr = new XMLHttpRequest();
  QR.xhr.open('POST', document.forms.qrPost.action, true);
  QR.xhr.withCredentials = true;
  QR.xhr.upload.onprogress = function(e) {
    if (e.loaded >= e.total) {
      QR.btn.value = '100%';
    }
    else {
      QR.btn.value = (0 | (e.loaded / e.total * 100)) + '%';
    }
  };
  QR.xhr.onerror = function() {
    QR.xhr = null;
    QR.checkBan();
  };
  QR.xhr.onload = function() {
    var resp, el, hasFile, cd, ids, tid, pid, tracked;
    
    QR.xhr = null;
    
    QR.btn.value = 'Submit';
    
    if (this.status == 200) {
      if (resp = this.responseText.match(/"errmsg"[^>]*>(.*?)<\/span/)) {
        QR.reloadCaptcha();
        QR.showPostError(resp[1]);
        return;
      }
      
      hasFile = QR.dndFile || ((el = $.id('qrFile')) && el.value);
      
      cd = 1;
      if ((el = $.id('qrEmail')) && /sage/i.test(el.value)) {
        cd |= QR.sagePost;
      }
      if (hasFile) {
        cd |= QR.filePost;
      }
      
      cd = Date.now() + '-' + cd;
      localStorage.setItem('4chan-cd-' + Main.board, cd);
      
      if (Config.persistentQR) {
        QR.startCooldown(cd);
        $.byName('com')[1].value = '';
        $.byName('sub')[1].value = '';
        if (el = $.byName('spoiler')[2]) {
          el.checked = false;
        }
        QR.reloadCaptcha();
        if (hasFile) {
          QR.resetFile();
        }
      }
      else {
        Recaptcha.reload('t');
        QR.close();
      }
      
      if (ids = this.responseText.match(/<!-- thread:([0-9]+),no:([0-9]+) -->/)) {
        tid = ids[1];
        pid = ids[2];
        
        if (Main.tid) {
          QR.lastReplyId = +pid;
          Parser.trackedReplies['>>' + pid] = 1;
          Parser.saveTrackedReplies(tid, Parser.trackedReplies);
        }
        else {
          tracked = Parser.getTrackedReplies(tid) || {};
          tracked['>>' + pid] = 1;
          Parser.saveTrackedReplies(tid, tracked);
        }
      }
      
      if (ThreadUpdater.enabled) {
        setTimeout(ThreadUpdater.forceUpdate, 500);
      }
	  
	  UA.dispatchEvent('QRPostSuccess', { thread: tid, post: pid });
	  
    }
    else {
      QR.showPostError('Error: ' + this.status + ' ' + this.statusText);
    }
  };
  
  
  if (QR.dndFile) {
    file = $.id('qrFile');
    file.disabled = true;
    formdata = new FormData(document.forms.qrPost);
    formdata.append('upfile', QR.dndFile);
    file.disabled = false;
  }
  else {
    formdata = new FormData(document.forms.qrPost);
  }
  
  clearInterval(QR.pulse);
  
  QR.btn.value = 'Sending';
  
  QR.xhr.send(formdata);
};

QR.purgeCooldown = function() {
  var data, cd, type, time, thres, elapsed;
  
  if (data = localStorage.getItem('4chan-cd-' + Main.board)) {
    cd = data.split('-');
    time = parseInt(cd[0], 10);
    type = +cd[1];
    
    if (type & QR.sagePost) {
      thres = QR.sageDelay;
    }
    else if (type & QR.filePost) {
      thres = QR.fileDelay;
    }
    else {
      thres = QR.baseDelay;
    }
    
    elapsed = Date.now() - time;
    
    if (elapsed >= thres || elapsed < 0) {
      localStorage.removeItem('4chan-cd-' + Main.board);
    }
    else {
      return data;
    }
  }
};

QR.startCooldown = function(cd) {
  var el;
  
  if (QR.noCooldown || !$.id('quickReply') || QR.xhr) {
    return;
  }
  
  clearInterval(QR.pulse);
  
  cd = cd.split('-');
  QR.timestamp = parseInt(cd[0], 10);
  QR.cdType = +cd[1];
  
  if ((QR.cdType & QR.sagePost) && (el = $.id('qrEmail')) && /sage/i.test(el.value)) {
    QR.activeDelay = QR.sageDelay;
  }
  else if ((QR.cdType & QR.filePost) && (el = $.id('qrFile')) && el.value) {
    QR.activeDelay = QR.fileDelay;
  }
  else {
    QR.activeDelay = QR.baseDelay;
  }
  
  QR.cdElapsed = Date.now() - QR.timestamp;
  QR.cooldown = Math.floor((QR.activeDelay - QR.cdElapsed) / 1000);
  
  if (QR.cooldown <= 0 || QR.cdElapsed < 0) {
    QR.cooldown = false;
    return;
  }
  
  QR.btn.value = QR.cooldown + 's';
  
  QR.pulse = setInterval(QR.onPulse, 1000);
};

QR.onPulse = function() {
  QR.cdElapsed = Date.now() - QR.timestamp;
  QR.cooldown = Math.floor((QR.activeDelay - QR.cdElapsed) / 1000);
  if (QR.cooldown <= 0) {
    clearInterval(QR.pulse);
    QR.btn.value = 'Submit';
    QR.cooldown = false;
    if (QR.auto) {
      QR.submit();
    }
  }
  else {
    QR.btn.value = QR.cooldown + (QR.auto ? 's (auto)' : 's');
  }
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

ThreadHiding.clear = function(silent) {
  var i, id, key, msg;
  
  this.load();
  
  i = 0;
  
  for (id in this.hidden) {
    ++i;
  }
  
  key = '4chan-hide-t-' + Main.board;
  
  if (!silent) {
    if (!i) {
      alert("You don't have any hidden threads on /" + Main.board + '/');
      return;
    }
    
    msg = 'This will unhide ' + i + ' thread' + (i > 1 ? 's' : '') + ' on /' + Main.board + '/';
    
    if (!confirm(msg)) {
      return;
    }
    
    localStorage.removeItem(key);
  }
  else {
    localStorage.removeItem(key);
  }
};

ThreadHiding.isHidden = function(tid) {
  var sa = $.id('sa' + tid);
  
  return !sa || sa.hasAttribute('data-hidden');
};

ThreadHiding.toggle = function(tid) {
  if (this.isHidden(tid)) {
    this.show(tid);
  }
  else {
    this.hide(tid);
  }
  this.save();
};

ThreadHiding.show = function(tid) {
  var sa, th;
  
  th = $.id('t' + tid);
  
  sa = $.id('sa' + tid);
  sa.removeAttribute('data-hidden');
  
  if (Main.hasMobileLayout) {
    sa.textContent = 'Hide';
    $.removeClass(sa, 'mobile-tu-show');
    $.cls('postLink', th)[0].appendChild(sa);
    
    th.style.display = null;
    $.removeClass(th.nextElementSibling, 'mobile-hr-hidden');
  }
  else {
    sa.firstChild.src = Main.icons.minus;
    $.removeClass(th, 'post-hidden');
  }
  
  delete this.hidden[tid];
};

ThreadHiding.hide = function(tid) {
  var sa, th;
  
  th = $.id('t' + tid);
  
  if (Main.hasMobileLayout) {
    th.style.display = 'none';
    $.addClass(th.nextElementSibling, 'mobile-hr-hidden');
    
    sa = $.id('sa' + tid);
    sa.setAttribute('data-hidden', tid);
    sa.textContent = 'Show Hidden Thread';
    $.addClass(sa, 'mobile-tu-show');
    
    th.parentNode.insertBefore(sa, th);
  }
  else {
    if (Config.hideStubs && !$.cls('stickyIcon', th)[0]) {
      th.style.display = th.nextElementSibling.style.display = 'none';
    }
    else {
      sa = $.id('sa' + tid);
      sa.setAttribute('data-hidden', tid);
      sa.firstChild.src = Main.icons.plus;
      th.className += ' post-hidden';
    }
  }
  
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

ReplyHiding.isHidden = function(pid) {
  var sa = $.id('sa' + pid);
  
  return !sa || sa.hasAttribute('data-hidden');
};

ReplyHiding.toggle = function(pid) {
  if (this.isHidden(pid)) {
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
  this.charLimit = 45;
  this.watched = {};
  this.isRefreshing = false;
  
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
    + (UA.hasCORS ? ('<img id="twPrune" class="pointer right" src="'
    + Main.icons.refresh + '" alt="R" title="Refresh"></div>') : '</div>');
  
  this.listNode = document.createElement('ul');
  this.listNode.id = 'watchList';
  
  this.load();
  
  if (Main.tid) {
    this.refreshCurrent();
  }
  
  this.build();
  
  cnt.appendChild(this.listNode);
  document.body.appendChild(cnt);
  cnt.addEventListener('mouseup', this.onClick, false);
  Draggable.set($.id('twHeader'));
  window.addEventListener('storage', this.syncStorage, false);
  
  if (!Main.tid && this.canAutoRefresh()) {
    this.refresh();
  }
};

ThreadWatcher.syncStorage = function(e) {
  var key;
  
  if (!e.key) {
    return;
  }
  
  key = e.key.split('-');
  
  if (key[0] == '4chan' && key[1] == 'watch' && e.newValue != e.oldValue) {
    ThreadWatcher.watched = JSON.parse(e.newValue);
    ThreadWatcher.build(true);
  }
};

ThreadWatcher.load = function() {
  if (storage = localStorage.getItem('4chan-watch')) {
    this.watched = JSON.parse(storage);
  }
};

ThreadWatcher.build = function(rebuildButtons) {
  var i, html, tuid, key, buttons, btn, nodes;
  
  html = '';
  
  for (key in this.watched) {
    tuid = key.split('-');
    html += '<li id="watch-' + key
      + '"><span class="pointer" data-cmd="unwatch" data-id="'
      + tuid[0] + '" data-board="' + tuid[1] + '">&times;</span> <a href="'
      + Main.linkToThread(tuid[0], tuid[1], this.watched[key][1]) + '"';
    
    if (this.watched[key][1] == -1) {
      html += ' class="deadlink">';
    }
    else if (this.watched[key][2]) {
      html += ' class="hasNewReplies">(' + this.watched[key][2] + ') ';
    }
    else {
      html += '>';
    }
    
    html += '/' + tuid[1] + '/ - ' + this.watched[key][0] + '</a></li>';
  }
  
  if (rebuildButtons) {
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
  else if (t.src && !ThreadWatcher.isRefreshing) {
    ThreadWatcher.refresh();
  }
};

ThreadWatcher.toggle = function(tid, board, synced) {
  var key, label, btn, lastReply, thread;
  
  key = tid + '-' + (board || Main.board);
  
  if (this.watched[key]) {
    delete this.watched[key];
    if (btn = $.id('wbtn-' + key)) {
      btn.src = Main.icons.notwatched;
      btn.removeAttribute('data-active');
    }
  }
  else {
    if (label = $.cls('subject', $.id('pi' + tid))[0].textContent) {
      label = label.slice(0, this.charLimit);
    }
    else if (label = $.id('m' + tid).innerHTML) {
      label = label.replace(/(?:<br>)+/g, ' ')
        .replace(/<[^>]*?>/g, '').slice(0, this.charLimit);
    }
    else {
      label = 'No.' + tid;
    }
    
    if ((thread = $.id('t' + tid)).children[1]) {
      lastReply = thread.lastElementChild.id.slice(2);
    }
    else {
      lastReply = tid;
    }
    
    this.watched[key] = [ label, lastReply, 0 ];
    
    if (btn = $.id('wbtn-' + key)) {
      btn.src = Main.icons.watched;
      btn.setAttribute('data-active', '1');
    }
  }
  this.save();
  this.load();
  this.build();
};

ThreadWatcher.save = function() {
  localStorage.setItem('4chan-watch', JSON.stringify(ThreadWatcher.watched));
};

ThreadWatcher.canAutoRefresh = function() {
  var time;
  
  if (time = localStorage.getItem('4chan-tw-timestamp')) {
    return Date.now() - (+time) >= 60000;
  }
  return false;
};

ThreadWatcher.setRefreshTimestamp = function() {
  localStorage.setItem('4chan-tw-timestamp', Date.now());
};

ThreadWatcher.refresh = function() {
  var i, to, key, total, img;
  
  if (total = $.id('watchList').children.length) {
    i = to = 0;
    img = $.id('twPrune');
    img.src = Main.icons.rotate;
    ThreadWatcher.isRefreshing = true;
    ThreadWatcher.setRefreshTimestamp();
    for (key in ThreadWatcher.watched) {
      setTimeout(ThreadWatcher.fetch, to, key, ++i == total ? img : null);
      to += 200;
    }
  }
};

ThreadWatcher.refreshCurrent = function(rebuild) {
  var key, thread, lastReply;
  
  key = Main.tid + '-' + Main.board;
  
  if (this.watched[key]) {
    if ((thread = $.id('t' + Main.tid)).children[1]) {
      lastReply = thread.lastElementChild.id.slice(2);
    }
    else {
      lastReply = Main.tid;
    }
    if (this.watched[key][1] != lastReply) {
      this.watched[key][1] = lastReply;
    }
    
    this.watched[key][2] = 0;
    this.save();
    
    if (rebuild) {
      this.build();
    }
  }
};

ThreadWatcher.onRefreshEnd = function(img) {
  img.src = Main.icons.refresh;
  this.isRefreshing = false;
  this.save();
  this.load();
  this.build();
};

ThreadWatcher.fetch = function(key, img) {
  var tuid, xhr, li, method;
  
  li = $.id('watch-' + key);
  
  if (ThreadWatcher.watched[key][1] == -1) {
    delete ThreadWatcher.watched[key];
    li.parentNode.removeChild(li);
    if (img) {
      ThreadWatcher.onRefreshEnd(img);
    }
    return;
  }
  
  tuid = key.split('-'); // tid, board
  
  xhr = new XMLHttpRequest();
  xhr.onload = function() {
    var i, newReplies, posts, lastReply;
    if (this.status == 200) {
      posts = Parser.parseThreadJSON(this.responseText);
      lastReply = ThreadWatcher.watched[key][1];
      newReplies = 0;
      for (i = posts.length - 1; i >= 1; i--) {
        if (posts[i].no <= lastReply) {
          break;
        }
        ++newReplies;
      }
      if (newReplies > ThreadWatcher.watched[key][2]) {
        ThreadWatcher.watched[key][2] = newReplies;
      }
    }
    else if (this.status == 404) {
      ThreadWatcher.watched[key][1] = -1;
    }
    if (img) {
      ThreadWatcher.onRefreshEnd(img);
    }
  };
  if (img) {
    xhr.onerror = xhr.onload;
  }
  xhr.open('GET', '//api.4chan.org/' + tuid[1] + '/res/' + tuid[0] + '.json');
  xhr.send(null);
};

/**
 * Thread expansion
 */
var ThreadExpansion = {};

ThreadExpansion.init = function() {
  this.enabled = UA.hasCORS;
};

ThreadExpansion.expandComment = function(link) {
  var ids, tid, pid, abbr;
  
  if (!(ids = link.getAttribute('href').match(/^(?:res\/)([0-9]+)#p([0-9]+)$/))) {
    return;
  }
  
  tid = ids[1];
  pid = ids[2];
  
  abbr = link.parentNode;
  abbr.textContent = 'Loading...';
  
  $.get('//api.4chan.org/' + Main.board + '/res/' + tid + '.json',
    {
      onload: function() {
        var i, msg, com, posts;
        
        if (this.status == 200) {
          msg = $.id('m' + pid);
          
          posts = Parser.parseThreadJSON(this.responseText);
          
          if (tid == pid) {
            com = posts[0].com;
          }
          else {
            for (i = posts.length - 1; i > 0; i--) {
              if (posts[i].no == pid) {
                com = posts[i].com;
                break;
              }
            }
          }
          if (com) {
            msg.innerHTML = com;
            if (Parser.prettify) {
              Parser.parseMarkup(msg);
            }
            if (window.jsMath) {
              Parser.parseMathOne(msg);
            }
          }
          else {
            abbr.textContent = "This post doesn't exist anymore.";
          }
        }
        else if (this.status == 404) {
          abbr.textContent = "This thread doesn't exist anymore.";
        }
        else {
          abbr.textContent = 'Connection Error';
          console.log('ThreadExpansion: ' + this.status + ' ' + this.statusText);
        }
      },
      onerror: function() {
        abbr.textContent = 'Connection Error';
        console.log('ThreadExpansion: xhr failed');
      }
    }
  );
};

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
          posts = Parser.parseThreadJSON(this.responseText);
          
          if (!Config.revealSpoilers && posts[0].custom_spoiler) {
            Parser.setCustomSpoiler(Main.board, posts[0].custom_spoiler);
          }
          
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
            if (Parser.prettify) {
              Parser.parseMarkup(msg);
            }
            if (window.jsMath) {
              Parser.parseMathOne(msg);
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
          summary.children[0].src = Main.icons.plus;
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
  
  if (!UA.hasCORS) {
    return;
  }
  
  this.enabled = true;
  
  this.pageTitle = document.title;
  
  this.unreadCount = 0;
  this.auto = false;
  
  this.delayId = 0;
  this.delayIdHidden = 4;
  this.delayRange = [ 10, 15, 20, 30, 60, 90, 120, 180, 240, 300 ];
  this.timeLeft = 0;
  this.interval = null;
  
  this.lastModified = '0';
  this.lastReply = null;
  
  this.iconPath = '//static.4chan.org/image/';
  this.iconNode = document.head.querySelector('link[rel="shortcut icon"]');
  this.iconNode.type = 'image/x-icon';
  this.defaultIcon = this.iconNode.getAttribute('href').replace(this.iconPath, '');
  
  this.deletionQueue = {};
  
  if (Config.updaterSound) {
    this.audioEnabled = false;
    this.audio = document.createElement('audio');
    this.audio.src = '//static.4chan.org/media/beep.ogg';
  }
  
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
  else {
    this.hidden = 'hidden';
    this.visibilitychange = 'visibilitychange';
  }
  
  this.initControls();
  
  if (sessionStorage.getItem('4chan-auto-' + Main.tid)) {
    this.start();
  }
};

ThreadUpdater.buildMobileControl = function(el, bottom) {
  var cnt, ctrl, cb, label;
  
  bottom = (bottom ? 'Bot' : '');
  
  // Update button
  el.textContent = 'Update';
  el.removeAttribute('onmouseup');
  el.setAttribute('data-cmd', 'update');
  
  cnt = el.parentNode.parentNode;
  ctrl = document.createElement('span');
  ctrl.className = 'mobileib button';
  
  // Auto checkbox
  label = document.createElement('label');
  cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.setAttribute('data-cmd', 'auto');
  this['autoNode' + bottom] = cb;
  label.appendChild(cb);
  label.appendChild(document.createTextNode('Auto'));
  ctrl.appendChild(label);
  cnt.appendChild(document.createTextNode(' '));
  cnt.appendChild(ctrl);
  
  // Status label
  label = document.createElement('div');
  label.className = 'mobile-tu-status';
  cnt.appendChild(this['statusNode' + bottom] = label);
  
  $.id('mpostform').parentNode.style.marginTop = '';
};

ThreadUpdater.buildDesktopControl = function(bottom) {
  var frag, el, label, navlinks;
  
  bottom = (bottom ? 'Bot' : '');
  
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
  this['autoNode' + bottom] = el;
  label.appendChild(el);
  label.appendChild(document.createTextNode('Auto'));
  frag.appendChild(label);
  frag.appendChild(document.createTextNode('] '));
  
  if (Config.updaterSound) {
    // Sound checkbox
    frag.appendChild(document.createTextNode(' ['));
    label = document.createElement('label');
    el = document.createElement('input');
    el.type = 'checkbox';
    el.title = 'Play a sound on new replies to your posts';
    el.setAttribute('data-cmd', 'sound');
    this['soundNode' + bottom] = el;
    label.appendChild(el);
    label.appendChild(document.createTextNode('Sound'));
    frag.appendChild(label);
    frag.appendChild(document.createTextNode('] '));
  }
  
  // Status label
  frag.appendChild(
    this['statusNode' + bottom] = document.createElement('span')
  );
  
  if (navlinks = $.cls('navLinks' + bottom)[0]) {
    navlinks.appendChild(frag);
  }
};

ThreadUpdater.initControls = function() {
  var i, j, frag, el, label, navlinks;
  
  // Mobile
  if (Main.hasMobileLayout) {
    this.buildMobileControl($.id('refresh_top'));
    this.buildMobileControl($.id('refresh_bottom'), true);
  }
  // Desktop
  else {
    this.buildDesktopControl();
    this.buildDesktopControl(true);
  }
};

ThreadUpdater.start = function() {
  this.auto = true;
  this.autoNode.checked = this.autoNodeBot.checked = true;
  this.force = this.updating = false;
  this.lastUpdated = Date.now();
  if (this.hidden) {
    document.addEventListener(this.visibilitychange,
      this.onVisibilityChange, false);
  }
  document.addEventListener('scroll', this.onScroll, false);
  this.delayId = 0;
  this.timeLeft = this.delayRange[0];
  this.pulse();
  sessionStorage.setItem('4chan-auto-' + Main.tid, 1);
};

ThreadUpdater.stop = function(manual) {
  clearTimeout(this.interval);
  this.auto = this.updating = this.force = false;
  this.autoNode.checked = this.autoNodeBot.checked = false;
  if (this.hidden) {
    document.removeEventListener(this.visibilitychange,
      this.onVisibilityChange, false);
  }
  if (manual) {
    this.setStatus('');
    this.setIcon(this.defaultIcon);
  }
  sessionStorage.removeItem('4chan-auto-' + Main.tid);
};

ThreadUpdater.pulse = function() {
  var self = ThreadUpdater;
  
  if (self.timeLeft == 0) {
    self.update();
  }
  else {
    self.setStatus(self.timeLeft--);
    self.interval = setTimeout(self.pulse, 1000);
  }
};

ThreadUpdater.adjustDelay = function(postCount)
{
  if (postCount == 0) {
    if (!this.force) {
      if (this.delayId < this.delayRange.length - 1) {
        ++this.delayId;
      }
    }
  }
  else {
    this.delayId = document[this.hidden] ? this.delayIdHidden : 0;
  }
  this.timeLeft = this.delayRange[this.delayId];
  if (this.auto) {
    this.pulse();
  }
};

ThreadUpdater.onVisibilityChange = function(e) {
  var self = ThreadUpdater;
  
  if (document[self.hidden] && self.delayId < self.delayIdHidden) {
    self.delayId = self.delayIdHidden;
  }
  else {
    self.delayId = 0;
  }
  
  self.timeLeft = self.delayRange[0];
  self.lastUpdated = Date.now();
  clearTimeout(self.interval);
  self.pulse();
};

ThreadUpdater.onScroll = function(e) {
  if (document.documentElement.scrollHeight
      <= (window.innerHeight + window.pageYOffset)
      && !document[ThreadUpdater.hidden]) {
    ThreadUpdater.clearUnread();
  }
};

ThreadUpdater.clearUnread = function() {
  if (!this.dead) {
    this.setIcon(this.defaultIcon);
  }
  if (this.lastReply) {
    this.unreadCount = 0;
    document.title = this.pageTitle;
    $.removeClass(this.lastReply, 'newPostsMarker');
    this.lastReply = null;
  }
};

ThreadUpdater.forceUpdate = function() {
  ThreadUpdater.force = true;
  ThreadUpdater.update();
};

ThreadUpdater.toggleAuto = function() {
  if (this.updating) {
    return;
  }
  this.auto ? this.stop(true) : this.start();
};

ThreadUpdater.toggleSound = function() {
  this.soundNode.checked = this.soundNodeBot.checked =
    this.audioEnabled = !this.audioEnabled;
};

ThreadUpdater.update = function() {
  var self, now = Date.now();
  
  self = ThreadUpdater;
  
  if (self.updating) {
    return;
  }
  
  clearTimeout(self.interval);
  
  self.updating = true;
  
  self.setStatus('Updating...');
  
  $.get('//api.4chan.org/' + Main.board + '/res/' + Main.tid + '.json',
    {
      onload: self.onload,
      onerror: self.onerror
    },
    {
      'If-Modified-Since': self.lastModified
    }
  );
};

ThreadUpdater.markDeletedReplies = function(newposts) {
  var i, j, posthash, oldposts, el;
  
  posthash = {};
  for (i = 0; j = newposts[i]; ++i) {
    posthash['pc' + j.no] = 1;
  }
  
  oldposts = $.cls('replyContainer');
  for (i = 0; j = oldposts[i]; ++i) {
    if (!posthash[j.id] && !$.hasClass(j, 'deleted')) {
      if (this.deletionQueue[j.id]) {
        el = document.createElement('img');
        el.src = Main.icons2.trash;
        el.className = 'trashIcon';
        el.title = 'This post has been deleted';
        $.addClass(j, 'deleted');
        $.cls('postNum', j)[1].appendChild(el);
        delete this.deletionQueue[j.id];
      }
      else {
        this.deletionQueue[j.id] = 1;
      }
    }
  }
};

ThreadUpdater.onload = function() {
  var i, el, state, self, nodes, thread, newposts, frag, lastrep, lastid,
    spoiler, op, doc, autoscroll, count, fromQR;
  
  self = ThreadUpdater;
  nodes = [];
  
  self.setStatus('');
  
  if (this.status == 200) {
    self.lastModified = this.getResponseHeader('Last-Modified');
    
    thread = $.id('t' + Main.tid);
    
    lastrep = thread.children[thread.childElementCount - 1];
    lastid = +lastrep.id.slice(2);
    
    newposts = Parser.parseThreadJSON(this.responseText);
    
    state = !!newposts[0].closed;
    if (state != Main.threadClosed) {
      if (QR.enabled && $.id('quickReply')) {
        if (state) {
          QR.lock();
        }
        else {
          QR.unlock();
        }
      }
      Main.setThreadState('closed', state);
    }
    
    state = !!newposts[0].sticky;
    if (state != Main.threadSticky) {
      Main.setThreadState('sticky', state);
    }
    
    state = !!newposts[0].imagelimit;
    if (QR.enabled && state != QR.fileDisabled) {
      QR.fileDisabled = state;
    }
    
    if (!Config.revealSpoilers && newposts[0].custom_spoiler) {
      Parser.setCustomSpoiler(Main.board, newposts[0].custom_spoiler);
    }
    
    for (i = newposts.length - 1; i >= 0; i--) {
      if (newposts[i].no <= lastid) {
        break;
      }
      nodes.push(newposts[i]);
    }
    
    count = nodes.length;
    
    if (count == 1 && QR.lastReplyId == nodes[0].no) {
      fromQR = true;
      QR.lastReplyId = null;
    }
    
    if (!fromQR) {
      self.markDeletedReplies(newposts);
    }
    
    if (count) {
      doc = document.documentElement;
      
      autoscroll = (
        Config.autoScroll
        && document[self.hidden]
        && doc.scrollHeight == (window.innerHeight + window.pageYOffset)
      );
      
      frag = document.createDocumentFragment();
      for (i = nodes.length - 1; i >= 0; i--) {
        frag.appendChild(Parser.buildHTMLFromJSON(nodes[i], Main.board));
      }
      thread.appendChild(frag);
      
      Parser.hasYouMarkers = false;
      Parser.parseThread(thread.id.slice(1), -nodes.length);
      
      if (!fromQR) {
        if (!self.force && doc.scrollHeight > window.innerHeight) {
          if (!self.lastReply && lastid != Main.tid) {
            (self.lastReply = lastrep.lastChild).className += ' newPostsMarker';
          }
          if (Parser.hasYouMarkers) {
            self.setIcon(self.icons[Main.type + 'rep']);
            if (self.audioEnabled && document[self.hidden]) {
              self.audio.play();
            }
          }
          else if (self.unreadCount == 0) {
            self.setIcon(self.icons[Main.type]);
          }
          self.unreadCount += count;
          document.title = '(' + self.unreadCount + ') ' + self.pageTitle;
        }
        else {
          self.setStatus(count + ' new post' + (count > 1 ? 's' : ''));
        }
      }
      
      if (autoscroll) {
        window.scrollTo(0, document.documentElement.scrollHeight);
      }
      
      if (Config.threadWatcher) {
        ThreadWatcher.refreshCurrent(true);
      }
      
      if (Config.threadStats) {
        op = newposts[0];
        ThreadStats.update(op.replies, op.images, op.bumplimit, op.imagelimit);
      }
	  
	  UA.dispatchEvent('ThreadUpdated', { count: count });
	  
    }
    else {
      self.setStatus('No new posts');
    }
  }
  else if (this.status == 304 || this.status == 0) {
    self.setStatus('No new posts');
  }
  else if (this.status == 404) {
    self.setIcon(self.icons[Main.type + 'dead']);
    self.setError('This thread has been pruned or deleted');
    self.dead = true;
    self.stop();
    return;
  }
  
  self.lastUpdated = Date.now();
  self.adjustDelay(nodes.length);
  self.updating = self.force = false;
};

ThreadUpdater.onerror = function() {
  var self = ThreadUpdater;
  
  if (UA.isOpera && !this.statusText && this.status == 0) {
    self.setStatus('No new posts');
  }
  else {
    self.setError('Connection Error');
  }
  
  self.lastUpdated = Date.now();
  self.adjustDelay(0);
  self.updating = self.force = false;
};

ThreadUpdater.setStatus = function(msg) {
  this.statusNode.textContent = this.statusNodeBot.textContent = msg;
};

ThreadUpdater.setError = function(msg) {
  this.statusNode.innerHTML
    = this.statusNodeBot.innerHTML
    = '<span class="tu-error">' + msg + '</span>';
};

ThreadUpdater.setIcon = function(data) {
  this.iconNode.href = this.iconPath + data;
  document.head.appendChild(this.iconNode);
};

ThreadUpdater.icons = {
  ws: 'favicon-ws-newposts.ico',
  nws: 'favicon-nws-newposts.ico',
  wsrep: 'favicon-ws-newreplies.ico',
  nwsrep: 'favicon-nws-newreplies.ico',
  wsdead: 'favicon-ws-deadthread.ico',
  nwsdead: 'favicon-nws-deadthread.ico'
};

/**
 * Thread stats
 */
var ThreadStats = {};

ThreadStats.init = function() {
  var i, cnt;
  
  this.nodeTop = document.createElement('div');
  this.nodeTop.className = 'thread-stats';
  this.nodeBot = this.nodeTop.cloneNode(false);
  
  cnt = $.cls('navLinks');
  cnt[0] && cnt[0].appendChild(this.nodeTop);
  cnt[3] && cnt[3].appendChild(this.nodeBot);
  
  this.pageNumber = null;
  this.updatePageNumber();
  this.pageInterval = setInterval(this.updatePageNumber, 3 * 60000);
  
  this.update(null, null, window.bumplimit, window.imagelimit);
};

ThreadStats.update = function(replies, images, isBumpFull, isImageFull) {
  var repStr, imgStr, pageStr, stateStr;
  
  if (replies === null) {
    replies = $.cls('replyContainer').length;
    images = $.cls('fileText').length - ($.id('fT' + Main.tid) ? 1 : 0);
  }
  
  repStr = replies + ' repl' + ((replies > 1 || !replies) ? 'ies' : 'y');
  imgStr = images + ' image' + ((images > 1 || !images) ? 's' : '');
  
  if (isBumpFull) {
    repStr = '<em title="Bump limit reached">' + repStr + '</em>';
  }
  
  if (isImageFull) {
    imgStr = '<em title="Image limit reached">' + imgStr + '</em>';
  }
  
  if (Main.threadSticky) {
    stateStr = ' [Sticky]';
  }
  else {
    stateStr = '';
  }
  
  if (Main.threadClosed) {
    stateStr += ' [Closed]';
  }
  
  if (this.pageNumber !== null) {
    pageStr = '<span class="ts-page"> [Page ' + this.pageNumber + ']</span>';
  }
  else {
    pageStr = '';
  }
  
  this.nodeTop.innerHTML = this.nodeBot.innerHTML
    = '[' + repStr + '] ' + '[' + imgStr + ']' + stateStr + pageStr;
};

ThreadStats.updatePageNumber = function() {
  $.get('//api.4chan.org/' + Main.board + '/threads.json',
    {
      onload: ThreadStats.onCatalogLoad,
      onerror: ThreadStats.onCatalogError
    }
  );
};

ThreadStats.onCatalogLoad = function() {
  var self, i, j, page, post, threads, catalog, tid, nodes;
  
  self = ThreadStats;
  
  if (this.status == 200) {
    tid = +Main.tid;
    catalog = JSON.parse(this.responseText);
    for (i = 0; page = catalog[i]; ++i) {
      threads = page.threads;
      for (j = 0; post = threads[j]; ++j) {
        if (post.no == tid) {
          if (self.pageNumber === null) {
            self.nodeTop.innerHTML = self.nodeBot.innerHTML
              += '<span class="ts-page"> [Page ' + i + ']</span>';
          }
          else {
            nodes = $.cls('ts-page');
            nodes[0].textContent = nodes[1].textContent
              = ' [Page ' + i + ']'
          }
          self.pageNumber = i;
          return;
        }
      }
    }
    clearInterval(self.pageInterval);
  }
  else {
    ThreadStats.onCatalogError();
  }
};

ThreadStats.onCatalogError = function() {
  console.log('ThreadStats: couldn\'t get the catalog (' + this.status + ')');
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
      case 'filters-palette':
        Filter.openPalette(e.target);
        break;
      case 'filters-palette-close':
        Filter.closePalette();
        break;
      case 'filters-palette-clear':
        Filter.clearPalette();
        break;
      case 'filters-up':
        Filter.moveUp(e.target.parentNode.parentNode);
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

Filter.onPaletteClick = function(e) {
  var cmd;
  
  if (cmd = e.target.getAttribute('data-cmd')) {
    switch (cmd) {
      case 'palette-pick':
        Filter.pickColor(e.target);
        break;
      case 'palette-clear':
        Filter.pickColor(e.target, true);
        break;
      case 'palette-close':
        Filter.closePalette();
        break;
    }
  }
  else {
    Filter.closePalette();
  }
};

Filter.exec = function(cnt, pi, msg, tid) {
  var trip, name, com, mail, uid, sub, f, filters, hit;
  
  if (Parser.trackedReplies && Parser.trackedReplies['>>' + pi.id.slice(2)]) {
    return false;
  }
  
  filters = Filter.activeFilters;
  hit = false;
  
  for (i = 0; f = filters[i]; ++i) {
    if (f.type == 0) {
      if ((trip || (trip = pi.getElementsByClassName('postertrip')[0]))
        && f.pattern == trip.textContent) {
        hit = true;
        break;
      }
    }
    else if (f.type == 1) {
      if ((name || (name = pi.getElementsByClassName('name')[0]))
        && f.pattern == name.textContent) {
        hit = true;
        break;
      }
    }
    else if (f.type == 2) {
      if (!com) {
        this.entities.innerHTML
          = msg.innerHTML.replace(/<br>/g, '\n').replace(/[<[^>]+>/g, '');
        com = this.entities.textContent;
      }
      if (f.pattern.test(com)) {
        hit = true;
        break;
      }
    }
    else if (f.type == 3) {
      if ((mail ||
          ((mail = pi.getElementsByClassName('useremail')[0])
            && (mail = mail.href.slice(7))
          )
        ) && f.pattern.test(mail)) {
        hit = true;
        break;
      }
    }
    else if (f.type == 4) {
      if ((uid ||
          ((uid = pi.getElementsByClassName('posteruid')[0])
            && (uid = uid.firstElementChild.textContent)
          )
        ) && f.pattern == uid) {
        hit = true;
        break;
      }
    }
    else {
      if ((sub ||
          ((sub = pi.getElementsByClassName('subject')[0])
            && (sub = sub.textContent)
          )
        ) && f.pattern.test(sub)) {
        hit = true;
        break;
      }
    }
  }
  
  if (hit) {
    if (f.hide) {
      cnt.className += ' post-hidden';
      el = document.createElement('span');
      if (!tid) {
        el.textContent = '[View]';
        el.setAttribute('data-filtered', '1');
      }
      else {
        el.innerHTML = '[<a data-filtered="1" href="res/' + tid + '">View</a>]';
      }
      el.className = 'filter-preview';
      pi.appendChild(el);
      return true;
    }
    else {
      cnt.className += ' filter-hl';
      cnt.style.boxShadow = '-3px 0 ' + f.color;
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
        // Name, Tripcode or ID, string comparison
        if (!f.type || f.type == 1 || f.type == 4) {
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
          pattern = new RegExp('^' + pattern, 'im');
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

Filter.addSelection = function() {
  var text, type, node, sel = UA.getSelection(true);
  
  if (Filter.open() === false) {
    return;
  }
  
  if (typeof sel == 'string') {
    text = sel.trim();
  }
  else {
    node = sel.anchorNode.parentNode;
    text = sel.toString().trim();
    
    if ($.hasClass(node, 'name')) {
      type = 1;
    }
    else if ($.hasClass(node, 'postertrip')) {
      type = 0;
    }
    else if ($.hasClass(node, 'subject')) {
      type = 5;
    }
    else if ($.hasClass(node, 'posteruid') || $.hasClass(node, 'hand')) {
      type = 4;
    }
    else {
      type = 2;
    }
  }
  
  Filter.add(text, type);
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
<div class="extPanel reply"><div class="panelHeader">Filters &amp; Highlights Help\
<span><img alt="Close" title="Close" class="pointer" data-cmd="filters-help-close" src="'
+ Main.icons.cross + '"></span></div>\
<h4>Tripcode, Name and ID filters:</h4>\
<ul><li>Those use simple string comparison.</li>\
<li>Type them exactly as they appear on 4chan, including the exclamation mark for tripcode filters.</li>\
<li>Example: <code>!Ep8pui8Vw2</code></li></ul>\
<h4>Comment, Subject and E-mail filters:</h4>\
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
<li><code>red</code>, <code>#0f0</code>, <code>#00ff00</code>, <code>rgba( 34, 12, 64, 0.3)</code>, etc…</li></ul>\
<h4>Shortcut:</h4>\
<ul><li>If you have <code>Keyboard shortcuts</code> enabled, pressing <kbd>F</kbd> will add the selected text to your filters.</li></ul>';

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
    return false;
  }
  
  cnt = document.createElement('div');
  cnt.id = 'filtersMenu';
  cnt.className = 'UIPanel';
  cnt.style.display = 'none';
  cnt.setAttribute('data-cmd', 'filters-close');
  cnt.innerHTML = '\
<div class="extPanel reply"><div class="panelHeader">Filters &amp; Highlights\
<span><img alt="Help" class="pointer" title="Help" data-cmd="filters-help-open" src="'
+ Main.icons.help
+ '"><img alt="Close" title="Close" class="pointer" data-cmd="filters-close" src="'
+ Main.icons.cross + '"></span></div>\
<table><thead><tr>\
<th>Order</th>\
<th>On</th>\
<th>Pattern</th>\
<th>Type</th>\
<th>Color</th>\
<th>Hide</th>\
<th>Del</th>\
</tr></thead><tbody id="filter-list"></tbody><tfoot><tr><td colspan="7">\
<button data-cmd="filters-add">Add</button>\
<button class="right" data-cmd="filters-save">Save</button>\
</td></tr></tfoot></table></div>';
  
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
    this.closePalette();
    cnt.removeEventListener('click', this.onClick, false);
    document.body.removeChild(cnt);
  }
};

Filter.moveUp = function(el) {
  var prev;
  
  if (prev = el.previousElementSibling) {
    el.parentNode.insertBefore(el, prev);
  }
};

Filter.add = function(pattern, type) {
  var filter, id, el;
  
  filter = {
    active: true,
    type: type || 0,
    pattern: pattern || '', 
    color: '',
    hide: false
  };
  
  id = this.getNextFilterId();
  el = this.buildEntry(filter, id);
  
  $.id('filter-list').appendChild(el);
  $.cls('fPattern', el)[0].focus();
};

Filter.remove = function(tr) {
  $.id('filter-list').removeChild(tr);
};

Filter.save = function() {
  var i, rawFilters, entries, tr, f, color;
  
  rawFilters = [];
  entries = $.id('filter-list').children;
  
  for (i = 0; tr = entries[i]; ++i) {
    f = {
      active: tr.children[1].firstChild.checked,
      pattern: tr.children[2].firstChild.value,
      type: tr.children[3].firstChild.selectedIndex,
      hide: tr.children[5].firstChild.checked
    }
    
    color = tr.children[4].firstChild;
    
    if (!color.hasAttribute('data-nocolor')) {
      f.color = color.style.backgroundColor;
    }
    
    rawFilters.push(f);
  }

  
  if (rawFilters[0]) {
    localStorage.setItem('4chan-filters', JSON.stringify(rawFilters));
  }
  else {
    localStorage.removeItem('4chan-filters');
  }
};

Filter.getNextFilterId = function() {
  var i, j, max, entries = $.id('filter-list').children;
  
  if (!entries.length) {
    return 0;
  }
  else {
    max = 0;
    for (i = 0; j = entries[i]; ++i) {
      j = +j.id.slice(7);
      if (j > max) {
        max = j;
      }
    }
    return max + 1;
  }
};

Filter.buildEntry = function(filter, id) {
  var tr, html, sel;
  
  tr = document.createElement('tr');
  tr.id = 'filter-' + id;
  
  html = '';
  
  // Move up
  html += '<td><span data-cmd="filters-up" class="pointer">&uarr;</span></td>';
  
  // On
  html += '<td><input type="checkbox"'
    + (filter.active ? ' checked="checked"></td>' : '></td>');
  
  // Pattern
  html += '<td><input class="fPattern" type="text" value="'
    + filter.pattern.replace(/"/g, '&quot;') + '"></td>';
  
  // Type
  sel = [ '', '', '', '', '', '' ];
  sel[filter.type] = ' selected="selected"';
  html += '<td><select size="1"><option value="0"'
    + sel[0] + '>Tripcode</option><option value="1"'
    + sel[1] + '>Name</option><option value="2"'
    + sel[2] + '>Comment</option><option value="3"'
    + sel[3] + '>E-mail</option><option value="4"'
    + sel[4] + '>ID</option><option value="5"'
    + sel[5] + '>Subject</option></select></td>';
  
  // Color
  html += '<td><span data-cmd="filters-palette" title="Change Color" class="colorbox fColor" ';
  
  if (!filter.color) {
    html += ' data-nocolor="1">&#x2215;';
  }
  else {
    html += ' style="background-color:' + filter.color + '">';
  }
  html += '</span></td>';
  
  // Hide
  html += '<td><input type="checkbox"'
    + (filter.hide ? ' checked="checked"></td>' : '></td>');
  
  // Del
  html += '<td><span data-cmd="filters-del" class="pointer fDel">&times;</span></td>';
  
  tr.innerHTML = html;
  
  return tr;
}

Filter.buildPalette = function(id) {
  var i, j, cnt, html, colors, rowCount, colCount;
  
  colors = [
    ['#E0B0FF', '#F2F3F4', '#7DF9FF', '#FFFF00'],
    ['#FBCEB1', '#FFBF00', '#ADFF2F', '#0047AB'],
    ['#00A550', '#007FFF', '#AF0A0F', '#B5BD68']
  ];
  
  rowCount = colors.length;
  colCount = colors[0].length;
  
  html = '<div id="colorpicker" class="reply extPanel"><table><tbody>';
  
  for (i = 0; i < rowCount; ++i) {
    html += '<tr>'
    for (j = 0; j < colCount; ++j) {
      html += '<td><div data-cmd="palette-pick" class="colorbox" style="background:'
        + colors[i][j] + '"></div></td>';
    }
    html += '</tr>'
  }
  
  html += '</tbody></table>Custom\
<div id="palette-custom"><input id="palette-custom-input" type="text">\
<div id="palette-custom-ok" data-cmd="palette-pick" title="Select Color" class="colorbox"></div></div>\
[<a href="javascript:;" data-cmd="palette-close">Close</a>]\
[<a href="javascript:;" data-cmd="palette-clear">Clear</a>]</div>';
  
  cnt = document.createElement('div');
  cnt.id = 'filter-palette';
  cnt.setAttribute('data-target', id);
  cnt.className = 'UIMenu';
  cnt.innerHTML = html;
  
  return cnt;
};

Filter.openPalette = function(target) {
  var el, pos, id, picker;
  
  Filter.closePalette();
  
  pos = target.getBoundingClientRect();
  id = target.parentNode.parentNode.id.slice(7);
  
  el = Filter.buildPalette(id);
  document.body.appendChild(el);
  
  $.id('filter-palette').addEventListener('click', Filter.onPaletteClick, false);
  $.id('palette-custom-input').addEventListener('keyup', Filter.setCustomColor, false);
  
  picker = el.firstElementChild;
  picker.style.cssText = 'top:' + pos.top + 'px;left:'
    + (pos.left - picker.clientWidth - 10) + 'px;';
};

Filter.closePalette = function() {
  var el;
  
  if (el = $.id('filter-palette')) {
    $.id('filter-palette').removeEventListener('click', Filter.onPaletteClick, false);
    $.id('palette-custom-input').removeEventListener('keyup', Filter.setCustomColor, false);
    el.parentNode.removeChild(el);
  }
};

Filter.pickColor = function(el, clear) {
  var id, target;
  
  id = $.id('filter-palette').getAttribute('data-target');
  target = $.id('filter-' + id);
  
  if (!target) {
    return;
  }
  
  target = $.cls('colorbox', target)[0];
  
  if (clear === true) {
    target.setAttribute('data-nocolor', '1');
    target.innerHTML = '&#x2215;';
    target.style.background = '';
  }
  else {
    target.removeAttribute('data-nocolor');
    target.innerHTML = '';
    target.style.background = el.style.backgroundColor;
  }
  
  Filter.closePalette();
};

Filter.setCustomColor = function() {
  var input, box;
  
  input = $.id('palette-custom-input');
  box = $.id('palette-custom-ok');
  
  box.style.backgroundColor = input.value;
};

/**
 * ID colors
 */
var IDColor = {
  css: 'padding: 0 5px; border-radius: 6px; font-size: 0.8em;',
  boards: { q: true, b: true, soc: true },
  ids: {}
};

IDColor.init = function() {
  var style;
  
  if (this.boards[Main.board]) {
    this.enabled = true;
    
    style = document.createElement('style');
    style.setAttribute('type', 'text/css');
    style.textContent = '.posteruid .hand {' + this.css + '}';
    document.head.appendChild(style);
  }
};

IDColor.compute = function(str) {
  var rgb, hash;
  
  rgb = [];
  hash = $.hash(str);
  
  rgb[0] = (hash >> 24) & 0xFF;
  rgb[1] = (hash >> 16) & 0xFF;
  rgb[2] = (hash >> 8) & 0xFF;
  rgb[3] = ((rgb[0] * 0.299) + (rgb[1] * 0.587) + (rgb[2] * 0.114)) > 125;
  
  this.ids[str] = rgb;
  
  return rgb;
};

IDColor.apply = function(uid) {
  var rgb;
  
  rgb = IDColor.ids[uid.textContent] || IDColor.compute(uid.textContent);
  uid.style.cssText = '\
    background-color: rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ');\
    color: ' + (rgb[3] ? 'black;' : 'white;');
};

IDColor.applyRemote = function(uid) {
  this.apply(uid);
  uid.style.cssText += this.css;
};

/**
 * Media
 */
var Media = {};

Media.init = function() {
  this.matchSC = /(?:soundcloud\.com|snd\.sc)\/[^\s<]+(?:<wbr>)?[^\s<]*/g;
  this.matchYT = /(?:youtube\.com\/watch\?[^\s]*?v=|youtu\.be\/)[^\s<]+(?:<wbr>)?[^\s<]*(?:<wbr>)?[^\s<]*/g;
  this.toggleYT = /(?:v=|\.be\/)([a-zA-Z0-9_-]{11})/;
  this.timeYT = /#t=([ms0-9]+)]/;
};

Media.parseSoundCloud = function(msg) {
  msg.innerHTML = msg.innerHTML.replace(this.matchSC, this.replaceSoundCloud);
};

Media.replaceSoundCloud = function(link) {
  return '<span>' + link + '</span> [<a href="javascript:;" data-cmd="embed" data-type="sc">Embed</a>]';
};

Media.toggleSoundCloud = function(node) {
  var xhr, url;
  
  if (node.textContent == 'Remove') {
    node.parentNode.removeChild(node.nextElementSibling);
    node.textContent = 'Embed';
  }
  else if (node.textContent == 'Embed') {
    url = node.previousElementSibling.textContent;
    
    xhr = new XMLHttpRequest();
    xhr.open('GET', '//soundcloud.com/oembed?show_artwork=false&'
      + 'maxwidth=500px&show_comments=false&format=json&url='
      + 'http://' + url);
    xhr.onload = function() {
      var el;
      
      if (this.status == 200 || this.status == 304) {
        el = document.createElement('div');
        el.className = 'media-embed';
        el.innerHTML = JSON.parse(this.responseText).html;
        node.parentNode.insertBefore(el, node.nextElementSibling);
        node.textContent = 'Remove';
      }
      else {
        node.textContent = 'Error';
        console.log('SoundCloud Error (HTTP ' + this.status + ')');
      }
    };
    node.textContent = 'Loading...';
    xhr.send(null);
  }
};

Media.parseYouTube = function(msg) {
  msg.innerHTML = msg.innerHTML.replace(this.matchYT, this.replaceYouTube);
};

Media.replaceYouTube = function(link) {
  return '<span>' + link + '</span> [<a href="javascript:;" data-cmd="embed" data-type="yt">Embed</a>]';
};

Media.toggleYouTube = function(node) {
  var vid, time, el, url;
  
  if (node.textContent == 'Remove') {
    node.parentNode.removeChild(node.nextElementSibling);
    node.textContent = 'Embed';
  }
  else {
    url = node.previousElementSibling.textContent;
    vid = url.match(this.toggleYT);
    time = url.match(this.timeYT);
    
    if (vid && (vid = vid[1])) {
      vid = encodeURIComponent(vid);
      
      if (time && (time = time[1])) {
        vid += '#t=' + encodeURIComponent(time);
      }
      
      el = document.createElement('div');
      el.className = 'media-embed';
      el.innerHTML = '<iframe src="//www.youtube.com/embed/'
        + vid
        + '" width="640" height="360" frameborder="0"></iframe>'
      
      node.parentNode.insertBefore(el, node.nextElementSibling);
      
      node.textContent = 'Remove';
    }
    else {
      node.textContent = 'Error';
    }
  }
};

Media.toggleEmbed = function(node) {
  if (node.getAttribute('data-type') == 'yt') {
    Media.toggleYouTube(node);
  }
  else {
    Media.toggleSoundCloud(node);
  }
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
<div class="extPanel reply"><div class="panelHeader">Custom CSS\
<span><img alt="Close" title="Close" class="pointer" data-cmd="css-close" src="'
+ Main.icons.cross + '"></span></div>\
<textarea id="customCSSBox">'
+ (localStorage.getItem('4chan-css') || '') + '</textarea>\
<div class="center"><button data-cmd="css-save">Save CSS</button></div>\
</td></tr></tfoot></table></div>';
  
  document.body.appendChild(cnt);
  cnt.addEventListener('click', this.onClick, false);
  $.id('customCSSBox').focus();
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
 * Keyboard shortcuts
 */
var Keybinds = {};

Keybinds.init = function() {
  this.map = {
    // A
    65: function() {
      if (ThreadUpdater.enabled) ThreadUpdater.toggleAuto();
    },
    // F
    70: function() {
      if (Config.filter) {
        Filter.addSelection();
      }
    },
    // Q
    81: function() {
      if (QR.enabled && Main.tid) {
        QR.quotePost(Main.tid);
      }
    },
    // R
    82: function() {
      if (ThreadUpdater.enabled) ThreadUpdater.forceUpdate();
    },
    // W
    87: function() {
      if (Config.threadWatcher && Main.tid) ThreadWatcher.toggle(Main.tid);
    },
    // B
    66: function() {
      var el;
      (el = $.cls('prev')[0]) && (el = $.tag('form', el)[0]) && el.submit();
    },
    // C
    67: function() {
      location.href = '/' + Main.board + '/catalog';
    },
    // N
    78: function() {
      var el;
      (el = $.cls('next')[0]) && (el = $.tag('form', el)[0]) && el.submit();
    },
    // I
    73: function() {
      location.href = '/' + Main.board + '/';
    }
  };
  
  document.addEventListener('keydown', this.resolve, false);
};

Keybinds.resolve = function(e) {
  var bind, el = e.target;
  
  if (el.nodeName == 'TEXTAREA' || el.nodeName == 'INPUT') {
    return;
  }
  
  bind = Keybinds.map[e.keyCode];
  
  if (bind && !e.altKey && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
    e.preventDefault();
    e.stopPropagation();
    bind();
  }
};

Keybinds.open = function() {
  var cnt;
  
  if ($.id('keybindsHelp')) {
    return;
  }
  
  cnt = document.createElement('div');
  cnt.id = 'keybindsHelp';
  cnt.className = 'UIPanel';
  cnt.setAttribute('data-cmd', 'keybinds-close');
  cnt.innerHTML = '\
<div class="extPanel reply"><div class="panelHeader">Keyboard Shortcuts\
<span><img data-cmd="keybinds-close" class="pointer" alt="Close" title="Close" src="'
+ Main.icons.cross + '"></span></div>\
<ul>\
<li><strong>Global</strong></li>\
<li><kbd>A</kbd> &mdash; Toggle auto-updater</li>\
<li><kbd>Q</kbd> &mdash; Open Quick Reply</li>\
<li><kbd>R</kbd> &mdash; Update thread</li>\
<li><kbd>W</kbd> &mdash; Watch/Unwatch thread</li>\
<li><kbd>B</kbd> &mdash; Previous page</li>\
<li><kbd>N</kbd> &mdash; Next page</li>\
<li><kbd>I</kbd> &mdash; Return to index</li>\
<li><kbd>C</kbd> &mdash; Open catalog</li>\
<li><kbd>F</kbd> &mdash; Filter selected text</li>\
</ul><ul>\
<li><strong>Quick Reply (always enabled)</strong></li>\
<li><kbd>Ctrl + Click</kbd> the post number &mdash; Quote without linking</li>\
<li><kbd>Ctrl + S</kbd> &mdash; Spoiler tags</li>\
<li><kbd>Esc</kbd> &mdash; Close the Quick Reply</li>\
</ul>';

  document.body.appendChild(cnt);
  cnt.addEventListener('click', this.onClick, false);
};

Keybinds.close = function() {
  var cnt;
  
  if (cnt = $.id('keybindsHelp')) {
    cnt.removeEventListener('click', this.onClick, false);
    document.body.removeChild(cnt);
  }
};

Keybinds.onClick = function(e) {
  var cmd;
  
  if ((cmd = e.target.getAttribute('data-cmd')) && cmd == 'keybinds-close') {
    Keybinds.close();
  }
};

/**
 * Reporting
 */
var Report = {};

Report.onDone = function(e) {
  var id;
  
  if (e.origin === 'https://sys.4chan.org' && /^done-report/.test(e.data)) {
    if (Report.cnt) {
      Report.close();
    }
    
    id = e.data.split('-')[2];
    
    if (Config.threadHiding && $.id('t' + id)) {
      if (!ThreadHiding.isHidden(id)) {
        ThreadHiding.hide(id);
        ThreadHiding.save();
      }
      
      return;
    }
    
    if (Config.replyHiding && $.id('p' + id)) {
      if (!ReplyHiding.isHidden(id)) {
        ReplyHiding.hide(id);
        ReplyHiding.save();
      }
      
      return;
    }
  }
};

Report.open = function(pid) {
  if (Config.inlineReport) {
    this.openInline(pid);
  }
  else {
    this.openPopup(pid);
  }
};

Report.openPopup = function(pid) {
  window.open('https://sys.4chan.org/'
    + Main.board + '/imgboard.php?mode=report&no=' + pid
    , Date.now(),
    "toolbar=0,scrollbars=0,location=0,status=1,menubar=0,resizable=1,width=600,height=170");
};

Report.openInline = function(pid) {
  if (this.cnt) {
    this.close();
  }
  
  this.cnt = document.createElement('div');
  this.cnt.id = 'quickReport';
  this.cnt.className = 'extPanel reply';
  this.cnt.setAttribute('data-trackpos', 'QRep-position');
  
  if (Config['QRep-position']) {
    this.cnt.style.cssText = Config['QRep-position'];
  }
  else {
    this.cnt.style.right = '0px';
    this.cnt.style.top = '50px';
  }
  
  this.cnt.innerHTML =
    '<div id="qrepHeader" class="drag postblock">Report Post No.' + pid
    + '<img alt="X" src="' + Main.icons.cross + '" id="qrepClose" '
    + 'class="extButton" title="Close Window"></div>'
    + '<iframe src="https://sys.4chan.org/' + Main.board
    + '/imgboard.php?mode=report&no=' + pid
    + '" width="610" height="170" frameborder="0"></iframe>';
  
  document.body.appendChild(this.cnt);
  
  window.addEventListener('message', Report.onDone, false);
  document.addEventListener('keydown', Report.onKeyDown, false);
  
  $.id('qrepClose').addEventListener('click', Report.close, false);
  Draggable.set($.id('qrepHeader'));
};

Report.close = function() {
  window.removeEventListener('message', Report.onDone, false);
  document.removeEventListener('keydown', Report.onKeyDown, false);
  Draggable.unset($.id('qrepHeader'));
  $.id('qrepClose').removeEventListener('click', Report.close, false);
  document.body.removeChild(Report.cnt);
  Report.cnt = null;
};

Report.onKeyDown = function(e) {
  if (e.keyCode == 27 && !e.ctrlkey && !e.altkey && !e.shiftkey && !e.metakey) {
    Report.close();
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
      self.scrollX = window.pageXOffset;
      self.scrollY = window.pageYOffset;
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
      style.left = '0';
      style.right = '';
    }
    else if (Draggable.right < left) {
      style.left = '';
      style.right = '0';
    }
    else {
      style.left = (left / document.documentElement.clientWidth * 100) + '%';
      style.right = '';
    }
    if (top < 1) {
      style.top = '0';
      style.bottom = '';
    }
    else if (Draggable.bottom < top) {
      style.bottom = '0';
      style.top = '';
    }
    else {
      style.top = (top / document.documentElement.clientHeight * 100) + '%';
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
  
  this.hasFormData = 'FormData' in window;
  
  this.hasDragAndDrop = false; /*'draggable' in document.createElement('div');*/
};

UA.dispatchEvent = function(name, detail) {
  var e = document.createEvent('Event');
  e.initEvent(name, false, false);
  if (detail) {
    e.detail = detail;
  }
  document.dispatchEvent(e);
};

UA.getSelection = function(raw) {
  var sel;
  
  if (UA.isOpera && typeof (sel = document.getSelection()) == 'string') {}
  else {
    sel = window.getSelection();
    
    if (!raw) {
      sel = sel.toString();
    }
  }
  
  return sel;
};

/**
 * Config
 */
var Config = {
  quotePreview: true,
  backlinks: true,
  quickReply: true,
  threadUpdater: true,
  threadHiding: true,
  pageTitle: true,
  hideGlobalMsg: true,
  
  topPageNav: false,
  threadWatcher: false,
  imageExpansion: false,
  threadExpansion: false,
  imageSearch: false,
  reportButton: false,
  localTime: false,
  stickyNav: false,
  keyBinds: false,
  inlineQuotes: false,

  filter: false,
  revealSpoilers: false,
  replyHiding: false,
  imageHover: false,
  threadStats: false,
  IDColor: false,
  downloadFile: false,
  inlineReport: false,
  noPictures: false,
  embedYouTube: false,
  embedSoundCloud: false,
  updaterSound: false,

  customCSS: false,
  autoScroll: false,
  hideStubs: false,
  compactThreads: false,
  dropDownNav: false,
  fixedThreadWatcher: false,
  persistentQR: false,
  
  disableAll: false
};

Config.load = function() {
  if (storage = localStorage.getItem('4chan-settings')) {
    storage = JSON.parse(storage);
    $.extend(Config, storage);
  }
  else {
    Main.firstRun = true;
  }
};

Config.loadFromURL = function() {
  var cmd, data;
  
  cmd = location.href.split('=', 2);
  
  if (/#cfg$/.test(cmd[0])) {
    try {
      data = JSON.parse(decodeURIComponent(cmd[1]));
      history.replaceState(null, '', location.href.split('#', 1)[0]);
      $.extend(Config, JSON.parse(data.settings));
      Config.save();
      if (data.filters) {
        localStorage.setItem('4chan-filters', data.filters);
      }
      if (data.css) {
        localStorage.setItem('4chan-css', data.css);
      }
      return true;
    }
    catch (e) {
      console.log(e);
    }
  }
  
  return false;
};

Config.toURL = function() {
  var data, cfg = {};
  
  cfg.settings = localStorage.getItem('4chan-settings');
  
  if (data = localStorage.getItem('4chan-filters')) {
    cfg.filters = data;
  }
  
  if (data = localStorage.getItem('4chan-css')) {
    cfg.css = data;
  }
  
  return encodeURIComponent(JSON.stringify(cfg));
};

Config.save = function() {
  localStorage.setItem('4chan-settings', JSON.stringify(Config));
};

/**
 * Settings menu
 */
var SettingsMenu = {};

SettingsMenu.options = {
  'Quotes': {
    quotePreview: [ 'Quote preview', 'Enable inline quote previews', true ],
    backlinks: [ 'Backlinks', 'Show who has replied to a post' ],
    inlineQuotes: [ 'Inline quote links', 'Clicking quote links will inline expand the quoted post, shift-clicking bypasses the inlining' ]
  },
  'Posting': {
    quickReply: [ 'Quick reply', 'Enable inline reply box', true ],
    persistentQR: [ 'Persistent quick reply', 'Keep quick reply window open after posting' ]
  },
  'Monitoring': {
    threadUpdater: [ 'Thread updater', 'Enable inline thread updating', true ],
    autoScroll: [ 'Auto-scroll with auto-updated posts', 'Automatically scroll the page as new posts are added' ],
    updaterSound: [ 'Sound notification', 'Play a sound when somebody replies to your posts' ],
    threadWatcher: [ 'Thread watcher', 'Enable thread watcher' ],
    fixedThreadWatcher: [ 'Pin thread watcher', 'Pin the thread watcher to the page' ],
    threadStats: [ 'Thread statistics', 'Display post and image counts at the top and bottom right of the page' ],
    pageTitle: [ 'Excerpts in page title', 'Show post subjects or comment excerpts in page title' ]
  },
  'Filtering': {
    filter: [ 'Filters &amp; Highlights [<a href="javascript:;" data-cmd="filters-open">Edit</a>]', 'Enable pattern-based filters' ],
    threadHiding: [ 'Thread hiding [<a href="javascript:;" data-cmd="thread-hiding-clear">Clear</a>]', 'Enable thread hiding', true ],
    replyHiding: [ 'Reply hiding', 'Enable reply hiding' ],
    hideStubs: [ 'Hide thread stubs', "Don't display stubs of hidden threads" ]
  },
  'Images': {
    imageExpansion: [ 'Image expansion', 'Enable inline image expansion, limited to browser width' ],
    imageHover: [ 'Image hover', 'Expand images on hover, limited to browser size' ],
    imageSearch: [ 'Image search', 'Add Google and iqdb image search buttons next to image posts' ],
    downloadFile: [ 'Download original', 'Adds a button to download image with original filename (Chrome only)'],
    revealSpoilers: [ "Don't spoiler images", 'Don\'t replace spoiler images with a placeholder and show filenames' ],
    noPictures: [ 'Hide thumbnails', 'Don\'t display thumbnails while browsing']
  },
  'Navigation': {
    threadExpansion: [ 'Thread expansion', 'Enable inline thread expansion', true ],
    topPageNav: [ 'Page navigation at top of page', 'Show the page switcher at the top of the page, hold Shift and drag to move' ],
    dropDownNav: [ 'Use drop-down navigation', 'Use persistent drop-down navigation bar instead of traditional links' ],
    stickyNav: [ 'Navigation arrows', 'Show top and bottom navigation arrows, hold Shift and drag to move' ],
    keyBinds: [ 'Use keyboard shortcuts [<a href="javascript:;" data-cmd="keybinds-open">Show</a>]', 'Enable handy keyboard shortcuts for common actions' ]
  },
  'Media': {
    embedYouTube: [ 'Embed YouTube links', 'Embed YouTube player into replies' ],
    embedSoundCloud: [ 'Embed SoundCloud links', 'Embed SoundCloud player into replies' ]
  },
  'Other': {
    customCSS: [ 'Custom CSS [<a href="javascript:;" data-cmd="css-open">Edit</a>]', 'Embed your own CSS rules', true ],
    hideGlobalMsg: [ 'Enable announcement hiding', 'Enable announcement hiding (will reset on new or updated announcements)' ],
    IDColor: [ 'Color user IDs', 'Assign unique colors to user IDs on boards that use them' ],
    compactThreads: [ 'Force long posts to wrap', 'Long posts will wrap at 75% screen width' ],
    reportButton: [ 'Report button', 'Add a report button next to posts for easy reporting' ],
    inlineReport: [ 'Inline report panel', 'Open report panel in browser window, instead of a popup'],
    localTime: [ 'Convert dates to local time', 'Convert 4chan server time (US Eastern Time) to your local time' ]
  }
};

SettingsMenu.presets = {
  'Essential': {
    quotePreview: 1,
    backlinks: 1,
    quickReply: 1,
    threadUpdater: 1,
    threadHiding: 1,
    pageTitle: 1,
    hideGlobalMsg: 1
  },
  'Recommended': {
    quotePreview: 1,
    backlinks: 1,
    quickReply: 1,
    threadUpdater: 1,
    threadHiding: 1,
    pageTitle: 1,
    hideGlobalMsg: 1,
    topPageNav: 1,
    threadWatcher: 1,
    imageExpansion: 1,
    threadExpansion: 1,
    imageSearch: 1,
    reportButton: 1,
    localTime: 1,
    topPageNav: 1,
    stickyNav: 1,
    keyBinds: 1
  },
  'Advanced': {
    topPageNav: 1,
    quotePreview: 1,
    backlinks: 1,
    quickReply: 1,
    threadUpdater: 1,
    threadHiding: 1,
    pageTitle: 1,
    hideGlobalMsg: 1,
    topPageNav: 1,
    threadWatcher: 1,
    imageExpansion: 1,
    threadExpansion: 1,
    imageSearch: 1,
    reportButton: 1,
    localTime: 1,
    topPageNav: 1,
    stickyNav: 1,
    keyBinds: 1,
    filter: 1,
    revealSpoilers: 1,
    replyHiding: 1,
    inlineQuotes: 1,
    imageHover: 1,
    threadStats: 1,
    IDColor: 1,
    downloadFile: 1,
    inlineReport: 1,
    noPictures: 1,
    embedYouTube: 1,
    embedSoundCloud: 1
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
  var i, cat, categories, key, html, cnt, opts, mobileOpts, el;
  
  if (Main.firstRun) {
    if (el = $.id('settingsTip')) {
      el.parentNode.removeChild(el);
    }
    if (el = $.id('settingsTipBottom')) {
      el.parentNode.removeChild(el);
    }
    Config.save();
  }
  
  cnt = document.createElement('div');
  cnt.id = 'settingsMenu';
  cnt.className = 'UIPanel';
  
  html = '<div class="extPanel reply"><div class="panelHeader">Settings'
    + '<span><img alt="Close" title="Close" class="pointer" data-cmd="settings-toggle" src="'
    + Main.icons.cross + '"></a>'
    + '</span></div><ul>';
  
  if (Main.hasMobileLayout) {
    categories = {};
    for (cat in SettingsMenu.options) {
      mobileOpts = {};
      opts = SettingsMenu.options[cat];
      for (key in opts) {
        if (opts[key][2]) {
          mobileOpts[key] = opts[key];
        }
      }
      for (i in mobileOpts) {
        categories[cat] = mobileOpts;
        break;
      }
    }
  }
  else {
    html += '<ul><li class="settings-cat">Presets <select id="settings-presets" size="1">';
    
    categories = SettingsMenu.presets;
    
    for (cat in categories) {
      html += '<option value="' + cat + '">' + cat + '</option>';
    }
    
    html += '</select></li></ul>';
    
    categories = SettingsMenu.options;
  }
  
  for (cat in categories) {
    opts = categories[cat];
    html += '<ul><li class="settings-cat">' + cat + '</li>';
    for (key in opts) {
      html += '<li><label'
        + (opts[key][1] ? ' title="' + opts[key][1] + '">' : '>')
        + '<input type="checkbox" class="menuOption" data-option="'
        + key + '"' + (Config[key] ? ' checked="checked">' : '>')
        + opts[key][0] + '</label></li>';
    }
    html += '</ul>';
  }
  
  html += '</ul><ul><li>'
    + '<label title="Completely disable the extension (overrides any checked boxes)">'
    + '<input type="checkbox" class="menuOption" data-option="disableAll"'
    + (Config.disableAll ? ' checked="checked">' : '>')
    + 'Disable the extension</label></li></ul>'
    + '<div class="center"><button data-cmd="settings-export">Export</button>'
    + '<button data-cmd="settings-save">Save</button></div>';
  
  cnt.innerHTML = html;
  cnt.addEventListener('click', SettingsMenu.onClick, false);
  document.body.appendChild(cnt);
  SettingsMenu.matchPreset();
  $.id('settings-presets').addEventListener('change', SettingsMenu.onPresetChange, false);
  (el = $.cls('menuOption', cnt)[0]) && el.focus();
};

SettingsMenu.matchPreset = function() {
  var i, id, el, opts, cat, nodes, preset, skip, select;
  
  nodes = $.cls('menuOption', $.id('settingsMenu'));
  preset = id = -1;
  
  for (cat in this.presets) {
    ++id;
    skip = false;
    opts = this.presets[cat];
    for (i = 0; el = nodes[i]; ++i) {
      if (!!opts[el.getAttribute('data-option')] != el.checked) {
        skip = true;
        break;
      }
    }
    if (!skip) {
      preset = id;
    }
  }
  
  select = $.id('settings-presets');
  
  if (el = $.id('custom-set')) {
    select.removeChild(el);
  }
  
  if (preset == -1) {
    el = document.createElement('option');
    el.id = 'custom-set';
    el.textContent = 'Custom';
    select.appendChild(el);
    select.selectedIndex = select.options.length - 1;
  }
  else {
    select.selectedIndex = preset;
  }
  
  return preset;
};

SettingsMenu.showExport = function() {
  var cnt, str, el;
  
  if ($.id('exportSettings')) {
    return;
  }
  
  str = location.href.replace(location.hash, '') + '#cfg=' + Config.toURL();
  
  cnt = document.createElement('div');
  cnt.id = 'exportSettings';
  cnt.className = 'UIPanel';
  cnt.setAttribute('data-cmd', 'export-close');
  cnt.innerHTML = '\
<div class="extPanel reply"><div class="panelHeader">Export Settings\
<span><img data-cmd="export-close" class="pointer" alt="Close" title="Close" src="'
+ Main.icons.cross + '"></span></div>\
<p class="center">Copy and save the URL below, and visit it from another \
browser or computer to restore your settings.</p>\
<p class="center">\
<input class="export-field" type="text" readonly="readonly" value="' + str + '"></p>\
<p style="margin-top:15px" class="center">Alternatively, you can drag the link below into your \
bookmarks bar and click it to restore.</p>\
<p class="center">[<a target="_blank" href="'
+ str + '">Restore 4chan Settings</a>]</p>';

  document.body.appendChild(cnt);
  cnt.addEventListener('click', this.onExportClick, false);
  el = $.cls('export-field', cnt)[0];
  el.focus();
  el.select();
};

SettingsMenu.closeExport = function() {
  var cnt;
  
  if (cnt = $.id('exportSettings')) {
    cnt.removeEventListener('click', this.onExportClick, false);
    document.body.removeChild(cnt);
  }
};

SettingsMenu.onExportClick = function(e) {
  var el;
  
  if (e.target.id == 'exportSettings') {
    e.preventDefault();
    e.stopPropagation();
    SettingsMenu.closeExport();
  }
};

SettingsMenu.onPresetChange = function() {
  var i, j, el, preset, opts, cb, checked;
  
  if (el = $.id('custom-set')) {
    el.parentNode.removeChild(el);
  }
  
  el = $.id('settings-presets');
  preset = el.options[el.selectedIndex].value;
  opts = $.cls('menuOption');
  
  for (i = 0; cb = opts[i]; ++i) {
    cb.checked = !!SettingsMenu.presets[preset][cb.getAttribute('data-option')];
  }
};

SettingsMenu.onClick = function(e) {
  var el, t, i, j;
  
  t = e.target;
  if ($.hasClass(t, 'menuOption')) {
    SettingsMenu.matchPreset();
  }
  else if (t.id == 'settingsMenu' && (el = $.id('settingsMenu'))) {
    e.preventDefault();
    e.stopPropagation();
    SettingsMenu.close(el);
  }
};

SettingsMenu.close = function(el) {
  if (el = (el || $.id('settingsMenu'))) {
    el.removeEventListener('click', SettingsMenu.onClick, false);
    if (!Main.hasMobileLayout) {
      $.id('settings-presets').removeEventListener('change', SettingsMenu.onPresetChange, false);
    }
    document.body.removeChild(el);
  }
};

/**
 * Main
 */
var Main = {};

Main.init = function() {
  var params;
  
  document.addEventListener('DOMContentLoaded', Main.run, false);
  
  Main.now = Date.now();
  
  UA.init();
  
  Config.load();
  
  if (Main.firstRun && Config.loadFromURL()) {
    Main.firstRun = false;
  }
  
  if (Main.stylesheet = Main.getCookie(style_group)) {
    Main.stylesheet = Main.stylesheet.toLowerCase().replace(/ /g, '_');
  }
  else {
    Main.stylesheet =
      style_group == 'nws_style' ? 'yotsuba_new' : 'yotsuba_b_new';
  }
  
  Main.passEnabled = Main.getCookie('pass_enabled');
  QR.noCaptcha = QR.noCaptcha || Main.passEnabled;
  
  Main.initIcons();
  
  Main.addCSS();
  
  Main.type = style_group.split('_')[0];
  
  params = location.pathname.split(/\//);
  Main.board = params[1];
  Main.tid = params[3];
  
  if (Config.IDColor) {
    IDColor.init();
  }
  
  if (Config.customCSS) {
    CustomCSS.init();
  }
  
  if (Config.keyBinds) {
    Keybinds.init();
  }
  
  UA.dispatchEvent('4chanMainInit');
};

Main.run = function() {
  var thread;
  
  document.removeEventListener('DOMContentLoaded', Main.run, false);
  
  document.addEventListener('click', Main.onclick, false);
  
  $.id('settingsWindowLink').addEventListener('click', SettingsMenu.toggle, false);
  $.id('settingsWindowLinkBot').addEventListener('click', SettingsMenu.toggle, false);
  $.id('settingsWindowLinkMobile').addEventListener('click', SettingsMenu.toggle, false);
  
  if (Config.disableAll) {
    return;
  }
  
  Main.hasMobileLayout = (el = $.id('refresh_top')) && el.offsetWidth > 0;
  Main.isMobileDevice = /Mobile|Android|Dolfin|Opera Mobi|PlayStation Vita|Nintendo DS/.test(navigator.userAgent);
  
  if (Main.firstRun && Main.isMobileDevice) {
    Config.topPageNav = false;
    Config.dropDownNav = true;
  }
  
  if (Config.dropDownNav && !Main.hasMobileLayout) {
    $.id('boardNavDesktop').style.display = 'none';
    $.id('boardNavDesktopFoot').style.display = 'none';
    $.removeClass($.id('boardNavMobile'), 'mobile');
    $.addClass(document.body, 'hasDropDownNav');
  }
  else if (Main.firstRun) {
    Main.onFirstRun();
  }
  
  $.addClass(document.body, Main.stylesheet);
  $.addClass(document.body, Main.type);
  
  if (Config.compactThreads) {
    $.addClass(document.body, 'compact');
  }
  
  if (Config.noPictures) {
    $.addClass(document.body, 'noPictures');
  }
  
  if (Config.quotePreview || Config.imageHover|| Config.filter) {
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
  
  if (Config.threadExpansion) {
    ThreadExpansion.init();
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
  
  if (Config.replyHiding) {
    ReplyHiding.init();
  }
  
  if (Config.quotePreview) {
    QuotePreview.init();
  }
  
  Parser.init();
  
  if (Main.tid) {
    Main.threadClosed = !document.forms.post;
    Main.threadSticky = !!$.cls('stickyIcon', $.id('pi' + Main.tid))[0];
    
    if (Config.threadStats) {
      ThreadStats.init();
    }
    
    if (Config.pageTitle) {
      Main.setTitle();
    }
    Parser.parseThread(Main.tid);
    if (Config.threadUpdater) {
      ThreadUpdater.init();
    }
  }
  else {
    Main.addCatalogTooltip();
  
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
  
  if (Config.quickReply) {
    QR.init();
  }
  
  if (Config.replyHiding) {
    ReplyHiding.purge();
  }
};

Main.onFirstRun = function() {
  var link, el;
  
  if (link = $.id('settingsWindowLink')) {
    this.addTooltip(link, null, 'settingsTip');
  }
  
  if (link = $.id('settingsWindowLinkBot')) {
    this.addTooltip(link, null, 'settingsTipBottom');
  }
}

Main.onCatalogClick = function() {
  var el = this.nextElementSibling;
  
  if (el && el.className == 'click-me') {
    el.parentNode.removeChild(el);
    this.removeEventListener('mousedown', Main.onCatalogClick, false);
    localStorage.setItem('catalog-visited', '1');
  }
};

Main.addCatalogTooltip = function() {
  var i, links, el;
  
  if (!localStorage.getItem('catalog-visited')) {
    links = $.cls('cataloglink');
    for (i = 0; el = links[i]; ++i) {
      el = el.firstElementChild;
      this.addTooltip(el, 'Try me!');
      el.addEventListener('mousedown', Main.onCatalogClick, false);
    }
  }
};

Main.addTooltip = function(link, message, id) {
  var el, pos;
  
  el = document.createElement('div');
  el.className = 'click-me';
  if (id) {
    el.id = id;
  }
  el.innerHTML = message || 'Click me!';
  link.parentNode.appendChild(el);
  
  pos = (link.offsetWidth - el.offsetWidth + link.offsetLeft - el.offsetLeft) / 2;
  el.style.marginLeft = pos + 'px';
  
  return el;
};

Main.isThreadClosed = function(tid) {
  return (el = $.id('pi' + tid)) && $.cls('closedIcon', el)[0];
};

Main.setThreadState = function(state, mode) {
  var cnt, el, ref, cap;
  
  cap = state.charAt(0).toUpperCase() + state.slice(1);
  
  if (mode) {
    cnt = $.cls('postNum', $.id('pi' + Main.tid))[0];
    el = document.createElement('img');
    el.className = state + 'Icon retina';
    el.title = cap;
    el.src = Main.icons2[state];
    if (state == 'sticky' && (ref = $.cls('closedIcon', cnt)[0])) {
      cnt.insertBefore(el, ref);
      cnt.insertBefore(document.createTextNode(' '), ref);
    }
    else {
      cnt.appendChild(document.createTextNode(' '));
      cnt.appendChild(el);
    }
  }
  else {
    el = $.cls(state + 'Icon', $.id('pi' + Main.tid))[0];
    el.parentNode.removeChild(el.previousSibling);
    el.parentNode.removeChild(el);
  }
  
  Main['thread' + cap] = mode;
};

Main.icons = {
  up: 'arrow_up.png',
  down: 'arrow_down.png',
  download: 'arrow_down2.png',
  refresh: 'refresh.png',
  cross: 'cross.png',
  gis: 'gis.png',
  iqdb: 'iqdb.png',
  minus: 'post_expand_minus.png',
  plus: 'post_expand_plus.png',
  rotate: 'post_expand_rotate.gif',
  quote: 'quote.png',
  report: 'report.png',
  notwatched: 'watch_thread_off.png',
  watched: 'watch_thread_on.png',
  help: 'question.png'
};

Main.icons2 = {
  closed: 'closed.gif',
  sticky: 'sticky.gif',
  trash: 'trash.gif'
},

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
  
  url = '//static.4chan.org/image/'
  
  if (window.devicePixelRatio >= 2) {
    for (key in Main.icons) {
      Main.icons[key] = Main.icons[key].replace('.', '@2x.');
    }
    for (key in Main.icons2) {
      Main.icons2[key] = Main.icons2[key].replace('.', '@2x.');
    }
  }
  
  for (key in Main.icons2) {
    Main.icons2[key] = url + Main.icons2[key];
  }
  
  url += 'buttons/' + paths[Main.stylesheet];
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
  var msg, btn, thisTs, oldTs;
  
  if ((msg = $.id('globalMessage')) && msg.textContent) {
    msg.nextElementSibling.style.clear = 'both';
    
    btn = document.createElement('img');
    btn.id = 'toggleMsgBtn';
    btn.className = 'extButton';
    btn.setAttribute('data-cmd', 'toggleMsg');
    btn.alt = 'Toggle';
    btn.title = 'Toggle announcement';
    
    oldTs = localStorage.getItem('4chan-global-msg');
    thisTs = msg.getAttribute('data-utc');
    
    if (oldTs && thisTs <= oldTs) {
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
    localStorage.removeItem('4chan-global-msg');
  }
  else {
    msg.style.display = 'none';
    btn.src = Main.icons.plus;
    btn.style.opacity = '0.5';
    localStorage.setItem('4chan-global-msg', msg.getAttribute('data-utc'));
  }
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
      title = 'No.' + Main.tid;
    }
  }
  
  document.title = '/' + Main.board + '/ - ' + title;
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
      return decodeURIComponent(c.substring(key.length, c.length));
    }
  }
  return null;
};

Main.onclick = function(e) {
  var t, cmd, tid;
  
  if ((t = e.target) == document) {
    return;
  }
  
  if (cmd = t.getAttribute('data-cmd')) {
    id = t.getAttribute('data-id');
    switch (cmd) {
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
        Report.open(id);
        break;
      case 'embed':
        Media.toggleEmbed(t);
        break
      case 'sound':
        ThreadUpdater.toggleSound();
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
      case 'keybinds-open':
        Keybinds.open();
        break;
      case 'filters-open':
        Filter.open();
        break;
      case 'thread-hiding-clear':
        ThreadHiding.clear();
        break;
      case 'css-open':
        CustomCSS.open();
        break;
      case 'settings-export':
        SettingsMenu.showExport();
        break;
      case 'export-close':
        SettingsMenu.closeExport();
        break;
    }
  }
  else if (!Config.disableAll) {
    if (QR.enabled && t.title == 'Quote this post') {
      e.preventDefault();
      tid = Main.tid || t.previousElementSibling.getAttribute('href').split('#')[0].slice(4);
      QR.quotePost(tid, !e.ctrlKey && t.textContent);
    }
    else if (Config.imageExpansion && e.which == 1 && t.parentNode
      && $.hasClass(t.parentNode, 'fileThumb')
      && t.parentNode.nodeName == 'A'
      && !$.hasClass(t.parentNode, 'deleted')) {
      e.preventDefault();
      ImageExpansion.toggle(t);
    }
    else if (Config.inlineQuotes && e.which == 1 && $.hasClass(t, 'quotelink')) {
      if (!e.shiftKey) {
        QuoteInline.toggle(t, e);
      }
      else {
        e.preventDefault();
        location = t.href;
      }
    }
    else if (Config.threadExpansion && t.parentNode && $.hasClass(t.parentNode, 'abbr')) {
      e.preventDefault();
      ThreadExpansion.expandComment(t);
    }
    else if (Main.isMobileDevice && Config.quotePreview) {
      if ($.id('quote-preview')) {
        QuotePreview.remove();
      }
      if ($.hasClass(t, 'quotelink')
        && (cmd = t.getAttribute('href').match(QuotePreview.regex))
        && cmd[1] != 'rs') {
        e.preventDefault();
      }
    }
  }
};

Main.onThreadMouseOver = function(e) {
  var t = e.target;
  
  if (Config.quotePreview
    && $.hasClass(t, 'quotelink')
    && !$.hasClass(t, 'deadlink')) {
    QuotePreview.resolve(e.target);
  }
  else if (Config.imageHover && t.hasAttribute('data-md5')
    && !$.hasClass(t.parentNode, 'deleted')) {
    ImageHover.show(t);
  }
  else if (Config.filter && t.hasAttribute('data-filtered')) {
    QuotePreview.show(t,
      t.href ? t.parentNode.parentNode.parentNode : t.parentNode.parentNode);
  }
};

Main.onThreadMouseOut = function(e) {
  var t = e.target;
  
  if (Config.quotePreview && $.hasClass(t, 'quotelink')) {
    QuotePreview.remove(t);
  }
  else if (Config.imageHover && t.hasAttribute('data-md5')) {
    ImageHover.hide();
  }
  else if (Config.filter && t.hasAttribute('data-filtered')) {
    QuotePreview.remove(t);
  }
};

Main.linkToThread = function(tid, board, post) {
  return '//' + location.host + '/'
    + (board || Main.board) + '/res/'
    + tid + (post > 0 ? ('#p' + post) : '');
};

Main.addCSS = function() {
  var style, css = '\
body.hasDropDownNav {\
  margin-top: 50px;\
}\
.extButton.threadHideButton {\
  float: left;\
  margin-right: 5px;\
  margin-top: -1px;\
}\
.extButton.replyHideButton {\
  margin-top: 1px;\
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
.extButton,\
img.pointer {\
  width: 18px;\
  height: 18px;\
}\
.extControls {\
  display: inline;\
  margin-left: 5px;\
}\
.extButton {\
  cursor: pointer;\
  margin-bottom: -4px;\
}\
.trashIcon {\
  width: 16px;\
  height: 16px;\
  margin-bottom: -2px;\
  margin-left: 5px;\
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
.center {\
  display: block;\
  margin: auto;\
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
#quickReport,\
#quickReply {\
  display: block;\
  position: fixed;\
  padding: 2px;\
  font-size: 10pt;\
}\
#qrepHeader,\
#qrHeader {\
  text-align: center;\
  margin-bottom: 1px;\
  padding: 0;\
  height: 18px;\
  line-height: 18px;\
}\
#qrepClose,\
#qrClose {\
  float: right;\
}\
#quickReport iframe {\
  overflow: hidden;\
}\
#quickReport {\
  height: 190px;\
}\
#qrForm > div {\
  clear: both;\
}\
#quickReply input[type="text"],\
#quickReply textarea,\
#quickReply #recaptcha_response_field {\
  border: 1px solid #aaa;\
  font-family: arial,helvetica,sans-serif;\
  font-size: 10pt;\
  outline: medium none;\
  width: 296px;\
  padding: 2px;\
  margin: 0 0 1px 0;\
}\
#quickReply textarea {\
  min-width: 296px;\
  float: left;\
}\
#quickReply input::-moz-placeholder,\
#quickReply textarea::-moz-placeholder {\
  color: #aaa !important;\
  opacity: 1 !important;\
}\
#quickReply input[type="submit"] {\
  width: 83px;\
  margin: 0;\
  font-size: 10pt;\
  float: left;\
}\
#quickReply #qrCapField {\
  display: block;\
  margin-top: 1px;\
}\
#qrCaptcha {\
  width: 300px;\
  height: 53px;\
  cursor: pointer;\
  border: 1px solid #aaa;\
  display: block;\
}\
#quickReply input.presubmit {\
  margin-right: 1px;\
  width: 212px;\
  float: left;\
}\
#qrFile {\
  width: 215px;\
  margin-right: 5px;\
}\
.qrRealFile {\
  position: absolute;\
  left: 0;\
  visibility: hidden;\
}\
.yotsuba_new #qrFile {\
  color:black;\
}\
#qrSpoiler {\
  display: inline;\
}\
#qrError {\
  width: 292px;\
  display: none;\
  font-family: monospace;\
  background-color: #E62020;\
  font-size: 12px;\
  color: white;\
  padding: 3px 5px;\
  text-shadow: 0 1px rgba(0, 0, 0, 0.20);\
  clear: both;\
}\
#qrError a:hover,\
#qrError a {\
  color: white !important;\
}\
#twHeader {\
  font-weight: bold;\
  text-align: center;\
  height: 17px;\
}\
.futaba_new #twHeader,\
.burichan_new #twHeader {\
  line-height: 1;\
}\
#twPrune {\
  margin-left: 3px;\
  margin-top: -1px;\
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
div.post div.image-expanded {\
  display: table;\
}\
div.op div.file .image-expanded-anti {\
  margin-left: -3px;\
}\
#quote-preview {\
  display: block;\
  position: absolute;\
  padding: 3px 6px 6px 3px;\
  margin: 0;\
}\
#quote-preview .dateTime {\
  white-space: nowrap;\
}\
.yotsuba_new #quote-preview.highlight,\
.yotsuba_b_new #quote-preview.highlight {\
  border-width: 1px 2px 2px 1px !important;\
  border-style: solid !important;\
}\
.yotsuba_new #quote-preview.highlight {\
  border-color: #D99F91 !important;\
}\
.yotsuba_b_new #quote-preview.highlight {\
  border-color: #BA9DBF !important;\
}\
.yotsuba_b_new .highlight-anti,\
.burichan_new .highlight-anti {\
  border-width: 1px !important;\
  background-color: #bfa6ba !important;\
}\
.yotsuba_new .highlight-anti,\
.futaba_new .highlight-anti {\
  background-color: #e8a690 !important;\
}\
.tomorrow .highlight-anti {\
  background-color: #111 !important;\
  border-color: #111;\
}\
.photon .highlight-anti {\
  background-color: #bbb !important;\
}\
.op.inlined {\
  display: block;\
}\
#quote-preview .inlined,\
#quote-preview .extButton,\
#quote-preview .extControls {\
  display: none;\
}\
.hasNewReplies {\
  font-weight: bold;\
}\
.deadlink {\
  text-decoration: line-through !important;\
}\
div.backlink {\
  font-size: 0.8em !important;\
  display: inline;\
  padding: 0;\
  padding-left: 5px;\
}\
.backlink span {\
  padding: 0;\
}\
.burichan_new .backlink a,\
.yotsuba_b_new .backlink a {\
  color: #34345C !important;\
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
.tu-error {\
  color: red;\
}\
.topPageNav {\
  position: absolute;\
}\
.yotsuba_b_new .topPageNav {\
  border-top: 1px solid rgba(255, 255, 255, 0.25);\
  border-left: 1px solid rgba(255, 255, 255, 0.25);\
}\
.newPostsMarker:not(#quote-preview) {\
  box-shadow: 0 3px red;\
}\
#toggleMsgBtn {\
  float: left;\
  margin-bottom: 6px;\
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
.yotsuba_new .panelHeader {\
  border-bottom: 1px solid #d9bfb7;\
}\
.yotsuba_b_new .panelHeader {\
  border-bottom: 1px solid #b7c5d9;\
}\
.tomorrow .panelHeader {\
  border-bottom: 1px solid #111;\
}\
.panelHeader span {\
  position: absolute;\
  right: 5px;\
  top: 5px;\
}\
.UIMenu,\
.UIPanel {\
  position: fixed;\
  width: 100%;\
  height: 100%;\
  z-index: 9002;\
  top: 0;\
  left: 0;\
}\
.UIPanel {\
  line-height: 14px;\
  font-size: 14px;\
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
.extPanel input[type="text"],\
.extPanel textarea {\
  border: 1px solid #AAA;\
  outline: none;\
}\
.UIPanel .center {\
  margin-bottom: 5px;\
}\
.UIPanel button {\
  display: inline-block;\
  margin-right: 5px;\
}\
.UIPanel code {\
  background-color: #eee;\
  color: #000000;\
  padding: 1px 4px;\
  font-size: 12px;\
}\
.UIPanel ul {\
  list-style: none;\
  padding: 0;\
  margin: 0 0 10px;\
}\
.UIPanel .export-field {\
  width: 385px;\
}\
#settingsMenu label input {\
  margin-right: 5px;\
}\
.tomorrow #settingsMenu ul {\
  border-bottom: 1px solid #282a2e;\
}\
.settings-cat {\
  font-weight: bold;\
  margin: 10px 0 5px;\
  padding-left: 5px;\
}\
#customCSSMenu textarea {\
  display: block;\
  max-width: 100%;\
  min-width: 100%;\
  -moz-box-sizing: border-box;\
  box-sizing: border-box;\
  height: 200px;\
  margin: 0 0 5px;\
  font-family: monospace;\
}\
#customCSSMenu .right,\
#settingsMenu .right {\
  margin-top: 2px;\
}\
#settingsMenu label {\
  display: inline-block;\
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
#filtersMenu .fPattern,\
#palette-custom-input {\
  padding: 1px;\
  font-size: 11px;\
}\
#filtersMenu select {\
  width: 85px;\
}\
#filtersMenu tfoot td {\
  padding-top: 10px;\
}\
#keybindsHelp li {\
  padding: 3px 5px;\
}\
.fPattern {\
  width: 130px;\
}\
.fColor {\
  width: 60px;\
}\
.fDel {\
  font-size: 16px;\
}\
.filter-preview {\
  cursor: default;\
  margin-left: 3px;\
}\
#quote-preview iframe,\
#quote-preview .filter-preview {\
  display: none;\
}\
.post-hidden .extButton,\
.post-hidden:not(#quote-preview) .postInfo {\
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
.post-hidden:not(#quote-preview) .backlink,\
div.post-hidden:not(#quote-preview) div.file,\
div.post-hidden:not(#quote-preview) blockquote.postMessage {\
  display: none;\
}\
.click-me {\
  border-radius: 5px;\
  margin-top: 5px;\
  padding: 2px 5px;\
  position: absolute;\
  font-weight: bold;\
  z-index: 2;\
  white-space: nowrap;\
}\
.yotsuba_new .click-me,\
.futaba_new .click-me {\
  color: #800000;\
  background-color: #F0E0D6;\
  border: 2px solid #D9BFB7;\
}\
.yotsuba_b_new .click-me,\
.burichan_new .click-me {\
  color: #000;\
  background-color: #D6DAF0;\
  border: 2px solid #B7C5D9;\
}\
.tomorrow .click-me {\
  color: #C5C8C6;\
  background-color: #282A2E;\
  border: 2px solid #111;\
}\
.photon .click-me {\
  color: #333;\
  background-color: #ddd;\
  border: 2px solid #ccc;\
}\
.click-me:before {\
  content: "";\
  border-width: 0 6px 6px;\
  border-style: solid;\
  left: 50%;\
  margin-left: -6px;\
  position: absolute;\
  width: 0;\
  height: 0;\
  top: -6px;\
}\
.yotsuba_new .click-me:before,\
.futaba_new .click-me:before {\
  border-color: #D9BFB7 transparent;\
}\
.yotsuba_b_new .click-me:before,\
.burichan_new .click-me:before {\
  border-color: #B7C5D9 transparent;\
}\
.tomorrow .click-me:before {\
  border-color: #111 transparent;\
}\
.photon .click-me:before {\
  border-color: #ccc transparent;\
}\
.click-me:after {\
  content: "";\
  border-width: 0 4px 4px;\
  top: -4px;\
  display: block;\
  left: 50%;\
  margin-left: -4px;\
  position: absolute;\
  width: 0;\
  height: 0;\
}\
.yotsuba_new .click-me:after,\
.futaba_new .click-me:after {\
  border-color: #F0E0D6 transparent;\
  border-style: solid;\
}\
.yotsuba_b_new .click-me:after,\
.burichan_new .click-me:after {\
  border-color: #D6DAF0 transparent;\
  border-style: solid;\
}\
.tomorrow .click-me:after {\
  border-color: #282A2E transparent;\
  border-style: solid;\
}\
.photon .click-me:after {\
  border-color: #DDD transparent;\
  border-style: solid;\
}\
.fitToScreen {\
  position: fixed;\
  max-width: 100%;\
  max-height: 100%;\
  top: 0px;\
  right: 0px;\
}\
.thread-stats {\
  float: right;\
}\
.compact .thread {\
  max-width: 75%;\
}\
.dotted {\
  text-decoration: none;\
  border-bottom: 1px dashed;\
}\
.linkfade {\
  opacity: 0.5;\
}\
#quote-preview .linkfade {\
  opacity: 1.0;\
}\
kbd {\
  background-color: #f7f7f7;\
  color: black;\
  border: 1px solid #ccc;\
  border-radius: 3px 3px 3px 3px;\
  box-shadow: 0 1px 0 #ccc, 0 0 0 2px #fff inset;\
  font-family: monospace;\
  font-size: 11px;\
  line-height: 1.4;\
  padding: 0 5px;\
}\
.deleted {\
  opacity: 0.66;\
}\
.noPictures a.fileThumb img {\
  opacity: 0;\
}\
.noPictures.futaba_new a.fileThumb,\
.noPictures.yotsuba_new a.fileThumb {\
  border: 1px solid #800;\
}\
.noPictures.burichan_new a.fileThumb,\
.noPictures.yotsuba_b_new a.fileThumb {\
  border: 1px solid #34345C;\
}\
.noPictures.tomorrow a.fileThumb {\
  border: 1px solid #C5C8C6;\
}\
.noPictures.photon a.fileThumb {\
  border: 1px solid #004A99;\
}\
.ownpost:after {\
  content: " (You)";\
}\
.ownpost {\
  display: inline-block;\
}\
.spinner {\
  margin-top: 2px;\
  padding: 3px;\
  display: table;\
}\
#settings-presets {\
  position: relative;\
  top: -1px;\
}\
#colorpicker { \
  position: fixed;\
  text-align: center;\
}\
.colorbox {\
  font-size: 10px;\
  width: 16px;\
  height: 16px;\
  line-height: 17px;\
  display: inline-block;\
  text-align: center;\
  background-color: #fff;\
  border: 1px solid #aaa;\
  text-decoration: none;\
  color: #000;\
  cursor: pointer;\
  vertical-align: top;\
}\
#palette-custom-input {\
  vertical-align: top;\
  width: 45px;\
  margin-right: 2px;\
}\
#qrDummyFile {\
  float: left;\
  margin-right: 5px;\
  width: 220px;\
  cursor: default;\
  -moz-user-select: none;\
  -webkit-user-select: none;\
  -ms-user-select: none;\
  user-select: none;\
  white-space: nowrap;\
  text-overflow: ellipsis;\
  overflow: hidden;\
}\
#qrDummyFileLabel {\
  margin-left: 3px;\
}\
\
@media only screen and (max-width: 480px) {\
.postLink .mobileHideButton {\
  margin-right: 3px;\
}\
.board .mobile-hr-hidden {\
  margin-top: 10px !important;\
}\
.board > .mobileHideButton {\
  margin-top: -20px !important;\
}\
.board > .mobileHideButton:first-child {\
  margin-top: 10px !important;\
}\
.extButton.threadHideButton {\
  float: none;\
  margin: 0;\
  margin-bottom: 5px;\
}\
.mobile-post-hidden {\
  display: none;\
}\
#toggleMsgBtn {\
  display: none;\
}\
.mobile-tu-status {\
  height: 20px;\
  line-height: 20px;\
}\
.mobile-tu-show {\
  width: 150px;\
  margin: auto;\
  display: block;\
  text-align: center;\
}\
.button input {\
  margin: 0 3px 0 0;\
  position: relative;\
  top: -2px;\
  border-radius: 0;\
  height: 10px;\
  width: 10px;\
}\
.UIPanel > div {\
  width: 320px;\
  margin-left: -160px;\
}\
.UIPanel .export-field {\
  width: 300px;\
}\
.yotsuba_new #quote-preview.highlight,\
#quote-preview {\
  border-width: 1px !important;\
}\
.yotsuba_new #quote-preview.highlight {\
  border-color: #D9BFB7 !important;\
}\
#quickReply input[type="text"],\
#quickReply textarea,\
.extPanel input[type="text"],\
.extPanel textarea {\
  font-size: 16px;\
}\
#quickReply {\
  position: absolute;\
  left: 50%;\
  margin-left: -154px;\
}\
}\
';
  
  style = document.createElement('style');
  style.setAttribute('type', 'text/css');
  style.textContent = css;
  document.head.appendChild(style);
};

Main.init();
