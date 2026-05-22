#!/usr/bin/env python3
import sqlite3
import json
import os
from pathlib import Path
from http.server import HTTPServer, BaseHTTPRequestHandler

DB = "/Users/joai/.hermes/state.db"
HERMES_HOME = Path("/Users/joai/.hermes")

def get_sessions():
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute("""
        SELECT s.id, s.title, s.model, s.source, s.started_at, s.message_count, s.tool_call_count,
               MAX(m.timestamp) as last_msg_ts
        FROM sessions s
        LEFT JOIN messages m ON m.session_id = s.id
        GROUP BY s.id
        ORDER BY s.started_at DESC
        LIMIT 50
    """)
    rows = []
    for r in cur.fetchall():
        row = dict(r)
        # Temps de réponse = écart entre début de session et dernier message
        if row.get('last_msg_ts') and row.get('started_at'):
            diff = row['last_msg_ts'] - row['started_at']
            if 0 < diff < 600:
                row['duration_s'] = round(diff, 1)
        rows.append(row)
    conn.close()
    return rows

def get_messages(session_id):
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute("""
        SELECT role, content, tool_name, tool_calls, timestamp
        FROM messages
        WHERE session_id = ?
        ORDER BY timestamp ASC
    """, (session_id,))
    rows = []
    prev_user_ts = None
    for r in cur.fetchall():
        row = dict(r)
        # Calcule le temps de réponse (écart entre question user et réponse assistant)
        if row.get('role') == 'user':
            prev_user_ts = row.get('timestamp')
        elif row.get('role') == 'assistant' and not row.get('tool_name') and prev_user_ts:
            diff = row.get('timestamp', 0) - prev_user_ts
            if 0 < diff < 300:
                row['response_time_s'] = round(diff, 1)
            prev_user_ts = None
        # Parse tool_calls JSON to extract tool name + args summary
        if row.get('tool_calls'):
            try:
                tc = json.loads(row['tool_calls'])
                if isinstance(tc, list) and tc:
                    calls = []
                    for c in tc:
                        name = c.get('name') or c.get('function', {}).get('name', '')
                        args = c.get('arguments') or c.get('function', {}).get('arguments', '')
                        if isinstance(args, str):
                            try: args = json.loads(args)
                            except: pass
                        # Summarise args
                        summary = ''
                        if isinstance(args, dict):
                            key_args = {k: v for k, v in args.items()
                                        if k in ('query','pattern','path','name','goal','prompt','content') and v}
                            if key_args:
                                first = next(iter(key_args.values()))
                                summary = str(first)[:80]
                        calls.append({'name': name, 'summary': summary})
                    row['parsed_tool_calls'] = calls
            except Exception:
                pass
        # Parse tool result content
        if row.get('tool_name') and row.get('content'):
            try:
                result = json.loads(row['content'])
                if isinstance(result, dict):
                    count = result.get('total_count') or result.get('count')
                    matches = result.get('matches') or result.get('files') or []
                    fname = result.get('name') or ''
                    content_snippet = result.get('content', '')[:200] if result.get('content') else ''
                    parts = []
                    if fname: parts.append(f"skill: {fname}")
                    if count is not None: parts.append(f"{count} résultat(s)")
                    if matches and isinstance(matches, list):
                        paths = [m.get('path','') if isinstance(m,dict) else str(m) for m in matches[:3]]
                        paths = [p.split('/')[-1] for p in paths if p]
                        if paths: parts.append(', '.join(paths))
                    if content_snippet: parts.append(content_snippet[:120])
                    if parts:
                        row['tool_summary'] = ' · '.join(parts)
            except Exception:
                pass
        rows.append(row)
    conn.close()
    return rows

