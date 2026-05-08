"""Genera el roadmap de lanzamiento de Axis Life RPG como PDF."""
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from datetime import date

# ── Colores brand Axis ────────────────────────────────────────────────────────
PURPLE      = colors.HexColor("#7c3aed")
PURPLE_LITE = colors.HexColor("#a78bfa")
CYAN        = colors.HexColor("#06b6d4")
GOLD        = colors.HexColor("#f59e0b")
GREEN       = colors.HexColor("#10b981")
RED         = colors.HexColor("#ef4444")
ORANGE      = colors.HexColor("#f97316")
BG_DARK     = colors.HexColor("#0d0d18")
BG_CARD     = colors.HexColor("#14141f")
BORDER      = colors.HexColor("#2d2d4a")
WHITE       = colors.white
GRAY        = colors.HexColor("#9ca3af")
GRAY_DARK   = colors.HexColor("#374151")

OUTPUT = "AXIS_Roadmap_Lanzamiento.pdf"

doc = SimpleDocTemplate(
    OUTPUT,
    pagesize=A4,
    leftMargin=2*cm, rightMargin=2*cm,
    topMargin=2*cm, bottomMargin=2*cm,
    title="Axis Life RPG — Roadmap de Lanzamiento",
    author="Axis RPG",
)

styles = getSampleStyleSheet()

def sty(name, **kw):
    return ParagraphStyle(name, **kw)

S_TITLE = sty("Title",
    fontName="Helvetica-Bold", fontSize=28, textColor=WHITE,
    spaceAfter=4, alignment=TA_CENTER)
S_SUBTITLE = sty("Subtitle",
    fontName="Helvetica", fontSize=12, textColor=PURPLE_LITE,
    spaceAfter=2, alignment=TA_CENTER)
S_DATE = sty("Date",
    fontName="Helvetica", fontSize=9, textColor=GRAY,
    spaceAfter=0, alignment=TA_CENTER)
S_SECTION = sty("Section",
    fontName="Helvetica-Bold", fontSize=14, textColor=PURPLE_LITE,
    spaceBefore=18, spaceAfter=6)
S_PHASE = sty("Phase",
    fontName="Helvetica-Bold", fontSize=11, textColor=WHITE,
    spaceBefore=10, spaceAfter=4)
S_BODY = sty("Body",
    fontName="Helvetica", fontSize=9.5, textColor=GRAY,
    spaceBefore=2, spaceAfter=2, leading=14)
S_BULLET = sty("Bullet",
    fontName="Helvetica", fontSize=9.5, textColor=GRAY,
    spaceBefore=2, spaceAfter=2, leading=14, leftIndent=14,
    bulletIndent=4)
S_NOTE = sty("Note",
    fontName="Helvetica-Oblique", fontSize=9, textColor=PURPLE_LITE,
    spaceBefore=4, spaceAfter=4, leftIndent=8)
S_TAG = sty("Tag",
    fontName="Helvetica-Bold", fontSize=8.5, textColor=WHITE,
    alignment=TA_CENTER)
S_SMALL = sty("Small",
    fontName="Helvetica", fontSize=8, textColor=GRAY,
    spaceBefore=1, spaceAfter=1)
S_LABEL = sty("Label",
    fontName="Helvetica-Bold", fontSize=9, textColor=WHITE)

def hr(color=BORDER, thickness=0.5):
    return HRFlowable(width="100%", thickness=thickness, color=color, spaceAfter=6, spaceBefore=4)

