# Freelancer OS

نظام إدارة أعمال للفريلانسر والفريق الصغير — **كل عمل خارج الاتفاق يصير فاتورة.**
عربي/إنجليزي، RTL كامل، عملات SAR / USD / YER.

> المرحلة الحالية: **واجهات فقط ببيانات تجريبية في الذاكرة** (تُمسح عند إعادة التحميل). الـ backend (SQLite محلي) هو المرحلة التالية.

## التشغيل
```bash
npm install
npm run dev
```

## المراجع
- المواصفة: `D:\memory\wiki\syntheses\freelancer-os-build-spec.md`
- تصميم قاعدة البيانات وقرارات المالك: [docs/database.md](docs/database.md)
- المكتبات المرجعية: `D:\codeing\_libraries\README.md`

## البنية
| المسار | المحتوى |
|---|---|
| `src/domain/` | الأنواع (مطابقة لجداول القاعدة)، المال (وحدات صغرى)، `selectors.ts` (الحارس وكل القيم المحسوبة)، التسعير — مع اختبارات |
| `src/mock/` | بيانات تجريبية + store (zustand) — كل action يقابل API مستقبلي |
| `src/i18n/` | قاموسا `ar.ts` و`en.ts` |
| `src/components/fos/` | مكونات النظام: مقياس الحدود، المال، الشارات، الصفحة، جدول الفواتير، تسجيل الدفعة |
| `src/features/` | الصفحات: today, engagements, clients, leads, calendar, finance, invoices, time, pricing, settings, portal |

## الاختبارات
```bash
npx vitest run --browser.enabled=false src/domain
```

مبني على [satnaing/shadcn-admin](https://github.com/satnaing/shadcn-admin) (MIT).
