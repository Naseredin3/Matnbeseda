# راهنمای گیت‌هاب اکشنز (GitHub Actions Setup)

این پروژه مجهز به گردش‌کارهای خودکار گیت‌هاب (GitHub Actions Workflows) است:

## ۱. فایل‌های اکشن اضافه‌شده

1. **`ci.yml` (بررسی کد و بیلد مداوم - CI)**:
   - مسیر: `.github/workflows/ci.yml`
   - روی هر `push` یا `pull_request` به شاخه‌های `main` و `master` اجرا می‌شود.
   - همچنین قابلیت اجرای دستی (`workflow_dispatch`) دارد.
   - شامل مراحل:
     - اعتبارسنجی تایپ‌ها (`npm run lint` / TypeScript)
     - ساخت نسخه پروداکشن پروژه (`npm run build`)
     - ذخیره و آرشیو فایل‌های خروجی (`dist/`) به عنوان Artifact

2. **`docker-publish.yml` (ساخت و انتشار ایمیج داکر)**:
   - مسیر: `.github/workflows/docker-publish.yml`
   - پس از ارسال تغییرات به گیت‌هاب، به صورت خودکار ایمیج پروژه را بیلد کرده و روی **GitHub Container Registry (GHCR)** قرار می‌دهد.

---

## ۲. تنظیم کلیدهای محرمانه در گیت‌هاب (GitHub Secrets)

اگر پروژه را در سرورها یا سرویس‌های ابری از طریق گیت‌هاب دیپلوی می‌کنید:
1. در صفحه مخزن خود در GitHub به بخش **Settings** بروید.
2. از منوی سمت چپ گزینه **Secrets and variables** > **Actions** را انتخاب کنید.
3. دکمه **New repository secret** را بزنید.
4. متغیر زیر را تعریف کنید:
   - نام: `GEMINI_API_KEY`
   - مقدار: کلید API جمینای شما

---

## ۳. اجرای دستی در GitHub

1. در تب **Actions** گیت‌هاب بروید.
2. اکشن **CI / Build & Typecheck** یا **Docker Build & Publish** را انتخاب کنید.
3. دکمه **Run workflow** را بزنید تا بدون نیاز به کامیت جدید، بیلد اجرا شود.