def phase_table(phases):
    """Tabla visual de fases con colores."""
    data = [[Paragraph(p["label"], S_TAG), Paragraph(p["name"], S_LABEL),
             Paragraph(p["time"], S_SMALL), Paragraph(p["status"], S_SMALL)]
            for p in phases]
    t = Table(data, colWidths=[2.2*cm, 8*cm, 3*cm, 3*cm])
    colors_list = [p["color"] for p in phases]
    style = [
        ("BACKGROUND", (0, 0), (0, -1), BORDER),
        ("ALIGN",      (0, 0), (0, -1), "CENTER"),
        ("VALIGN",     (0, 0), (-1, -1), "MIDDLE"),
        ("ROWBACKGROUNDS", (1, 0), (-1, -1), [BG_CARD, BG_DARK]),
        ("GRID",       (0, 0), (-1, -1), 0.3, BORDER),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
    ]
    for i, color in enumerate(colors_list):
        style.append(("BACKGROUND", (0, i), (0, i), color))
    t.setStyle(TableStyle(style))
    return t


def kv_table(rows, col1=7*cm, col2=9.5*cm):
    data = [[Paragraph(k, S_LABEL), Paragraph(v, S_BODY)] for k, v in rows]
    t = Table(data, colWidths=[col1, col2])
    t.setStyle(TableStyle([
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [BG_CARD, BG_DARK]),
        ("GRID",       (0, 0), (-1, -1), 0.3, BORDER),
        ("VALIGN",     (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
    ]))
    return t


def priority_badge(label, color):
    s = ParagraphStyle("badge", fontName="Helvetica-Bold", fontSize=8,
                       textColor=WHITE, backColor=color,
                       borderPadding=2, alignment=TA_CENTER)
    return Paragraph(label, s)


story = []

# ── PORTADA ────────────────────────────────────────────────────────────────────
story += [
    Spacer(1, 1*cm),
    Paragraph("AXIS", S_TITLE),
    Paragraph("The Life RPG", S_SUBTITLE),
    Paragraph("Roadmap de Lanzamiento — Estrategia Freemium", S_SUBTITLE),
    Paragraph(f"Generado: {date.today().strftime('%d %B %Y')}", S_DATE),
    Spacer(1, 0.5*cm),
    hr(PURPLE, 1.5),
]

# ── VISIÓN ─────────────────────────────────────────────────────────────────────
story += [
    Paragraph("Visión del Producto", S_SECTION),
    Paragraph(
        "Axis convierte tus hábitos reales en un RPG: tu disciplina diaria genera stats (VIT, FOC, SAB, DIS, CRE, VOL) "
        "que hacen crecer a tu personaje de forma <b>honesta</b> — sin trampa, sin números vacíos. "
        "El Consejero Arcano (Claude AI) analiza tus datos y da feedback narrativo y accionable.",
        S_BODY),
    Spacer(1, 0.3*cm),
    kv_table([
        ("Plataforma", "Web PWA (instalable en móvil y desktop)"),
        ("Backend", "FastAPI + PostgreSQL · Hostinger VPS"),
        ("Frontend", "Next.js 16 + Tailwind CSS"),
        ("Modelo de negocio", "Freemium — gratis con límites, premium desbloquea AI ilimitada + extras"),
        ("Mercado objetivo", "Hispanohablantes 18-35 interesados en productividad y gamificación"),
    ]),
]

# ── FASES OVERVIEW ─────────────────────────────────────────────────────────────
story += [
    Paragraph("Fases del Roadmap", S_SECTION),
    phase_table([
        {"label": "FASE 0", "name": "Infraestructura de producción",    "time": "Semana 1",   "status": "🔴 Bloqueante",  "color": RED},
        {"label": "FASE 1", "name": "Beta cerrada (primeros 50 users)", "time": "Semanas 2-3","status": "🟠 Prioritario", "color": ORANGE},
        {"label": "FASE 2", "name": "Freemium + pagos",                 "time": "Semanas 4-6","status": "🟡 Importante",  "color": GOLD},
        {"label": "FASE 3", "name": "Lanzamiento público",              "time": "Semana 7+",  "status": "🟢 Objetivo",    "color": GREEN},
        {"label": "FASE 4", "name": "Crecimiento y retención",          "time": "Mes 3+",     "status": "🔵 Largo plazo", "color": CYAN},
    ]),
]

# ── FASE 0 ─────────────────────────────────────────────────────────────────────
story += [
    Paragraph("FASE 0 — Infraestructura de Producción", S_SECTION),
    Paragraph("Objetivo: app estable, segura y accesible desde internet con dominio propio.", S_BODY),
    hr(),
    Paragraph("0.1 · Dominio y DNS", S_PHASE),
    kv_table([
        ("Acción",         "Comprar dominio en Hostinger → apuntar A record a IP pública del VPS"),
        ("Recomendación",  "axisrpg.app / axislife.io / getaxis.app (disponibilidad variable)"),
        ("Tiempo estimado","15-30 minutos"),
        ("Coste",          "~10-15€/año"),
    ]),
    Paragraph("0.2 · HTTPS con Let's Encrypt + Nginx", S_PHASE),
    kv_table([
        ("Acción",         "Instalar Nginx + Certbot en el VPS. Nginx como reverse proxy → FastAPI:8000 y Next.js:3000"),
        ("Comandos clave", "sudo apt install nginx certbot python3-certbot-nginx\nsudo certbot --nginx -d tudominio.com"),
        ("Renovación",     "Automática vía cron (certbot lo configura solo)"),
    ]),
    Paragraph("0.3 · PostgreSQL en producción", S_PHASE),
    kv_table([
        ("Acción",         "Levantar el servicio postgres del docker-compose.yml en el VPS"),
        ("Migrar datos",   "alembic upgrade head (primera vez en Postgres vacío)\nalembic stamp head (si ya tienes datos en SQLite)"),
        ("Backup diario",  "pg_dump axis_db | gzip > backup_$(date +%Y%m%d).sql.gz"),
    ]),
    Paragraph("0.4 · Variables de entorno en producción", S_PHASE),
    kv_table([
        ("SECRET_KEY",       "Generar: python -c \"import secrets; print(secrets.token_hex(32))\""),
        ("DATABASE_URL",     "postgresql://axis_user:password@localhost:5432/axis_db"),
        ("ANTHROPIC_API_KEY","Tu key de console.anthropic.com"),
        ("CORS_ORIGINS",     "https://tudominio.com"),
        ("APP_URL",          "https://tudominio.com"),
        ("SMTP_*",           "Gmail App Password para emails de bienvenida y reset"),
    ]),
    Paragraph("0.5 · Monitoring básico", S_PHASE),
    Paragraph("• <b>Sentry</b> (sentry.io) — gratis hasta 5k errores/mes. SDK de Python (FastAPI) y JavaScript (Next.js).", S_BULLET),
    Paragraph("• <b>UptimeRobot</b> (uptimerobot.com) — gratis. Ping /api/health cada 5 min. Alerta por email si cae.", S_BULLET),
]

# ── FASE 1 ─────────────────────────────────────────────────────────────────────
story += [
    Paragraph("FASE 1 — Beta Cerrada (50 usuarios)", S_SECTION),
    Paragraph("Objetivo: validar el producto con usuarios reales antes de abrir el registro.", S_BODY),
    hr(),
    Paragraph("1.1 · Landing page orientada a conversión", S_PHASE),
    Paragraph("La landing actual existe pero necesita:", S_BODY),
    Paragraph("• Hero section con <b>propuesta de valor en 5 segundos</b>: screenshot del personaje + stats reales", S_BULLET),
    Paragraph("• Demo en GIF/video corto (30 seg) mostrando el loop: completar hábito → XP → stats suben", S_BULLET),
    Paragraph("• Formulario de <b>waitlist</b> (Mailchimp gratis o simple endpoint propio) con el CTA: \"Únete a la beta\"", S_BULLET),
    Paragraph("• Sección de clases (Warrior, Scholar, etc.) con descripción visual atractiva", S_BULLET),
    Paragraph("1.2 · Flujo de onboarding testeado en móvil real", S_PHASE),
    Paragraph("Probar el golden path en iOS Safari y Android Chrome:", S_BODY),
    Paragraph("• Registro → crear personaje → elegir stats → seleccionar hábitos → primer dashboard", S_BULLET),
    Paragraph("• Instalar como PWA (\"Añadir a pantalla de inicio\")", S_BULLET),
    Paragraph("• Completar un hábito → ver XP y animación → verificar toast de achievement", S_BULLET),
    Paragraph("1.3 · Primeros canales de adquisición", S_PHASE),
    kv_table([
        ("Reddit",       "r/selfimprovement, r/habitbuilding, r/indiegaming, r/getmotivated\nPost honesto: \"Hice una app que convierte tus hábitos en un RPG\""),
        ("Twitter/X",    "Thread con screenshots del personaje y evolución de stats. Hashtags: #buildinpublic #productivity"),
        ("ProductHunt",  "Preparar listing para lanzamiento formal (necesita 50-100 early adopters que lo upvoten el día D)"),
        ("Discord/Telegram","Crear comunidad pequeña para beta testers: feedback directo y sentido de pertenencia"),
    ]),
    Paragraph("1.4 · KPIs de la beta", S_PHASE),
    kv_table([
        ("Retención D1",  "≥ 40% de usuarios que se registran vuelven al día siguiente"),
        ("Retención D7",  "≥ 20% siguen usando la app a los 7 días"),
        ("Activación",    "≥ 60% completan el onboarding y crean al menos 1 hábito"),
        ("NPS informal",  "Preguntar directamente en Discord/email: ¿lo recomendarías?"),
    ]),
]

# ── FASE 2 ─────────────────────────────────────────────────────────────────────
story += [
    Paragraph("FASE 2 — Modelo Freemium + Pagos", S_SECTION),
    Paragraph("Objetivo: monetizar sin bloquear el valor core. El personaje y los hábitos son siempre gratis.", S_BODY),
    hr(),
    Paragraph("2.1 · Definición de tiers", S_PHASE),
    Table(
        [
            [Paragraph("<b>Feature</b>", S_LABEL),
             Paragraph("<b>Free</b>", S_LABEL),
             Paragraph("<b>Premium (~3-5€/mes)</b>", S_LABEL)],
            [Paragraph("Hábitos activos", S_BODY),   Paragraph("Hasta 10", S_BODY),       Paragraph("Ilimitados", S_BODY)],
            [Paragraph("Personaje + stats", S_BODY), Paragraph("✓ Completo", S_BODY),     Paragraph("✓ Completo", S_BODY)],
            [Paragraph("Consejero Arcano (IA)", S_BODY), Paragraph("5 mensajes/día", S_BODY), Paragraph("Ilimitado", S_BODY)],
            [Paragraph("Análisis semanal IA", S_BODY), Paragraph("1/semana", S_BODY),    Paragraph("Ilimitado + histórico", S_BODY)],
            [Paragraph("Historial de stats", S_BODY), Paragraph("30 días", S_BODY),       Paragraph("365 días", S_BODY)],
            [Paragraph("Exportar datos", S_BODY),    Paragraph("✗", S_BODY),              Paragraph("✓ CSV/JSON", S_BODY)],
            [Paragraph("Skins de personaje", S_BODY),Paragraph("Clase base", S_BODY),     Paragraph("Skins exclusivos", S_BODY)],
            [Paragraph("Badge premium en perfil", S_BODY), Paragraph("✗", S_BODY),        Paragraph("✓", S_BODY)],
        ],
        colWidths=[6*cm, 4.5*cm, 6*cm]
    ),
    Spacer(1, 0.3*cm),
    Paragraph("2.2 · Implementación técnica de pagos", S_PHASE),
    kv_table([
        ("Proveedor recomendado", "<b>Stripe</b> — mejor DX, disponible en España, soporte subscripciones"),
        ("Librería backend",       "stripe (pip install stripe) — webhooks en FastAPI para activar premium"),
        ("Tabla DB",               "Añadir columna is_premium en users + stripe_customer_id"),
        ("Middleware de límites",  "Decorador @require_tier en endpoints de IA: verifica user.is_premium"),
        ("Alternativa más simple", "LemonSqueezy — sin necesidad de empresa constituida en España"),
    ]),
    Paragraph("2.3 · Política anti-churn", S_PHASE),
    Paragraph("• Si un usuario premium cancela → downgrade graceful (no borrar datos, solo limitar features)", S_BULLET),
    Paragraph("• Email automático a los 3 días de inactividad: \"Tu personaje necesita entrenamiento\"", S_BULLET),
    Paragraph("• Semana gratuita de premium para nuevos usuarios en onboarding", S_BULLET),
]

# ── FASE 3 ─────────────────────────────────────────────────────────────────────
story += [
    Paragraph("FASE 3 — Lanzamiento Público", S_SECTION),
    Paragraph("Objetivo: lanzamiento coordinado para maximizar impacto inicial.", S_BODY),
    hr(),
    Paragraph("3.1 · Checklist pre-lanzamiento", S_PHASE),
    kv_table([
        ("Legal",          "Términos de uso + Política de privacidad (GDPR)\nPuedes generar una base en iubenda.com (~29€/año)"),
        ("SEO básico",     "Meta tags en landing page, Open Graph para redes sociales\nSitemap.xml y robots.txt"),
        ("Rendimiento",    "Lighthouse score ≥ 80 en móvil. Imágenes optimizadas. First paint < 3s"),
        ("Accesibilidad",  "Contraste de colores mínimo WCAG AA (el dark theme actual puede tener problemas)"),
        ("Stress test",    "k6 o Artillery: simular 100 usuarios concurrentes en el VPS"),
    ]),
    Paragraph("3.2 · ProductHunt Launch", S_PHASE),
    Paragraph("ProductHunt es la mayor oportunidad de tracción orgánica para una app indie:", S_BODY),
    Paragraph("• Preparar listing 2 semanas antes: tagline, screenshots, video demo de 90 segundos", S_BULLET),
    Paragraph("• Conseguir 50+ \"followers\" antes del día D (beta testers de Fase 1)", S_BULLET),
    Paragraph("• Lanzar martes o miércoles a las 00:01 PST (7:00 CET)", S_BULLET),
    Paragraph("• Estar disponible todo el día para responder comentarios", S_BULLET),
]

# ── FASE 4 ─────────────────────────────────────────────────────────────────────
story += [
    Paragraph("FASE 4 — Crecimiento y Retención", S_SECTION),
    Paragraph("Objetivo: loops de retención que traigan usuarios de vuelta cada día.", S_BODY),
    hr(),
    Paragraph("4.1 · Features de retención de alto impacto", S_PHASE),
    kv_table([
        ("Notificaciones push reales",  "Implementar Web Push API con backend (actualmente solo funciona en pestaña abierta)\nUsar web-push (npm) + VAPID keys en el backend"),
        ("Email semanal automático",    "Resumen con stats de la semana, mejor racha, y mensaje del Consejero\nSendGrid gratis hasta 100 emails/día"),
        ("Sistema de amigos/rival",     "Ver el personaje de un amigo, competir en rachas. Mayor viral loop"),
        ("Retos temporales",            "\"Reto de 21 días\" con quests especiales. Urgencia + comunidad"),
        ("Más clases y progresión",     "Subclases al nivel 20+, evolución visual del personaje"),
    ]),
    Paragraph("4.2 · Métricas clave a perseguir", S_PHASE),
    kv_table([
        ("MRR (Monthly Recurring Revenue)", "Objetivo mes 3: 100€ · mes 6: 500€ · mes 12: 2.000€"),
        ("DAU/MAU ratio",                   "≥ 20% (buena app de hábitos debe tener uso diario)"),
        ("Conversión free → premium",       "≥ 3-5% (media SaaS freemium)"),
        ("Churn mensual",                   "≤ 5% de usuarios premium cancelan cada mes"),
    ]),
]

# ── STACK Y COSTES ─────────────────────────────────────────────────────────────
story += [
    Paragraph("Stack Técnico y Costes Estimados", S_SECTION),
    kv_table([
        ("VPS Hostinger",        "~4-8€/mes (plan actual)"),
        ("Dominio",              "~10-15€/año"),
        ("Anthropic API (Claude Haiku)", "~0.0005$/1k tokens input. Con 100 users activos: ~5-15€/mes"),
        ("Sentry",               "Gratis (hasta 5k errores/mes)"),
        ("UptimeRobot",          "Gratis"),
        ("Stripe",               "0€ fijo + 1.4% + 0.25€ por transacción (tarjetas EU)"),
        ("Gmail SMTP",           "Gratis (App Password)"),
        ("SendGrid (emails mkt)","Gratis hasta 100/día"),
        ("Coste total mes 0-3",  "~15-25€/mes hasta tener ingresos"),
    ]),
    Paragraph(
        "💡 El modelo freemium con Claude Haiku es sostenible: el coste de IA por usuario activo free "
        "es muy bajo (~0.05€/mes con 5 mensajes/día). Los usuarios premium financian el crecimiento.",
        S_NOTE),
]

# ── PRÓXIMOS 7 DÍAS ────────────────────────────────────────────────────────────
story += [
    Paragraph("Plan de Acción — Próximos 7 Días", S_SECTION),
    Table(
        [
            [Paragraph("<b>Día</b>", S_LABEL), Paragraph("<b>Tarea</b>", S_LABEL), Paragraph("<b>Tiempo</b>", S_LABEL)],
            [Paragraph("1", S_BODY), Paragraph("Comprar dominio en Hostinger + apuntar DNS a VPS", S_BODY), Paragraph("30 min", S_BODY)],
            [Paragraph("1", S_BODY), Paragraph("Instalar Nginx + Certbot → HTTPS funcionando", S_BODY), Paragraph("1h", S_BODY)],
            [Paragraph("2", S_BODY), Paragraph("Levantar PostgreSQL en Docker + alembic upgrade head", S_BODY), Paragraph("1h", S_BODY)],
            [Paragraph("2", S_BODY), Paragraph("Configurar .env de producción con SECRET_KEY seguro", S_BODY), Paragraph("15 min", S_BODY)],
            [Paragraph("3", S_BODY), Paragraph("Configurar Sentry en FastAPI y Next.js", S_BODY), Paragraph("45 min", S_BODY)],
            [Paragraph("3", S_BODY), Paragraph("Configurar UptimeRobot → /api/health", S_BODY), Paragraph("15 min", S_BODY)],
            [Paragraph("4", S_BODY), Paragraph("Test completo golden path en móvil (iOS + Android)", S_BODY), Paragraph("2h", S_BODY)],
            [Paragraph("5", S_BODY), Paragraph("Mejorar landing page: hero section + demo GIF + waitlist", S_BODY), Paragraph("3h", S_BODY)],
            [Paragraph("6", S_BODY), Paragraph("Configurar SMTP (Gmail) → test email bienvenida", S_BODY), Paragraph("30 min", S_BODY)],
            [Paragraph("7", S_BODY), Paragraph("Post en Reddit r/selfimprovement + compartir con beta testers", S_BODY), Paragraph("1h", S_BODY)],
        ],
        colWidths=[1.5*cm, 12*cm, 3*cm]
    ),
]

# ── FOOTER ─────────────────────────────────────────────────────────────────────
story += [
    Spacer(1, 0.8*cm),
    hr(PURPLE, 1),
    Paragraph(
        f"AXIS Life RPG · Roadmap v1.0 · {date.today().strftime('%B %Y')} · Confidencial",
        sty("footer", fontName="Helvetica", fontSize=8, textColor=GRAY, alignment=TA_CENTER)
    ),
]

# ── BUILD ──────────────────────────────────────────────────────────────────────
def on_page(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(BG_DARK)
    canvas.rect(0, 0, A4[0], A4[1], fill=1, stroke=0)
    canvas.restoreState()

doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
print(f"PDF generado: {OUTPUT}")
