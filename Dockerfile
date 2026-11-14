FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html style.css manifest.webmanifest favicon.ico favicon.svg apple-touch-icon.png icon-192.png icon-512.png /usr/share/nginx/html/
COPY src /usr/share/nginx/html/src
COPY fonts /usr/share/nginx/html/fonts
