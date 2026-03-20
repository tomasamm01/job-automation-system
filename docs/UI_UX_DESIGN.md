# Job Automation System — Diseño UI/UX

> **Diseñado como**: Product SaaS enfocado en toma de decisiones basadas en datos  
> **Principio clave**: El score es el elemento visual dominante que guía todas las decisiones del usuario

---

## 1. Layout General de la Aplicación

### Estructura de Grid
```
┌─────────────────────────────────────────────────────────────────┐
│                         TOPBAR (56px)                           │
├────────────┬────────────────────────────────────────────────────┤
│            │                                                    │
│  SIDEBAR   │              CONTENIDO PRINCIPAL                   │
│   (240px)  │                                                    │
│            │                                                    │
│  Colapsable│                                                    │
│  a 64px    │                                                    │
│            │                                                    │
└────────────┴────────────────────────────────────────────────────┘
```

### **Sidebar (240px → 64px colapsado)**

**Secciones verticales:**

1. **Logo/Brand** (arriba)
   - Logo completo cuando expandido
   - Icono solo cuando colapsado
   - Click → vuelve al Dashboard

2. **Navegación Principal**
   - **Dashboard** — Icono: Grid/Home
   - **Jobs** — Icono: Briefcase (con badge de "nuevos")
   - **Applications** — Icono: Send/Paper plane
   - **Analytics** — Icono: BarChart

3. **Separador visual**

4. **Navegación Secundaria**
   - **Settings** — Icono: Gear
   - **Help** — Icono: Question mark

5. **Footer del Sidebar**
   - Botón collapse/expand
   - Versión de la app (texto muted)

**Decisión UX:** Sidebar fijo (no overlay) para mantener contexto de navegación. Colapsable para maximizar espacio en pantallas medianas.

---

### **Topbar (56px altura)**

```
┌─────────────────────────────────────────────────────────────────┐
│ [Breadcrumb]          [🔍 Search...]           [🔔] [Avatar ▾] │
└─────────────────────────────────────────────────────────────────┘
```

**Elementos de izquierda a derecha:**

1. **Breadcrumb contextual**
   - Muestra: `Dashboard` o `Jobs > Senior React Developer`
   - Tipografía: 14px, color muted para ancestros, bold para actual

2. **Search Bar (centro, 400px max-width)**
   - Placeholder: "Search jobs, companies, skills..."
   - Shortcut hint: `⌘K` visible dentro del input
   - Comportamiento: Command palette (modal) al hacer focus

3. **Área derecha**
   - **Notificaciones** — Badge rojo si hay nuevas
   - **Avatar + Dropdown** — Nombre, email, logout

**Decisión UX:** Search como command palette permite búsqueda global sin cambiar de contexto. El breadcrumb da orientación espacial.

---

## 2. Pantalla Principal: Job Dashboard

### Jerarquía Visual (de arriba a abajo)

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER DE PÁGINA                                               │
│  "Your Job Feed"                    [Last sync: 2 min ago] 🔄   │
├─────────────────────────────────────────────────────────────────┤
│  MÉTRICAS RÁPIDAS (4 cards horizontales)                        │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐               │
│  │ 47      │ │ 12      │ │ 8       │ │ 85      │               │
│  │ New Jobs│ │ High    │ │ Applied │ │ Avg     │               │
│  │ Today   │ │ Match   │ │ This Wk │ │ Score   │               │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘               │
├─────────────────────────────────────────────────────────────────┤
│  FILTERS BAR                                                    │
│  [Score ▾] [Location ▾] [Remote ▾] [Keywords...] [Clear all]   │
├─────────────────────────────────────────────────────────────────┤
│  SORT + VIEW TOGGLE                                             │
│  "Showing 47 jobs"    Sort: [Relevance ▾]    [≡ List] [⊞ Grid] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  JOB CARDS GRID (2-3 columnas responsive)                       │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │ [92] SCORE       │  │ [87] SCORE       │                    │
│  │ Senior React Dev │  │ Full Stack Eng   │                    │
│  │ Company • Remote │  │ Startup • NYC    │                    │
│  │ $120-150k        │  │ $100-130k        │                    │
│  │ [View] [Apply →] │  │ [View] [Apply →] │                    │
│  └──────────────────┘  └──────────────────┘                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### **Métricas Rápidas (KPI Cards)**

4 cards en fila horizontal con:
- **Número grande** (32px, bold)
- **Label descriptivo** (12px, muted)
- **Indicador de tendencia** (flecha verde/roja + %)
- **Hover:** Tooltip con contexto adicional

