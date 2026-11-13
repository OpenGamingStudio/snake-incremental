FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html style.css /usr/share/nginx/html/
COPY src /usr/share/nginx/html/src
COPY fonts /usr/share/nginx/html/fonts
