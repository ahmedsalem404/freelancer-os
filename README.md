# Freelancer OS

نظام إدارة أعمال للفريلانسر والفريق الصغير — **كل عمل خارج الاتفاق يصير فاتورة.**
عربي/إنجليزي، RTL كامل، عملات SAR / USD / YER.

واجهة React + API (Hono) + قاعدة SQLite محلية في `data/`. الدخول بحساب وكلمة مرور.

## التشغيل
```bash
npm install
npm run db:reset
npm run auth:set-password -- owner@freelancer-os.local
npm run dev
```

- `db:reset` يمسح القاعدة المحلية ويحمّل بيانات تجريبية.
- `auth:set-password` يضبط كلمة مرور المالك (مرة وحدة). بعدها تغيّر اسم الدخول وكلمة
  المرور من الإعدادات.
- يفتح على `http://localhost:5180`. يحتاج Node 24.7 أو أحدث.

## المراجع
- البنية والقواعد والقرارات: [ARCHITECTURE.md](ARCHITECTURE.md)
- تصميم قاعدة البيانات وقرارات المالك: [docs/database.md](docs/database.md)

## الاختبارات
```bash
npm test
```

مبني في الأصل على [satnaing/shadcn-admin](https://github.com/satnaing/shadcn-admin) (MIT).
