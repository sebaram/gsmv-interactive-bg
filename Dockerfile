FROM node:24-alpine AS build
WORKDIR /app
COPY . .
RUN npm run build

FROM python:3.13-slim
WORKDIR /app
COPY --from=build /app/_site ./_site
COPY serve.py server_storage.py ./
RUN mkdir /data && chown 10001:10001 /data
USER 10001:10001
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
EXPOSE 8765
VOLUME ["/data"]
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8765/api/health', timeout=3)" || exit 1
CMD ["python", "serve.py", "--site-dir", "/app/_site", "--data-dir", "/data", "--port", "8765"]
