import "./style.css";
import { auth, db, firebaseConfigured } from "./firebase.js";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import {
  collection, addDoc, getDocs, query, orderBy, serverTimestamp, doc, getDoc
} from "firebase/firestore";

const app = document.querySelector("#app");
let currentUser = null;
let profile = null;
let assets = [];
let activePage = "dashboard";

const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, c => ({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
}[c]));

const roleLabels = {
  superadmin:"SUPERADMINISTRADOR",
  company_admin:"ADMINISTRADOR DA EMPRESA",
  usuario:"CONSULTA",
  lojas:"CADASTRO"
};

const icons = {
  dashboard:'<svg viewBox="0 0 24 24"><rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="5" rx="2"/><rect x="13" y="10" width="8" height="11" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/></svg>',
  assets:'<svg viewBox="0 0 24 24"><path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5z"/><path d="m4.5 7.8 7.5 4.3 7.5-4.3M12 12v8.5"/></svg>',
  companies:'<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 8h2m4 0h2M8 12h2m4 0h2M8 16h2m4 0h2"/></svg>',
  stores:'<svg viewBox="0 0 24 24"><path d="M3 10h18l-1.5-6h-15zM5 10v10h14V10M9 20v-6h6v6"/></svg>',
  users:'<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.5"/><path d="M2.8 20a6.2 6.2 0 0 1 12.4 0M16 5.5a3.5 3.5 0 0 1 0 6.8M17 14a5.5 5.5 0 0 1 4.2 5.3"/></svg>',
  reports:'<svg viewBox="0 0 24 24"><path d="M4 19V5m0 14h17M8 16v-5m5 5V7m5 9v-8"/></svg>',
  settings:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.2 1-1.2 2.1-1.5-.5a8 8 0 0 1-1.7 1l-.3 1.6h-2.4l-.3-1.6a8 8 0 0 1-1.7-1l-1.5.5-1.2-2.1 1.2-1a8 8 0 0 1 0-2l-1.2-1 1.2-2.1 1.5.5a8 8 0 0 1 1.7-1l.3-1.6h2.4l.3 1.6a8 8 0 0 1 1.7 1l1.5-.5 1.2 2.1-1.2 1a8 8 0 0 1 0 2Z"/></svg>',
  logout:'<svg viewBox="0 0 24 24"><path d="M10 17l5-5-5-5M15 12H3"/><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6"/></svg>',
  search:'<svg viewBox="0 0 24 24"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></svg>',
  bell:'<svg viewBox="0 0 24 24"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg>'
};

function brand() {
  return `<div class="brand-lockup"><div class="brand-mark">WP<span>.</span></div><div class="brand-word">GESTOR<small>WP INTEGRADA</small></div></div>`;
}

function renderSetup() {
  app.innerHTML = `
    <main class="setup-screen">
      <section class="setup-card">
        ${brand()}
        <div class="eyebrow">PRIMEIRA CONFIGURAÇÃO</div>
        <h1>Seu ambiente está quase pronto.</h1>
        <p>Para ativar o WP Gestor, configure o Firebase no arquivo <code>src/firebase.js</code>, publique as regras do Firestore e cadastre o primeiro usuário administrador.</p>
        <div class="setup-steps">
          <div><b>01</b><span>Configurar Firebase Authentication</span></div>
          <div><b>02</b><span>Publicar as regras de segurança</span></div>
          <div><b>03</b><span>Criar o perfil em <code>users/{uid}</code></span></div>
        </div>
        <p class="muted tiny">O sistema ainda está em desenvolvimento. Os módulos comerciais e a integração com Google Drive serão conectados nas próximas etapas.</p>
      </section>
    </main>`;
}

