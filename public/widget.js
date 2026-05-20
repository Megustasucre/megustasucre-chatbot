(function () {
  'use strict';

  // Determine API base from the script tag's own origin
  var apiBase = '';
  var scripts = document.querySelectorAll('script[src]');
  for (var i = 0; i < scripts.length; i++) {
    if (scripts[i].src.indexOf('widget.js') !== -1) {
      apiBase = new URL(scripts[i].src).origin;
      break;
    }
  }

  // Session ID (persists within tab)
  var sessionId = sessionStorage.getItem('Chinchilla_sid');
  if (!sessionId) {
    sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    sessionStorage.setItem('Chinchilla_sid', sessionId);
  }

  var welcomed = false;

  // Detect page language from URL param or html[lang]
  var urlLang = new URLSearchParams(window.location.search).get('lang');
  var pageLang = urlLang || document.documentElement.lang || 'es';
  var isEN = pageLang.toLowerCase().startsWith('en');

  var bubbleText  = isEN ? 'Need help? 😊' : '¿Necesitas ayuda? 😊';
  var placeholderText = isEN ? 'Type a message...' : 'Escribe un mensaje...';
  var welcomeText = isEN
    ? "Hi! I'm Chinchilla, your Me Gusta Sucre guide. Ask me about the hostal, Spanish classes, the café, or anything about Sucre!"
    : '¡Hola! 🐭 Soy Chinchilla, tu guía en Me Gusta Sucre. Puedo ayudarte con el hostal, las clases de español, el café y todo sobre Sucre.';

  // ── Styles ────────────────────────────────────────────────────────────────
  var style = document.createElement('style');
  style.textContent = [
    '#Chinchilla-fab{position:fixed;bottom:24px;right:24px;width:56px;height:56px;background:#111;border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(0,0,0,.3);z-index:99998;transition:transform .2s,box-shadow .2s}',
    '#Chinchilla-bubble{position:fixed;bottom:92px;right:16px;background:#fff;color:#111;font-family:\'Inter\',-apple-system,BlinkMacSystemFont,sans-serif;font-size:13px;font-weight:500;padding:10px 14px;border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,.15);z-index:99997;white-space:nowrap;cursor:pointer;animation:chFadeIn .3s ease}',
    '#Chinchilla-bubble::after{content:\'\';position:absolute;bottom:-5px;right:22px;width:10px;height:10px;background:#fff;transform:rotate(45deg);box-shadow:2px 2px 4px rgba(0,0,0,.06)}',
    '@keyframes chFadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}',
    '#Chinchilla-fab:hover{transform:scale(1.08);box-shadow:0 6px 24px rgba(0,0,0,.4)}',
    '#Chinchilla-win{position:fixed;bottom:92px;right:24px;width:360px;height:520px;background:#fff;border-radius:16px;box-shadow:0 8px 40px rgba(0,0,0,.2);z-index:99999;display:none;flex-direction:column;overflow:hidden;font-family:\'Inter\',-apple-system,BlinkMacSystemFont,sans-serif}',
    '#Chinchilla-win.open{display:flex}',
    '#Chinchilla-header{background:#111;color:#fff;padding:14px 16px;display:flex;align-items:center;gap:10px;flex-shrink:0}',
    '#Chinchilla-avatar{width:36px;height:36px;border-radius:50%;overflow:hidden;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:#d61a16}',
    '#Chinchilla-avatar img{width:100%;height:100%;object-fit:cover}',
    '#Chinchilla-info{flex:1}',
    '#Chinchilla-name{font-weight:700;font-size:15px;line-height:1.2}',
    '#Chinchilla-sub{font-size:11px;color:#aaa;margin-top:1px}',
    '#Chinchilla-close{background:none;border:none;color:#aaa;cursor:pointer;font-size:20px;padding:4px;line-height:1;transition:color .15s}',
    '#Chinchilla-close:hover{color:#fff}',
    '#Chinchilla-msgs{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;background:#fafafa}',
    '.ch-msg{max-width:82%;padding:10px 14px;border-radius:14px;font-size:14px;line-height:1.5;word-wrap:break-word;white-space:pre-wrap}',
    '.ch-msg.bot{background:#fff;color:#111;align-self:flex-start;border:1px solid #e8e8e8;border-bottom-left-radius:4px}',
    '.ch-msg.user{background:#111;color:#fff;align-self:flex-end;border-bottom-right-radius:4px}',
    '#Chinchilla-typing{display:flex;gap:4px;align-items:center;padding:10px 14px;background:#fff;border:1px solid #e8e8e8;border-radius:14px;border-bottom-left-radius:4px;align-self:flex-start}',
    '#Chinchilla-typing span{width:7px;height:7px;background:#bbb;border-radius:50%;animation:chDot 1.2s infinite}',
    '#Chinchilla-typing span:nth-child(2){animation-delay:.2s}',
    '#Chinchilla-typing span:nth-child(3){animation-delay:.4s}',
    '@keyframes chDot{0%,60%,100%{transform:translateY(0);opacity:.4}30%{transform:translateY(-5px);opacity:1}}',
    '#Chinchilla-footer{padding:12px;background:#fff;border-top:1px solid #eee;display:flex;gap:8px;flex-shrink:0}',
    '#Chinchilla-input{flex:1;padding:10px 14px;border:1.5px solid #ddd;border-radius:24px;font-size:14px;font-family:inherit;outline:none;transition:border-color .15s}',
    '#Chinchilla-input:focus{border-color:#111}',
    '#Chinchilla-send{width:40px;height:40px;background:#d61a16;border:none;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:background .15s,transform .15s}',
    '#Chinchilla-send:hover{background:#b51512;transform:scale(1.05)}',
    '#Chinchilla-send svg{width:18px;height:18px;fill:#fff}',
    '#Chinchilla-send:disabled{opacity:.5;cursor:not-allowed;transform:none}',
    '@media(max-width:420px){#Chinchilla-fab{bottom:16px;right:16px}#Chinchilla-win{width:calc(100vw - 20px);right:10px;bottom:84px;height:72vh}}'
  ].join('');
  document.head.appendChild(style);

  // ── HTML ──────────────────────────────────────────────────────────────────
  var container = document.createElement('div');
  container.innerHTML = [
    '<div id="Chinchilla-bubble"></div>',
    '<button id="Chinchilla-fab" title="Chat con Chinchilla" aria-label="Abrir chat"><img src="https://megustasucre.com/imagenes/logos/logo_me_gusta_sucre_of/SVG/logo_chinchi.svg" alt="Chinchilla" style="width:42px;height:42px;object-fit:contain;filter:brightness(0) invert(1)" /></button>',
    '<div id="Chinchilla-win" role="dialog" aria-label="Chat Chinchilla">',
      '<div id="Chinchilla-header">',
        '<div id="Chinchilla-avatar"><img src="https://megustasucre.com/imagenes/logos/logo_me_gusta_sucre_of/SVG/logo_chinchi.svg" alt="Chinchilla" /></div>',
        '<div id="Chinchilla-info">',
          '<div id="Chinchilla-name">Chinchilla</div>',
          '<div id="Chinchilla-sub">Asistente de Me Gusta Sucre</div>',
        '</div>',
        '<button id="Chinchilla-close" aria-label="Cerrar">✕</button>',
      '</div>',
      '<div id="Chinchilla-msgs"></div>',
      '<div id="Chinchilla-footer">',
        '<input id="Chinchilla-input" type="text" placeholder="Escribe un mensaje..." autocomplete="off" maxlength="500" />',
        '<button id="Chinchilla-send" aria-label="Enviar">',
          '<svg viewBox="0 0 24 24"><path d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg>',
        '</button>',
      '</div>',
    '</div>'
  ].join('');
  document.body.appendChild(container);

  var fab    = document.getElementById('Chinchilla-fab');
  var bubble = document.getElementById('Chinchilla-bubble');
  var win    = document.getElementById('Chinchilla-win');
  var msgs   = document.getElementById('Chinchilla-msgs');
  var input  = document.getElementById('Chinchilla-input');
  var send   = document.getElementById('Chinchilla-send');
  var close  = document.getElementById('Chinchilla-close');

  // Set bubble text and input placeholder based on language
  bubble.textContent = bubbleText;
  document.getElementById('Chinchilla-input').placeholder = placeholderText;

  // Show bubble after 2s, auto-hide after 8s
  bubble.style.display = 'none';
  setTimeout(function () {
    bubble.style.display = 'block';
    setTimeout(function () { bubble.style.display = 'none'; }, 8000);
  }, 2000);

  bubble.addEventListener('click', function () {
    bubble.style.display = 'none';
    fab.click();
  });

  // ── Helpers ───────────────────────────────────────────────────────────────
  function addMsg(text, who) {
    var div = document.createElement('div');
    div.className = 'ch-msg ' + who;
    div.textContent = text;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function showTyping() {
    var div = document.createElement('div');
    div.id = 'Chinchilla-typing';
    div.innerHTML = '<span></span><span></span><span></span>';
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function hideTyping() {
    var t = document.getElementById('Chinchilla-typing');
    if (t) t.remove();
  }

  // ── Send ──────────────────────────────────────────────────────────────────
  function sendMessage() {
    var text = input.value.trim();
    if (!text) return;
    input.value = '';
    send.disabled = true;

    addMsg(text, 'user');
    showTyping();

    fetch(apiBase + '/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, sessionId: sessionId })
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        hideTyping();
        addMsg(data.reply || 'Ups, algo salió mal 😅', 'bot');
      })
      .catch(function () {
        hideTyping();
        addMsg('Hubo un error de conexión. Intenta de nuevo.', 'bot');
      })
      .finally(function () {
        send.disabled = false;
        input.focus();
      });
  }

  // ── Events ────────────────────────────────────────────────────────────────
  fab.addEventListener('click', function () {
    bubble.style.display = 'none';
    win.classList.add('open');
    fab.style.display = 'none';
    if (!welcomed) {
      welcomed = true;
      setTimeout(function () {
        addMsg(welcomeText, 'bot');
      }, 300);
    }
    setTimeout(function () { input.focus(); }, 400);
  });

  close.addEventListener('click', function () {
    win.classList.remove('open');
    fab.style.display = 'flex';
  });

  send.addEventListener('click', sendMessage);

  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
})();
