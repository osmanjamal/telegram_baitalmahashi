FROM node:16-alpine

# إنشاء مجلد التطبيق
WORKDIR /usr/src/app

# نسخ ملفات التبعيات
COPY package*.json ./

# تثبيت التبعيات
RUN npm install

# نسخ مصدر المشروع
COPY . .

# إنشاء المجلدات المطلوبة
RUN mkdir -p logs
RUN mkdir -p frontend/assets/images/menu
RUN mkdir -p frontend/assets/images/uploads

# تعيين متغيرات البيئة
ENV NODE_ENV=production
ENV PORT=3000

# التعرض على المنفذ
EXPOSE 3000

# بدء التطبيق
CMD ["npm", "start"]