function renderLogin(error = "") {
  app.innerHTML = `
    <main class="login-screen">
      <div class="login-art">
        <div class="art-glow"></div>
        <div class="art-content">
          ${brand()}
          <div class="art-copy">
            <div class="eyebrow">PLATAFORMA DE GESTÃO</div>
            <h1>Controle inteligente.<br><em>Decisões melhores.</em></h1>
            <p>Patrimônio, unidades e equipes em um só lugar. Uma experiência de gestão feita para empresas que querem evoluir.</p>
          </div>
          <div class="art-footer">TECNOLOGIA E GESTÃO <span>•</span> WP INTEGRADA</div>
        </div>
      </div>
      <section class="login-side">
        <div class="login-box">
          <div class="mobile-brand">${brand()}</div>
          <div class="eyebrow">BEM-VINDO DE VOLTA</div>
          <h2>Acesse sua conta</h2>
          <p class="muted">Entre com suas credenciais para continuar.</p>
          ${error ? `<div class="alert-error">${escapeHtml(error)}</div>` : ""}
          <form id="loginForm" class="login-form">
            <label>E-mail corporativo<input name="email" type="email" autocomplete="username" required placeholder="nome@empresa.com.br"></label>
            <label>Senha<input name="password" type="password" autocomplete="current-password" required placeholder="Digite sua senha"></label>
            <button class="btn-primary" type="submit">Entrar na plataforma <span>→</span></button>
          </form>
          <div class="login-security"><span class="security-dot"></span> Ambiente protegido por autenticação segura</div>
        </div>
        <div class="login-copyright">© ${new Date().getFullYear()} WP Integrada. Todos os direitos reservados.</div>
      </section>
    </main>`;
  document.querySelector("#loginForm").addEventListener("submit", async event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const button = event.currentTarget.querySelector("button");
    button.disabled = true;
    button.innerHTML = 'Autenticando <span class="spinner"></span>';
    try {
      await signInWithEmailAndPassword(auth, data.get("email"), data.get("password"));
    } catch (err) {
      renderLogin("Não foi possível entrar. Confira seu e-mail e senha ou solicite acesso ao administrador.");
    }
  });
}

async function loadProfile(user) {
  const snap = await getDoc(doc(db, "users", user.uid));
  if (!snap.exists() || snap.data().active === false) {
    await signOut(auth);
    throw new Error("Usuário sem perfil ativo. Solicite acesso ao administrador da plataforma.");
  }
  return { uid: user.uid, ...snap.data() };
}

function allowed(role, action) {
  const permissions = {
    superadmin:["view","create","edit","delete","manage"],
    company_admin:["view","create","edit","delete","manage"],
    usuario:["view"],
    lojas:["create"]
  };
  return (permissions[role] || []).includes(action);
}

async function loadAssets() {
  const companyId = profile.companyId;
  const storeIds = profile.storeIds || [];
  if (profile.role === "superadmin") { assets = []; return; }
  const all = [];
  for (const storeId of storeIds) {
    const ref = collection(db, "companies", companyId, "stores", storeId, "assets");
    const snap = await getDocs(query(ref, orderBy("createdAt", "desc")));
    snap.forEach(d => all.push({ id:d.id, storeId, ...d.data() }));
  }
  assets = all;
}

function navItem(id, label, group = "") {
  return `<button class="nav-item ${activePage===id?"active":""}" data-page="${id}">
    <span class="nav-icon">${icons[id]}</span><span>${label}</span>
    ${id==="assets" ? `<span class="nav-count">${assets.length}</span>` : ""}
  </button>`;
}

