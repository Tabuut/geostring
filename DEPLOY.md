# نشر Geostring على Cloudflare Workers

المشروع مبني على **TanStack Start + SSR** على **Cloudflare Workers**. هذا الدليل لنشره من GitHub إلى Cloudflare.

## 1. إنشاء حساب Cloudflare
1. سجّل في [dash.cloudflare.com](https://dash.cloudflare.com) (مجاناً).
2. من القائمة الجانبية: **Workers & Pages**.

## 2. الحصول على بيانات الاعتماد
### Account ID
- من صفحة Workers & Pages، انسخ **Account ID** من الجانب الأيمن.

### API Token
1. اذهب إلى [My Profile → API Tokens](https://dash.cloudflare.com/profile/api-tokens).
2. اضغط **Create Token** → اختر قالب **"Edit Cloudflare Workers"** → **Continue → Create Token**.
3. انسخ التوكن (يُعرض مرّة واحدة فقط).

## 3. إضافة الأسرار إلى GitHub
في مستودع GitHub: **Settings → Secrets and variables → Actions → New repository secret**:
- `CLOUDFLARE_API_TOKEN` = التوكن من الخطوة 2.
- `CLOUDFLARE_ACCOUNT_ID` = الـ Account ID.

## 4. النشر
أي push إلى فرع `main` سيشغّل الـ workflow تلقائياً ويُنشر التطبيق على:
```
https://geostring.<your-cloudflare-subdomain>.workers.dev
```

## النشر اليدوي من الجهاز (اختياري)
```bash
bunx wrangler login
bun run deploy
```

## ربط دومين مخصّص
من لوحة Cloudflare: **Workers & Pages → geostring → Settings → Domains & Routes → Add Custom Domain**.