**Cards:**
1. **New Jobs Today** — Cuántos llegaron en 24h
2. **High Match (80+)** — Jobs con score alto (accionable)
3. **Applied This Week** — Tu actividad
4. **Avg Score** — Calidad promedio del feed

**Decisión UX:** Las métricas son clickeables y actúan como filtros rápidos. Click en "High Match" → filtra automáticamente.

---

### **Filters Bar**

**Diseño horizontal con chips/dropdowns:**

```
[Score: 70+ ▾] [Location: Any ▾] [Remote: Yes ▾] [🔍 Keywords...] [✕ Clear]
```

- **Score Filter:** Slider dentro del dropdown (0-100)
- **Location:** Multi-select con búsqueda
- **Remote:** Toggle (Any / Remote Only / On-site Only)
- **Keywords:** Input con tags (React, TypeScript, etc.)

**Estados de filtros activos:** Chips con fondo de color accent + ✕ para remover individualmente.

**Decisión UX:** Filtros visibles siempre (no colapsados) porque son la acción principal del usuario. "Clear all" solo aparece cuando hay filtros activos.

---

### **Job Cards Grid**

**Anatomía de cada card:**

```
┌────────────────────────────────────────┐
│ ┌────┐                                 │
│ │ 92 │  ← SCORE BADGE (prominente)     │
│ └────┘                                 │
│                                        │
│ Senior React Developer        [♡]      │
│ Acme Corp • San Francisco, CA          │
│ 🏠 Remote OK  •  💰 $120k-150k         │
│                                        │
│ ┌──────────────────────────────────┐   │
│ │ React  TypeScript  Node.js       │   │
│ └──────────────────────────────────┘   │
│                                        │
│ Posted 2 hours ago                     │
│                                        │
│ [View Details]        [Apply Now →]    │
└────────────────────────────────────────┘
```

**Elementos clave:**