def get_pillars():
    pillars = []

    # 1. SOUL.md
    soul_path = HERMES_HOME / "SOUL.md"
    pillars.append({
        "id": "soul",
        "title": "Personnalité",
        "subtitle": "SOUL.md",
        "icon": "✦",
        "color": "#7c6af7",
        "content": soul_path.read_text() if soul_path.exists() else "(vide)",
        "type": "markdown"
    })

    # 2. Modèle (extrait de config.yaml)
    import re
    config_path = HERMES_HOME / "config.yaml"
    model_info = "(non configuré)"
    if config_path.exists():
        raw = config_path.read_text()
        m = re.search(r"model:\s*\n\s*default:\s*(\S+)\s*\n\s*provider:\s*(\S+)", raw)
        if m:
            model_info = f"Modèle : {m.group(1)}\nProvider : {m.group(2)}"
        pillars.append({
            "id": "config",
            "title": "Configuration",
            "subtitle": "config.yaml",
            "icon": "⚙",
            "color": "#4a9eff",
            "content": raw,
            "type": "yaml",
            "summary": model_info
        })

    # 3. Mémoire
    memories_dir = HERMES_HOME / "memories"
    mem_files = list(memories_dir.glob("**/*")) if memories_dir.exists() else []
    mem_files = [f for f in mem_files if f.is_file()]
    if mem_files:
        mem_content = ""
        for f in sorted(mem_files):
            mem_content += f"### {f.name}\n\n{f.read_text()}\n\n---\n\n"
    else:
        mem_content = "(Aucun souvenir pour l'instant — Hermes apprend au fil des conversations)"
    pillars.append({
        "id": "memory",
        "title": "Mémoire",
        "subtitle": f"{len(mem_files)} souvenir(s)",
        "icon": "◈",
        "color": "#f7a44a",
        "content": mem_content,
        "type": "markdown"
    })

    # 4. Skills custom (hors bundlés)
    skills_dir = HERMES_HOME / "skills"
    custom_skills = []
    if skills_dir.exists():
        for skill_file in sorted(skills_dir.glob("**/SKILL.md")):
            rel = skill_file.relative_to(skills_dir)
            parts = rel.parts
            name = parts[-2] if len(parts) >= 2 else skill_file.stem
            content = skill_file.read_text()
            # Heuristique : skill custom si pas dans les catégories bundlées
            bundled_categories = {
                "apple","autonomous-ai-agents","creative","data-science","devops",
                "diagramming","dogfood","domain","email","gaming","gifs","github",
                "inference-sh","mcp","media","mlops","note-taking","productivity",
                "red-teaming","research","smart-home","social-media","software-development","yuanbao"
            }
            category = parts[0] if parts else ""
            if category not in bundled_categories:
                custom_skills.append({"name": name, "content": content})

    if custom_skills:
        skills_content = "\n\n---\n\n".join(
            f"## {s['name']}\n\n{s['content']}" for s in custom_skills
        )
    else:
        skills_content = "(Aucun skill custom pour l'instant — ils apparaîtront ici quand tu en créeras)"

    pillars.append({
        "id": "skills",
        "title": "Skills custom",
        "subtitle": f"{len(custom_skills)} skill(s)",
        "icon": "◆",
        "color": "#4af7a4",
        "content": skills_content,
        "type": "markdown"
    })

    # 5. Hooks
    hooks_dir = HERMES_HOME / "hooks"
    hook_files = list(hooks_dir.glob("**/*")) if hooks_dir.exists() else []
    hook_files = [f for f in hook_files if f.is_file()]
    if hook_files:
        hooks_content = ""
        for f in sorted(hook_files):
            hooks_content += f"### {f.name}\n\n```\n{f.read_text()}\n```\n\n---\n\n"
    else:
        hooks_content = "(Aucun hook configuré — les hooks permettent de déclencher des actions automatiques)"

    pillars.append({
        "id": "hooks",
        "title": "Hooks",
        "subtitle": f"{len(hook_files)} hook(s)",
        "icon": "⚡",
        "color": "#f74a4a",
        "content": hooks_content,
        "type": "markdown"
    })

    return pillars