function shell(content, title, subtitle) {
  const name = profile.name || currentUser.email;
  const initials = String(name).split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase();
  app.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="sidebar-top">${brand()}<button class="collapse-btn" title="Recolher menu">‹</button></div>
        <div class="workspace-label">ESPAÇO DE TRABALHO</div>
        <div class="workspace-switch"><div class="workspace-avatar">W</div><div><b>${escapeHtml(profile.companyName || (profile.role==="superadmin"?"WP Integrada":"Minha empresa"))}</b><small>${profile.role==="superadmin"?"Painel global":"Conta empresarial"}</small></div><span>⌄</span></div>
        <nav class="nav">
          <div class="nav-caption">VISÃO GERAL</div>
          ${navItem("dashboard","Dashboard")}
          <div class="nav-caption">GESTÃO</div>
          ${navItem("assets","Patrimônio")}
          ${profile.role==="superadmin" || allowed(profile.role,"manage") ? navItem("companies","Empresas") : ""}
          ${profile.role==="superadmin" || allowed(profile.role,"manage") ? navItem("stores","Unidades / Filiais") : ""}
          ${profile.role==="superadmin" || allowed(profile.role,"manage") ? navItem("users","Usuários e acessos") : ""}
          <div class="nav-caption">INTELIGÊNCIA</div>
          ${navItem("reports","Relatórios")}
          <div class="nav-caption">SISTEMA</div>
          ${profile.role==="superadmin" || allowed(profile.role,"manage") ? navItem("settings","Configurações") : ""}
        </nav>
        <div class="sidebar-bottom">
          <div class="help-card"><div class="help-icon">✦</div><b>Precisa de ajuda?</b><p>Consulte o suporte WP Integrada.</p><a href="mailto:suporte@wpintegrada.com.br">Falar com suporte ↗</a></div>
          <button id="logout" class="logout-btn">${icons.logout}<span>Sair da plataforma</span></button>
        </div>
      </aside>
      <main class="main-area">
        <header class="topbar">
          <div class="breadcrumb">WP GESTOR <span>/</span> ${escapeHtml(title.toUpperCase())}</div>
          <div class="top-actions"><div class="secure-label"><span></span> Sistema seguro</div><button class="icon-btn" aria-label="Notificações">${icons.bell}</button><div class="user-chip"><div class="user-avatar">${escapeHtml(initials)}</div><div><b>${escapeHtml(name)}</b><small>${roleLabels[profile.role] || "USUÁRIO"}</small></div><span>⌄</span></div></div>
        </header>
        <section class="page-content">
          <div class="page-heading"><div><div class="eyebrow">${subtitle}</div><h1>${title}</h1><p>${escapeHtml(profile.companyName || "Visão consolidada da plataforma")}</p></div><div class="page-date">${new Intl.DateTimeFormat("pt-BR",{dateStyle:"full"}).format(new Date())}</div></div>
          ${content}
          <footer class="page-footer">WP GESTOR <span>•</span> Uma solução <b>WP Integrada</b><span class="footer-version">Ambiente em desenvolvimento</span></footer>
        </section>
      </main>
    </div>`;
  document.querySelector("#logout").onclick = () => signOut(auth);
  document.querySelectorAll("[data-page]").forEach(btn => btn.addEventListener("click", () => {
    activePage = btn.dataset.page;
    renderApp();
  }));
}

function metric(icon, label, value, note, tone="gold") {
  return `<article class="metric-card"><div class="metric-top"><span>${label}</span><span class="metric-icon ${tone}">${icon}</span></div><div class="metric-value">${value}</div><div class="metric-note">${note}</div></article>`;
}

function dashboardContent() {
  const canView = allowed(profile.role,"view");
  const inUse = assets.filter(a=>a.statusOperacional==="EM USO").length;
  const stock = assets.filter(a=>a.statusOperacional==="ESTOQUE").length;
  const maintenance = assets.filter(a=>["MANUTENÇÃO","DEFEITO"].includes(a.statusOperacional)).length;
  return `
    <div class="welcome-banner"><div><div class="eyebrow">CENTRAL DE CONTROLE</div><h2>Olá, ${escapeHtml((profile.name||"").split(" ")[0] || "bem-vindo")} 👋</h2><p>Acompanhe os principais indicadores da sua operação.</p></div><div class="banner-mark">WP<span>.</span></div></div>
    <div class="section-title"><div><h3>Resumo operacional</h3><p>Indicadores atualizados conforme seus acessos.</p></div><span class="live-tag"><i></i> VISÃO GERAL</span></div>
    <div class="metrics-grid">
      ${metric("▧","Total de patrimônios",canView?assets.length:"—","Registros disponíveis","gold")}
      ${metric("✓","Em utilização",canView?inUse:"—","Ativos em operação","green")}
      ${metric("▣","Em estoque",canView?stock:"—","Disponíveis para alocação","blue")}
      ${metric("↻","Atenção necessária",canView?maintenance:"—","Manutenção ou defeito","red")}
    </div>
    <div class="dashboard-grid">
      <section class="surface-card activity-card"><div class="card-heading"><div><h3>Patrimônio recente</h3><p>Últimos registros cadastrados</p></div><button class="text-action" data-page="assets">Ver patrimônio →</button></div>
        ${canView ? recentAssets() : `<div class="empty-state"><div class="empty-symbol">▧</div><b>Acesso de cadastro</b><p>Seu perfil pode cadastrar patrimônios, mas não visualizar a base.</p></div>`}
      </section>
      <section class="surface-card status-card"><div class="card-heading"><div><h3>Distribuição por status</h3><p>Visão dos ativos cadastrados</p></div></div>
        ${canView ? statusBreakdown(inUse,stock,maintenance,assets.length) : `<div class="empty-state"><p>Indicadores indisponíveis para este perfil.</p></div>`}
      </section>
    </div>`;
}

function recentAssets() {
  if (!assets.length) return `<div class="empty-state"><div class="empty-symbol">▧</div><b>Nenhum patrimônio cadastrado</b><p>Quando houver registros, eles aparecerão aqui.</p></div>`;
  return `<div class="recent-list">${assets.slice(0,5).map(a=>`<div class="recent-row"><div class="asset-symbol">▧</div><div class="recent-info"><b>${escapeHtml(a.nome)}</b><small>${escapeHtml(a.etiqueta)} · ${escapeHtml(a.local)}</small></div><span class="status-pill ${statusClass(a.statusOperacional)}">${escapeHtml(a.statusOperacional)}</span></div>`).join("")}</div>`;
}
function statusClass(s) { return s==="EM USO"?"s-green":s==="ESTOQUE"?"s-blue":"s-red"; }
function statusBreakdown(a,b,c,total) {
  const pct = n => total ? Math.round(n/total*100) : 0;
  return `<div class="status-total"><b>${total}</b><span>patrimônios cadastrados</span></div>
    <div class="bar-stack"><i class="bar-green" style="width:${pct(a)}%"></i><i class="bar-blue" style="width:${pct(b)}%"></i><i class="bar-red" style="width:${pct(c)}%"></i></div>
    <div class="legend-list"><div><i class="legend-dot green"></i><span>Em utilização</span><b>${a}</b></div><div><i class="legend-dot blue"></i><span>Em estoque</span><b>${b}</b></div><div><i class="legend-dot red"></i><span>Manutenção / defeito</span><b>${c}</b></div></div>`;
}

function assetRows(term="") {
  const rows = assets.filter(a => !term || [a.etiqueta,a.nome,a.serie,a.categoria,a.alocadoPara,a.local].some(v=>String(v||"").toLocaleLowerCase("pt-BR").includes(term)));
  if (!rows.length) return `<tr><td colspan="7" class="empty-cell">Nenhum patrimônio encontrado.</td></tr>`;
  return rows.map(a=>`<tr><td><b class="tag-code">${escapeHtml(a.etiqueta)}</b></td><td><b>${escapeHtml(a.nome)}</b><small>${escapeHtml(a.serie)}</small></td><td>${escapeHtml(a.categoria)}</td><td>${escapeHtml(a.alocadoPara)}</td><td>${escapeHtml(a.local)}</td><td><span class="status-pill ${statusClass(a.statusOperacional)}">${escapeHtml(a.statusOperacional)}</span></td><td>${escapeHtml(a.situacao)}</td></tr>`).join("");
}

function assetsContent() {
  const canView=allowed(profile.role,"view"), canCreate=allowed(profile.role,"create");
  return `<div class="section-title"><div><h3>Base patrimonial</h3><p>Cadastre e acompanhe os bens vinculados à sua empresa.</p></div>${canCreate?'<button class="btn-primary compact" id="openAsset">+ Novo patrimônio</button>':""}</div>
    ${canCreate?`<section class="surface-card form-card" id="assetPanel" hidden><div class="card-heading"><div><h3>Novo patrimônio</h3><p>Preencha os dados para registrar um novo bem.</p></div><button id="closeAsset" class="close-btn">×</button></div>
      <form id="assetForm" class="asset-form">
        <label>Etiqueta *<input name="etiqueta" required placeholder="PAT-01029"></label>
        <label>Nome do ativo *<input name="nome" required placeholder="Notebook Dell"></label>
        <label>Número de série *<input name="serie" required></label>
        <label>Categoria *<select name="categoria" required><option value="">Selecione</option>${["NOTEBOOK","MONITOR","ALL IN ONE","THINKCENTER","SMARTPHONE","NOBREAK","TABLET","HEADSET","KIT TECLADO / MOUSE","IMPRESSORA 3D","ACESSORIOS-OUTROS"].map(x=>`<option>${x}</option>`).join("")}</select></label>
        <label>Alocado para *<input name="alocadoPara" required></label>
        <label>Local / setor *<input name="local" required></label>
        <label>Status *<select name="statusOperacional" required><option>EM USO</option><option>ESTOQUE</option><option>DEFEITO</option><option>MANUTENÇÃO</option></select></label>
        <label>Situação física *<select name="situacao" required><option>NOVO</option><option>RECONDICIONADO</option><option>USADO BOM</option><option>USADO MARCAS</option><option>AVARIADO</option><option>MAL FUNCIONAMENTO</option></select></label>
        <div class="form-actions"><button type="button" id="cancelAsset" class="btn-secondary">Cancelar</button><button class="btn-primary" type="submit">Salvar patrimônio</button></div>
      </form><p class="muted tiny">A empresa e a unidade são determinadas pelo vínculo do usuário autenticado.</p>
    </section>`:""}
    ${canView?`<section class="surface-card table-card"><div class="table-toolbar"><div><h3>Todos os patrimônios</h3><p>${assets.length} registro(s) nesta visualização</p></div><div class="search-field">${icons.search}<input id="search" placeholder="Buscar patrimônio..."></div></div><div class="table-wrap"><table><thead><tr><th>ETIQUETA</th><th>ATIVO / SÉRIE</th><th>CATEGORIA</th><th>RESPONSÁVEL</th><th>LOCAL</th><th>STATUS</th><th>CONDIÇÃO</th></tr></thead><tbody id="assetRows">${assetRows()}</tbody></table></div></section>`:`<section class="surface-card empty-state"><b>Seu perfil permite cadastrar novos patrimônios.</b><p>A visualização da base não está habilitada para seu usuário.</p></section>`}`;
}

function placeholderContent(page) {
  const info = {
    companies:["Empresas","Gerencie as organizações cadastradas na plataforma.","O cadastro e gerenciamento de empresas será disponibilizado no módulo administrativo."],
    stores:["Unidades e filiais","Organize os locais e unidades de cada empresa.","O gerenciamento de unidades será conectado à estrutura multiempresa do Firebase."],
    users:["Usuários e acessos","Defina quem pode visualizar, cadastrar e administrar informações.","O gerenciamento de usuários e permissões será concluído nesta etapa."],
    reports:["Relatórios gerenciais","Transforme os dados patrimoniais em informações para decisão.","Os relatórios e exportações serão implementados após a consolidação dos cadastros."],
    settings:["Configurações","Personalize os parâmetros e integrações da sua operação.","As configurações gerais e integrações serão ativadas nas próximas etapas."]
  };
  const [title,sub,desc]=info[page];
  return `<section class="surface-card coming-soon"><div class="coming-icon">${icons[page]||icons.settings}</div><div class="eyebrow">MÓDULO EM DESENVOLVIMENTO</div><h2>${title}</h2><p>${desc}</p><span class="coming-note">Este espaço já faz parte da estrutura visual do WP Gestor.</span></section>`;
}

function renderApp() {
  const pages = {
    dashboard:["Dashboard","VISÃO GERAL"],
    assets:["Patrimônio","CONTROLE PATRIMONIAL"],
    companies:["Empresas","ADMINISTRAÇÃO"],
    stores:["Unidades / Filiais","ESTRUTURA ORGANIZACIONAL"],
    users:["Usuários e acessos","CONTROLE DE ACESSO"],
    reports:["Relatórios","INTELIGÊNCIA"],
    settings:["Configurações","PREFERÊNCIAS"]
  };
  const [title,subtitle]=pages[activePage]||pages.dashboard;
  const content=activePage==="dashboard"?dashboardContent():activePage==="assets"?assetsContent():placeholderContent(activePage);
  shell(content,title,subtitle);
  const open=document.querySelector("#openAsset");
  if(open) open.onclick=()=>{document.querySelector("#assetPanel").hidden=false;document.querySelector("#assetPanel").scrollIntoView({behavior:"smooth",block:"start"});};
  const close=()=>{const panel=document.querySelector("#assetPanel");if(panel)panel.hidden=true;};
  ["closeAsset","cancelAsset"].forEach(id=>{const el=document.querySelector("#"+id);if(el)el.onclick=close;});
  const form=document.querySelector("#assetForm");
  if(form) form.addEventListener("submit",saveAsset);
  const search=document.querySelector("#search");
  if(search) search.addEventListener("input",()=>{document.querySelector("#assetRows").innerHTML=assetRows(search.value.toLocaleLowerCase("pt-BR"));});
  document.querySelectorAll('[data-page="assets"]').forEach(b=>b.addEventListener("click",()=>{activePage="assets";renderApp();}));
}

async function saveAsset(event) {
  event.preventDefault();
  if (!allowed(profile.role,"create")) return;
  const form=new FormData(event.currentTarget);
  const storeId=profile.storeIds?.[0];
  if(!profile.companyId||!storeId){alert("Seu usuário ainda não está vinculado a uma empresa e unidade. Solicite a configuração do acesso.");return;}
  const data=Object.fromEntries(form.entries());
  const duplicate=assets.some(a=>a.etiqueta?.toUpperCase()===data.etiqueta.trim().toUpperCase());
  if(duplicate&&!confirm("Já existe uma etiqueta igual na sua lista. Deseja continuar?"))return;
  const submit=event.currentTarget.querySelector('button[type="submit"]');
  submit.disabled=true;submit.textContent="Salvando...";
  try{
    const ref=collection(db,"companies",profile.companyId,"stores",storeId,"assets");
    await addDoc(ref,{...data,etiqueta:data.etiqueta.trim().toUpperCase(),companyId:profile.companyId,storeId,createdBy:currentUser.uid,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
    await loadAssets();activePage="assets";renderApp();alert("Patrimônio cadastrado com sucesso.");
  }catch(err){console.error(err);alert("Não foi possível salvar. Confira sua conexão e suas permissões.");submit.disabled=false;submit.textContent="Salvar patrimônio";}
}

if(!firebaseConfigured){renderSetup();}
else{
  onAuthStateChanged(auth,async user=>{
    currentUser=user;
    if(!user){profile=null;renderLogin();return;}
    try{profile=await loadProfile(user);await loadAssets();activePage="dashboard";renderApp();}
    catch(err){renderLogin(err.message);}
  });
}
