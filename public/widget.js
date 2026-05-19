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
  var sessionId = sessionStorage.getItem('chinchi_sid');
  if (!sessionId) {
    sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    sessionStorage.setItem('chinchi_sid', sessionId);
  }

  var welcomed = false;

  // ── Styles ────────────────────────────────────────────────────────────────
  var style = document.createElement('style');
  style.textContent = [
    '#chinchi-fab{position:fixed;bottom:24px;right:24px;width:56px;height:56px;background:#111;border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(0,0,0,.3);z-index:99998;transition:transform .2s,box-shadow .2s}',
    '#chinchi-fab:hover{transform:scale(1.08);box-shadow:0 6px 24px rgba(0,0,0,.4)}',
    '#chinchi-win{position:fixed;bottom:92px;right:24px;width:360px;height:520px;background:#fff;border-radius:16px;box-shadow:0 8px 40px rgba(0,0,0,.2);z-index:99999;display:none;flex-direction:column;overflow:hidden;font-family:\'Inter\',-apple-system,BlinkMacSystemFont,sans-serif}',
    '#chinchi-win.open{display:flex}',
    '#chinchi-header{background:#111;color:#fff;padding:14px 16px;display:flex;align-items:center;gap:10px;flex-shrink:0}',
    '#chinchi-avatar{width:36px;height:36px;border-radius:50%;overflow:hidden;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:#d61a16}',
    '#chinchi-avatar img{width:100%;height:100%;object-fit:cover}',
    '#chinchi-info{flex:1}',
    '#chinchi-name{font-weight:700;font-size:15px;line-height:1.2}',
    '#chinchi-sub{font-size:11px;color:#aaa;margin-top:1px}',
    '#chinchi-close{background:none;border:none;color:#aaa;cursor:pointer;font-size:20px;padding:4px;line-height:1;transition:color .15s}',
    '#chinchi-close:hover{color:#fff}',
    '#chinchi-msgs{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;background:#fafafa}',
    '.ch-msg{max-width:82%;padding:10px 14px;border-radius:14px;font-size:14px;line-height:1.5;word-wrap:break-word;white-space:pre-wrap}',
    '.ch-msg.bot{background:#fff;color:#111;align-self:flex-start;border:1px solid #e8e8e8;border-bottom-left-radius:4px}',
    '.ch-msg.user{background:#111;color:#fff;align-self:flex-end;border-bottom-right-radius:4px}',
    '#chinchi-typing{display:flex;gap:4px;align-items:center;padding:10px 14px;background:#fff;border:1px solid #e8e8e8;border-radius:14px;border-bottom-left-radius:4px;align-self:flex-start}',
    '#chinchi-typing span{width:7px;height:7px;background:#bbb;border-radius:50%;animation:chDot 1.2s infinite}',
    '#chinchi-typing span:nth-child(2){animation-delay:.2s}',
    '#chinchi-typing span:nth-child(3){animation-delay:.4s}',
    '@keyframes chDot{0%,60%,100%{transform:translateY(0);opacity:.4}30%{transform:translateY(-5px);opacity:1}}',
    '#chinchi-footer{padding:12px;background:#fff;border-top:1px solid #eee;display:flex;gap:8px;flex-shrink:0}',
    '#chinchi-input{flex:1;padding:10px 14px;border:1.5px solid #ddd;border-radius:24px;font-size:14px;font-family:inherit;outline:none;transition:border-color .15s}',
    '#chinchi-input:focus{border-color:#111}',
    '#chinchi-send{width:40px;height:40px;background:#d61a16;border:none;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:background .15s,transform .15s}',
    '#chinchi-send:hover{background:#b51512;transform:scale(1.05)}',
    '#chinchi-send svg{width:18px;height:18px;fill:#fff}',
    '#chinchi-send:disabled{opacity:.5;cursor:not-allowed;transform:none}',
    '@media(max-width:420px){#chinchi-fab{bottom:16px;right:16px}#chinchi-win{width:calc(100vw - 20px);right:10px;bottom:84px;height:72vh}}'
  ].join('');
  document.head.appendChild(style);

  // ── HTML ──────────────────────────────────────────────────────────────────
  var container = document.createElement('div');
  container.innerHTML = [
    '<button id="chinchi-fab" title="Chat con Chinchi" aria-label="Abrir chat"><img src="https://megustasucre.com/imagenes/logos/logo_me_gusta_sucre_of/SVG/logo_chinchi.svg" alt="Chinchi" style="width:42px;height:42px;object-fit:contain;filter:brightness(0) invert(1)" /></button>',
    '<div id="chinchi-win" role="dialog" aria-label="Chat Chinchi">',
      '<div id="chinchi-header">',
        '<div id="chinchi-avatar"><img src="https://megustasucre.com/imagenes/logos/logo_me_gusta_sucre_of/SVG/logo_chinchi.svg" alt="Chinchi" /></div>',
        '<div id="chinchi-info">',
          '<div id="chinchi-name">Chinchi</div>',
          '<div id="chinchi-sub">Asistente de Me Gusta Sucre</div>',
        '</div>',
        '<button id="chinchi-close" aria-label="Cerrar">✕</button>',
      '</div>',
      '<div id="chinchi-msgs"></div>',
      '<div id="chinchi-footer">',
        '<input id="chinchi-input" type="text" placeholder="Escribe un mensaje..." autocomplete="off" maxlength="500" />',
        '<button id="chinchi-send" aria-label="Enviar">',
          '<svg viewBox="0 0 24 24"><path d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg>',
        '</button>',
      '</div>',
    '</div>'
  ].join('');
  document.body.appendChild(container);

  var fab    = document.getElementById('chinchi-fab');
  var win    = document.getElementById('chinchi-win');
  var msgs   = document.getElementById('chinchi-msgs');
  var input  = document.getElementById('chinchi-input');
  var send   = document.getElementById('chinchi-send');
  var close  = document.getElementById('chinchi-close');

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
    div.id = 'chinchi-typing';
    div.innerHTML = '<span></span><span></span><span></span>';
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function hideTyping() {
    var t = document.getElementById('chinchi-typing');
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
    win.classList.add('open');
    fab.style.display = 'none';
    if (!welcomed) {
      welcomed = true;
      setTimeout(function () {
        addMsg('¡Hola! 🐭 Soy Chinchi, tu guía en Me Gusta Sucre. Puedo ayudarte con el hostal, las clases de español, el café y todo sobre Sucre.\n\nHi! I\'m Chinchi, your Me Gusta Sucre guide. Ask me about the hostal, Spanish classes, the café, or anything about Sucre!', 'bot');
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