HTML = """<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Hermes Viewer</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f0f0f; color: #e8e8e8; height: 100vh; display: flex; flex-direction: column; }

  /* Nav tabs */
  #nav { display: flex; align-items: center; background: #141414; border-bottom: 1px solid #222; padding: 0 20px; gap: 4px; }
  #nav .logo { font-size: 14px; font-weight: 600; color: #fff; padding: 14px 16px 14px 4px; margin-right: 8px; border-right: 1px solid #222; }
  #nav .logo span { opacity: 0.35; font-weight: 400; }
  .tab { padding: 14px 16px; font-size: 13px; color: #555; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.15s; user-select: none; }
  .tab:hover { color: #aaa; }
  .tab.active { color: #fff; border-bottom-color: #7c6af7; }

  /* Layout */
  #content { flex: 1; display: flex; overflow: hidden; }

  /* ── Sessions tab ── */
  #view-sessions { display: flex; width: 100%; overflow: hidden; }
  #sidebar { width: 280px; min-width: 280px; background: #141414; border-right: 1px solid #222; display: flex; flex-direction: column; overflow: hidden; }
  #sessions-list { overflow-y: auto; flex: 1; }
  .session { padding: 13px 18px; cursor: pointer; border-bottom: 1px solid #1a1a1a; transition: background 0.1s; }
  .session:hover { background: #1a1a1a; }
  .session.active { background: #1c1c1c; border-left: 2px solid #7c6af7; padding-left: 16px; }
  .session-title { font-size: 13px; font-weight: 500; color: #ddd; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .session-meta { font-size: 11px; color: #484848; margin-top: 3px; display: flex; gap: 6px; align-items: center; }
  .session-duration { color: #2a5c2a; font-size: 11px; margin-left: auto; }

  #chat-pane { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
  #chat-header { padding: 14px 22px; border-bottom: 1px solid #1e1e1e; display: flex; justify-content: space-between; align-items: center; }
  #chat-header span { font-size: 13px; color: #555; }
  #refresh-btn { background: #1e1e1e; border: 1px solid #2a2a2a; color: #666; padding: 5px 12px; border-radius: 6px; font-size: 12px; cursor: pointer; }
  #refresh-btn:hover { color: #aaa; background: #242424; }
  #messages { flex: 1; overflow-y: auto; padding: 20px 24px; display: flex; flex-direction: column; gap: 14px; }
  #empty-msg { margin: auto; color: #2a2a2a; font-size: 14px; }

  .msg { max-width: 700px; }
  .msg.user { align-self: flex-end; }
  .msg.assistant, .msg.tool { align-self: flex-start; }
  .msg-label { font-size: 10px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 5px; color: #444; }
  .msg.user .msg-label { text-align: right; }
  .msg-bubble { padding: 11px 15px; border-radius: 12px; font-size: 14px; line-height: 1.65; white-space: pre-wrap; word-break: break-word; }
  .msg.user .msg-bubble { background: #7c6af7; color: #fff; border-bottom-right-radius: 3px; }
  .msg.assistant .msg-bubble { background: #191919; color: #e0e0e0; border: 1px solid #242424; border-bottom-left-radius: 3px; }
  .msg.tool .msg-bubble { background: #161616; color: #555; font-size: 12px; font-family: monospace; border: 1px solid #1e1e1e; border-radius: 8px; }
  .msg.tool-call .msg-bubble { background: #0d1a0d; color: #4a9e4a; font-size: 12px; font-family: monospace; border: 1px solid #1a2e1a; border-radius: 8px; padding: 8px 12px; }
  .tool-call-row { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
  .tool-call-name { color: #4af77a; font-weight: 600; font-size: 12px; }
  .tool-call-summary { color: #3a5e3a; font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 500px; }
  .tool-result-summary { color: #3a6e3a; font-size: 11px; font-style: italic; }
  .msg-time { font-size: 10px; color: #333; margin-top: 3px; display: flex; gap: 8px; }
  .msg.user .msg-time { justify-content: flex-end; }
  .response-time { color: #2a5c2a; font-size: 10px; }
  .response-time.slow { color: #5c3a2a; }

  /* ── Piliers tab ── */
  #view-pillars { display: flex; width: 100%; overflow: hidden; }
  #pillars-list { width: 240px; min-width: 240px; background: #141414; border-right: 1px solid #222; overflow-y: auto; padding: 12px 0; }
  .pillar-item { display: flex; align-items: center; gap: 12px; padding: 12px 18px; cursor: pointer; border-radius: 0; transition: background 0.1s; border-left: 2px solid transparent; }
  .pillar-item:hover { background: #1a1a1a; }
  .pillar-item.active { background: #1c1c1c; border-left-color: var(--color); }
  .pillar-icon { font-size: 16px; }
  .pillar-info { flex: 1; min-width: 0; }
  .pillar-name { font-size: 13px; font-weight: 500; color: #ddd; }
  .pillar-sub { font-size: 11px; color: #444; margin-top: 2px; }

  #pillar-pane { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
  #pillar-header { padding: 14px 24px; border-bottom: 1px solid #1e1e1e; display: flex; align-items: center; gap: 10px; }
  #pillar-header .pillar-h-icon { font-size: 18px; }
  #pillar-header .pillar-h-title { font-size: 15px; font-weight: 600; color: #fff; }
  #pillar-header .pillar-h-sub { font-size: 12px; color: #444; margin-left: auto; }
  #pillar-content { flex: 1; overflow-y: auto; padding: 24px; }
  #pillar-content pre { font-family: 'SF Mono', 'Monaco', monospace; font-size: 13px; line-height: 1.6; color: #ccc; background: #141414; padding: 16px; border-radius: 8px; border: 1px solid #222; white-space: pre-wrap; word-break: break-word; }
  #pillar-empty { margin: auto; color: #2a2a2a; font-size: 14px; display: flex; align-items: center; height: 100%; justify-content: center; }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-thumb { background: #222; border-radius: 2px; }

  .hidden { display: none !important; }
</style>
</head>
<body>

<div id="nav">
  <div class="logo">⚕ Hermes <span>viewer</span></div>
  <div class="tab active" onclick="switchTab('sessions')">Conversations</div>
  <div class="tab" onclick="switchTab('pillars')">Piliers</div>
</div>

<div id="content">

  <!-- Sessions -->
  <div id="view-sessions">
    <div id="sidebar">
      <div id="sessions-list"></div>
    </div>
    <div id="chat-pane">
      <div id="chat-header">
        <span id="session-label">Sélectionne une session</span>
        <button id="refresh-btn" onclick="refresh()">↻ Actualiser</button>
      </div>
      <div id="messages"><div id="empty-msg">← Choisis une session</div></div>
    </div>
  </div>

  <!-- Piliers -->
  <div id="view-pillars" class="hidden">
    <div id="pillars-list"></div>
    <div id="pillar-pane">
      <div id="pillar-header">
        <span id="pillar-empty">← Choisis un pilier</span>
      </div>
      <div id="pillar-content"></div>
    </div>
  </div>

</div>

<script>
let currentSession = null;
let currentPillar = null;
let autoRefreshTimer = null;
let pillarsData = [];

// ── Tab switching ──
function switchTab(name) {
  document.querySelectorAll('.tab').forEach((t,i) => t.classList.toggle('active', ['sessions','pillars'][i] === name));
  document.getElementById('view-sessions').classList.toggle('hidden', name !== 'sessions');
  document.getElementById('view-pillars').classList.toggle('hidden', name !== 'pillars');
  if (name === 'pillars' && pillarsData.length === 0) loadPillars();
}

// ── Sessions ──
async function loadSessions() {
  const res = await fetch('/api/sessions');
  sessionsCache = await res.json();
  const sessions = sessionsCache;
  const el = document.getElementById('sessions-list');
  el.innerHTML = sessions.map(s => {
    const date = new Date(s.started_at * 1000);
    const label = s.title || 'Sans titre';
    const time = date.toLocaleString('fr-FR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' });
    const dur = s.duration_s != null ? `<span class="session-duration">⏱ ${s.duration_s}s</span>` : '';
    return `<div class="session ${s.id === currentSession ? 'active' : ''}" onclick="openSession('${s.id}', this)">
      <div class="session-title">${escHtml(label)}</div>
      <div class="session-meta"><span>${escHtml(s.model)} · ${s.message_count} msgs · ${time}</span>${dur}</div>
    </div>`;
  }).join('');
}

let sessionsCache = [];

async function openSession(id, el) {
  currentSession = id;
  document.querySelectorAll('.session').forEach(s => s.classList.remove('active'));
  el.classList.add('active');
  await loadMessages(id);
  clearInterval(autoRefreshTimer);
  autoRefreshTimer = setInterval(() => loadMessages(id), 3000);
}

async function loadMessages(id) {
  const res = await fetch('/api/messages/' + id);
  const msgs = await res.json();
  const el = document.getElementById('messages');
  const sess = sessionsCache.find(s => s.id === id);
  const durStr = sess && sess.duration_s != null ? ` · ⏱ ${sess.duration_s}s` : '';
  document.getElementById('session-label').textContent = 'Session · ' + id + durStr;
  if (!msgs.length) { el.innerHTML = '<div id="empty-msg">Aucun message</div>'; return; }
  const wasAtBottom = el.scrollHeight - el.clientHeight <= el.scrollTop + 40;
  el.innerHTML = msgs.filter(m => m.role !== 'system').map(m => {
    const time = new Date(m.timestamp * 1000).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' });

    // Appel d'outil (assistant qui décide d'appeler un tool)
    if (m.parsed_tool_calls && m.parsed_tool_calls.length) {
      const calls = m.parsed_tool_calls.map(c =>
        `<div class="tool-call-row">
          <span class="tool-call-name">⚙ ${escHtml(c.name)}</span>
          ${c.summary ? `<span class="tool-call-summary">${escHtml(c.summary)}</span>` : ''}
        </div>`
      ).join('');
      return `<div class="msg tool-call">
        <div class="msg-label">outil appelé</div>
        <div class="msg-bubble">${calls}</div>
        <div class="msg-time">${time}</div>
      </div>`;
    }

    // Résultat d'outil
    if (m.tool_name) {
      const summary = m.tool_summary || (m.content || '').substring(0, 120);
      return `<div class="msg tool">
        <div class="msg-label">↩ ${escHtml(m.tool_name)}</div>
        <div class="msg-bubble"><span class="tool-result-summary">${escHtml(summary)}</span></div>
        <div class="msg-time">${time}</div>
      </div>`;
    }

    // Message vide
    if (!m.content) return '';

    // Message normal
    const roleLabel = m.role === 'user' ? 'Vous' : 'Hermes';
    const cls = m.role;
    const rtHtml = m.response_time_s != null
      ? `<span class="response-time ${m.response_time_s > 15 ? 'slow' : ''}">⏱ ${m.response_time_s}s</span>`
      : '';
    return `<div class="msg ${cls}">
      <div class="msg-label">${roleLabel}</div>
      <div class="msg-bubble">${escHtml(m.content)}</div>
      <div class="msg-time"><span>${time}</span>${rtHtml}</div>
    </div>`;
  }).join('');
  if (wasAtBottom) el.scrollTop = el.scrollHeight;
}

// ── Piliers ──
async function loadPillars() {
  const res = await fetch('/api/pillars');
  pillarsData = await res.json();
  const el = document.getElementById('pillars-list');
  el.innerHTML = pillarsData.map(p => `
    <div class="pillar-item ${p.id === currentPillar ? 'active' : ''}"
         style="--color: ${p.color}"
         onclick="openPillar('${p.id}')">
      <div class="pillar-icon" style="color:${p.color}">${p.icon}</div>
      <div class="pillar-info">
        <div class="pillar-name">${p.title}</div>
        <div class="pillar-sub">${p.subtitle}</div>
      </div>
    </div>`).join('');
}

function openPillar(id) {
  currentPillar = id;
  const p = pillarsData.find(x => x.id === id);
  if (!p) return;
  document.querySelectorAll('.pillar-item').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.pillar-item').forEach(el => {
    if (el.querySelector('.pillar-name').textContent === p.title) el.classList.add('active');
  });
  const header = document.getElementById('pillar-header');
  header.innerHTML = `
    <span class="pillar-h-icon" style="color:${p.color}">${p.icon}</span>
    <span class="pillar-h-title">${p.title}</span>
    <span class="pillar-h-sub">${p.subtitle}</span>`;
  document.getElementById('pillar-content').innerHTML = `<pre>${escHtml(p.content)}</pre>`;
}

function refresh() {
  loadSessions();
  if (currentSession) loadMessages(currentSession);
  if (pillarsData.length) { pillarsData = []; loadPillars(); }
}

function escHtml(s) {
  return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

loadSessions();
setInterval(loadSessions, 5000);
</script>
</body>
</html>
"""

class Handler(BaseHTTPRequestHandler):
    def log_message(self, format, *args): pass

    def send_json(self, data):
        body = json.dumps(data, ensure_ascii=False).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", len(body))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path == "/":
            body = HTML.encode()
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", len(body))
            self.end_headers()
            self.wfile.write(body)
        elif self.path == "/api/sessions":
            self.send_json(get_sessions())
        elif self.path.startswith("/api/messages/"):
            session_id = self.path[len("/api/messages/"):]
            self.send_json(get_messages(session_id))
        elif self.path == "/api/pillars":
            self.send_json(get_pillars())
        else:
            self.send_response(404)
            self.end_headers()

if __name__ == "__main__":
    port = 7842
    server = HTTPServer(("127.0.0.1", port), Handler)
    print(f"  ⚕ Hermes Viewer → http://localhost:{port}")
    print(f"  Ctrl+C pour arrêter")
    server.serve_forever()
