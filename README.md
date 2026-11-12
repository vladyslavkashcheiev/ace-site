# ACE — портал подразделения

Сайт подразделения ACE (Army Compartmented Elements), National Guard, GTA5RP.

**Этап 1:** вход через Discord, справочник (повышение, коды, законы, устав, кодекс, форма, Fort Zancudo), карта ФЗ, личный кабинет, отчёт на повышение и запись на переаттестацию с отправкой в Discord.

Стек: Next.js · Supabase (база) · Discord OAuth + бот · хостинг Vercel.

## Запуск (один раз)

### 1. База данных — Supabase
1. supabase.com → войти через GitHub → **New project** (регион — Frankfurt).
2. **SQL Editor** → New query → вставить содержимое `supabase/schema.sql` → **Run**.
3. **Project Settings → API**: скопировать **Project URL** и ключ **service_role** (секретный!).

### 2. Discord
1. discord.com/developers → «ACE Портал» → **OAuth2 → Redirects** → добавить
   `https://<адрес-сайта>/api/auth/callback`.
2. **OAuth2** → Reset Secret → скопировать **Client Secret** (секретный!).
3. **Bot** → Reset Token → скопировать **Token** (секретный!).
4. **Installation / OAuth2 URL Generator** → scopes: `bot`; права: View Channels, Send Messages, Embed Links, Mention Everyone (для пинга ролей). Открыть ссылку и добавить бота на сервер ACE.
5. Убедиться, что бот видит каналы отчётов и заявок на аттестацию.

### 3. Хостинг — Vercel
1. vercel.com → войти через GitHub → **Add New → Project** → выбрать репозиторий → Deploy.
2. **Settings → Environment Variables** — добавить (значения из шагов выше):

| Переменная | Значение |
|---|---|
| `SITE_URL` | `https://<твой-проект>.vercel.app` |
| `DISCORD_CLIENT_ID` | `1570509111806791812` |
| `DISCORD_CLIENT_SECRET` | из шага 2.2 |
| `DISCORD_BOT_TOKEN` | из шага 2.3 |
| `SESSION_SECRET` | любая случайная строка 40+ символов |
| `SUPABASE_URL` | из шага 1.3 |
| `SUPABASE_SERVICE_ROLE_KEY` | из шага 1.3 |

3. **Deployments → Redeploy**.

> Секретные ключи хранятся только в Vercel. Никогда не добавляй их в код и не отправляй в чаты.

## Настройки сервера
ID сервера, ролей и каналов — в `src/config/discord.ts`. Порядок повышения и баллы — в `src/lib/ranks.ts`. Тексты справочника — в `src/data/handbook.json`.

## Локальный запуск
```
npm install
cp .env.example .env.local   # заполнить
npm run dev
```