1. **Score Badge** — Esquina superior izquierda, grande y colorizado
   - 90-100: Verde esmeralda (#10B981) — "Excellent"
   - 80-89: Verde lima (#84CC16) — "Great"
   - 70-79: Amarillo (#EAB308) — "Good"
   - 60-69: Naranja (#F97316) — "Fair"
   - <60: Gris (#9CA3AF) — "Low"

2. **Título del Job** — 18px, bold, truncado a 2 líneas max

3. **Company + Location** — 14px, muted

4. **Tags de metadata** — Iconos + texto (Remote, Salary)

5. **Skills chips** — Max 3 visibles + "+2 more"

6. **Timestamp** — "Posted X ago" en texto pequeño

7. **Actions**
   - **View Details** — Secundario (outline)
   - **Apply Now** — Primario (filled, con flecha)
   - **Bookmark** — Icono corazón en esquina

**Hover state:** Elevación sutil (shadow), borde accent

---

### **Estados Especiales**

**Loading State:**
```
┌────────────────────────────────────────┐
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  Skeleton cards (3-6 placeholders)     │
│  Animación shimmer de izq a derecha    │
└────────────────────────────────────────┘
```

**Empty State (sin resultados):**
```
┌────────────────────────────────────────┐
│           🔍                           │
│                                        │
│   No jobs match your filters           │
│                                        │
│   Try adjusting your criteria or       │
│   [Clear all filters]                  │
│                                        │
└────────────────────────────────────────┘
```

**Empty State (feed vacío):**
```
┌────────────────────────────────────────┐
│           📭                           │
│                                        │
│   Your job feed is empty               │
│                                        │
│   We're searching for jobs that        │
│   match your profile.                  │
│                                        │
│   [Configure Preferences]              │
└────────────────────────────────────────┘
```

---

## 3. Job Detail

### Layout de Dos Columnas

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Back to Jobs                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────┐  ┌───────────────────────────┐│
│  │     CONTENIDO PRINCIPAL     │  │    SIDEBAR STICKY         ││
│  │         (65%)               │  │       (35%)               ││
│  │                             │  │                           ││
│  │  [Logo] Company Name        │  │  ┌─────────────────────┐  ││
│  │  Job Title                  │  │  │       92            │  ││
│  │  Location • Remote • FT     │  │  │   MATCH SCORE       │  ││
│  │                             │  │  │                     │  ││
│  │  ─────────────────────────  │  │  │  [████████░░] 92%   │  ││
│  │                             │  │  └─────────────────────┘  ││
│  │  ## About the Role          │  │                           ││
│  │  [Descripción...]           │  │  Score Breakdown:         ││
│  │                             │  │  • Skills: 95%            ││
│  │  ## Requirements            │  │  • Experience: 88%        ││
│  │  • 5+ years React           │  │  • Location: 90%          ││
│  │  • TypeScript               │  │  • Salary: 85%            ││
│  │                             │  │                           ││
│  │  ## Benefits                │  │  ─────────────────────    ││
│  │  • Health insurance         │  │                           ││
│  │  • 401k                     │  │  [♡ Save]                 ││
│  │                             │  │  [Apply Now →]            ││
│  │  ## Skills                  │  │                           ││
│  │  [React] [TS] [Node]        │  │  Applied via: LinkedIn    ││
│  │                             │  │                           ││
│  └─────────────────────────────┘  └───────────────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### **Columna Principal (Izquierda)**

1. **Header del Job**
   - Logo de la empresa (48x48px, rounded)
   - Nombre de empresa (link a perfil)
   - Título del puesto (24px, bold)
   - Meta: Location • Remote/On-site • Full-time/Contract
   - Posted date

2. **Secciones de contenido** (con headings claros)
   - About the Role
   - Requirements
   - Responsibilities
   - Benefits & Perks
   - Skills (como chips)

3. **Información de la empresa** (colapsable)
   - Descripción breve
   - Tamaño, industria, funding

### **Sidebar Sticky (Derecha)**

**Score Card prominente:**
```
┌─────────────────────────────────┐
│           92                    │
│      MATCH SCORE                │
│                                 │
│  [████████████████░░░░] 92%     │
│                                 │
│  "Excellent match for your      │
│   profile"                      │
└─────────────────────────────────┘
```

**Score Breakdown (expandible):**
```
┌─────────────────────────────────┐
│  Score Breakdown          [▾]   │
├─────────────────────────────────┤
│  Skills Match         ████░ 95% │
│  Experience Level     ████░ 88% │
│  Location Fit         ████░ 90% │
│  Salary Range         ███░░ 85% │
│  Company Culture      ████░ 92% │
└─────────────────────────────────┘
```

Cada barra es interactiva: hover muestra tooltip con detalle ("You have 8/10 required skills").

**Actions (sticky en scroll):**
- **Save/Bookmark** — Icono corazón
- **Apply Now** — Botón primario grande
- **Share** — Icono compartir

**Meta info:**
- "Apply via: Company Website / LinkedIn / Email"
- "X people applied this week"

---

## 4. Application Tracker

### Vista Dual: Lista + Kanban

**Toggle en header:**
```
Applications (23)          [≡ List] [⊞ Kanban]
```

### **Vista Lista (Default)**

```
┌─────────────────────────────────────────────────────────────────┐
│  FILTERS: [All Statuses ▾] [Date Range ▾] [Search...]          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ [Logo] Senior React Dev     │ Applied │ Mar 15 │ [Actions] ││
│  │        Acme Corp            │  ●───○  │        │    ⋮      ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ [Logo] Full Stack Engineer  │Interview│ Mar 12 │ [Actions] ││
│  │        StartupXYZ           │  ●●●─○  │ 📅 Mar 20│   ⋮      ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Columnas de la tabla:**
1. **Job Info** — Logo + Título + Company
2. **Status Badge** — Con color y mini progress
3. **Applied Date**
4. **Next Action** — Si hay entrevista programada
5. **Actions Menu** — Update status, Add note, Archive

**Status Badges con colores:**
- **Applied** — Azul
- **Screening** — Amarillo
- **Interview** — Púrpura
- **Offer** — Verde
- **Rejected** — Gris
- **Withdrawn** — Gris outline

---

### **Vista Kanban**

```
┌──────────┬──────────┬──────────┬──────────┬──────────┐
│ Applied  │Screening │Interview │  Offer   │ Closed   │
│   (8)    │   (3)    │   (2)    │   (1)    │   (9)    │
├──────────┼──────────┼──────────┼──────────┼──────────┤
│ ┌──────┐ │ ┌──────┐ │ ┌──────┐ │ ┌──────┐ │ ┌──────┐ │
│ │Card 1│ │ │Card 4│ │ │Card 7│ │ │Card 9│ │ │Card10│ │
│ └──────┘ │ └──────┘ │ └──────┘ │ └──────┘ │ └──────┘ │
│ ┌──────┐ │ ┌──────┐ │ ┌──────┐ │          │ ┌──────┐ │
│ │Card 2│ │ │Card 5│ │ │Card 8│ │          │ │Card11│ │
│ └──────┘ │ └──────┘ │ └──────┘ │          │ └──────┘ │
│ ┌──────┐ │ ┌──────┐ │          │          │          │
│ │Card 3│ │ │Card 6│ │          │          │          │
│ └──────┘ │ └──────┘ │          │          │          │
│   ...    │          │          │          │          │
└──────────┴──────────┴──────────┴──────────┴──────────┘
```

**Interacción:** Drag & drop para mover entre columnas. Al soltar, modal para agregar nota opcional.

**Mini Card en Kanban:**
```
┌────────────────────┐
│ Senior React Dev   │
│ Acme Corp          │
│ Applied: Mar 15    │
│ [Score: 92]        │
└────────────────────┘
```

---

## 5. Componentes Clave

### **Job Card**

```
┌────────────────────────────────────────┐
│ SCORE    │                    │ SAVE   │
│  [92]    │  Job Title         │  [♡]   │
│          │  Company • Location│        │
├──────────┴────────────────────┴────────┤
│ 🏠 Remote  •  💰 $120k-150k            │
│                                        │
│ [React] [TypeScript] [+3]              │
│                                        │
│ Posted 2h ago                          │
├────────────────────────────────────────┤
│ [View Details]        [Apply Now →]    │
└────────────────────────────────────────┘
```

**Variantes:**
- **Default** — Como arriba
- **Compact** — Sin skills, para listas
- **Applied** — Con badge de status overlay

---

### **Score Badge**

**Tamaños:**
- **Large (64px)** — Para Job Detail sidebar
- **Medium (40px)** — Para Job Cards
- **Small (24px)** — Para listas compactas

**Anatomía:**
```
┌─────────┐
│   92    │  ← Número centrado, bold
│         │  ← Fondo con gradiente según rango
└─────────┘
```

**Colores por rango:**
- **90-100:** Verde esmeralda (#10B981) — "Excellent"
- **80-89:** Verde lima (#84CC16) — "Great"
- **70-79:** Amarillo (#EAB308) — "Good"
- **60-69:** Naranja (#F97316) — "Fair"
- **<60:** Gris (#9CA3AF) — "Low"

**Hover:** Tooltip con label ("Excellent Match")

---

### **Status Badge**

```
┌─────────────────┐
│ ● Interview     │
└─────────────────┘
```

**Estilos:**
- Pill shape (border-radius full)
- Dot de color + texto
- Fondo subtle del mismo color (10% opacity)

**Estados:**
| Status | Color | Dot |
|--------|-------|-----|
| Applied | Blue #3B82F6 | ● |
| Screening | Yellow #EAB308 | ● |
| Interview | Purple #8B5CF6 | ● |
| Offer | Green #10B981 | ● |
| Rejected | Gray #6B7280 | ● |
| Withdrawn | Gray outline | ○ |

---

### **Filters Panel**

**Horizontal (default para desktop):**
```
[Score: 70+ ▾] [Location ▾] [Remote ▾] [Keywords...] [Clear]
```

**Expandido (mobile o filtros avanzados):**
```
┌─────────────────────────────────────┐
│  Filters                    [Done]  │
├─────────────────────────────────────┤
│  Score Range                        │
│  [────●────────] 70 - 100           │
│                                     │
│  Location                           │
│  [🔍 Search locations...]           │
│  ☑ San Francisco  ☑ New York        │
│  ☐ Austin         ☐ Seattle         │
│                                     │
│  Work Type                          │
│  ◉ Any  ○ Remote  ○ On-site         │
│                                     │
│  Keywords                           │
│  [React] [TypeScript] [+Add]        │
│                                     │
│  [Clear All]        [Apply Filters] │
└─────────────────────────────────────┘
```

---

## 6. Sistema de Diseño

### **Tipografía**

| Uso | Font | Weight | Size |
|-----|------|--------|------|
| H1 (Page title) | Inter | 700 | 28px |
| H2 (Section) | Inter | 600 | 20px |
| H3 (Card title) | Inter | 600 | 18px |
| Body | Inter | 400 | 14px |
| Body Small | Inter | 400 | 12px |
| Label | Inter | 500 | 12px |
| Score Number | Inter | 700 | 32px |

**Line heights:** 1.5 para body, 1.2 para headings

---

### **Espaciado (8px base unit)**

| Token | Value | Uso |
|-------|-------|-----|
| space-1 | 4px | Padding interno mínimo |
| space-2 | 8px | Gap entre elementos inline |
| space-3 | 12px | Padding de chips/badges |
| space-4 | 16px | Padding de cards |
| space-5 | 24px | Gap entre secciones |
| space-6 | 32px | Margin entre bloques |
| space-8 | 48px | Padding de página |

---

### **Colores**

**Neutrals (Gray scale):**
```
gray-50:  #F9FAFB  ← Background
gray-100: #F3F4F6  ← Card background
gray-200: #E5E7EB  ← Borders
gray-300: #D1D5DB  ← Disabled
gray-400: #9CA3AF  ← Placeholder
gray-500: #6B7280  ← Muted text
gray-700: #374151  ← Secondary text
gray-900: #111827  ← Primary text
```

**Primary (Brand):**
```
primary-500: #6366F1 (Indigo)  ← Buttons, links
primary-600: #4F46E5           ← Hover
primary-100: #E0E7FF           ← Light backgrounds
```

**Semantic:**
```
success: #10B981 (Green)   ← Positive, high score
warning: #F59E0B (Amber)   ← Attention needed
error:   #EF4444 (Red)     ← Errors, rejected
info:    #3B82F6 (Blue)    ← Informational
```

**Score Gradient:**
```
score-excellent: #10B981
score-great:     #84CC16
score-good:      #EAB308
score-fair:      #F97316
score-low:       #9CA3AF
```

---

### **Sombras y Elevación**

```
shadow-sm:  0 1px 2px rgba(0,0,0,0.05)     ← Cards default
shadow-md:  0 4px 6px rgba(0,0,0,0.1)      ← Cards hover
shadow-lg:  0 10px 15px rgba(0,0,0,0.1)    ← Modals, dropdowns
```

---

### **Border Radius**

```
radius-sm:   4px   ← Inputs, small elements
radius-md:   8px   ← Cards, buttons
radius-lg:   12px  ← Large cards, modals
radius-full: 9999px ← Pills, avatars
```

---

## 7. UX: Flujos y Decisiones

### **Flujo Principal del Usuario**

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Ver Feed   │ ──► │ Filtrar por │ ──► │  Revisar    │
│  de Jobs    │     │   Score     │     │  Job Card   │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                                               ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Trackear   │ ◄── │   Aplicar   │ ◄── │ Ver Detail  │
│ Application │     │             │     │ + Score     │
└─────────────┘     └─────────────┘     └─────────────┘
```

### **Acciones Prioritarias (por frecuencia)**

1. **Escanear jobs por score** — El score debe ser lo primero visible
2. **Filtrar rápidamente** — Filtros siempre accesibles, no escondidos
3. **Aplicar a un job** — CTA prominente, mínimos clicks
4. **Actualizar status** — Desde la lista, sin entrar al detail

### **Reducción de Fricción**

| Problema | Solución |
|----------|----------|
| Demasiados jobs | Score como filtro principal, ordenado por default |
| No sé si debo aplicar | Score breakdown explica el "por qué" |
| Perdí track de aplicaciones | Badge en sidebar con contador |
| Quiero aplicar rápido | Botón "Apply" visible en card, no solo en detail |
| Filtros complejos | Presets: "High Match", "Remote Only", "New Today" |
| No sé qué pasó con mi aplicación | Timeline visual en Application detail |

### **Micro-interacciones Clave**

1. **Score hover** → Muestra breakdown resumido
2. **Apply click** → Confirmación inline, no modal
3. **Status change** → Animación de transición suave
4. **Filter apply** → Contador de resultados actualiza en tiempo real
5. **Card hover** → Elevación sutil + highlight de CTA

---

## Resumen de Decisiones de Diseño

| Decisión | Razón |
|----------|-------|
| Score como elemento visual dominante | Es el diferenciador del producto, debe guiar decisiones |
| Grid de cards vs tabla | Permite escaneo visual rápido, más engagement |
| Sidebar fijo | Navegación siempre accesible, contexto claro |
| Filtros visibles | Acción principal, no debe requerir clicks extra |
| Dual view en Tracker | Lista para overview, Kanban para gestión activa |
| Colores semánticos en scores | Decisión instantánea sin leer números |
| CTAs en cards | Reduce pasos para la acción más común (aplicar) |

---

## Próximos Pasos de Implementación

1. **Sistema de diseño base** — Crear tokens de diseño en TailwindCSS
2. **Componentes UI** — ScoreBadge, StatusBadge, Filters mejorados
3. **Layout** — Sidebar colapsable, Topbar con search
4. **Dashboard** — KPI cards, grid de jobs mejorado
5. **Job Detail** — Layout de dos columnas con score breakdown
6. **Application Tracker** — Vista dual (lista + kanban)
